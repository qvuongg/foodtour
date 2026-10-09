# Supabase credentials and affiliate maintenance

Updated: 2026-10-10. Scope: frontend credential exposure, exact branch imports, affiliate preservation during metadata sync.

## Credential boundary

- Frontend: `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY`, containing a publishable key (`sb_publishable_…`) or a legacy JWT with role `anon`.
- Maintenance: `SUPABASE_SECRET_KEY` (preferred), or an unrevoked legacy `SUPABASE_SERVICE_ROLE_KEY`. Never prefix these with `VITE_`. These credentials belong only on the operator's machine or private job runner; the static Vercel frontend does not need them.
- Maintenance requires an explicit HTTPS origin in `SUPABASE_URL` or `VITE_SUPABASE_URL`. It never falls back to a hardcoded project or a public key. Shell configuration takes priority across aliases as well as individual variable names.
- Vite rejects privileged credentials in any `VITE_*` variable during development and production builds, including values loaded from an overridden environment directory. The browser client independently rejects invalid configuration.
- Publishable/secret keys use `apikey`; legacy JWT keys additionally use `Authorization: Bearer …`.

Changing the frontend value does **not** revoke an already leaked key. The production incident is contained only after the old credential is disabled and rejection is independently verified.

## Production key incident procedure

1. Pause crawler/import jobs while rotating credentials. Do not put secrets into Git, chat, screenshots, reports, or command arguments.
2. Replace the Production `VITE_SUPABASE_ANON_KEY` in Vercel with the project's publishable key. Save, then deploy the guarded frontend. Changing an environment value alone does not change an existing build.
3. Check the actual public JavaScript bundle for privileged JWTs/secret keys, and check restaurant reads/RPCs using the publishable key. Do not log key values.
4. In Supabase → Settings → API Keys → Legacy, disable JWT-based API keys after migrating consumers. **This alone is insufficient for a leaked service-role JWT**: the token can remain valid in `Authorization` when combined with a publishable `apikey`. This was reproduced with a read-only administrative endpoint during this repair; no user records were output or saved.
5. In Settings → JWT Keys → JWT Signing Keys, revoke the **Legacy HS256** key under **Previously used keys**. This project already has a current ECC (P-256) key, so no further migration/rotation is needed. Keep the current ECC key. Revocation also invalidates any remaining sessions signed by the legacy key. Account-owner credential changes must be completed directly by the owner when using the browser workflow.
6. Verify both `apikey: OLD_KEY` and `apikey: PUBLISHABLE_KEY` with `Authorization: Bearer OLD_KEY` are rejected. The publishable-only restaurant reads must still succeed. Record HTTP statuses, never credentials. Do not use a write/delete probe against production.
7. Remove the old service-role value from local/job configuration. If maintenance is needed, the owner can put the project's private `sb_secret_…` key into `SUPABASE_SECRET_KEY` locally, with file permissions restricted to the operator. No need to send the value through chat or expose it in the Vercel frontend.
8. Review existing Supabase audit logs and backups for the exposure period. A successful rotation does not prove that no earlier access or data modification occurred.

Old deployment assets or browser caches may still contain the old bytes. Revocation is the essential containment step; deleting a local file or rebuilding cannot invalidate already downloaded credentials. Avoid rolling back to a deployment built with the leaked key.

