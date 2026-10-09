#!/usr/bin/env node
/**
 * ============================================================================
 * 🛡️ SHOPEEFOOD BATCH CRAWLER V5 (CHỌN LỌC RATING & QUÉT SÂU TOÀN DIỆN THEO QUẬN)
 * ============================================================================
 *
 * 📌 LUỒNG ĐI DỮ LIỆU TỔNG QUAN (END-TO-END DATA FLOW):
 *
 * [1. Input / Khởi động]
 *    │ ├── Đọc cấu hình từ .env.local (Supabase URL, Service Role Key).
 *    │ ├── Nạp danh sách món: Toàn bộ 243 món từ bảng `dishes` (Supabase) hoặc `foods.ts`.
 *    │ ├── Nạp dữ liệu quán đã có từ Supabase để chống cào trùng lặp (Deduplication).
 *    │ └── Nạp Checkpoint (`data/crawler_checkpoint.json`) để tự động cào tiếp nếu bị ngắt quãng.
 *    ▼
 * [2. Stealth Browser & Intercept API ShopeeFood]
 *    │ ├── Sử dụng Playwright với ngụy trang chống Bot (xóa navigator.webdriver, giả lập Chrome).
 *    │ ├── Truy cập trang tìm kiếm của ShopeeFood: /<city>/danh-sach-dia-diem-giao-tan-noi?q=<món>
 *    │ └── Lắng nghe trực tiếp các gói tin JSON API ngầm (`delivery/get_infos`, `search_global`).
 *    ▼
 * [3. Bộ Lọc Chất Lượng Cao (Quality Gate)]
 *    │ ├── 📍 Tọa độ GPS: Bắt buộc (lat, lng) phải nằm trong ranh giới địa lý của Thành phố.
 *    │ └── ⭐ Lọc đánh giá: BẮT BUỘC `rating_count >= 500` (Quán uy tín, đông khách, có thật).
 *    ▼
 * [4. Quét Toàn Diện Không Giới Hạn (Pagination & District Expansion)]
 *    │ ├── Quét tất cả các trang tìm kiếm chung toàn thành phố (từ trang 1 đến trang cuối cùng).
 *    │ └── 🏛️ Quét sâu TẤT CẢ các quận cho CẢ 3 THÀNH PHỐ:
 *    │       • Hà Nội: 12 quận trọng điểm.
 *    │       • TP. HCM: 17 quận / huyện nội ngoại thành.
 *    │       • Đà Nẵng: 6 quận đô thị.
 *    │       Mỗi quận đều tìm kiếm theo từ khóa `<món> <quận>` và duyệt qua toàn bộ các trang.
 *    ▼
 * [5. DỮ LIỆU CÀO VỀ ĐƯỢC LƯU Ở ĐÂU? (STORAGE DESTINATIONS)]
 *    │
 *    ├── 🗄️ 1. CƠ SỞ DỮ LIỆU SUPABASE (PostgreSQL Cloud):
 *    │   ├── Bảng `restaurants`:
 *    │   │   Lưu thông tin quán (id, delivery_id, name, address, district, city, lat, lng,
 *    │   │   rating, rating_count, original_url, is_verified, is_active).
 *    │   │   Affiliate chỉ do importer quản lý, crawler không ghi trường này.
 *    │   │   Cơ chế: `on_conflict=delivery_id` (upsert - cập nhật thông tin nếu quán đã có).
 *    │   └── Bảng `restaurant_dishes`:
 *    │       Lưu quan hệ nhiều-nhiều giữa quán ăn (`restaurant_id`) và món ăn (`dish_id`).
 *    │       Tự động gán quán vào món ăn tương ứng nếu tên quán phù hợp (`isRestaurantRelevantForDish`).
 *    │
 *    ├── 📄 2. FILE CSV XUẤT AFFILIATE:
 *    │   └── Đường dẫn: `data/crawler_urls_pending_affiliate.csv`
 *    │       Cấu trúc cột:
 *    │       `Tên Quán, Thành Phố, Quận, Link ShopeeFood Gốc, Link Affiliate shope.ee (Điền vào đây)`
 *    │       => Các quán MỚI chưa có link Affiliate sẽ tự động được ghi dồn vào file CSV này.
 *    │
 *    └── 💾 3. FILE CHECKPOINT TIẾN TRÌNH:
 *        └── Đường dẫn: `data/crawler_checkpoint.json`
 *            Lưu danh sách các cặp `<thành_phố>::<tên_món>` đã cào xong.
 *            Khi dừng giữa chừng (mất điện, ngắt mạng), chạy lại script sẽ bỏ qua các món đã xong.
 *    ▼
 * [6. Quy Trình Gắn Affiliate Cho Quán Cào Được]
 *    1. Mở file `data/crawler_urls_pending_affiliate.csv`.
 *    2. Copy cột "Link ShopeeFood Gốc", đưa lên cổng Shopee Affiliate để tạo link rút gọn hàng loạt.
 *    3. Dán link rút gọn (shope.ee / s.shopee.vn) vào cột "Link Affiliate".
 *    4. Chạy script `node scripts/import-affiliate-csv.mjs` để cập nhật link affiliate vào Supabase!
 *
 * ============================================================================
 * 💻 CÁCH SỬ DỤNG (CLI COMMANDS):
 * ============================================================================
 * 1. Cào thử nghiệm 1 hoặc vài món (lọc rating_count >= 500, quét tất cả quận của cả 3 TP):
 *    node scripts/crawl-shopeefood-batch.mjs "Bánh giò nóng" "Cháo ếch"
 *
 * 2. Cào cho 1 thành phố cụ thể (ví dụ TP. HCM hoặc Hà Nội hoặc Đà Nẵng):
 *    node scripts/crawl-shopeefood-batch.mjs --city=ho-chi-minh "Bún bò Huế"
 *    node scripts/crawl-shopeefood-batch.mjs --city=ha-noi "Phở bò"
 *    node scripts/crawl-shopeefood-batch.mjs --city=da-nang "Bánh mì"
 *
 * 3. Cào toàn bộ 243 món ăn trên cả 3 thành phố (quét sâu theo quận, tất cả các trang):
 *    node scripts/crawl-shopeefood-batch.mjs --all
 *
 * 4. Các tùy chọn mở rộng:
 *    --min-rating-count=500 (Chỉ lấy quán có ít nhất 500 reviews, mặc định là 500)
 *    --max-pages=N          (Giới hạn N trang mỗi query, mặc định quét hết tất cả các trang)
 *    --force                (Bỏ qua checkpoint, ép cào lại món được chỉ định)
 *    --reset-checkpoint     (Xóa checkpoint cũ để cào lại từ đầu)
 *    --retry-sync           (Đẩy bù dữ liệu từ hàng đợi offline lên Supabase mà không mở trình duyệt)
 *    --fast                 (Giảm độ trễ nếu dùng proxy hoặc đường truyền riêng)
 * ============================================================================
 */

