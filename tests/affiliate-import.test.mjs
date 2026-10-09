import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { canonicalRestaurantUrl, validateAffiliateUrl, normalizeMappings, parseCsv, mappingsFromCsv, planImport, createRestaurantStore, executePlan } from '../scripts/lib/affiliate-import.mjs';

const original = 'https://shopeefood.vn/da-nang/3tete-ca-phe-muoi';
const branch = `${original}-03-nguyen-du`;
const affiliate = 'https://spf.shopee.vn/AbC123';
const oldAffiliate = 'https://shope.ee/Other';
const mapping = (url = original, link = affiliate) => ({ original_url: url, affiliate_url: link });
const restaurant = (id = 'one', url = original, link = null) => ({ id, original_url: url, affiliate_url: link });
const normalized = (...rows) => normalizeMappings(rows).mappings;
const response = (rows, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => rows });

for (const host of ['shope.ee', 's.shopee.vn', 'spf.shopee.vn']) {
  test(`accepts HTTPS ${host} and preserves the issued link exactly`, () => {
    const url = `https://${host}/AbCd?tag=Original%20Case#fragment`;
    assert.equal(validateAffiliateUrl(url), url);
  });
}
test('rejects deceptive hosts, non-HTTPS, credentials, explicit nondefault ports and missing destinations', () => {
  for (const url of ['http://shope.ee/abc', 'https://shope.ee.evil.test/abc', 'https://evil.test/?q=shope.ee/abc', 'https://user@shope.ee/abc', 'https://shope.ee:444/abc', 'https://shope.ee/', 'https://shope.ee\\@evil.test/abc']) assert.throws(() => validateAffiliateUrl(url));
  assert.throws(() => canonicalRestaurantUrl('https://shopeefood.vn.evil.test/da-nang/cafe'));
  assert.throws(() => canonicalRestaurantUrl('https://shopeefood.vn/bo-suu-tap/voucher'));
});
test('canonicalizes official www, trailing slash and tracking without folding restaurant path case', () => {
  assert.equal(canonicalRestaurantUrl(`${original}/?source=one`), original);
  assert.equal(canonicalRestaurantUrl(original.replace('://', '://www.')), original);
  assert.equal(canonicalRestaurantUrl(`${original}-ABC`), `${original}-ABC`);
});
test('conflicting duplicates across batches block import; identical duplicates are idempotently deduplicated', () => {
  assert.equal(normalizeMappings([mapping(), mapping(`${original}/?track=x`)]).mappings.length, 1);
  const result = normalizeMappings([mapping(), mapping(`${original}/`, oldAffiliate)]);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].reason, /conflicting/);
});
test('actual 3TeTe prefix collision selects only exact branch, never the longer listing', () => {
  const plan = planImport(normalized(mapping()), [restaurant(), restaurant('two', branch, oldAffiliate)]);
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.changes.length, 1);
  assert.equal(plan.changes[0].id, 'one');
  assert.equal(plan.changes[0].original_url, original);
});
test('zero and multiple canonical matches are errors before any writes', async () => {
  for (const rows of [[], [restaurant(), restaurant('two', `${original}/?source=x`)]]) {
    const plan = planImport(normalized(mapping()), rows);
    assert.equal(plan.errors.length, 1);
    let writes = 0;
    await assert.rejects(executePlan(plan, { apply: async () => writes++ }, { apply: true }), /Preflight blocked/);
    assert.equal(writes, 0);
  }
});
test('existing different affiliates are protected, intentional replacement records rollback value', () => {
  const rows = [restaurant('one', original, oldAffiliate)];
  assert.equal(planImport(normalized(mapping()), rows).errors.length, 1);
  const plan = planImport(normalized(mapping()), rows, { replaceExisting: true });
  assert.equal(plan.changes[0].previous_affiliate_url, oldAffiliate);
});
test('idempotent mappings cause no writes even with --apply', async () => {
  const plan = planImport(normalized(mapping()), [restaurant('one', original, affiliate)]);
  let writes = 0;
  await executePlan(plan, { apply: async () => writes++ }, { apply: true });
  assert.equal(plan.unchanged.length, 1); assert.equal(writes, 0);
});
test('default dry run performs no writes for a valid change', async () => {
  const plan = planImport(normalized(mapping()), [restaurant()]);
  let writes = 0;
  assert.deepEqual(await executePlan(plan, { apply: async () => writes++ }), { verified: 0, dryRun: true });
  assert.equal(writes, 0); assert.equal(plan.changes[0].status, 'planned');
});
test('PATCH uses stable ID, original equality and old-value guard, returns one row and reads it back', async () => {
  const calls = []; const row = restaurant('one', original, affiliate);
  const store = createRestaurantStore({ url: 'https://project.supabase.co', key: 'fake-only', fetchImpl: async (url, options) => { calls.push({ url, options }); return response([row]); } });
  const plan = planImport(normalized(mapping()), [restaurant()]);
  await executePlan(plan, store, { apply: true });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.method, 'PATCH');
  assert.equal(calls[0].url.searchParams.get('id'), 'eq."one"');
  assert.equal(calls[0].url.searchParams.get('original_url'), `eq."${original}"`);
  assert.equal(calls[0].url.searchParams.get('affiliate_url'), 'is.null');
  assert.equal(calls[0].options.headers.Prefer, 'return=representation');
  assert.equal(calls[0].url.toString().includes('ilike'), false);
  assert.equal(calls[1].options.method, undefined);
  assert.equal(plan.changes[0].status, 'verified');
});
test('zero/multiple affected rows and read-back mismatch fail and stop following writes', async () => {
  for (const responses of [[[]], [[restaurant('one', original, affiliate), restaurant('two', branch, affiliate)]], [[restaurant('one', original, affiliate)], [restaurant('one', original, oldAffiliate)]]]) {
    let calls = 0;
    const store = createRestaurantStore({ url: 'https://project.supabase.co', key: 'fake-only', fetchImpl: async () => response(responses[calls++]) });
    const plan = planImport(normalized(mapping(), mapping(branch)), [restaurant(), restaurant('two', branch)]);
    await assert.rejects(executePlan(plan, store, { apply: true }), /verification failed/);
    assert.equal(plan.changes[0].status, 'requires_reconciliation');
    assert.equal(plan.changes[1].status, 'planned');
    assert.ok(calls <= 2);
  }
});
test('read-only pagination handles server page caps and rejects repeated IDs', async () => {
  const offsets = [];
  const store = createRestaurantStore({ url: 'https://project.supabase.co', key: 'fake-only', fetchImpl: async url => { const offset = Number(url.searchParams.get('offset')); offsets.push(offset); return response(offset < 2 ? [restaurant(String(offset))] : []); } });
  assert.equal((await store.readAll()).length, 2);
  assert.deepEqual(offsets, [0, 1, 2]);
  const duplicate = createRestaurantStore({ url: 'https://project.supabase.co', key: 'fake-only', fetchImpl: async url => response(Number(url.searchParams.get('offset')) < 2 ? [restaurant()] : []) });
  await assert.rejects(duplicate.readAll(), /Unstable or duplicate/);
});
test('HTTP errors omit response bodies and credentials', async () => {
  const store = createRestaurantStore({ url: 'https://project.supabase.co', key: 'SENSITIVE_FAKE', fetchImpl: async () => response({ detail: 'SENSITIVE_FAKE' }, 403) });
  await assert.rejects(store.readAll(), error => error.message === 'Database request failed (HTTP 403)');
});
test('CSV supports Vietnamese headers, BOM, quoted names and multiline fields', () => {
  const text = `\uFEFFTên Quán,Thành Phố,Quận,Link ShopeeFood Gốc,Link Affiliate shope.ee (Điền vào đây)\r\n"Quán, A\nchi nhánh",DN,Q,${original},${affiliate}\r\n`;
  assert.equal(parseCsv(text)[1][0], 'Quán, A\nchi nhánh');
  assert.deepEqual(mappingsFromCsv(text, 'fixture.csv').mappings[0], { ...mapping(), source: 'fixture.csv:2' });
  assert.throws(() => parseCsv('a,b\n"unclosed'), /Unclosed/);
});
test('Python wrapper requires explicit batch; offline dry run leaves pending file byte-identical, apply updates only matched row', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'affiliate-import-'));
  try {
    fs.mkdirSync(path.join(cwd, 'data'));
    const filename = path.join(cwd, 'data', 'result.csv');
    fs.writeFileSync(filename, `Liên kết gốc,Sub_id1,Sub_id2,Sub_id3,Sub_id4,Sub_id5,Liên kết chuyển đổi,Lí do thất bại\n${original},,,,,,${affiliate},\n`);
    const pending = path.join(cwd, 'data', 'crawler_urls_pending_affiliate.csv');
    const before = `Tên Quán,Thành Phố,Quận,Link ShopeeFood Gốc,Link Affiliate shope.ee (Điền vào đây)\nShort,DN,,${original},\nBranch,DN,,${branch},${oldAffiliate}\n`;
    fs.writeFileSync(pending, before);
    const script = path.resolve('scripts/merge-affiliate-results.py');
    const base = ['--files=data/result.csv', '--no-supabase', '--report=report.json'];
    const missing = spawnSync('python3', [script], { cwd, encoding: 'utf8' });
    assert.notEqual(missing.status, 0);
    const preview = spawnSync('python3', [script, ...base], { cwd, encoding: 'utf8' });
    assert.equal(preview.status, 0, preview.stderr);
    assert.equal(fs.readFileSync(pending, 'utf8'), before);
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'report.json'), 'utf8')).outcome, 'dry-run-complete');
    const applied = spawnSync('python3', [script, ...base, '--apply'], { cwd, encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    assert.equal(parseCsv(fs.readFileSync(pending, 'utf8'))[1][4], affiliate);
    assert.equal(parseCsv(fs.readFileSync(pending, 'utf8'))[2][4], oldAffiliate);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('invalid stored link credentials never enter a rollback report', () => {
  const plan = planImport(normalized(mapping()), [restaurant('one', original, 'https://private:SECRET@shope.ee/old')], { replaceExisting: true });
  assert.equal(plan.errors.length, 1);
  assert.equal(JSON.stringify(plan).includes('SECRET'), false);
  assert.equal(plan.changes.length, 0);
});

test('explicit --all reads food AND drink batches; conflicting duplicates fail before local writes', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'affiliate-batches-'));
  try {
    fs.mkdirSync(path.join(cwd, 'data'));
    const header = 'Liên kết gốc,Liên kết chuyển đổi\n';
    fs.writeFileSync(path.join(cwd, 'data/AffiliateBatchCustomLinks_food.csv'), `${header}${original},${affiliate}\n`);
    fs.writeFileSync(path.join(cwd, 'data/AffiliateBatchCustomLinks_drink.csv'), `${header}${branch},${oldAffiliate}\n`);
    const pending = path.join(cwd, 'data/crawler_urls_pending_affiliate.csv');
    const before = `original_url,affiliate_url\n${original},\n${branch},\n`;
    fs.writeFileSync(pending, before);
    const script = path.resolve('scripts/merge-affiliate-results.py');
    const args = [script, '--all', '--no-supabase', '--report=report.json'];
    assert.equal(spawnSync('python3', args, { cwd, encoding: 'utf8' }).status, 0);
    let report = JSON.parse(fs.readFileSync(path.join(cwd, 'report.json'), 'utf8'));
    assert.equal(report.batches.length, 2); assert.equal(report.normalized_mappings, 2);
    assert.equal(report.pending[0].changes.length, 2);
    fs.writeFileSync(path.join(cwd, 'data/AffiliateBatchCustomLinks_drink.csv'), `${header}${original},${oldAffiliate}\n`);
    assert.equal(spawnSync('python3', [...args, '--apply'], { cwd, encoding: 'utf8' }).status, 1);
    report = JSON.parse(fs.readFileSync(path.join(cwd, 'report.json'), 'utf8'));
    assert.equal(report.outcome, 'blocked-no-writes');
    assert.equal(fs.statSync(path.join(cwd, 'report.json')).mode & 0o777, 0o600);
    assert.equal(fs.readFileSync(pending, 'utf8'), before);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('brand wrapper defaults to dry run, applies exact branches and preserves unrelated affiliates/metadata', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'affiliate-brands-'));
  try {
    fs.mkdirSync(path.join(cwd, 'data')); fs.mkdirSync(path.join(cwd, 'src/data'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'data/result.csv'), `Liên kết gốc,Liên kết chuyển đổi\n${original},${affiliate}\n`);
    fs.writeFileSync(path.join(cwd, 'data/brand_branches_pending_affiliate.csv'), `original_url,affiliate_url\n${original},\n${branch},${oldAffiliate}\n`);
    const records = [
      { id: 'one', delivery_id: 100, shopeefood_url: original, affiliate_url: null, name: 'Short', lat: 10 },
      { id: 'two', delivery_id: 200, shopeefood_url: branch, affiliate_url: oldAffiliate, name: 'Branch', lat: 20 }
    ];
    const targets = ['data/brand_branches_master.json', 'src/data/brand-branches.json'];
    for (const target of targets) fs.writeFileSync(path.join(cwd, target), JSON.stringify(records));
    const script = path.resolve('scripts/merge-brand-branches-affiliate.py');
    const args = [script, '--file=data/result.csv', '--no-supabase', '--report=report.json'];
    const preview = spawnSync('python3', args, { cwd, encoding: 'utf8' });
    assert.equal(preview.status, 0, preview.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cwd, targets[0]), 'utf8')), records);
    const applied = spawnSync('python3', [...args, '--apply'], { cwd, encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    for (const target of targets) {
      const updated = JSON.parse(fs.readFileSync(path.join(cwd, target), 'utf8'));
      assert.deepEqual(updated, [{ ...records[0], affiliate_url: affiliate }, records[1]]);
    }
    assert.equal(fs.existsSync(path.join(cwd, 'data/.brand-affiliate-write.lock')), false);
    fs.writeFileSync(path.join(cwd, 'data/.brand-affiliate-write.lock'), 'another-process');
    const locked = spawnSync('python3', [...args, '--apply'], { cwd, encoding: 'utf8' });
    assert.equal(locked.status, 1);
    assert.equal(fs.readFileSync(path.join(cwd, 'data/.brand-affiliate-write.lock'), 'utf8'), 'another-process');
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('search/collection routes cannot collapse query-distinct destinations into a restaurant identity', () => {
  for (const suffix of ['danh-sach-dia-diem-giao-tan-noi?q=coffee', 'collection-list', '%64anh-sach-dia-diem-giao-tan-noi?q=rice']) {
    assert.throws(() => canonicalRestaurantUrl(`https://shopeefood.vn/da-nang/${suffix}`));
  }
});

test('report cannot overwrite batch-input JSON (including a symlink alias)', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'affiliate-report-'));
  try {
    const input = path.join(cwd, 'input.json');
    const before = JSON.stringify({ mappings: [mapping()] });
    fs.writeFileSync(input, before);
    fs.symlinkSync(input, path.join(cwd, 'alias.json'));
    for (const report of ['input.json', 'alias.json']) {
      const result = spawnSync('node', [path.resolve('scripts/lib/affiliate-import-cli.mjs'), '--batch-input=input.json', `--report=${report}`, '--no-supabase'], { cwd, encoding: 'utf8' });
      assert.equal(result.status, 1);
      assert.equal(fs.readFileSync(input, 'utf8'), before);
    }
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('pending-only import refuses a busy local write lock and preserves data', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'affiliate-pending-lock-'));
  try {
    fs.mkdirSync(path.join(cwd, 'data'));
    fs.writeFileSync(path.join(cwd, 'input.csv'), `original_url,affiliate_url\n${original},${affiliate}\n`);
    const before = `original_url,affiliate_url\n${original},\n`;
    fs.writeFileSync(path.join(cwd, 'pending.csv'), before);
    fs.writeFileSync(path.join(cwd, 'data/.brand-affiliate-write.lock'), 'another-process');
    const result = spawnSync('node', [path.resolve('scripts/import-affiliate-csv.mjs'), '--file=input.csv', '--pending=pending.csv', '--no-supabase', '--apply', '--report=report.json'], { cwd, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(fs.readFileSync(path.join(cwd, 'pending.csv'), 'utf8'), before);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
