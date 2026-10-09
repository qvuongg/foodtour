import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { restaurantMetadata, mergeCrawledBranch, preserveBranchAffiliates, mergeBranchSnapshots, withBrandSnapshotLock, fetchAllRows } from "../scripts/lib/restaurant-metadata.mjs";
import { getMaintenanceKey, getMaintenanceHeaders } from "../scripts/lib/maintenance-env.mjs";

const oldLink = "https://spf.shopee.vn/old-import";
const newLink = "https://spf.shopee.vn/new-import";
const restaurant = {
  id: "r-42", delivery_id: 42, name: "Quán thử", address: "Địa chỉ thử", district: "Quận thử",
  city: "da-nang", lat: 16.06, lng: 108.21, rating: 4.7, rating_count: 200,
  original_url: "https://shopeefood.vn/da-nang/quan-thu", affiliate_url: oldLink,
};

test("crawler metadata never owns affiliate fields, including stale non-null links", () => {
  for (const affiliate_url of [undefined, null, "", oldLink]) {
    const payload = restaurantMetadata({ ...restaurant, affiliate_url, affiliate_updated_at: "stale", isNew: true });
    assert.equal(Object.hasOwn(payload, "affiliate_url"), false);
    assert.equal(Object.hasOwn(payload, "affiliate_updated_at"), false);
    const databaseRow = { ...restaurant, affiliate_url: newLink };
    Object.assign(databaseRow, payload);
    assert.equal(databaseRow.affiliate_url, newLink);
  }
});

test("fresh local metadata keeps imported affiliate fields and blocks cross-branch merge", () => {
  const existing = { ...restaurant, affiliate_source: "batch.csv", affiliate_updated_at: "2026-10-10" };
  for (const affiliate_url of [undefined, null, "", newLink]) {
    const result = mergeCrawledBranch(existing, { ...restaurant, name: "Tên mới", affiliate_url });
    assert.equal(result.name, "Tên mới");
    assert.equal(result.affiliate_url, oldLink);
    assert.equal(result.affiliate_source, "batch.csv");
  }
  assert.throws(() => mergeCrawledBranch(existing, { ...restaurant, delivery_id: 43 }), /different delivery/);
  assert.equal(Object.hasOwn(mergeCrawledBranch(undefined, restaurant), "affiliate_url"), false);
});

test("checkpoint re-read keeps links imported while crawling and refuses conflicting snapshots", () => {
  const result = preserveBranchAffiliates([{ ...restaurant, name: "Fresh name" }], [{ ...restaurant, affiliate_url: newLink }]);
  assert.equal(result[0].name, "Fresh name");
  assert.equal(result[0].affiliate_url, newLink);
  const merged = mergeBranchSnapshots([[restaurant], [{ ...restaurant, affiliate_url: null }]]);
  assert.equal(merged[0].affiliate_url, oldLink);
  assert.throws(() => mergeBranchSnapshots([[restaurant], [{ ...restaurant, affiliate_url: newLink }]]), /Conflicting affiliate/);
});