import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { getMaintenanceKey, getMaintenanceHeaders } from "./lib/maintenance-env.mjs";
import { getMaintenanceUrl } from "./lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "./lib/maintenance-env-file.mjs";
import { restaurantMetadata, fetchAllRows } from "./lib/restaurant-metadata.mjs";
import { isRestaurantRelevantForDish } from "../src/lib/dish-relevance.ts";

// Tự động nạp cấu hình từ .env.local
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();

const SUPABASE_SERVICE_ROLE_KEY = getMaintenanceKey();

const CHECKPOINT_PATH = path.resolve("data/crawler_checkpoint.json");
const PENDING_QUEUE_PATH = path.resolve("data/crawler_pending_supabase_queue.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gửi HTTP Request với cơ chế Tự động thử lại (Retry with Exponential Backoff)
 * Tránh lỗi mạng chập chờn, rớt gói tin hoặc ngắt kết nối socket tạm thời (fetch failed, ECONNRESET, ETIMEDOUT)
 */
async function fetchWithRetry(url, options = {}, maxRetries = 4, initialDelayMs = 1500) {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        return res;
      }

      // Nếu gặp Rate Limit (429) hoặc Lỗi Server Supabase (5xx), tự động thử lại
      if (res.status === 429 || res.status >= 500) {
        attempt++;
        if (attempt > maxRetries) {
          const errText = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        console.warn(`  ⚠️ Supabase phản hồi HTTP ${res.status}, đang tự động thử lại lần ${attempt}/${maxRetries} sau ${(delay / 1000).toFixed(1)}s...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      // Các lỗi 4xx client thông thường (không phải 429) thì quăng lỗi trực tiếp
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText}`);
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        throw err;
      }
      console.warn(`  ⚠️ Lỗi kết nối Supabase (${err.message}), đang thử lại lần ${attempt}/${maxRetries} sau ${(delay / 1000).toFixed(1)}s...`);
      await sleep(delay);
      delay *= 2;
    }
  }
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
      "Quận 4",
      "Quận 5",
      "Quận 6",
      "Quận 7",
      "Quận 8",
      "Quận 10",
      "Quận 11",
      "Quận 12",
      "Bình Thạnh",
      "Tân Bình",
      "Tân Phú",
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
        let city = "ha-noi";
        let dish = item;
        if (item.includes("::")) {
          const parts = item.split("::");
          city = parts[0].trim().toLowerCase();
          dish = parts.slice(1).join("::").trim();
        }
        // Lưu key gốc, key viết thường và key slug không dấu để luôn đối soát khớp 100%
        set.add(`${city}::${dish}`);
        set.add(`${city}::${dish.toLowerCase()}`);
        set.add(`${city}::${slugify(dish)}`);
      }
      return set;
    } catch { }
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
 * Kiểm tra xem một món tại một thành phố đã hoàn thành trong Checkpoint chưa
 * (Hỗ trợ chuẩn hoá chữ hoa/thường và không dấu để luôn khớp 100%)
 */
