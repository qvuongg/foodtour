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
  assert.ok(ids.includes("starbucks"), "Starbucks should be included");
  assert.ok(ids.includes("mixue"), "Mixue should be included");
  assert.ok(ids.includes("gongcha"), "Gong Cha should be included");
});

test("resolveBrandShopeeLink prioritizes direct affiliateUrl and cityBranches from database", () => {
  const highlands = TOP_BEVERAGE_BRANDS.find((b) => b.id === "highlands");
  assert.ok(highlands);

  // Da Nang branch
  const urlDaNang = resolveBrandShopeeLink(highlands, "da-nang");
  assert.equal(urlDaNang, "https://shope.ee/3VkfEe8V7W");

  // Hanoi branch
  const urlHanoi = resolveBrandShopeeLink(highlands, "ha-noi");
  assert.equal(urlHanoi, "https://shope.ee/6VOGo9x52q");

  // HCM branch
  const urlHcm = resolveBrandShopeeLink(highlands, "ho-chi-minh");
  assert.equal(urlHcm, "https://shope.ee/8fSlO8opf4");

  // Fallback to primary brand affiliate link when no city specified
  const urlDefault = resolveBrandShopeeLink(highlands);
  assert.equal(urlDefault, "https://shope.ee/3VkfEe8V7W");
});

test("resolveBrandShopeeLink generates valid tracked restaurant URL for brands without shortlink", () => {
  const koithe = TOP_BEVERAGE_BRANDS.find((b) => b.id === "koithe");
  assert.ok(koithe);

  const urlHanoi = resolveBrandShopeeLink(koithe, "ha-noi");
  assert.ok(urlHanoi.startsWith("https://shopeefood.vn/ha-noi/koi-the-cau-giay"));
  const parsed = new URL(urlHanoi);
  assert.equal(parsed.searchParams.get("mmp_pid"), "an_17316810077");
  assert.equal(parsed.searchParams.get("utm_source"), "an_17316810077");
  assert.equal(parsed.searchParams.get("sub_id"), "brand_koithe");
});

test("resolveBrandShopeeLink generates valid fallback search URL with UTM parameters when no store in DB", () => {
  const genericBrand = {
    id: "generic",
    name: "Generic Tea",
    shortName: "Generic",
    logoUrl: "/brands/generic.png",
    taglineVi: "Trà",
    taglineEn: "Tea",
    initials: "GT",
    themeColor: "#123456",
    textColor: "#FFFFFF",
    searchKeyword: "Generic Tea",
    subId: "brand_generic",
  };

  const urlStr = resolveBrandShopeeLink(genericBrand, "da-nang");
  assert.ok(urlStr.startsWith("https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q="));

  const parsed = new URL(urlStr);
  assert.equal(parsed.searchParams.get("mmp_pid"), "an_17316810077");
  assert.equal(parsed.searchParams.get("utm_source"), "an_17316810077");
  assert.equal(parsed.searchParams.get("utm_medium"), "affiliate_food");
  assert.equal(parsed.searchParams.get("utm_campaign"), "foodtour_brand_hub");
  assert.equal(parsed.searchParams.get("sub_id"), "brand_generic");
  assert.equal(parsed.searchParams.get("q"), "Generic Tea");

  // Invalid city falls back gracefully
  const urlFallback = resolveBrandShopeeLink(genericBrand, "invalid-city-xyz");
  assert.ok(urlFallback.startsWith("https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q="));
});
