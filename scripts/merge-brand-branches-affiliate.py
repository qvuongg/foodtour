#!/usr/bin/env python3
"""Brand affiliate import through the same safe, exact-identity engine.

Preview:
  python3 scripts/merge-brand-branches-affiliate.py --file=data/AffiliateBatchCustomLinks_brand.csv
Local-only preview: add --no-supabase. Apply after review: add --apply.
Existing conflicting links require --replace-existing. No implicit newest batch,
metadata upsert, missing-link nulls, or anonymous-key fallback.
"""
from pathlib import Path
import subprocess
import sys


def main():
    args = sys.argv[1:]
    if '--help' in args or '-h' in args:
        print(__doc__)
        return 0
    # Delegate parsing/validation and exit status; explicit input is required by the wrapper.
    command = [sys.executable, str(Path(__file__).with_name('merge-affiliate-results.py')), *args]
    targets = [target for target in ['data/brand_branches_master.json', 'src/data/brand-branches.json'] if Path(target).is_file()]
    if not targets:
        print('Missing brand branch snapshots; no changes made.', file=sys.stderr)
        return 1
    for target in targets:
        command.append('--brand-json=' + target)
    # Override default food/drink targets. Explicit missing pending files are rejected upstream.
    command.append('--pending=data/brand_branches_pending_affiliate.csv')
    return subprocess.run(command, check=False).returncode


if __name__ == '__main__':
    sys.exit(main())