function isKeyInCheckpoint(completedSet, citySlug, dishName) {
  if (!completedSet || completedSet.size === 0) return false;
  const cSlug = citySlug.trim().toLowerCase();
  const dName = dishName.trim();
  const dLower = dName.toLowerCase();
  const dSlug = slugify(dName);

  return (
    completedSet.has(`${cSlug}::${dName}`) ||
    completedSet.has(`${cSlug}::${dLower}`) ||
    completedSet.has(`${cSlug}::${dSlug}`)
  );
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
      loadTimes: function () { },
      csi: function () { },
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
      const res = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/dishes?select=name&order=id.asc`, {
        headers: {
          ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
        },
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((d) => d.name);
        }
      }
    } catch { }
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
    } catch { }
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
    const dishRes = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/dishes?select=id,slug,name`, {
      headers: {
        ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
      },
    });
    if (dishRes.ok) {
      const dishes = await dishRes.json();
      for (const d of dishes) {
        dishMap.set(d.slug, d.id);
        dishMap.set(d.name.toLowerCase(), d.id);
      }
    }

    const list = await fetchAllRows(
      `${SUPABASE_URL}/rest/v1/restaurants?select=id,delivery_id,original_url,affiliate_url`,
      {
        headers: {
          ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
        },
      },
      fetchWithRetry,
    );

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
  } catch { }
  return set;
}

/**
 * Cào 1 món tại 1 thành phố với cơ chế Chọn lọc (rating_count >= 500), Quét tất cả các trang & Mở rộng theo Quận cho cả 3 thành phố
 */
