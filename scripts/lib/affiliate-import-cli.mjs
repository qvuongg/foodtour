#!/usr/bin/env node
/** CLI orchestration; all database writes require --apply and a clean complete preflight. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getMaintenanceKey, getMaintenanceHeaders } from './maintenance-env.mjs';
import { loadMaintenanceEnvFile } from './maintenance-env-file.mjs';
import { getMaintenanceUrl } from './maintenance-url.mjs';
import { withBrandSnapshotLock } from './restaurant-metadata.mjs';
import { canonicalRestaurantUrl, validateAffiliateUrl, normalizeMappings, mappingsFromCsv, parseCsv, serializeCsv, mappingColumns, planImport, createRestaurantStore, executePlan } from './affiliate-import.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
function atomicWrite(filename, content) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  try { fs.writeFileSync(temporary, content, { mode: 0o600 }); fs.renameSync(temporary, filename); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function argumentsFor(argv) {
  const options = { apply: false, replaceExisting: false, noSupabase: false, pending: [], brandJson: [] };
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i];
    if (argument === '--apply') options.apply = true;
    else if (argument === '--replace-existing') options.replaceExisting = true;
    else if (argument === '--no-supabase') options.noSupabase = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else {
      const [flag, ...rest] = argument.split('=');
      if (!['--file', '--batch-input', '--report', '--pending', '--brand-json'].includes(flag)) throw new Error(`Unknown argument: ${flag}`);
      const value = rest.length ? rest.join('=') : argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      if (flag === '--pending') options.pending.push(value);
      else if (flag === '--brand-json') options.brandJson.push(value);
      else options[{ '--file': 'file', '--batch-input': 'batchInput', '--report': 'report' }[flag]] = value;
    }
  }
  return options;
}
function planPending(filename, mappings, replaceExisting) {
  const before = fs.readFileSync(filename, 'utf8');
  const rows = parseCsv(before);
  if (!rows.length) throw new Error(`Empty pending CSV: ${filename}`);
  const columns = mappingColumns(rows[0]); const map = new Map(mappings.map(row => [row.original_url, row.affiliate_url]));
  const changes = []; const errors = []; const matched = new Set();
  rows.slice(1).forEach((row, index) => {
    let key;
    try { key = canonicalRestaurantUrl(row[columns.original]); } catch { return; }
    const next = map.get(key);
    if (!next) return;
    matched.add(key);
    if (row[columns.affiliate] === next) return;
    const previous = row[columns.affiliate] || '';
    if (previous && !replaceExisting) { errors.push({ source: `${filename}:${index + 2}`, reason: 'Existing pending affiliate differs; pass --replace-existing only after review' }); return; }
    if (previous) {
      try { validateAffiliateUrl(previous); }
      catch { errors.push({ source: `${filename}:${index + 2}`, reason: 'Existing pending affiliate is invalid; reconcile manually before replacement' }); return; }
    }
    changes.push({ row: index + 2, column: columns.affiliate, original_url: row[columns.original], previous_affiliate_url: previous, affiliate_url: next });
    row[columns.affiliate] = next;
  });
  return { filename, sha256: digest(before), changes, errors, matched_urls: [...matched], after: serializeCsv(rows) };
}

function planBrandJson(filename, mappings, replaceExisting) {
  const before = fs.readFileSync(filename, 'utf8');
  const rows = JSON.parse(before);
  if (!Array.isArray(rows)) throw new Error('Expected an array of brand branches');
  const records = rows.map(row => ({ ...row, original_url: row.shopeefood_url }));
  const plan = planImport(mappings, records, { replaceExisting });
  if (new Set(records.map(row => row.id)).size !== records.length) plan.errors.push({ source: filename, reason: 'Duplicate branch IDs' });
  const next = new Map(plan.changes.map(change => [change.id, change.affiliate_url]));
  const updated = rows.map(row => next.has(row.id) ? { ...row, affiliate_url: next.get(row.id) } : row);
  return { filename, sha256: digest(before), ...plan, after: JSON.stringify(updated, null, 2) + '\n' };
}

export async function runImport(argv = process.argv.slice(2)) {
  const options = argumentsFor(argv);
  if (options.help) {
    console.log('Usage: node scripts/import-affiliate-csv.mjs --file=data/pending.csv [--apply] [--replace-existing] [--report=path.json]\nDry-run is the default. An explicit file is required. No wildcard updates; conflicts stop the whole batch before writes.\nThe Python merge wrapper also accepts --no-supabase for local CSV-only review/application.');
    return 0;
  }
  if (Boolean(options.file) === Boolean(options.batchInput)) throw new Error('Select exactly one explicit --file or --batch-input');
  const raw = fs.readFileSync(options.batchInput === '-' ? 0 : options.batchInput || options.file, 'utf8');
  const input = options.batchInput ? JSON.parse(raw) : { ...mappingsFromCsv(raw, options.file), batches: [{ file: options.file, sha256: digest(raw) }] };
  if (Array.isArray(input.csv_batches)) {
    input.mappings = []; input.batches = []; input.skipped = 0;
    for (const batch of input.csv_batches) {
      const parsed = mappingsFromCsv(batch.csv, batch.file);
      input.mappings.push(...parsed.mappings); input.skipped += parsed.skipped;
      input.batches.push({ file: batch.file, sha256: batch.sha256 });
    }
    delete input.csv_batches;
  }
  if (!Array.isArray(input.mappings)) throw new Error('Invalid mapping input');
  const normalized = normalizeMappings(input.mappings);
  const reportPath = path.resolve(options.report || `artifacts/affiliate-import/${new Date().toISOString().replaceAll(':', '-')}-${process.pid}.json`);
  const resolvedIdentity = filename => fs.existsSync(filename) ? fs.realpathSync(filename) : path.resolve(filename);
  const inputs = [options.file, options.batchInput === '-' ? null : options.batchInput, ...options.pending, ...options.brandJson, ...(input.batches || []).map(batch => batch.file)].filter(Boolean);
  if (inputs.some(file => resolvedIdentity(file) === resolvedIdentity(reportPath))) throw new Error('Report must not overwrite an input file');
  const report = { version: 1, created_at: new Date().toISOString(), mode: options.apply ? 'apply' : 'dry-run', batches: input.batches || [], skipped_without_conversion: input.skipped || 0, normalized_mappings: normalized.mappings.length, errors: normalized.errors, database: null, pending: [], branches: [], outcome: 'preflight' };
  const saveReport = () => atomicWrite(reportPath, JSON.stringify(report, null, 2) + '\n');
  let pending = []; let branches = []; let store;
  try {
    // Invalid sources or ambiguous batch mappings never trigger even a database read.
    if (report.errors.length) throw new Error(`Input validation blocked: ${report.errors.length} error(s)`);
    pending = options.pending.map(filename => planPending(filename, normalized.mappings, options.replaceExisting));
    report.pending = pending.map(({ after, ...plan }) => plan);
    branches = options.brandJson.length ? withBrandSnapshotLock(() => options.brandJson.map(filename => planBrandJson(filename, normalized.mappings, options.replaceExisting))) : [];
    report.branches = branches.map(({ after, ...plan }) => plan);
    report.errors.push(...pending.flatMap(plan => plan.errors), ...branches.flatMap(plan => plan.errors));
    if (options.noSupabase && !branches.length) {
      const matched = new Set(pending.flatMap(plan => plan.matched_urls));
      for (const mapping of normalized.mappings) {
        if (!matched.has(mapping.original_url)) report.errors.push({ source: mapping.source, original_url: mapping.original_url, reason: 'No matching restaurant in the selected local pending files' });
      }
    }
    if (report.errors.length) throw new Error(`Local snapshot conflicts: ${report.errors.length}`);
    if (!options.noSupabase) {
      loadMaintenanceEnvFile();
      const key = getMaintenanceKey(process.env, { required: true });
      const url = getMaintenanceUrl();
      store = createRestaurantStore({ url, key, headers: getMaintenanceHeaders(key) });
      report.database = planImport(normalized.mappings, await store.readAll(), { replaceExisting: options.replaceExisting });
      report.errors.push(...report.database.errors);
    } else if (!pending.length && !branches.length) throw new Error('--no-supabase requires at least one local CSV/JSON target');
    if (report.errors.length) throw new Error(`Preflight blocked: ${report.errors.length} conflict(s); no writes performed`);
    for (const plan of [...pending, ...branches]) if (digest(fs.readFileSync(plan.filename, 'utf8')) !== plan.sha256) throw new Error('Local snapshot changed during preflight; no writes performed');
    // Save prior values for manual rollback/reconciliation before any database mutation.
    report.outcome = options.apply ? 'applying' : 'dry-run-complete'; saveReport();
    if (report.database) await executePlan(report.database, store, { apply: options.apply, onProgress: saveReport });
    if (options.apply) {
      const applyLocal = () => {
        for (const plan of [...pending, ...branches]) {
          if (digest(fs.readFileSync(plan.filename, 'utf8')) !== plan.sha256) throw new Error('Local snapshot changed concurrently; database state is recorded in report; reconcile before retry');
        }
        for (const plan of [...pending, ...branches]) {
          if (!plan.changes.length) continue;
          atomicWrite(plan.filename, plan.after);
          [...report.pending, ...report.branches].find(item => item.filename === plan.filename).status = 'applied'; saveReport();
        }
      };
      if (pending.length || branches.length) withBrandSnapshotLock(applyLocal);
      report.outcome = 'applied'; saveReport();
    }
    console.log(`${options.apply ? 'Applied and verified' : 'DRY RUN — no restaurant or pending CSV changes'}: ${report.database?.changes.length || 0} database changes, ${report.database?.unchanged.length || 0} unchanged; ${[...pending, ...branches].reduce((sum, plan) => sum + plan.changes.length, 0)} local CSV/JSON changes.\nReport: ${reportPath}`);
    return 0;
  } catch (error) {
    report.outcome = report.outcome === 'applying' ? 'stopped-reconcile-before-retry' : 'blocked-no-writes';
    // All upstream errors are deliberately sanitized; never include fetch response bodies or keys.
    report.failure = error.message; saveReport();
    console.error(`Import stopped: ${error.message}\nReport: ${reportPath}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runImport().then(code => { process.exitCode = code; }).catch(() => { console.error('Invalid arguments or unreadable import file. Use --help.'); process.exitCode = 1; });
}
