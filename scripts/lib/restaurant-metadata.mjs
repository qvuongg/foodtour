import * as fs from "node:fs";
import * as path from "node:path";

// Affiliate ownership is deliberately separate from crawler metadata. An old
// preload or offline queue must never overwrite a later affiliate import.
const METADATA_COLUMNS = new Set([
  "id", "delivery_id", "name", "address", "district", "city", "lat", "lng",
  "rating", "rating_count", "original_url", "is_verified", "is_active",
]);

export function restaurantMetadata(record) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => METADATA_COLUMNS.has(key)));
}

export function mergeCrawledBranch(existing, fresh) {
  if (existing?.delivery_id && String(existing.delivery_id) !== String(fresh.delivery_id)) {
    throw new Error("Cannot merge metadata from different delivery IDs.");
  }
  const merged = { ...existing, ...fresh };
  // Only the dedicated importer may replace affiliate fields. Missing, null or
  // stale crawl values are all ignored, including for a newly discovered branch.
  for (const key of Object.keys(merged)) {
    if (!key.startsWith("affiliate_")) continue;
    if (existing && Object.hasOwn(existing, key)) merged[key] = existing[key];
    else delete merged[key];
  }
  return merged;
}

/** Re-read persisted snapshots before checkpointing a long crawl. */
export function preserveBranchAffiliates(crawled, persisted) {
  const map = new Map(crawled.map((row) => [String(row.delivery_id), row]));
  for (const row of persisted) {
    if (!row.delivery_id) continue;
    const key = String(row.delivery_id);
    const fresh = map.get(key);
    if (!fresh) map.set(key, row);
    else if (row.affiliate_url) map.set(key, mergeCrawledBranch(row, fresh));
  }
  return [...map.values()];
}

export function mergeBranchSnapshots(snapshots) {
  const map = new Map();
  for (const snapshot of snapshots) {
    if (!Array.isArray(snapshot)) throw new Error("Invalid branch snapshot.");
    for (const row of snapshot) {
      if (!row.delivery_id) continue;
      const key = String(row.delivery_id);
      const previous = map.get(key);
      if (previous?.affiliate_url && row.affiliate_url && previous.affiliate_url !== row.affiliate_url) {
        throw new Error(`Conflicting affiliate snapshots for delivery ID ${key}; reconcile them before crawling.`);
      }
      map.set(key, previous?.affiliate_url ? mergeCrawledBranch(previous, row) : row);
    }
  }
  return [...map.values()];
}

/** Synchronous critical section shared by the crawler and affiliate importer. */
export function withBrandSnapshotLock(callback, lockPath = path.resolve("data/.brand-affiliate-write.lock")) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  let fd;
  try {
    fd = fs.openSync(lockPath, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST") throw new Error("Brand snapshots are being written by another process; retry after it finishes. If it crashed, check before removing its lock.");
    throw error;
  }
  try {
    fs.writeFileSync(fd, String(process.pid));
    return callback();
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lockPath);
  }
}

/** Walk all PostgREST pages, even when its server page cap is below pageSize. */
export async function fetchAllRows(url, options = {}, fetchImpl = fetch, pageSize = 1000) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new Error("Invalid page size.");
  const rows = [];
  for (;;) {
    const pageUrl = new URL(url);
    pageUrl.searchParams.set("order", "id.asc");
    pageUrl.searchParams.set("limit", String(pageSize));
    pageUrl.searchParams.set("offset", String(rows.length));
    const response = await fetchImpl(pageUrl.toString(), options);
    if (!response.ok) throw new Error(`Metadata preload failed: HTTP ${response.status}`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error("Invalid metadata preload response.");
    if (page.length === 0) return rows;
    rows.push(...page);
  }
}