async function crawlDishInCity(
  context,
  dish,
  city,
  dbState,
  maxPages = 100,
  isFastMode = false,
  minRatingCount = 500,
) {
  console.log(`\n🔍 Đang quét: "${dish}" tại [${city.name}] (Lọc chọn lọc: rating_count >= ${minRatingCount})...`);

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

          // BỘ LỌC CHỌN LỌC: Chỉ cào những quán có rating_count >= 500
          const ratingCount = Number(
            item.rating?.total_review ??
            item.rating?.review_count ??
            item.total_review ??
            item.rating_count ??
            item.review_count ??
            0,
          );
          if (ratingCount < minRatingCount) {
            continue; // Bỏ qua quán có dưới 500 lượt đánh giá
          }

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
            rating_count: ratingCount,
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
      } catch { }
    }
  });

  // Helper duyệt 1 URL tìm kiếm và quét tất cả các trang
  async function scrapeSearchUrlWithPagination(queryLabel, queryUrl) {
    if (rateLimitDetected) return;
    try {
      const initialResponsePromise = page
        .waitForResponse(
          (res) => res.url().includes("delivery/get_infos") && res.status() === 200,
          { timeout: 9000 },
        )
        .catch(() => null);

      await page.goto(queryUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
      await initialResponsePromise;
      await randomDelay(isFastMode ? 0.8 : 1.3, isFastMode ? 1.4 : 2.2);

      if (rateLimitDetected) {
        console.warn("  🛑 Phát hiện chặn WAF, tạm nghỉ giải lao 45 giây...");
        await sleep(45000);
        return;
      }

      // Đọc số trang trong thanh phân trang
      let detectedPages = await page.$$eval(".pagination a", (els) =>
        els
          .map((e) => e.innerText.trim())
          .filter((t) => /^\d+$/.test(t))
          .map(Number),
      );

      let availableMaxPage = detectedPages.length > 0 ? Math.max(...detectedPages) : 1;
      const pagesToScrape = Math.min(availableMaxPage, maxPages);

      console.log(
        `     └─ [${queryLabel}] Trang 1: Tích lũy ${sessionSpots.size} quán chất lượng (Tổng có ${availableMaxPage} trang, sẽ quét ${pagesToScrape} trang)`,
      );

      // Duyệt qua tất cả các trang tiếp theo (không giới hạn số quán)
      for (let p = 2; p <= pagesToScrape; p++) {
        if (rateLimitDetected) break;

        await page.evaluate(() => window.scrollBy(0, 300));
        await randomDelay(isFastMode ? 0.6 : 1.0, isFastMode ? 1.2 : 2.0);

        const pageBtn = page.locator(".pagination a", { hasText: new RegExp(`^${p}$`) });

        if ((await pageBtn.count()) > 0) {
          const pageResponsePromise = page
            .waitForResponse(
              (res) => res.url().includes("delivery/get_infos") && res.status() === 200,
              { timeout: 9000 },
            )
            .catch(() => null);

          await pageBtn.first().click();
          await pageResponsePromise;
          await randomDelay(isFastMode ? 0.8 : 1.4, isFastMode ? 1.5 : 2.5);

          // Cập nhật số trang nếu phân trang dài ra
          const morePages = await page.$$eval(".pagination a", (els) =>
            els
              .map((e) => e.innerText.trim())
              .filter((t) => /^\d+$/.test(t))
              .map(Number),
          );
          if (morePages.length > 0) {
            availableMaxPage = Math.max(availableMaxPage, ...morePages);
          }

          console.log(`        └─ [${queryLabel}] Trang ${p}/${availableMaxPage}: Tích lũy ${sessionSpots.size} quán`);
        } else {
          break;
        }
      }
    } catch (errQuery) {
      console.warn(`        ⚠️ Lỗi tải trang [${queryLabel}]: ${errQuery.message}`);
    }
  }

  try {
    // 1. Quét tìm kiếm chung toàn thành phố (tất cả các trang)
    const citySearchUrl = `https://shopeefood.vn/${city.slug}/danh-sach-dia-diem-giao-tan-noi?q=${encodeURIComponent(
      dish,
    )}`;
    await scrapeSearchUrlWithPagination("Toàn thành phố", citySearchUrl);

    // 2. Quét chuyên sâu THEO TỪNG QUẬN cho CẢ 3 THÀNH PHỐ (Hà Nội, Đà Nẵng, TP.HCM)
    if (!rateLimitDetected && Array.isArray(city.districts) && city.districts.length > 0) {
      console.log(
        `     🏛️  Kích hoạt quét theo từng quận tại [${city.name}] (${city.districts.length} quận, lọc review >= ${minRatingCount})...`,
      );

      for (const district of city.districts) {
        if (rateLimitDetected) break;

        const districtQuery = `${dish} ${district}`;
        const districtUrl = `https://shopeefood.vn/${city.slug}/danh-sach-dia-diem-giao-tan-noi?q=${encodeURIComponent(
          districtQuery,
        )}`;

        const beforeCount = sessionSpots.size;
        await scrapeSearchUrlWithPagination(`Quận ${district}`, districtUrl);
        const addedInDistrict = sessionSpots.size - beforeCount;
        console.log(
          `        ✨ [Quận ${district}] hoàn tất: +${addedInDistrict} quán mới (Tổng tích lũy: ${sessionSpots.size} quán)`,
        );
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ Lỗi tổng thể quét "${dish}" tại ${city.name}: ${err.message}`);
  } finally {
    await page.close();
  }

  const allSpots = Array.from(sessionSpots.values());
  console.log(
    `     ✅ Hoàn tất [${city.name}]: ${allSpots.length} quán chọn lọc (Cũ: ${alreadyExistingCount}, ✨ Mới: ${newlyDiscoveredCount})`,
  );
  return allSpots;
}

/**
 * Lưu các quán bị lỗi mạng vào hàng đợi offline để không bao giờ bị mất dữ liệu
 */
function saveToOfflineQueue(spots, dish, dishId) {
  try {
    let queue = [];
    if (fs.existsSync(PENDING_QUEUE_PATH)) {
      try {
        queue = JSON.parse(fs.readFileSync(PENDING_QUEUE_PATH, "utf8"));
      } catch {}
    }

    queue.push({
      timestamp: new Date().toISOString(),
      dish,
      dishId,
      spots,
    });

    fs.writeFileSync(PENDING_QUEUE_PATH, JSON.stringify(queue, null, 2), "utf8");
    console.log(
      `  💾 [OFFLINE QUEUE] Đã lưu an toàn ${spots.length} quán vào: ${path.basename(PENDING_QUEUE_PATH)} (sẽ tự động đồng bộ khi có mạng)!`,
    );
    return true;
  } catch (err) {
    console.error("  ❌ Không thể lưu hàng đợi offline:", err.message);
    return false;
  }
}

/**
 * Đẩy trực tiếp danh sách quán & liên kết món lên Supabase qua API kèm Retry
 */
export async function syncToSupabaseDirect(spots, dish, dishId) {
  if (!SUPABASE_SERVICE_ROLE_KEY || spots.length === 0) return;

  // Lấy map delivery_id -> id thực tế đã có trong database để tránh đổi ID vi phạm khoá ngoại
  const allDeliveryIds = spots.map((s) => s.delivery_id).filter(Boolean);
  const existingIdMap = new Map();

  for (let i = 0; i < allDeliveryIds.length; i += 150) {
    const chunk = allDeliveryIds.slice(i, i + 150);
    try {
      const res = await fetchWithRetry(
        `${SUPABASE_URL}/rest/v1/restaurants?select=id,delivery_id&delivery_id=in.(${chunk.join(",")})`,
        {
          headers: {
            ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
          },
        },
      );
      if (!res.ok) throw new Error(`Restaurant ID lookup failed: HTTP ${res.status}`);
      {
        const rows = await res.json();
        for (const r of rows) {
          if (r.delivery_id) existingIdMap.set(Number(r.delivery_id), r.id);
        }
      }
    } catch {
      throw new Error("Cannot resolve existing restaurant IDs; metadata sync stopped without writing.");
    }
  }

  const restaurantPayload = spots.map((s) => {
    const existingId = existingIdMap.get(Number(s.delivery_id));
    return restaurantMetadata({
      id: existingId || s.id,
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

      is_verified: true,
      is_active: true,
    });
  });

  const BATCH_SIZE = 50;
  for (let i = 0; i < restaurantPayload.length; i += BATCH_SIZE) {
    const chunk = restaurantPayload.slice(i, i + BATCH_SIZE);
    await fetchWithRetry(`${SUPABASE_URL}/rest/v1/restaurants?on_conflict=delivery_id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
  }

  if (dishId) {
    const relevantSpots = spots.filter((s) =>
      isRestaurantRelevantForDish(s.name, dish),
    );
    const junctionPayload = relevantSpots.map((s) => ({
      restaurant_id: existingIdMap.get(Number(s.delivery_id)) || s.id,
      dish_id: dishId,
    }));

    for (let i = 0; i < junctionPayload.length; i += BATCH_SIZE) {
      const chunk = junctionPayload.slice(i, i + BATCH_SIZE);
      await fetchWithRetry(`${SUPABASE_URL}/rest/v1/restaurant_dishes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
          Prefer: "resolution=ignore-duplicates",
        },
        body: JSON.stringify(chunk),
      });
    }
  }
}

/**
 * Tự động đồng bộ bù các dữ liệu tồn đọng trong hàng đợi offline
 */
async function flushPendingQueue(dbState) {
  // Never acknowledge/delete queued rows when no private write credential is configured.
  if (!SUPABASE_SERVICE_ROLE_KEY) return 0;
  if (!fs.existsSync(PENDING_QUEUE_PATH)) return 0;

  let queue = [];
  try {
    queue = JSON.parse(fs.readFileSync(PENDING_QUEUE_PATH, "utf8"));
  } catch {
    return 0;
  }

  if (!Array.isArray(queue) || queue.length === 0) return 0;

  console.log(`\n📦 Phát hiện ${queue.length} đợt dữ liệu chờ đồng bộ trong hàng đợi offline. Đang đẩy lên Supabase...`);
  const remaining = [];
  let flushedCount = 0;

  for (const item of queue) {
    try {
      const dishId = item.dishId || dbState?.dishMap?.get(slugify(item.dish)) || null;
      await syncToSupabaseDirect(item.spots, item.dish, dishId);
      flushedCount += item.spots.length;
      console.log(`  ✅ Đã đồng bộ bù thành công ${item.spots.length} quán cho món "${item.dish}" lên Supabase!`);
    } catch (err) {
      console.warn(`  ⚠️ Vẫn chưa thể đồng bộ bù cho món "${item.dish}": ${err.message}. Giữ lại trong hàng đợi.`);
      remaining.push(item);
    }
  }

  if (remaining.length === 0) {
    try {
      fs.unlinkSync(PENDING_QUEUE_PATH);
    } catch {}
    console.log(`  🎉 Đã giải phóng hoàn toàn hàng đợi offline!`);
  } else {
    fs.writeFileSync(PENDING_QUEUE_PATH, JSON.stringify(remaining, null, 2), "utf8");
  }

  return flushedCount;
}

/**
 * Đẩy dữ liệu an toàn vào Supabase kèm cơ chế Retry và Fallback Hàng đợi Offline
 */
async function syncToSupabase(spots, dish, dbState) {
  if (!SUPABASE_SERVICE_ROLE_KEY || spots.length === 0) return { success: true };

  const slug = slugify(dish);
  const dishId = dbState.dishMap.get(slug) || dbState.dishMap.get(dish.toLowerCase());

  try {
    await syncToSupabaseDirect(spots, dish, dishId);
    console.log(`  ✅ Đã đồng bộ an toàn ${spots.length} quán lên Supabase.`);
    return { success: true };
  } catch (err) {
    console.warn(`  ⚠️ Lỗi đồng bộ Supabase sau nhiều lần thử lại (${err.message}).`);
    const queued = saveToOfflineQueue(spots, dish, dishId);
    return { success: false, queued };
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Chế độ chỉ đồng bộ hàng đợi offline (không mở trình duyệt cào)
  const isRetrySyncOnly = args.includes("--retry-sync") || args.includes("--flush-pending");
  if (isRetrySyncOnly) {
    getMaintenanceKey(process.env, { required: true });
    console.log("🔄 Đang kiểm tra và đẩy bù hàng đợi offline lên Supabase...");
    const dbState = await fetchExistingDatabaseState();
    const count = await flushPendingQueue(dbState);
    console.log(`✅ Hoàn tất! Đã đồng bộ ${count} quán từ hàng đợi offline lên Supabase.`);
    process.exit(0);
  }

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
  const isForce = args.includes("--force");

  // Tiêu chí chọn lọc: chỉ cào những quán có rating_count >= 500 (mặc định 500)
  const minRatingArg = args.find(
    (a) => a.startsWith("--min-rating-count=") || a.startsWith("--min-reviews="),
  );
  const minRatingCount = minRatingArg ? parseInt(minRatingArg.split("=")[1], 10) : 500;

  // Giới hạn số trang:
  // Nếu có truyền --max-pages=N thì dùng N, còn mặc định quét TẤT CẢ các trang (maxPages = 100)
  const maxPagesArg = args.find((a) => a.startsWith("--max-pages="));
  const maxPages = maxPagesArg ? parseInt(maxPagesArg.split("=")[1], 10) : 100;

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
  console.log(`🛡️  SHOPEEFOOD ANTI-BAN CRAWLER V5 (CHỌN LỌC RATING & QUÉT TẤT CẢ CÁC TRANG THEO QUẬN)`);
  console.log(`📋 Tổng số món trong kế hoạch: ${targetDishes.length} món`);
  console.log(`🏙️  Thành phố mục tiêu: ${targetCities.map((c) => c.name).join(", ")}`);
  console.log(`⭐ Tiêu chí chọn lọc: rating_count >= ${minRatingCount} (Quán uy tín, đông khách)`);
  console.log(`📑 Phân trang: ${maxPages >= 100 ? "Quét TẤT CẢ các trang (không giới hạn)" : `Tối đa ${maxPages} trang`}`);
  console.log(`🏛️  Chế độ quận: Mở rộng quét TẤT CẢ các quận cho CẢ 3 THÀNH PHỐ`);
  console.log(`💾 Đã hoàn thành trước đó (Checkpoint): ${completedCheckpoint.size} lượt (món × thành phố)`);
  console.log(`================================================================`);

  // 1. Tải trạng thái DB & CSV
  const dbState = await fetchExistingDatabaseState();
  const csvPath = path.resolve("data/crawler_urls_pending_affiliate.csv");
  const existingCsvUrls = getExistingCsvUrls(csvPath);

  // Tự động kiểm tra và đẩy bù hàng đợi offline nếu có dữ liệu tồn từ lần chạy trước
  await flushPendingQueue(dbState);

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

    // Xác định các thành phố cần quét món này:
    // MẶC ĐỊNH: Luôn tôn trọng Checkpoint (bỏ qua các thành phố đã cào xong món này)
    // CHỈ cào lại khi người dùng chỉ định rõ cờ --force
    const remainingCitiesForDish = targetCities.filter(
      (c) => isForce || !isKeyInCheckpoint(completedCheckpoint, c.slug, dish)
    );

    if (remainingCitiesForDish.length === 0) {
      const cityNames = targetCities.map((c) => c.name).join(", ");
      console.log(`⏩ [${dIdx + 1}/${targetDishes.length}] Món "${dish}" đã cào xong tại [${cityNames}] (Checkpoint), bỏ qua.`);
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
      const spots = await crawlDishInCity(
        currentContext,
        dish,
        city,
        dbState,
        maxPages,
        isFastMode,
        minRatingCount,
      );

      let syncResult = { success: true };
      if (spots.length > 0) {
        syncResult = await syncToSupabase(spots, dish, dbState);

        for (const s of spots) {
          const cUrl = cleanUrl(s.original_url);
          if (s.isNew && !s.affiliate_url && !existingCsvUrls.has(cUrl)) {
            existingCsvUrls.add(cUrl);
            allBrandNewForCsv.push(s);
          }
        }
      }

      // Đánh dấu thành phố này đã hoàn tất cho món này vào Checkpoint (khi DB đã nhận hoặc đã lưu queue offline)
      if (syncResult.success || syncResult.queued) {
        completedCheckpoint.add(`${city.slug}::${dish}`);
        completedCheckpoint.add(`${city.slug}::${dish.toLowerCase()}`);
        saveCheckpoint(completedCheckpoint);
      } else {
        console.warn(`  ⚠️ KHÔNG ghi checkpoint cho [${city.name}] - "${dish}" vì dữ liệu chưa được lưu an toàn. Sẽ cào lại ở lần chạy sau.`);
      }

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

  // Kiểm tra và giải phóng hàng đợi offline lần cuối nếu có món nào bị rớt mạng trong lúc chạy
  await flushPendingQueue(dbState);

  console.log(`\n================================================================`);
  console.log(`🎉 HOÀN THÀNH TIẾN TRÌNH CÀO AN TOÀN!`);
  console.log(`   - Tổng số món đã hoàn tất: ${completedCheckpoint.size}/${targetDishes.length}`);
  console.log(`   - Checkpoint lưu tại: ${CHECKPOINT_PATH}`);
  console.log(`================================================================`);
}

if (isMain) main().catch((error) => { console.error(error); process.exitCode = 1; });