Official references: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [JWT signing keys and revocation](https://supabase.com/docs/guides/auth/signing-keys).

## Import affiliate links safely

```bash
# Read-only database preflight and a local report; no restaurant/CSV changes.
python3 scripts/merge-affiliate-results.py --files=data/AffiliateBatchCustomLinks_result.csv

# Apply only after reviewing the report and selecting an unambiguous batch.
python3 scripts/merge-affiliate-results.py --files=data/AffiliateBatchCustomLinks_result.csv --apply

# CSV already containing named original and affiliate columns.
node scripts/import-affiliate-csv.mjs --file=data/crawler_urls_pending_affiliate.csv

# Brand batch: same rules; also synchronizes the existing local branch snapshots.
python3 scripts/merge-brand-branches-affiliate.py --file=data/AffiliateBatchCustomLinks_brand.csv
```

No implicit batch is selected. `--all` and `--drinks` are explicit discovery choices; combining historical batches can legitimately produce conflicts. CSV and XLSX are supported; XLSX needs `openpyxl`. Export binary XLS to CSV/XLSX first.

`--no-supabase` previews local pending CSV/brand JSON only. With `--apply`, it writes those local targets only and cannot claim database verification. `--pending=...` selects explicit local CSV targets. Use a fresh report path for each run.

Import rules:

1. Accept official HTTPS restaurant listing URLs and official short-link hosts `shope.ee`, `s.shopee.vn`, `spf.shopee.vn`. Reject search/collection routes, host lookalikes, credentials and malformed URLs. Preserve the issued affiliate URL exactly; do not manufacture tracking parameters.
2. Canonicalize only approved listing URL variations, then require exactly one matching restaurant ID. Never use partial `LIKE`/`ILIKE` matching. Conflicting batch mappings or zero/multiple database matches block the batch before any write.
3. Preserve a different existing affiliate by default. An intentional replacement needs `--replace-existing` after reconciliation. Re-running the same mapping is a no-op.
4. Write a restricted-permission report before mutation, including batch hashes and each old/new value. Reports live under ignored `artifacts/affiliate-import/` and must not overwrite inputs or local data snapshots.
5. Apply a conditional PATCH by stable ID, exact original URL and the previous affiliate value. Require exactly one returned row and read it back. A concurrent update, request failure or uncertain response stops subsequent writes.
6. Record `verified`, `pending_verification` or `requires_reconciliation` per row. A batch is not a database transaction: already verified rows may have committed before a later failure. Inspect the report and current database before retrying; never assume a timeout means nothing changed.
7. Local CSV/JSON writes recheck source hashes under a shared lock. A crashed process can leave `data/.brand-affiliate-write.lock`; verify the owning process is gone before removing that lock.

For rollback, use the report's previous values and require that the current database value still matches the value written by that run. Do not restore an old full-table snapshot over subsequent work. Reports contain recovery information; there is no automatic rollback command.

Matching an exported original URL to the correct row prevents cross-branch updates. It does not independently prove that Shopee's opaque short link targets that restaurant or that an order earns commission. Those require Shopee export provenance and dashboard reconciliation.

Historical local batches were found to contain conflicting duplicate mappings. They are deliberately rejected. Do not use `--all --replace-existing` as a blanket repair, and do not infer previously corrupted production links from names alone.

## Crawl/sync ownership

Only the dedicated importer owns `affiliate_url`. The four restaurant metadata writers (`crawl-brand-branches`, `crawl-shopeefood-batch`, `crawl-drinks`, `sync-pending-supabase`) omit the column completely from their payloads, including when an offline queue contains a stale non-null link. A new row gets the database default; an existing row retains its imported affiliate.

Brand JSON checkpoints preserve existing affiliate fields and re-read both snapshots under the same lock used by imports. Conflicting snapshots stop processing instead of selecting an arbitrary winner. Database preloads paginate until the final empty page. Missing private credentials cannot acknowledge/remove a pending retry queue.

There is no production database trigger or permission migration in this patch. Scripts outside these reviewed entrypoints or direct administrative writes can still alter affiliate fields; retire old copies of the unsafe scripts.

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
```

Regression tests cover frontend dev/build rejection; runtime fail-closed behavior; public/secret header formats; exact prefix-collision branch matching; duplicate and missing mappings; idempotence; no-write default; conditional PATCH and read-back; paging; safe reports and locks; and actual crawler/sync request payloads intercepted with a fake database.

Live validation uses read-only restaurant requests and the two search RPCs with sample public city coordinates. No production import, crawl, database mutation, or destructive probe is part of verification.
