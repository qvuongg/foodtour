#!/usr/bin/env node
/**
 * Safely import one explicitly selected pending/portal CSV.
 * Preview: node scripts/import-affiliate-csv.mjs --file=data/crawler_urls_pending_affiliate.csv
 * Apply after reviewing report: same command + --apply
 * Conflicting existing links require intentional --replace-existing. See --help.
 */
import { runImport } from './lib/affiliate-import-cli.mjs';
runImport().then(code => { process.exitCode = code; }).catch(() => {
  console.error('Invalid arguments or unreadable import file. Use --help.');
  process.exitCode = 1;
});