test("brand snapshot lock blocks concurrent writers and releases after success or failure", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "foodtour-branch-lock-"));
  const lock = path.join(directory, "write.lock");
  try {
    withBrandSnapshotLock(() => {
      assert.equal(fs.existsSync(lock), true);
      assert.throws(() => withBrandSnapshotLock(() => assert.fail("must not enter"), lock), /another process/);
      assert.equal(fs.existsSync(lock), true);
    }, lock);
    assert.equal(fs.existsSync(lock), false);
    assert.throws(() => withBrandSnapshotLock(() => { throw new Error("fixture failure"); }, lock), /fixture failure/);
    assert.equal(fs.existsSync(lock), false);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("preload fetches beyond both requested page size and smaller server cap", async () => {
  const data = Array.from({ length: 1205 }, (_, id) => ({ id }));
  const offsets = [];
  const result = await fetchAllRows("https://db.test/rest/v1/restaurants?select=id", {}, async (value) => {
    const url = new URL(value);
    const offset = Number(url.searchParams.get("offset"));
    offsets.push(offset);
    assert.equal(url.searchParams.get("order"), "id.asc");
    return { ok: true, json: async () => data.slice(offset, offset + 500) };
  });
  assert.deepEqual(result, data);
  assert.deepEqual(offsets, [0, 500, 1000, 1205]);
});

test("private maintenance keys reject public fallbacks and never echo invalid secrets", () => {
  const jwt = (role) => `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
  assert.equal(getMaintenanceKey({ VITE_SUPABASE_ANON_KEY: jwt("service_role") }), "");
  assert.throws(() => getMaintenanceKey({ SUPABASE_SERVICE_ROLE_KEY: jwt("anon") }), /public\/invalid/);
  assert.throws(() => getMaintenanceKey({}, { required: true }), /Missing/);
  assert.deepEqual(getMaintenanceHeaders(getMaintenanceKey({ SUPABASE_SECRET_KEY: "sb_secret_fixture" })), { apikey: "sb_secret_fixture" });
  assert.equal(getMaintenanceHeaders(getMaintenanceKey({ SUPABASE_SERVICE_ROLE_KEY: jwt("service_role") })).Authorization, `Bearer ${jwt("service_role")}`);
  const badSecret = "private-value-that-must-not-be-logged";
  assert.throws(() => getMaintenanceKey({ SUPABASE_SECRET_KEY: badSecret }), (error) => !error.message.includes(badSecret));
});

test("all four real sync paths omit affiliate on the wire and preserve a concurrent import", async (t) => {
  const oldSecret = process.env.SUPABASE_SECRET_KEY;
  const oldUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_SECRET_KEY = "sb_secret_fixture";
  process.env.SUPABASE_URL = "https://database.fixture.test";
  t.after(() => { if (oldSecret === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY = oldSecret; });
  t.after(() => { if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl; });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Importing a script must not access the network"); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const [brand, batch, drinks, pending] = await Promise.all([
    import("../scripts/crawl-brand-branches.mjs"), import("../scripts/crawl-shopeefood-batch.mjs"),
    import("../scripts/crawl-drinks.mjs"), import("../scripts/sync-pending-supabase.mjs"),
  ]);
  const paths = [
    ["brand", (row) => brand.syncBranchesToSupabase([{ ...row, shopeefood_url: row.original_url }])],
    ["batch", (row) => batch.syncToSupabaseDirect([row], "Phở", null)],
    ["drinks", (row) => drinks.syncToSupabase([{ ...row, isNew: true }], "Trà sữa", { dishMap: new Map([["tra-sua", 1]]) })],
    ["pending queue", (row) => pending.syncToSupabaseDirect([row], "Phở", null)],
  ];
  for (const [name, sync] of paths) {
    for (const affiliate_url of [undefined, null, oldLink]) {
      let metadataPosts = 0;
      const databaseRow = { ...restaurant, affiliate_url: newLink };
      globalThis.fetch = async (value, options = {}) => {
        const url = new URL(value);
        assert.equal(options.headers.apikey, "sb_secret_fixture");
        assert.equal(options.headers.Authorization, undefined);
        if (options.method === "POST" && url.pathname.endsWith("/restaurants")) {
          const [payload] = JSON.parse(options.body);
          assert.equal(Object.hasOwn(payload, "affiliate_url"), false, name);
          Object.assign(databaseRow, payload);
          metadataPosts++;
        }
        return { ok: true, status: 200, json: async () => [{ id: restaurant.id, delivery_id: restaurant.delivery_id }] };
      };
      await sync({ ...restaurant, name: "New metadata", affiliate_url });
      assert.equal(metadataPosts, 1, name);
      assert.equal(databaseRow.affiliate_url, newLink, name);
      assert.equal(databaseRow.name, "New metadata", name);
    }
  }
});
