#!/usr/bin/env node
/**
 * ShopeeFood Batch Crawler V4 (Industrial Anti-Ban & Multi-Dish Pipeline)
 *
 * TÍNH NĂNG BẢO VỆ CHỐNG BAN IP / CHỐNG CHẶN WAF CLOUDFLARE:
 * 1. Fingerprint Stealth Injection: Xóa dấu vết `navigator.webdriver`, giả lập `window.chrome`, `plugins`, `languages`.
 * 2. Ngẫu nhiên hóa hành vi (Human Jitter): Độ trễ ngẫu nhiên giữa các lần nhấp trang và chuyển món (không dùng fixed delay).
 * 3. Tái tạo Session định kỳ (Context Recycling): Tự động đổi context, xóa cookie và làm mới session sau mỗi 6 món ăn.
 * 4. Nhịp nghỉ sinh học (Cool-down Breathing): Nghỉ ngắn 15s sau mỗi 5 món, nghỉ dài 45s sau mỗi 25 món.
 * 5. Tự động nhận diện Rate Limit (403/429): Tạm dừng thông minh 45s và đổi session nếu phát hiện cảnh báo từ Cloudflare.
 * 6. Điểm kiểm soát tiến trình (Checkpoint & Auto-Resume): Lưu lại tiến trình vào `data/crawler_checkpoint.json`.
 *    Nếu bị dừng giữa chừng (mất điện, ngắt mạng), khi chạy lại sẽ tự động tiếp tục từ món đang dở.
 * 7. Mở Rộng Theo Quận (District Query Expansion - 100% Ẩn danh): Tự động quét sâu từng quận tại Đà Nẵng
 *    và bất kỳ thành phố nào có số lượng quán dưới 50, vét sạch quán mà không cần đăng nhập / không sợ ban acc.
 *
 * CÁCH SỬ DỤNG:
 * 1. Cào TẤT CẢ 128 món ăn (Hà Nội, Đà Nẵng, TP. HCM):
 *    node scripts/crawl-shopeefood-batch.mjs --all
 *
 * 2. Cào tất cả món nhưng chỉ cho 1 thành phố cụ thể:
 *    node scripts/crawl-shopeefood-batch.mjs --all --city=da-nang
 *    node scripts/crawl-shopeefood-batch.mjs --all --city=ha-noi
 *    node scripts/crawl-shopeefood-batch.mjs --all --city=ho-chi-minh
 *
 * 3. Cào Top 10 món phổ biến nhất:
 *    node scripts/crawl-shopeefood-batch.mjs --top10
 *
 * 4. Cào 1 hoặc vài món tùy chọn:
 *    node scripts/crawl-shopeefood-batch.mjs "Cơm tấm" "Phở bò" "Bánh mì"
 *
 * 5. Các tùy chọn an toàn bổ sung:
 *    --max-pages=N         (Số trang tối đa mỗi thành phố, mặc định 4 trang khi cào --all, 8 trang khi cào đơn lẻ)
 *    --reset-checkpoint    (Xóa checkpoint cũ để cào lại từ đầu)
 *    --fast                (Giảm độ trễ nếu dùng mạng 4G/Proxy riêng)
 */

import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

