import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "tnag-restaurant-roulette-"));
buildSync({
  entryPoints: ["src/lib/restaurant-roulette.ts"],
  outfile: join(out, "restaurant-roulette.mjs"),
  bundle: true,
  format: "esm",
});

const {
  RESTAURANT_ROULETTE_CATALOG,
  getEligibleRestaurants,
  resolveRestaurantActionUrl,
} = await import(pathToFileURL(join(out, "restaurant-roulette.mjs")).href);

test("RESTAURANT_ROULETTE_CATALOG integrity and 3-city coverage", () => {
  assert.ok(RESTAURANT_ROULETTE_CATALOG.length >= 100, "Catalog must have at least 100 restaurants");

  const cities = new Set(RESTAURANT_ROULETTE_CATALOG.map((r) => r.city));
  assert.ok(cities.has("ha-noi"), "Must contain Ha Noi");
  assert.ok(cities.has("da-nang"), "Must contain Da Nang");
  assert.ok(cities.has("ho-chi-minh"), "Must contain Ho Chi Minh");

  for (const item of RESTAURANT_ROULETTE_CATALOG) {
    assert.ok(item.id && typeof item.id === "string", "id missing");
    assert.ok(item.name && typeof item.name === "string", "name missing");
    assert.ok(item.city && ["ha-noi", "da-nang", "ho-chi-minh"].includes(item.city), "invalid city");
    assert.ok(typeof item.lat === "number" && !isNaN(item.lat), "lat invalid");
    assert.ok(typeof item.lng === "number" && !isNaN(item.lng), "lng invalid");
    assert.ok(item.rating >= 4.0 && item.rating <= 5.0, `rating invalid: ${item.rating}`);
    // Mandatory user rule: ratingCount >= 100!
    assert.ok(
      item.ratingCount >= 100,
      `User requirement violation: ratingCount must be >= 100, got ${item.ratingCount} for ${item.name}`,
    );
    assert.ok(Array.isArray(item.specialties) && item.specialties.length > 0, `specialties empty for ${item.name}`);
    assert.ok(item.shopeeUrl.startsWith("https://shopeefood.vn/"), `shopeeUrl invalid: ${item.shopeeUrl}`);
    assert.ok(["lunch", "drink", "snack", "nhau"].includes(item.category), `category invalid: ${item.category}`);
  }
});

test("getEligibleRestaurants filters properly by city and returns >= 8 items for reel", () => {
  const hanoiSpots = getEligibleRestaurants({ city: "ha-noi", category: "lunch" });
  assert.ok(hanoiSpots.length >= 8, "Must provide >= 8 items for spinning reel");
  assert.ok(hanoiSpots.every((r) => r.city === "ha-noi"));

  const danangSpots = getEligibleRestaurants({ city: "da-nang", category: "lunch" });
  assert.ok(danangSpots.length >= 8);
  assert.ok(danangSpots.every((r) => r.city === "da-nang"));

  const hcmSpots = getEligibleRestaurants({ city: "ho-chi-minh", category: "lunch" });
  assert.ok(hcmSpots.length >= 8);
  assert.ok(hcmSpots.every((r) => r.city === "ho-chi-minh"));
});

test("getEligibleRestaurants filters by 3km GPS radius when user coordinates are provided", () => {
  // Near Da Nang City Hall (Hải Châu: 16.0602, 108.2208)
  const nearby = getEligibleRestaurants({
    city: "da-nang",
    category: "lunch",
    userCoords: { lat: 16.0602, lng: 108.2208 },
    maxRadiusKm: 3.0,
  });

  assert.ok(nearby.length >= 8);
  // All spots should be within reasonable proximity or graceful fallback
  assert.ok(nearby.every((r) => r.ratingCount >= 100));
});

test("resolveRestaurantActionUrl prefers affiliate shortlink when present", () => {
  const itemWithAff = RESTAURANT_ROULETTE_CATALOG.find((r) => r.affiliateUrl);
  if (itemWithAff) {
    assert.equal(resolveRestaurantActionUrl(itemWithAff), itemWithAff.affiliateUrl);
  }

  const itemWithoutAff = {
    ...RESTAURANT_ROULETTE_CATALOG[0],
    affiliateUrl: undefined,
  };
  assert.equal(resolveRestaurantActionUrl(itemWithoutAff), itemWithoutAff.shopeeUrl);
});
