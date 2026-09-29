import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "tnag-geo-"));
buildSync({
  entryPoints: ["src/lib/geo-distance.ts"],
  outfile: join(out, "geo-distance.mjs"),
  bundle: true,
  format: "esm",
});

const { haversineDistanceKm, formatDistance, findNearbyRestaurants } =
  await import(pathToFileURL(join(out, "geo-distance.mjs")).href);

test("haversineDistanceKm calculates real-world distance accurately", () => {
  // Tọa độ Hồ Gươm (Hoàn Kiếm): 21.0285, 105.8542
  // Tọa độ Bún Chả Hương Liên (24 Lê Văn Hưu): 21.01825, 105.85292
  // Khoảng cách thực tế đường chim bay ~1.15 km
  const dist = haversineDistanceKm(21.0285, 105.8542, 21.01825, 105.85292);
  assert.ok(dist >= 1.0 && dist <= 1.3, `Distance ${dist}km should be ~1.15km`);

  // Hai điểm trùng nhau thì khoảng cách là 0
  assert.equal(haversineDistanceKm(21.0, 105.0, 21.0, 105.0), 0);

  // Đầu vào lỗi / NaN trả về Infinity
  assert.equal(haversineDistanceKm(NaN, 105.0, 21.0, 105.0), Infinity);
});

test("formatDistance formats meters and kilometers properly", () => {
  assert.equal(formatDistance(0.35), "350 m");
  assert.equal(formatDistance(0.854), "854 m");
  assert.equal(formatDistance(1.23), "1.2 km");
  assert.equal(formatDistance(2.8), "2.8 km");

  // Xử lý an toàn các giá trị âm, vô hạn, NaN
  assert.equal(formatDistance(-1), "");
  assert.equal(formatDistance(NaN), "");
  assert.equal(formatDistance(Infinity), "");
  assert.equal(formatDistance(-Infinity), "");
});

test("findNearbyRestaurants filters strictly within 3km and picks top recommendations", () => {
  const userLat = 21.027;
  const userLng = 105.849;

  const mockRestaurants = [
    {
      id: "near-good",
      name: "Bún Chả Gần & Ngon",
      lat: 21.029, // ~0.3 km
      lng: 105.849,
      rating: 4.8,
      ratingCount: 1500,
    },
    {
      id: "medium-dist",
      name: "Bún Chả Vừa Phải",
      lat: 21.042, // ~1.7 km
      lng: 105.849,
      rating: 4.6,
      ratingCount: 800,
    },
    {
      id: "too-far",
      name: "Bún Chả Hà Đông (Quá Xa)",
      lat: 20.9712, // ~7 km
      lng: 105.7765,
      rating: 4.9,
      ratingCount: 5000,
    },
  ];

  const result = findNearbyRestaurants(mockRestaurants, userLat, userLng, 3.0);

  assert.equal(result.totalFound, 2);
  assert.equal(result.primary?.restaurant.id, "near-good");
  assert.ok(result.primary.distanceKm < 1.0);
  assert.equal(result.alternatives.length, 1);
  assert.equal(result.alternatives[0].restaurant.id, "medium-dist");
});

test("findNearbyRestaurants returns null when no restaurants within radius", () => {
  const result = findNearbyRestaurants(
    [{ id: "1", lat: 21.0285, lng: 105.8542 }],
    10.7769, // TP.HCM
    106.7009,
    3.0,
  );
  assert.equal(result.primary, null);
  assert.equal(result.totalFound, 0);
  assert.deepEqual(result.alternatives, []);
});
