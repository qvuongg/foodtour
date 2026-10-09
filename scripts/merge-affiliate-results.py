#!/usr/bin/env python3
"""Merge explicitly selected Shopee restaurant affiliate result batches safely.

Preview (default; no database/pending CSV writes):
  python3 scripts/merge-affiliate-results.py --files=data/AffiliateBatch1.csv,data/AffiliateBatch2.xlsx
  python3 scripts/merge-affiliate-results.py --drinks --no-supabase
  python3 scripts/merge-affiliate-results.py --all --no-supabase
Apply only after reviewing the generated report: add --apply.
Replacing an existing different link additionally requires --replace-existing.

--file/--files and positional filenames remain supported. --all/--drinks are
explicit discovery choices; no implicit "only drinks" or automatic writes.
CSV and XLSX supported. Legacy binary XLS must be exported as CSV/XLSX first.
Shared Node engine performs host validation, conflict checks, stable-ID guarded
updates, affected-row/read-back verification and writes a reconciliation report.
"""
import argparse
import csv
import glob
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys


def read_batch(filename):
    path = Path(filename)
    if not path.is_file():
        raise ValueError(f"Missing input file: {path.name}")
    raw = path.read_bytes()
    if path.suffix.lower() == '.csv':
        rows = list(csv.reader(io.StringIO(raw.decode('utf-8-sig')), strict=True))
    elif path.suffix.lower() == '.xlsx':
        try:
            import openpyxl
        except ImportError as error:
            raise ValueError('XLSX requires openpyxl; alternatively export a CSV') from error
        workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            rows = [[str(cell) if cell is not None else '' for cell in row]
                    for row in workbook.active.iter_rows(values_only=True)]
        finally:
            workbook.close()
    else:
        raise ValueError('Only .csv/.xlsx result files are supported; convert legacy .xls first')
    # Headers are interpreted once, by the same engine used for direct CSV imports.
    output = io.StringIO(newline='')
    csv.writer(output).writerows(rows)
    return { 'file': str(path), 'sha256': hashlib.sha256(raw).hexdigest(), 'csv': output.getvalue() }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('filenames', nargs='*')
    parser.add_argument('--files', '--file', dest='files')
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument('--drinks', action='store_true')
    selection.add_argument('--all', action='store_true')
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--replace-existing', action='store_true')
    parser.add_argument('--no-supabase', action='store_true')
    parser.add_argument('--report')
    parser.add_argument('--pending', action='append', help='Explicit pending CSV targets; replaces the default food/drink targets')
    parser.add_argument('--brand-json', action='append', default=[], help='Explicit brand JSON targets (same exact mapping checks)')
    args = parser.parse_args(argv)
    explicit = args.filenames + ([part.strip() for part in args.files.split(',') if part.strip()] if args.files else [])
    if explicit and (args.drinks or args.all):
        parser.error('Choose explicit files OR --all/--drinks, not both')
    if not explicit and not args.drinks and not args.all:
        parser.error('Select --files=..., positional files, --all or --drinks. There is no implicit batch selection.')
    if not explicit:
        pattern = 'data/AffiliateBatch*drink*' if args.drinks else 'data/AffiliateBatchCustomLinks*'
        explicit = sorted(glob.glob(pattern + '.csv') + glob.glob(pattern + '.xlsx'))
    files = list(dict.fromkeys(explicit))
    if not files:
        parser.error('No matching input batches found')
    try:
        batches = [read_batch(filename) for filename in files]
    except (ValueError, OSError, UnicodeError, csv.Error) as error:
        print(f'Cannot read batch: {error}', file=sys.stderr)
        return 1
    print(f"Selected {len(batches)} explicit batch(es). {'APPLY requested' if args.apply else 'DRY RUN'}.", flush=True)
    cli = Path(__file__).resolve().parent / 'lib' / 'affiliate-import-cli.mjs'
    command = ['node', str(cli), '--batch-input=-']
    for flag in ['apply', 'replace_existing', 'no_supabase']:
        if getattr(args, flag):
            command.append('--' + flag.replace('_', '-'))
    if args.report:
        command.append('--report=' + args.report)
    for pending in args.pending or ['data/drinks_pending_affiliate.csv', 'data/crawler_urls_pending_affiliate.csv']:
        if args.pending or Path(pending).is_file():
            command.append('--pending=' + pending)
    for target in args.brand_json:
        command.append('--brand-json=' + target)
    # Send batch data through stdin; never put credentials or URL payloads in shell commands.
    payload = json.dumps({'csv_batches': batches})
    try:
        return subprocess.run(command, input=payload, text=True, check=False).returncode
    except OSError:
        print('Could not run Node.js. Install the Node version required by package.json.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
