import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "foodtour-brand-locator-"));
buildSync({
  entryPoints: ["src/lib/brand-locator.ts"],
  outfile: join(out, "brand-locator.mjs"),
  bundle: true,
  format: "esm",
});

const {
  getBranchesForBrand,
  findNearestBrandBranch,
  openShopeeFoodDirect,
  getCachedUserCoordinates,
  cacheUserCoordinates,
} = await import(pathToFileURL(join(out, "brand-locator.mjs")).href);

const outCatalog = mkdtempSync(join(tmpdir(), "foodtour-brand-catalog-"));
buildSync({
  entryPoints: ["src/lib/brand-catalog.ts"],
  outfile: join(outCatalog, "brand-catalog.mjs"),
  bundle: true,
  format: "esm",
});
const { TOP_BEVERAGE_BRANDS } = await import(
  pathToFileURL(join(outCatalog, "brand-catalog.mjs")).href
);

const outReward = mkdtempSync(join(tmpdir(), "foodtour-shopee-reward-"));
buildSync({
  entryPoints: ["src/lib/shopee-reward.ts"],
  outfile: join(outReward, "shopee-reward.mjs"),
  bundle: true,
  format: "esm",
});
const { SHOPEE_RESTAURANT_OPEN_EVENT } = await import(
  pathToFileURL(join(outReward, "shopee-reward.mjs")).href
);

test("Brand Locator: All 10 curated beverage brands have branch coverage", () => {
  for (const brand of TOP_BEVERAGE_BRANDS) {
    const branches = getBranchesForBrand(brand.id);
    assert.ok(
      branches.length > 0,
      `Thương hiệu ${brand.name} (${brand.id}) phải có ít nhất 1 chi nhánh trong database`,
    );

    // Kiểm tra cấu trúc mỗi chi nhánh
    for (const b of branches) {
      assert.ok(b.id, "Chi nhánh phải có ID");
      assert.ok(b.delivery_id, "Chi nhánh phải có delivery_id");
      assert.ok(b.name, "Chi nhánh phải có tên");
      assert.ok(Number.isFinite(b.lat), "Chi nhánh phải có toạ độ vĩ độ hợp lệ");
      assert.ok(Number.isFinite(b.lng), "Chi nhánh phải có toạ độ kinh độ hợp lệ");
      assert.ok(
        b.shopeefood_url.startsWith("https://shopeefood.vn"),
        `Link quán phải bắt đầu bằng https://shopeefood.vn: ${b.shopeefood_url}`,
      );
      assert.ok(
        ["ho-chi-minh", "ha-noi", "da-nang"].includes(b.city),
        `Thành phố phải thuộc 3 thành phố chính: ${b.city}`,
      );
    }
  }
});

test("Brand Locator: GPS nearest branch calculation picks closest store", () => {
  // Toạ độ Hồ Hoàn Kiếm, Hà Nội (21.0285, 105.8542)
  const hanoiCoords = { lat: 21.0285, lng: 105.8542 };

  const phelaHanoi = findNearestBrandBranch("phela", hanoiCoords, "ha-noi");
  assert.ok(phelaHanoi !== null, "Phải tìm thấy chi nhánh Phê La gần Hoàn Kiếm");
  assert.equal(phelaHanoi.isNearestByGps, true);
  assert.equal(phelaHanoi.branch.city, "ha-noi");
  assert.ok(
    phelaHanoi.distanceKm !== null && phelaHanoi.distanceKm < 5,
    `Khoảng cách Phê La từ Hoàn Kiếm phải < 5km (thực tế: ${phelaHanoi.distanceKm}km)`,
  );
  assert.ok(phelaHanoi.distanceFormatted, "Phải có định dạng khoảng cách hiển thị");

  // Toạ độ Quận 1, TP.HCM - Phố đi bộ Nguyễn Huệ (10.7735, 106.7038)
  const hcmCoords = { lat: 10.7735, lng: 106.7038 };
  const katinatHcm = findNearestBrandBranch("katinat", hcmCoords, "ho-chi-minh");
  assert.ok(katinatHcm !== null, "Phải tìm thấy chi nhánh Katinat gần Nguyễn Huệ");
  assert.equal(katinatHcm.isNearestByGps, true);
  assert.equal(katinatHcm.branch.city, "ho-chi-minh");
  assert.ok(
    katinatHcm.distanceKm !== null && katinatHcm.distanceKm < 3,
    `Khoảng cách Katinat từ Nguyễn Huệ phải < 3km (thực tế: ${katinatHcm.distanceKm}km)`,
  );
});

