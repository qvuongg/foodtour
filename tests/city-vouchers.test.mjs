import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "tnag-city-vouchers-"));
buildSync({
  entryPoints: ["src/lib/city-vouchers.ts"],
  outfile: join(out, "city-vouchers.mjs"),
  bundle: true,
  format: "esm",
});

const {
  CITY_VOUCHERS_CATALOG,
  resolveVoucherAffiliateLink,
  getVouchersForCity,
  getCityShopeeHubUrl,
} = await import(pathToFileURL(join(out, "city-vouchers.mjs")).href);

test("CITY_VOUCHERS_CATALOG integrity and 3-city coverage", () => {
  assert.ok(CITY_VOUCHERS_CATALOG.length >= 20, "Must have at least 20 vouchers total");

  const cities = new Set(CITY_VOUCHERS_CATALOG.map((v) => v.city));
  assert.ok(cities.has("ha-noi"), "Must contain Ha Noi vouchers");
  assert.ok(cities.has("da-nang"), "Must contain Da Nang vouchers");
  assert.ok(cities.has("ho-chi-minh"), "Must contain Ho Chi Minh vouchers");

  for (const v of CITY_VOUCHERS_CATALOG) {
    assert.ok(v.id && typeof v.id === "string", "id missing");
    assert.ok(v.subId && typeof v.subId === "string", "subId missing");
    assert.ok(/^[a-z0-9]{3,16}$/.test(v.subId), `subId must be alphanumeric (3-16 chars): ${v.subId}`);
    assert.ok(v.titleVi && typeof v.titleVi === "string", "titleVi missing");
    assert.ok(v.titleEn && typeof v.titleEn === "string", "titleEn missing");
    assert.ok(v.badge && typeof v.badge === "string", "badge missing");
    assert.ok(v.discountVi && typeof v.discountVi === "string", "discountVi missing");
    assert.ok(v.minOrderVi && typeof v.minOrderVi === "string", "minOrderVi missing");
    assert.ok(["ha-noi", "da-nang", "ho-chi-minh"].includes(v.city), "city invalid");
    assert.ok(["all", "freeship", "megadeal", "lunch", "drinks", "party"].includes(v.category), "category invalid");
    assert.ok(v.originalUrl.startsWith("https://shopeefood.vn/"), `originalUrl invalid: ${v.originalUrl}`);
  }
});

test("getVouchersForCity returns properly filtered vouchers per city", () => {
  const hanoiVouchers = getVouchersForCity("ha-noi");
  assert.ok(hanoiVouchers.length >= 6);
  assert.ok(hanoiVouchers.every((v) => v.city === "ha-noi"));

  const danangVouchers = getVouchersForCity("da-nang");
  assert.ok(danangVouchers.length >= 6);
  assert.ok(danangVouchers.every((v) => v.city === "da-nang"));

  const hcmVouchers = getVouchersForCity("ho-chi-minh");
  assert.ok(hcmVouchers.length >= 6);
  assert.ok(hcmVouchers.every((v) => v.city === "ho-chi-minh"));
});

test("getVouchersForCity filters by category", () => {
  const freeshipHanoi = getVouchersForCity("ha-noi", "freeship");
  assert.ok(freeshipHanoi.length >= 1);
  assert.ok(freeshipHanoi.every((v) => v.category === "freeship" && v.city === "ha-noi"));
});

test("resolveVoucherAffiliateLink embeds required affiliate parameters when no shortlink is configured", () => {
  const fallbackVoucher = {
    ...CITY_VOUCHERS_CATALOG[0],
    affiliateUrl: undefined,
  };
  const trackingUrl = resolveVoucherAffiliateLink(fallbackVoucher);

  const parsed = new URL(trackingUrl);
  assert.equal(parsed.searchParams.get("mmp_pid"), "an_17316810077");
  assert.equal(parsed.searchParams.get("utm_source"), "an_17316810077");
  assert.equal(parsed.searchParams.get("utm_medium"), "affiliate_food");
  assert.ok(parsed.searchParams.get("utm_campaign").startsWith("foodtour_voucher_"));
  assert.equal(parsed.searchParams.get("sub_id"), fallbackVoucher.subId);
});

test("resolveVoucherAffiliateLink prefers custom affiliateUrl when set", () => {
  const voucher = CITY_VOUCHERS_CATALOG[0];
  const resolved = resolveVoucherAffiliateLink(voucher);
  assert.ok(resolved.startsWith("https://shope.ee/"), `Must return shope.ee link: ${resolved}`);
});

test("getCityShopeeHubUrl generates city-specific affiliate landing link", () => {
  const hanoiHub = getCityShopeeHubUrl("ha-noi");
  assert.ok(hanoiHub.includes("/ha-noi/food/collection-list"));
  assert.ok(hanoiHub.includes("mmp_pid=an_17316810077"));
  assert.ok(hanoiHub.includes("sub_id=hubhanoi"));

  const danangHub = getCityShopeeHubUrl("da-nang");
  assert.ok(danangHub.includes("/da-nang/food/collection-list"));
  assert.ok(danangHub.includes("sub_id=hubdanang"));

  const hcmHub = getCityShopeeHubUrl("ho-chi-minh");
  assert.ok(hcmHub.includes("/ho-chi-minh/food/collection-list"));
  assert.ok(hcmHub.includes("sub_id=hubhochiminh"));
});
