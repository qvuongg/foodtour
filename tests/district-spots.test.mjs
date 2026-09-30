import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "tnag-district-spots-"));
buildSync({
  entryPoints: ["src/lib/district-spots.ts"],
  outfile: join(out, "district-spots.mjs"),
  bundle: true,
  format: "esm",
});

const {
  DA_NANG_DISTRICTS,
  CURATED_DRINK_SPOTS,
  detectClosestDistrict,
  getSpotsForDistrict,
  formatRatingCount,
  resolveDistrictSpotLink,
} = await import(pathToFileURL(join(out, "district-spots.mjs")).href);

test("DA_NANG_DISTRICTS contains all major Da Nang urban districts", () => {
  assert.ok(DA_NANG_DISTRICTS.length >= 6);
  const districtIds = DA_NANG_DISTRICTS.map((d) => d.id);
  assert.ok(districtIds.includes("lien-chieu"));
  assert.ok(districtIds.includes("hai-chau"));
  assert.ok(districtIds.includes("thanh-khe"));
  assert.ok(districtIds.includes("son-tra"));
  assert.ok(districtIds.includes("ngu-hanh-son"));
  assert.ok(districtIds.includes("cam-le"));
});

test("CURATED_DRINK_SPOTS integrity and schema compliance", () => {
  assert.ok(CURATED_DRINK_SPOTS.length >= 15);

  for (const spot of CURATED_DRINK_SPOTS) {
    assert.ok(spot.id && typeof spot.id === "string", `Spot ID missing: ${JSON.stringify(spot)}`);
    assert.ok(spot.name && typeof spot.name === "string", `Spot name missing: ${spot.id}`);
    assert.ok(spot.districtId && typeof spot.districtId === "string", `districtId missing: ${spot.id}`);
    assert.ok(spot.address && typeof spot.address === "string", `address missing: ${spot.id}`);
    assert.ok(typeof spot.lat === "number" && spot.lat > 15 && spot.lat < 17, `lat invalid: ${spot.id}`);
    assert.ok(typeof spot.lng === "number" && spot.lng > 107 && spot.lng < 109, `lng invalid: ${spot.id}`);
    assert.ok(spot.rating >= 4.0 && spot.rating <= 5.0, `rating invalid: ${spot.id}`);
    assert.ok(spot.ratingCount > 0, `ratingCount invalid: ${spot.id}`);
    assert.ok(Array.isArray(spot.specialties) && spot.specialties.length > 0, `specialties empty: ${spot.id}`);
    assert.ok(spot.originalUrl.startsWith("https://shopeefood.vn/"), `originalUrl invalid: ${spot.id}`);
  }
});

test("detectClosestDistrict correctly selects nearest district or defaults gracefully", () => {
  // Graceful fallback for undefined/invalid coordinates
  assert.equal(detectClosestDistrict(undefined, undefined), "lien-chieu");
  assert.equal(detectClosestDistrict(NaN, NaN), "lien-chieu");

  // Near Da Nang University of Technology (BK) -> Liên Chiểu
  assert.equal(detectClosestDistrict(16.0735, 108.1432), "lien-chieu");

  // Near Dragon Bridge / Bach Dang -> Hải Châu
  assert.equal(detectClosestDistrict(16.061, 108.2185), "hai-chau");

  // Near Dien Bien Phu -> Thanh Khê
  assert.equal(detectClosestDistrict(16.0645, 108.192), "thanh-khe");

  // Near My Khe Beach / Son Tra -> Sơn Trà
  assert.equal(detectClosestDistrict(16.0754, 108.245), "son-tra");

  // Near An Thuong Foreigner Quarter -> Ngũ Hành Sơn
  assert.equal(detectClosestDistrict(16.052, 108.2435), "ngu-hanh-son");

  // Near Cam Le District People's Committee -> Cẩm Lệ
  assert.equal(detectClosestDistrict(16.0185, 108.1952), "cam-le");
});

test("getSpotsForDistrict retrieves curated spots for specified district", () => {
  const lcSpots = getSpotsForDistrict("lien-chieu");
  assert.ok(lcSpots.length >= 8);
  assert.ok(lcSpots.every((s) => s.districtId === "lien-chieu"));

  const hcSpots = getSpotsForDistrict("hai-chau");
  assert.ok(hcSpots.length >= 4);
  assert.ok(hcSpots.every((s) => s.districtId === "hai-chau"));

  const invalid = getSpotsForDistrict("unknown-district");
  assert.deepEqual(invalid, []);
});

test("formatRatingCount formats 1000+ as 999+ according to product specification", () => {
  assert.equal(formatRatingCount(undefined), "");
  assert.equal(formatRatingCount(0), "");
  assert.equal(formatRatingCount(-5), "");
  assert.equal(formatRatingCount(50), "50");
  assert.equal(formatRatingCount(999), "999");
  assert.equal(formatRatingCount(1000), "999+");
  assert.equal(formatRatingCount(2400), "999+");
});

test("resolveDistrictSpotLink returns affiliate URL or tracks campaign and sub_id", () => {
  const spotWithAff = {
    id: "test_spot_1",
    name: "Cafe Chú Long",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "123 Nlb",
    lat: 16.07,
    lng: 108.14,
    rating: 4.8,
    ratingCount: 500,
    specialties: ["Cà phê muối"],
    affiliateUrl: "https://shope.ee/test12345",
    originalUrl: "https://shopeefood.vn/da-nang/cafe-chu-long",
  };
  assert.equal(resolveDistrictSpotLink(spotWithAff), "https://shope.ee/test12345");

  const spotWithoutAff = {
    id: "test_spot_2",
    name: "Quán Trà Sữa",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "456 Nlb",
    lat: 16.07,
    lng: 108.14,
    rating: 4.8,
    ratingCount: 500,
    specialties: ["Trà sữa"],
    originalUrl: "https://shopeefood.vn/da-nang/quan-tra-sua",
  };
  const resolved = resolveDistrictSpotLink(spotWithoutAff, "Quán Trà Sữa");
  assert.ok(resolved.includes("utm_campaign=foodtour_district_spots"));
  assert.ok(resolved.includes("sub_id=quan_tra_sua"));
});