test("Brand Locator: Graceful fallback when GPS coordinates are unavailable", () => {
  // Khi không có GPS, hệ thống phải chọn chi nhánh tốt nhất tại thành phố yêu cầu
  const fallbackHanoi = findNearestBrandBranch("highlands", null, "ha-noi");
  assert.ok(fallbackHanoi !== null, "Fallback phải tìm thấy chi nhánh");
  assert.equal(fallbackHanoi.isNearestByGps, false);
  assert.equal(fallbackHanoi.distanceKm, null);
  assert.equal(fallbackHanoi.distanceFormatted, null);
  assert.equal(fallbackHanoi.branch.city, "ha-noi");

  const fallbackDanang = findNearestBrandBranch("highlands", null, "da-nang");
  assert.ok(fallbackDanang !== null, "Fallback Đà Nẵng phải tìm thấy chi nhánh");
  assert.equal(fallbackDanang.branch.city, "da-nang");
});

test("Brand Locator: Session storage coordinate caching works as expected", () => {
  // Giả lập môi trường window & sessionStorage
  const storage = new Map();
  globalThis.window = {};
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
  };

  cacheUserCoordinates(10.7769, 106.7009);
  const cached = getCachedUserCoordinates();
  assert.ok(cached !== null, "Phải lấy được toạ độ từ cache");
  assert.equal(Math.round(cached.lat * 1000) / 1000, 10.777);
  assert.equal(Math.round(cached.lng * 1000) / 1000, 106.701);
});

test("Brand Locator: openShopeeFoodDirect launches native deep link without intermediate page", () => {
  let openedDeepLink = "";
  let dispatchedEvent = "";

  globalThis.window = {
    location: {
      set href(val) {
        openedDeepLink = val;
      },
    },
    dispatchEvent: (ev) => {
      dispatchedEvent = ev.type;
      return true;
    },
  };
  globalThis.CustomEvent = class {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };

  // Giả lập Mobile User Agent
  try {
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      configurable: true,
      writable: true,
    });
  } catch {
    globalThis.navigator = {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    };
  }

  const storeUrl =
    "https://shopeefood.vn/ha-noi/phe-la-tra-ca-phe-dac-san-nguyen-van-cu";
  openShopeeFoodDirect(storeUrl);

  // Kiểm tra deep link native của Shopee App
  assert.ok(
    openedDeepLink.startsWith("shopeevn://main?apprl="),
    `Deep link phải dùng shopeevn scheme: ${openedDeepLink}`,
  );
  assert.ok(
    openedDeepLink.includes(encodeURIComponent(storeUrl)),
    "Deep link phải bọc đúng link quán gốc của ShopeeFood",
  );
  assert.ok(
    openedDeepLink.includes("push=1"),
    "Deep link phải có flag push=1 để bung màn hình",
  );

  // Đảm bảo không mở link rút gọn affiliate (shope.ee) gây màn hình chuyển tiếp trung gian
  assert.ok(
    !openedDeepLink.includes("shope.ee"),
    "Không được sử dụng shortlink shope.ee gây màn hình trắng trung gian",
  );

  // Đảm bảo vẫn kích hoạt sự kiện tích điểm Foodie Pet
  assert.equal(dispatchedEvent, SHOPEE_RESTAURANT_OPEN_EVENT);
});