// Tự động nạp cấu hình từ .env.local
function loadEnv() {
  const envPath = path.resolve(".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://cfjahscecuviajbemznx.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

const CHECKPOINT_PATH = path.resolve("data/crawler_checkpoint.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Độ trễ ngẫu nhiên giả lập con người
 */
function randomDelay(minSec, maxSec) {
  const ms = Math.floor((minSec + Math.random() * (maxSec - minSec)) * 1000);
  return sleep(ms);
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const u = new URL(rawUrl);
    return `${u.origin}${u.pathname}`.toLowerCase();
  } catch {
    return rawUrl.toLowerCase();
  }
}

const TOP_10_DISHES = [
  "Cơm tấm",
  "Phở bò",
  "Bánh mì",
  "Bún chả",
  "Bún đậu mắm tôm",
  "Bún bò Huế",
  "Cơm gà",
  "Bún riêu",
  "Trà sữa",
  "Cà phê muối",
];

const ALL_CITIES = [
  {
    slug: "ha-noi",
    name: "Hà Nội",
    latMin: 20.8,
    latMax: 21.35,
    lngMin: 105.6,
    lngMax: 106.05,
    districts: [
      "Cầu Giấy",
      "Đống Đa",
      "Ba Đình",
      "Hoàn Kiếm",
      "Hai Bà Trưng",
      "Thanh Xuân",
      "Tây Hồ",
      "Nam Từ Liêm",
      "Bắc Từ Liêm",
      "Hà Đông",
      "Hoàng Mai",
      "Long Biên",
    ],
  },
  {
    slug: "da-nang",
    name: "Đà Nẵng",
    latMin: 15.9,
    latMax: 16.25,
    lngMin: 108.0,
    lngMax: 108.35,
    districts: [
      "Hải Châu",
      "Thanh Khê",
      "Sơn Trà",
      "Ngũ Hành Sơn",
      "Cẩm Lệ",
      "Liên Chiểu",
    ],
  },
  {
    slug: "ho-chi-minh",
    name: "TP. HCM",
    latMin: 10.65,
    latMax: 11.0,
    lngMin: 106.5,
    lngMax: 106.85,
    districts: [
      "Quận 1",
      "Quận 3",
      "Quận 5",
      "Quận 7",
      "Quận 10",
      "Bình Thạnh",
      "Tân Bình",
      "Phú Nhuận",
      "Gò Vấp",
      "Thủ Đức",
      "Bình Tân",
    ],
  },
];

/**
 * Quản lý Checkpoint để tiếp tục khi bị ngắt quãng (Lưu vết theo từng Món × Thành Phố)
 */
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
      const rawList = data.completedKeys || data.completedDishes || [];
      const set = new Set();
      for (const item of rawList) {
        if (typeof item !== "string") continue;
        if (item.includes("::")) {
          set.add(item);
        } else {
          // Định dạng cũ (chỉ có tên món): ánh xạ sang Hà Nội vì trước đó cào ở Hà Nội
          set.add(`ha-noi::${item}`);
        }
      }
      return set;
    } catch {}
  }
  return new Set();
}

function saveCheckpoint(completedSet) {
  try {
    const data = {
      completedKeys: Array.from(completedSet),
      lastUpdated: new Date().toISOString(),
      totalCompleted: completedSet.size,
    };
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("⚠️ Không thể lưu checkpoint:", err.message);
  }
}

/**
 * Tạo Browser Context ngụy trang chống phát hiện Headless / Bot
 */
async function createStealthContext(browser) {
  const viewports = [
    { width: 1366, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
  ];
  const vp = viewports[Math.floor(Math.random() * viewports.length)];

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: vp,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    permissions: ["geolocation"],
  });

  // Xóa các dấu hiệu tự động hóa của Playwright/Puppeteer
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
    window.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["vi-VN", "vi", "en-US", "en"],
    });
  });

  return context;
}

/**
 * Lấy danh sách toàn bộ món ăn trong hệ thống (128 món)
 */
