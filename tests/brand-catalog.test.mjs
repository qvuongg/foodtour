import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "tnag-brand-catalog-"));
buildSync({
  entryPoints: ["src/lib/brand-catalog.ts"],
  outfile: join(out, "brand-catalog.mjs"),
  bundle: true,
  format: "esm",
});

const {
  TOP_BEVERAGE_BRANDS,
  resolveBrandShopeeLink,
} = await import(pathToFileURL(join(out, "brand-catalog.mjs")).href);

test("TOP_BEVERAGE_BRANDS contains valid list of top chains", () => {
  assert.ok(TOP_BEVERAGE_BRANDS.length >= 10);

  const seenIds = new Set();
  const seenSubIds = new Set();

  for (const brand of TOP_BEVERAGE_BRANDS) {
    assert.ok(brand.id && typeof brand.id === "string", `Missing brand id: ${JSON.stringify(brand)}`);
    assert.ok(brand.name && typeof brand.name === "string", `Missing brand name: ${brand.id}`);
    assert.ok(brand.shortName && typeof brand.shortName === "string", `Missing shortName: ${brand.id}`);
    assert.ok(brand.taglineVi && typeof brand.taglineVi === "string", `Missing taglineVi: ${brand.id}`);
    assert.ok(brand.taglineEn && typeof brand.taglineEn === "string", `Missing taglineEn: ${brand.id}`);
    assert.ok(brand.initials && brand.initials.length >= 1 && brand.initials.length <= 3, `Invalid initials: ${brand.id}`);
    assert.match(brand.themeColor, /^#[0-9A-Fa-f]{6}$/, `Invalid themeColor: ${brand.id}`);
    assert.match(brand.textColor, /^#[0-9A-Fa-f]{6}$/, `Invalid textColor: ${brand.id}`);
    assert.ok(brand.searchKeyword && brand.searchKeyword.length > 0, `Missing searchKeyword: ${brand.id}`);
    assert.ok(brand.subId && brand.subId.startsWith("brand_"), `Invalid subId format: ${brand.id}`);
    assert.ok(brand.logoUrl && typeof brand.logoUrl === "string", `Missing logoUrl: ${brand.id}`);

    // Verify physical logo asset exists in public folder
    const localAssetPath = join(process.cwd(), "public", brand.logoUrl.replace(/^\//, ""));
    assert.ok(existsSync(localAssetPath), `Physical logo file missing for ${brand.id}: ${localAssetPath}`);

    assert.ok(!seenIds.has(brand.id), `Duplicate brand id: ${brand.id}`);
    assert.ok(!seenSubIds.has(brand.subId), `Duplicate brand subId: ${brand.subId}`);
    seenIds.add(brand.id);
    seenSubIds.add(brand.subId);
  }
});

test("TOP_BEVERAGE_BRANDS includes national iconic brands", () => {
  const ids = TOP_BEVERAGE_BRANDS.map((b) => b.id);
  assert.ok(ids.includes("highlands"), "Highlands Coffee should be included");
  assert.ok(ids.includes("phuclong"), "Phúc Long should be included");
  assert.ok(ids.includes("phela"), "Phê La should be included");
  assert.ok(ids.includes("katinat"), "Katinat should be included");
  assert.ok(ids.includes("thecoffeehouse"), "The Coffee House should be included");
  assert.ok(ids.includes("starbucks"), "Starbucks should be included");
});

test("resolveBrandShopeeLink generates valid affiliate link with UTM parameters", () => {
  const highlands = TOP_BEVERAGE_BRANDS.find((b) => b.id === "highlands");
  assert.ok(highlands);

  const urlStr = resolveBrandShopeeLink(highlands, "da-nang");
  assert.ok(urlStr.startsWith("https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q="));

  const parsed = new URL(urlStr);
  assert.equal(parsed.searchParams.get("mmp_pid"), "an_17316810077");
  assert.equal(parsed.searchParams.get("utm_source"), "an_17316810077");
  assert.equal(parsed.searchParams.get("utm_medium"), "affiliate_food");
  assert.equal(parsed.searchParams.get("utm_campaign"), "foodtour_brand_hub");
  assert.equal(parsed.searchParams.get("sub_id"), "brand_highlands");
  assert.equal(parsed.searchParams.get("q"), "Highlands Coffee");
});

test("resolveBrandShopeeLink supports other cities gracefully", () => {
  const phela = TOP_BEVERAGE_BRANDS.find((b) => b.id === "phela");
  assert.ok(phela);

  const urlHanoi = resolveBrandShopeeLink(phela, "ha-noi");
  assert.ok(urlHanoi.startsWith("https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q="));

  const urlHcm = resolveBrandShopeeLink(phela, "ho-chi-minh");
  assert.ok(urlHcm.startsWith("https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q="));

  // Invalid city falls back to DEFAULT_ORDERING_CITY ("da-nang")
  const urlFallback = resolveBrandShopeeLink(phela, "invalid-city-xyz");
  assert.ok(urlFallback.startsWith("https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q="));
});

test("resolveBrandShopeeLink prioritizes direct affiliateUrl if present", () => {
  const customBrand = {
    id: "custom",
    name: "Custom Cafe",
    shortName: "Custom",
    taglineVi: "Custom",
    taglineEn: "Custom",
    initials: "CC",
    themeColor: "#123456",
    textColor: "#FFFFFF",
    searchKeyword: "Custom",
    subId: "brand_custom",
    affiliateUrl: "https://shope.ee/custom12345",
  };

  const resolved = resolveBrandShopeeLink(customBrand);
  assert.equal(resolved, "https://shope.ee/custom12345");
});