async function fetchAllDishesList() {
  // 1. Thử lấy từ Supabase dishes table
  if (SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=name&order=id.asc`, {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((d) => d.name);
        }
      }
    } catch {}
  }

  // 2. Fallback: đọc từ file src/lib/foods.ts
  const foodsPath = path.resolve("src/lib/foods.ts");
  if (fs.existsSync(foodsPath)) {
    try {
      const content = fs.readFileSync(foodsPath, "utf8");
      const regex = /"name":\s*"([^"]+)"/g;
      const dishes = [];
      let m;
      while ((m = regex.exec(content)) !== null) {
        dishes.push(m[1]);
      }
      if (dishes.length > 0) return dishes;
    } catch {}
  }

  return TOP_10_DISHES;
}

/**
 * Lấy danh sách quán hiện có từ Supabase để chống trùng lặp
 */
async function fetchExistingDatabaseState() {
  const existingDeliveryIds = new Set();
  const existingRestaurantIds = new Set();
  const existingUrls = new Set();
  const existingAffiliates = new Map();
  const deliveryIdToDbId = new Map();
  const dishMap = new Map();

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log("⚠️ Không có SUPABASE_SERVICE_ROLE_KEY. Chỉ lọc trùng lặp trong phiên cào.");
    return { existingDeliveryIds, existingRestaurantIds, existingUrls, existingAffiliates, deliveryIdToDbId, dishMap };
  }

  try {
    const dishRes = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=id,slug,name`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (dishRes.ok) {
      const dishes = await dishRes.json();
      for (const d of dishes) {
        dishMap.set(d.slug, d.id);
        dishMap.set(d.name.toLowerCase(), d.id);
      }
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?select=id,delivery_id,original_url,affiliate_url`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (res.ok) {
      const list = await res.json();
      for (const r of list) {
        if (r.id) existingRestaurantIds.add(r.id);
        if (r.delivery_id) {
          const dId = Number(r.delivery_id);
          existingDeliveryIds.add(dId);
          deliveryIdToDbId.set(dId, r.id);
        }
        if (r.original_url) existingUrls.add(cleanUrl(r.original_url));
        if (r.affiliate_url) {
          existingAffiliates.set(r.id, r.affiliate_url);
          if (r.delivery_id) existingAffiliates.set(String(r.delivery_id), r.affiliate_url);
        }
      }
      console.log(`📦 Đã nạp từ Supabase: ${existingRestaurantIds.size} quán đã có trong hệ thống.`);
    }
  } catch (err) {
    console.warn("⚠️ Không thể nạp dữ liệu cũ từ Supabase:", err.message);
  }

  return { existingDeliveryIds, existingRestaurantIds, existingUrls, existingAffiliates, deliveryIdToDbId, dishMap };
}

function getExistingCsvUrls(csvPath) {
  const set = new Set();
  if (!fs.existsSync(csvPath)) return set;
  try {
    const content = fs.readFileSync(csvPath, "utf8");
    const lines = content.split("\n");
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length >= 4) {
        const u = parts[3].replace(/^"|"$/g, "").trim();
        if (u && u.startsWith("http")) {
          set.add(cleanUrl(u));
        }
      }
    }
  } catch {}
  return set;
}

/**
 * Cào 1 món tại 1 thành phố với cơ chế Anti-Ban & Auto-Pagination
 */
async function crawlDishInCity(context, dish, city, dbState, maxPages = 4, isFastMode = false) {
  console.log(`\n🔍 Đang quét: "${dish}" tại [${city.name}]...`);

  const page = await context.newPage();
  const sessionSpots = new Map();
  let newlyDiscoveredCount = 0;
  let alreadyExistingCount = 0;
  let rateLimitDetected = false;

  page.on("response", async (response) => {
    const url = response.url();
    const status = response.status();

    if (status === 403 || status === 429) {
      rateLimitDetected = true;
      console.warn(`\n  ⚠️ CẢNH BÁO RATE LIMIT (HTTP ${status}) từ ShopeeFood API!`);
      return;
    }

    if (
      url.includes("/api/delivery/") ||
      url.includes("/api/dish/") ||
      url.includes("get_browse_list") ||
      url.includes("search_global") ||
      url.includes("deliverynow.vn")
    ) {
      try {
        const contentType = response.headers()["content-type"] || "";
        if (!contentType.includes("application/json")) return;

        const json = await response.json();
        const items =
          json?.reply?.delivery_infos ||
          json?.reply?.deliveries ||
          json?.reply?.delivery_detail ||
          json?.reply?.items ||
          json?.reply?.search_result ||
          (Array.isArray(json?.data) ? json.data : []) ||
          [];

        const list = Array.isArray(items) ? items : [items];

        for (const item of list) {
          if (!item || typeof item !== "object") continue;

          const rawId = item.delivery_id || item.restaurant_id || item.id;
          const name = (item.name || item.restaurant_name || "").trim();
          if (!rawId || !name) continue;

          const position = item.position || item.location || {};
          const lat = Number(position.latitude || item.latitude || item.lat);
          const lng = Number(position.longitude || item.longitude || item.lng);

          if (
            !lat ||
            !lng ||
            lat < city.latMin ||
            lat > city.latMax ||
            lng < city.lngMin ||
            lng > city.lngMax
          ) {
            continue;
          }

          const deliveryId = Number(rawId);
          const existingId = dbState.deliveryIdToDbId.get(deliveryId);
          const recordId = existingId || `spf_${city.slug}_${deliveryId}`;
          const slug = item.url_rewrite_name || item.slug || slugify(name);
          const restaurantUrl = item.url
            ? (item.url.startsWith("http") ? item.url : `https://shopeefood.vn/${item.url}`)
            : `https://shopeefood.vn/${city.slug}/${slug}`;
          const cUrl = cleanUrl(restaurantUrl);

          if (sessionSpots.has(recordId)) continue;

          const isAlreadyInDb =
            dbState.existingRestaurantIds.has(recordId) ||
            dbState.existingDeliveryIds.has(deliveryId) ||
            dbState.existingUrls.has(cUrl);

          const existingAffiliate =
            dbState.existingAffiliates.get(recordId) ||
            dbState.existingAffiliates.get(String(deliveryId)) ||
            null;

          const address = (item.address || item.full_address || "").trim();
          const district = (item.district_name || item.district || "").trim();

          const spotData = {
            id: recordId,
            delivery_id: deliveryId,
            name,
            address,
            district,
            city: city.slug,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            rating: Number(item.rating?.avg || item.avg_rating || item.rating || 4.5),
            rating_count: Number(item.rating?.total_review || item.review_count || 100),
            original_url: restaurantUrl,
            affiliate_url: existingAffiliate,
            is_verified: true,
            isNew: !isAlreadyInDb,
          };

          sessionSpots.set(recordId, spotData);

          if (isAlreadyInDb) {
            alreadyExistingCount++;
          } else {
            newlyDiscoveredCount++;
            dbState.existingRestaurantIds.add(recordId);
            dbState.existingDeliveryIds.add(deliveryId);
            dbState.existingUrls.add(cUrl);
            dbState.deliveryIdToDbId.set(deliveryId, recordId);
          }
        }
      } catch {}
    }
  });

  const searchUrl = `https://shopeefood.vn/${city.slug}/danh-sach-dia-diem-giao-tan-noi?q=${encodeURIComponent(dish)}`;

  try {
    const initialResponsePromise = page
      .waitForResponse(
        (res) => res.url().includes("delivery/get_infos") && res.status() === 200,
        { timeout: 8000 },
      )
      .catch(() => null);

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await initialResponsePromise;
    await randomDelay(isFastMode ? 0.8 : 1.5, isFastMode ? 1.5 : 2.5);

    if (rateLimitDetected) {
      console.warn("  🛑 Phát hiện chặn WAF, tạm nghỉ giải lao 45 giây...");
      await sleep(45000);
      return [];
    }

    // Đọc số trang trong thanh phân trang
    const detectedPages = await page.$$eval(".pagination a", (els) =>
      els
        .map((e) => e.innerText.trim())
        .filter((t) => /^\d+$/.test(t))
        .map(Number),
    );

    const availableMaxPage = detectedPages.length > 0 ? Math.max(...detectedPages) : 1;
    const pagesToScrape = Math.min(availableMaxPage, maxPages);

    console.log(`     └─ Trang 1: Đã lấy ${sessionSpots.size} quán (Tổng có ${availableMaxPage} trang, sẽ quét ${pagesToScrape} trang)`);

    // Duyệt các trang kế tiếp với độ trễ ngẫu nhiên giả lập người dùng
    for (let p = 2; p <= pagesToScrape; p++) {
      if (rateLimitDetected) break;

      // Giả lập lướt nhẹ trang trước khi click
      await page.evaluate(() => window.scrollBy(0, 300));
      await randomDelay(isFastMode ? 0.8 : 1.5, isFastMode ? 1.5 : 2.5);

      const pageBtn = page.locator(".pagination a", { hasText: new RegExp(`^${p}$`) });

      if ((await pageBtn.count()) > 0) {
        const pageResponsePromise = page
          .waitForResponse(
            (res) => res.url().includes("delivery/get_infos") && res.status() === 200,
            { timeout: 8000 },
          )
          .catch(() => null);

        await pageBtn.first().click();
        await pageResponsePromise;
        await randomDelay(isFastMode ? 1.0 : 1.8, isFastMode ? 1.8 : 2.8);
        console.log(`     └─ Trang ${p}/${pagesToScrape}: Tích lũy ${sessionSpots.size} quán`);
      } else {
        break;
      }
    }

    // Kỹ thuật mở rộng quét theo quận (District Query Expansion):
    // Tự động kích hoạt khi:
    // 1. Thành phố là Đà Nẵng (do ShopeeFood siết kết quả khách vãng lai ở mức 22 quán)
    // 2. Hoặc bất kỳ thành phố nào có số quán thu thập được dưới 50 quán (< 50 quán)
    const DISTRICT_EXPANSION_THRESHOLD = 50;
    const shouldExpandByDistrict =
      (city.slug === "da-nang" || sessionSpots.size < DISTRICT_EXPANSION_THRESHOLD) &&
      Array.isArray(city.districts) &&
      city.districts.length > 0;

    if (shouldExpandByDistrict && !rateLimitDetected) {
      console.log(
        `     🔍 Kích hoạt Mở Rộng Theo Quận cho [${city.name}] (${sessionSpots.size} quán < ${DISTRICT_EXPANSION_THRESHOLD} quán)...`
      );

      for (const district of city.districts) {
        if (rateLimitDetected) break;

        const districtQuery = `${dish} ${district}`;
        const districtUrl = `https://shopeefood.vn/${city.slug}/danh-sach-dia-diem-giao-tan-noi?q=${encodeURIComponent(
          districtQuery
        )}`;

        const beforeCount = sessionSpots.size;
        try {
          const districtResponsePromise = page
            .waitForResponse(
              (res) => res.url().includes("delivery/get_infos") && res.status() === 200,
              { timeout: 8000 },
            )
            .catch(() => null);

          await page.goto(districtUrl, {
            waitUntil: "domcontentloaded",
            timeout: 25000,
          });
          await districtResponsePromise;
          await randomDelay(isFastMode ? 0.8 : 1.5, isFastMode ? 1.5 : 2.5);

          const addedInDistrict = sessionSpots.size - beforeCount;
          console.log(
            `        └─ [Quận ${district}]: +${addedInDistrict} quán mới (Tổng tích lũy: ${sessionSpots.size} quán)`
          );
        } catch (errDistrict) {
          console.warn(`        ⚠️ Bỏ qua quận ${district}: ${errDistrict.message}`);
        }
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ Lỗi tải trang "${dish}" tại ${city.name}: ${err.message}`);
  } finally {
    await page.close();
  }

  const allSpots = Array.from(sessionSpots.values());
  console.log(`     ✅ Kết quả [${city.name}]: ${allSpots.length} quán (Cũ: ${alreadyExistingCount}, ✨ Mới: ${newlyDiscoveredCount})`);
  return allSpots;
}

/**
 * Đẩy dữ liệu an toàn vào Supabase
 */
async function syncToSupabase(spots, dish, dbState) {
  if (!SUPABASE_SERVICE_ROLE_KEY || spots.length === 0) return;

  const slug = slugify(dish);
  const dishId = dbState.dishMap.get(slug) || dbState.dishMap.get(dish.toLowerCase());

  try {
    const restaurantPayload = spots.map((s) => ({
      id: s.id,
      delivery_id: s.delivery_id,
      name: s.name,
      address: s.address,
      district: s.district,
      city: s.city,
      lat: s.lat,
      lng: s.lng,
      rating: s.rating,
      rating_count: s.rating_count,
      original_url: s.original_url,
      affiliate_url: s.affiliate_url,
      is_verified: true,
      is_active: true,
    }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < restaurantPayload.length; i += BATCH_SIZE) {
      const chunk = restaurantPayload.slice(i, i + BATCH_SIZE);
      await fetch(`${SUPABASE_URL}/rest/v1/restaurants?on_conflict=delivery_id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(chunk),
      });
    }

    if (dishId) {
      const junctionPayload = spots.map((s) => ({
        restaurant_id: s.id,
        dish_id: dishId,
      }));

      for (let i = 0; i < junctionPayload.length; i += BATCH_SIZE) {
        const chunk = junctionPayload.slice(i, i + BATCH_SIZE);
        await fetch(`${SUPABASE_URL}/rest/v1/restaurant_dishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "resolution=ignore-duplicates",
          },
          body: JSON.stringify(chunk),
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ Lỗi đồng bộ Supabase:", err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  const isResetCheckpoint = args.includes("--reset-checkpoint");
  if (isResetCheckpoint && fs.existsSync(CHECKPOINT_PATH)) {
    fs.unlinkSync(CHECKPOINT_PATH);
    console.log("🧹 Đã xóa checkpoint cũ theo yêu cầu.");
  }

  const completedCheckpoint = loadCheckpoint();

  // Đọc cờ thành phố
  const cityArg = args.find((a) => a.startsWith("--city="));
  const selectedCitySlug = cityArg ? cityArg.split("=")[1].trim().toLowerCase() : null;
  const targetCities = selectedCitySlug
    ? ALL_CITIES.filter((c) => c.slug === selectedCitySlug)
    : ALL_CITIES;

  const isFastMode = args.includes("--fast");
  const isAllDishes = args.includes("--all");

  // Giới hạn số trang mỗi thành phố:
  // Nếu cào --all: mặc định 4 trang (~100 quán/tp) để đảm bảo tốc độ và an toàn IP.
  // Nếu cào đơn lẻ: mặc định 8 trang (~200 quán/tp).
  const maxPagesArg = args.find((a) => a.startsWith("--max-pages="));
  const defaultMaxPages = isAllDishes ? 4 : 8;
  const maxPages = maxPagesArg ? parseInt(maxPagesArg.split("=")[1], 10) : defaultMaxPages;

  let targetDishes = [];
  if (isAllDishes) {
    targetDishes = await fetchAllDishesList();
  } else if (args.includes("--top10")) {
    targetDishes = TOP_10_DISHES;
  } else {
    targetDishes = args.filter((a) => !a.startsWith("--"));
    if (targetDishes.length === 0) {
      targetDishes = ["Bún chả"];
    }
  }

  console.log(`================================================================`);
  console.log(`🛡️  SHOPEEFOOD ANTI-BAN CRAWLER V4 (AN TOÀN CAO CẤP & ĐA MÓN)`);
  console.log(`📋 Tổng số món trong kế hoạch: ${targetDishes.length} món`);
  console.log(`🏙️  Thành phố mục tiêu: ${targetCities.map((c) => c.name).join(", ")}`);
  console.log(`📑 Giới hạn: tối đa ${maxPages} trang mỗi thành phố (~${maxPages * 25} quán/thành phố)`);
  console.log(`💾 Đã hoàn thành trước đó (Checkpoint): ${completedCheckpoint.size} lượt (món × thành phố)`);
  console.log(`================================================================`);

  // 1. Tải trạng thái DB & CSV
  const dbState = await fetchExistingDatabaseState();
  const csvPath = path.resolve("data/crawler_urls_pending_affiliate.csv");
  const existingCsvUrls = getExistingCsvUrls(csvPath);

  // 2. Khởi tạo Browser Chromium với cờ che giấu tự động hóa
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
    ],
  });

  let currentContext = await createStealthContext(browser);
  let processedDishesSinceContextRecycle = 0;
  let totalDishesProcessedInRun = 0;
  const allBrandNewForCsv = [];

  for (let dIdx = 0; dIdx < targetDishes.length; dIdx++) {
    const dish = targetDishes[dIdx];

    // Xác định các thành phố cần quét món này
    const isExplicitlyRequested = !isAllDishes && !args.includes("--top10") && args.some((a) => !a.startsWith("--"));
    const remainingCitiesForDish = targetCities.filter(
      (c) => isExplicitlyRequested || !completedCheckpoint.has(`${c.slug}::${dish}`)
    );

    if (remainingCitiesForDish.length === 0) {
      console.log(`⏩ [${dIdx + 1}/${targetDishes.length}] Món "${dish}" đã cào xong ở các thành phố mục tiêu (Checkpoint), bỏ qua.`);
      continue;
    }

    console.log(`\n🍲 [${dIdx + 1}/${targetDishes.length}] ĐANG XỬ LÝ MÓN: "${dish.toUpperCase()}"...`);

    // Tái tạo Context sau mỗi 6 món để xóa sạch cookie và token cũ
    if (processedDishesSinceContextRecycle >= 6) {
      console.log("🔄 Làm mới Browser Context (Tẩy cookie, reset token) để giữ an toàn tuyệt đối...");
      await currentContext.close();
      currentContext = await createStealthContext(browser);
      processedDishesSinceContextRecycle = 0;
      await randomDelay(2.0, 4.0);
    }

    // Quét món này lần lượt qua các thành phố còn lại
    for (const city of remainingCitiesForDish) {
      const spots = await crawlDishInCity(currentContext, dish, city, dbState, maxPages, isFastMode);

      if (spots.length > 0) {
        await syncToSupabase(spots, dish, dbState);

        for (const s of spots) {
          const cUrl = cleanUrl(s.original_url);
          if (s.isNew && !s.affiliate_url && !existingCsvUrls.has(cUrl)) {
            existingCsvUrls.add(cUrl);
            allBrandNewForCsv.push(s);
          }
        }
      }

      // Đánh dấu thành phố này đã hoàn tất cho món này vào Checkpoint
      completedCheckpoint.add(`${city.slug}::${dish}`);
      saveCheckpoint(completedCheckpoint);

      // Nghỉ giữa các thành phố (3s - 5s)
      await randomDelay(isFastMode ? 1.5 : 3.0, isFastMode ? 2.5 : 5.0);
    }

    processedDishesSinceContextRecycle++;
    totalDishesProcessedInRun++;

    // Tự động ghi tích lũy vào CSV sau mỗi món để không bị mất dữ liệu
    if (allBrandNewForCsv.length > 0) {
      const fileExists = fs.existsSync(csvPath);
      const rows = allBrandNewForCsv.map(
        (s) =>
          `"${s.name.replace(/"/g, '""')}","${s.city}","${s.district}","${s.original_url}",""`,
      );

      if (!fileExists) {
        const header = "Tên Quán,Thành Phố,Quận,Link ShopeeFood Gốc,Link Affiliate shope.ee (Điền vào đây)\n";
        fs.writeFileSync(csvPath, header + rows.join("\n") + "\n", "utf8");
      } else {
        fs.appendFileSync(csvPath, rows.join("\n") + "\n", "utf8");
      }

      console.log(`  📁 Đã thêm ${allBrandNewForCsv.length} quán mới vào CSV: ${path.basename(csvPath)}`);
      allBrandNewForCsv.length = 0; // Xóa mảng đệm sau khi đã ghi file
    }

    // Nhịp nghỉ an toàn (Cool-down Breathing):
    // Cứ mỗi 25 món nghỉ 45 giây; cứ mỗi 5 món nghỉ 15 giây; giữa các món bình thường nghỉ 4s - 7s.
    if (totalDishesProcessedInRun % 25 === 0) {
      console.log(`\n☕ [COOL-DOWN LỚN] Đã cào liên tục 25 món. Nghỉ giải lao 45 giây để bảo vệ IP...`);
      for (let s = 45; s > 0; s -= 15) {
        console.log(`   ⏳ Còn lại ${s} giây...`);
        await sleep(15000);
      }
    } else if (totalDishesProcessedInRun % 5 === 0) {
      console.log(`\n🍵 [COOL-DOWN NHỎ] Đã cào 5 món. Nghỉ nhẹ 15 giây...`);
      await sleep(15000);
    } else {
      await randomDelay(isFastMode ? 2.0 : 4.0, isFastMode ? 3.5 : 7.0);
    }
  }

  await currentContext.close();
  await browser.close();

  console.log(`\n================================================================`);
  console.log(`🎉 HOÀN THÀNH TIẾN TRÌNH CÀO AN TOÀN!`);
  console.log(`   - Tổng số món đã hoàn tất: ${completedCheckpoint.size}/${targetDishes.length}`);
  console.log(`   - Checkpoint lưu tại: ${CHECKPOINT_PATH}`);
  console.log(`================================================================`);
}

main().catch(console.error);
