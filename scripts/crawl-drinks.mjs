#!/usr/bin/env node
/**
 * ============================================================================
 * SHOPEEFOOD DRINKS CRAWLER (HÀ NỘI · ĐÀ NẴNG · TP. HỒ CHÍ MINH)
 * ============================================================================
 * Chuyên biệt 100% cho mảng ĐỒ UỐNG & QUÁN NƯỚC (Cà phê, Trà sữa, Trà trái cây, Nước ép, Sinh tố).
 * Kỹ thuật chuẩn xác từ pipeline ăn trưa:
 *   - Lắng nghe response JSON `delivery/get_infos` & `deliveries`
 *   - Tự động bắt đúng cấu trúc dữ liệu ShopeeFood
 *   - Tự động kích hoạt Mở Rộng Theo Quận (District Query Expansion)
 *   - Đồng bộ database Supabase & file CSV độc lập
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

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();

const SUPABASE_SERVICE_ROLE_KEY = getMaintenanceKey();

const CHECKPOINT_PATH = path.resolve("data/crawler_checkpoint_drinks.json");
const CSV_OUTPUT_PATH = path.resolve("data/drinks_pending_affiliate.csv");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, maxRetries = 4, initialDelayMs = 1500) {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      if (res.status === 429 || res.status >= 500) {
        attempt++;
        if (attempt > maxRetries) {
          const errText = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        console.warn(`  ⚠️ Supabase HTTP ${res.status}, thử lại lần ${attempt}/${maxRetries} sau ${(delay / 1000).toFixed(1)}s...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText}`);
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      console.warn(`  ⚠️ Lỗi kết nối (${err.message}), thử lại lần ${attempt}/${maxRetries} sau ${(delay / 1000).toFixed(1)}s...`);
      await sleep(delay);
      delay *= 2;
    }
  }
}

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

// ============================================================================
// DANH MỤC 3 THÀNH PHỐ
// ============================================================================
export const DRINK_CITIES = [
  {
    slug: "da-nang",
    name: "Đà Nẵng",
    latMin: 15.9,
    latMax: 16.25,
    lngMin: 108.0,
    lngMax: 108.35,
    districts: [
      "Liên Chiểu",
      "Hải Châu",
      "Thanh Khê",
      "Sơn Trà",
      "Ngũ Hành Sơn",
      "Cẩm Lệ",
    ],
  },
  {
    slug: "ha-noi",
    name: "Hà Nội",
    latMin: 20.8,
    latMax: 21.35,
    lngMin: 105.6,
    lngMax: 106.05,
    districts: [
      "Hoàn Kiếm",
      "Đống Đa",
      "Ba Đình",
      "Hai Bà Trưng",
      "Cầu Giấy",
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
      "Phú Nhuận",
      "Tân Bình",
      "Gò Vấp",
      "Thủ Đức",
      "Bình Tân",
      "Tân Phú",
    ],
  },
];

// ============================================================================
// DANH MỤC CÁC MÓN NƯỚC THEO NHÓM
// ============================================================================
export const DRINK_GROUPS = {
  coffee: [
    "Cà phê đen đá",
    "Cà phê sữa đá",
    "Bạc xỉu",
    "Cà phê muối",
    "Cà phê cốt dừa",
    "Cà phê trứng",
    "Cà phê ủ lạnh",
    "Latte",
    "Cappuccino",
    "Americano",
    "Espresso",
    "Cacao sữa",
    "Cacao kem muối",
  ],
  milktea: [
    "Trà sữa trân châu",
    "Trà sữa ô long",
    "Trà sữa Thái",
    "Trà sữa nướng",
    "Matcha latte",
    "Sữa tươi trân châu đường đen",
    "Trà sữa khoai môn",
    "Trà sữa lài",
    "Trà sữa trà xanh",
    "Hojicha latte",
    "Matcha latte dâu",
  ],
  fruit_tea: [
    "Trà đào cam sả",
    "Trà vải",
    "Trà chanh",
    "Trà tắc",
    "Trà sen vàng",
    "Trà dâu",
    "Trà xoài",
    "Trà mãng cầu",
    "Trà nhãn sen",
    "Hồng trà",
    "Trà xanh",
    "Trà ô long",
  ],
  juice: [
    "Nước ép cam",
    "Nước ép dưa hấu",
    "Nước ép dứa",
    "Nước ép ổi",
    "Nước ép táo",
    "Nước ép bưởi",
    "Nước ép cà rốt",
    "Nước ép cóc",
    "Nước chanh",
    "Nước chanh dây",
    "Nước chanh muối",
  ],
  smoothie: [
    "Sinh tố bơ",
    "Sinh tố xoài",
    "Sinh tố dâu",
    "Sinh tố chuối",
    "Sinh tố mãng cầu",
    "Sinh tố sapoche",
    "Sinh tố dưa gang",
    "Matcha đá xay",
    "Sô cô la đá xay",
    "Bánh quy kem đá xay",
  ],
  traditional: [
    "Rau má đậu xanh",
    "Nước rau má",
    "Nước dừa",
    "Nước mía",
    "Sữa đậu nành",
    "Sâm bí đao",
    "Nước sâm",
    "Nước mơ",
    "Nước sấu",
    "Sữa hạt sen mè đen",
    "Sữa đậu xanh cốt dừa",
    "Sữa chua đá",
    "Sữa chua việt quất",
    "Sữa chua chanh dây",
    "Soda chanh",
    "Soda dâu",
    "Soda việt quất",
  ],
};

export const ALL_DRINKS = Array.from(
  new Set(Object.values(DRINK_GROUPS).flat()),
);

// ============================================================================
// CHECKPOINT & CSV
// ============================================================================
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
      const rawList = data.completedKeys || [];
      const set = new Set();
      for (const item of rawList) {
        if (typeof item !== "string") continue;
        let city = "ha-noi";
        let drink = item;
        if (item.includes("::")) {
          const parts = item.split("::");
          city = parts[0].trim().toLowerCase();
          drink = parts.slice(1).join("::").trim();
        }
        set.add(`${city}::${drink}`);
        set.add(`${city}::${drink.toLowerCase()}`);
        set.add(`${city}::${slugify(drink)}`);
      }
      return set;
    } catch {}
  }
  return new Set();
}

function isKeyInCheckpoint(completedSet, citySlug, drinkName) {
  if (!completedSet || completedSet.size === 0) return false;
  const cSlug = citySlug.trim().toLowerCase();
  const dName = drinkName.trim();
  const dLower = dName.toLowerCase();
  const dSlug = slugify(dName);

  return (
    completedSet.has(`${cSlug}::${dName}`) ||
    completedSet.has(`${cSlug}::${dLower}`) ||
    completedSet.has(`${cSlug}::${dSlug}`)
  );
}

function saveCheckpoint(set) {
  try {
    fs.mkdirSync(path.dirname(CHECKPOINT_PATH), { recursive: true });
    fs.writeFileSync(
      CHECKPOINT_PATH,
      JSON.stringify(
        { updatedAt: new Date().toISOString(), completedKeys: Array.from(set) },
        null,
        2,
      ),
      "utf8",
    );
  } catch {}
}

function getExistingCsvUrls(csvPath) {
  const set = new Set();
  if (fs.existsSync(csvPath)) {
    try {
      const lines = fs.readFileSync(csvPath, "utf8").split("\n");
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split('","');
        if (parts.length >= 4) {
          const urlPart = parts[3].replace(/^"|"$/g, "");
          if (urlPart.startsWith("http")) set.add(cleanUrl(urlPart));
        }
      }
    } catch {}
  }
  return set;
}

// ============================================================================
// DATABASE STATE & SYNC
// ============================================================================
async function fetchExistingDbState() {
  const existingUrls = new Set();
  const dishMap = new Map();

  if (!SUPABASE_SERVICE_ROLE_KEY) return { existingUrls, dishMap };

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

    const rows = await fetchAllRows(`${SUPABASE_URL}/rest/v1/restaurants?select=original_url`, {
      headers: {
        ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
      },
    }, fetchWithRetry);
    for (const r of rows) {
      if (r.original_url) existingUrls.add(cleanUrl(r.original_url));
    }
  } catch {}

  return { existingUrls, dishMap };
}

export async function syncToSupabase(spots, dishName, dbState) {
  if (!SUPABASE_SERVICE_ROLE_KEY || spots.length === 0) return;

  const dishSlug = slugify(dishName);
  let dishId = dbState.dishMap.get(dishSlug) || dbState.dishMap.get(dishName.toLowerCase());

  if (!dishId) {
    try {
      const insertDishRes = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/dishes`, {
        method: "POST",
        headers: {
          ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: dishName,
          slug: dishSlug,
          category: "drinks",
        }),
      });
      if (insertDishRes.ok) {
        const created = await insertDishRes.json();
        if (created?.[0]?.id) {
          dishId = created[0].id;
          dbState.dishMap.set(dishSlug, dishId);
        }
      } else {
        const errText = await insertDishRes.text();
        console.warn(`⚠️ Không thể tạo món "${dishName}" trên Supabase:`, errText);
      }
    } catch (err) {
      console.warn(`⚠️ Lỗi kết nối khi tạo món "${dishName}":`, err.message);
    }
  }

  const newSpotsToInsert = spots.filter((s) => s.isNew);
  if (newSpotsToInsert.length > 0) {
    const payload = newSpotsToInsert.map((s) => restaurantMetadata({
      id: s.id,
      name: s.name,
      address: s.address,
      district: s.district,
      city: s.city,
      lat: s.lat,
      lng: s.lng,
      rating: s.rating,
      rating_count: s.rating_count,
      original_url: s.original_url,

      delivery_id: s.delivery_id || null,
      is_verified: true,
      is_active: true,
    }));

    try {
      await fetchWithRetry(`${SUPABASE_URL}/rest/v1/restaurants`, {
        method: "POST",
        headers: {
          ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn(`⚠️ Lỗi đồng bộ quán đồ uống:`, err.message);
    }
  }

  if (dishId) {
    try {
      const urls = spots.map((s) => s.original_url);
      const restRes = await fetchWithRetry(
        `${SUPABASE_URL}/rest/v1/restaurants?original_url=in.(${urls.map((u) => `"${encodeURIComponent(u)}"`).join(",")})&select=id`,
        {
          headers: {
            ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
          },
        },
      );
      if (restRes.ok) {
        const found = await restRes.json();
        if (Array.isArray(found) && found.length > 0) {
          const links = found.map((r) => ({
            restaurant_id: r.id,
            dish_id: dishId,
          }));
          await fetchWithRetry(`${SUPABASE_URL}/rest/v1/restaurant_dishes`, {
            method: "POST",
            headers: {
              ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
              "Content-Type": "application/json",
              Prefer: "resolution=ignore-duplicates",
            },
            body: JSON.stringify(links),
          });
        }
      }
    } catch {}
  }
}

// ============================================================================
// STEALTH CONTEXT
// ============================================================================
async function createStealthContext(browser) {
  const viewports = [
    { width: 1366, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
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

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    window.chrome = { runtime: {}, app: {} };
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4] });
    Object.defineProperty(navigator, "languages", { get: () => ["vi-VN", "vi", "en-US"] });
  });

  return context;
}

// ============================================================================
// HÀM CÀO 1 MÓN TẠI 1 THÀNH PHỐ
// ============================================================================
async function crawlDrinkInCity(context, drinkName, city, dbState, maxPages, isFastMode) {
  console.log(`\n🔍 Đang quét: "${drinkName}" tại [${city.name}]...`);

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
      console.warn(`  ⚠️ CẢNH BÁO RATE LIMIT (HTTP ${status}) từ ShopeeFood API!`);
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
        const ct = response.headers()["content-type"] || "";
        if (!ct.includes("application/json")) return;

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

          const ratingCount = Number(
            item.rating?.total_review ??
            item.rating?.review_count ??
            item.total_review ??
            item.rating_count ??
            item.review_count ??
            0,
          );
          if (ratingCount < 500) {
            continue; // Bỏ qua quán dưới 500 lượt đánh giá
          }

          const deliveryId = Number(rawId);
          const recordId = `spf_${city.slug}_${deliveryId}`;
          const slug = item.url_rewrite_name || item.slug || slugify(name);
          const restaurantUrl = item.url
            ? item.url.startsWith("http")
              ? item.url
              : `https://shopeefood.vn/${item.url}`
            : `https://shopeefood.vn/${city.slug}/${slug}`;
          const cUrl = cleanUrl(restaurantUrl);

          if (sessionSpots.has(recordId)) continue;

          const isAlreadyInDb = dbState.existingUrls.has(cUrl);
          const address = (item.address || item.full_address || "").trim();
          let district = (item.district_name || item.district || "").trim();
          if (!district && address) {
            for (const d of city.districts) {
              if (address.toLowerCase().includes(d.toLowerCase())) {
                district = d;
                break;
              }
            }
          }

          const spotData = {
            id: recordId,
            delivery_id: deliveryId,
            name,
            address,
            district: district || city.districts[0],
            city: city.slug,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            rating: Number(item.rating?.avg || item.avg_rating || item.rating || 4.5),
            rating_count: ratingCount,
            original_url: restaurantUrl,
            isNew: !isAlreadyInDb,
          };

          sessionSpots.set(recordId, spotData);

          if (isAlreadyInDb) {
            alreadyExistingCount++;
          } else {
            newlyDiscoveredCount++;
            dbState.existingUrls.add(cUrl);
          }
        }
      } catch {}
    }
  });

  const searchUrl = `https://shopeefood.vn/${city.slug}/danh-sach-dia-diem-giao-tan-noi?q=${encodeURIComponent(drinkName)}`;

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

    // Duyệt qua các trang kế tiếp
    for (let p = 2; p <= pagesToScrape; p++) {
      if (rateLimitDetected) break;

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

    // Mở Rộng Theo Quận (District Query Expansion)
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

        const districtQuery = `${drinkName} ${district}`;
        const districtUrl = `https://shopeefood.vn/${city.slug}/danh-sach-dia-diem-giao-tan-noi?q=${encodeURIComponent(
          districtQuery,
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
            `        └─ [Quận ${district}]: +${addedInDistrict} quán mới (Tổng tích lũy: ${sessionSpots.size} quán)`,
          );
        } catch (errDistrict) {
          console.warn(`        ⚠️ Bỏ qua quận ${district}: ${errDistrict.message}`);
        }
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ Lỗi tải trang "${drinkName}" tại ${city.name}: ${err.message}`);
  } finally {
    await page.close();
  }

  const allSpots = Array.from(sessionSpots.values());
  console.log(`     ✅ Kết quả [${city.name}]: ${allSpots.length} quán (Cũ: ${alreadyExistingCount}, ✨ Mới: ${newlyDiscoveredCount})`);
  return allSpots;
}

// ============================================================================
// HÀM MAIN
// ============================================================================
async function main() {
  const args = process.argv.slice(2);
  const isReset = args.includes("--reset-checkpoint");
  const isFastMode = args.includes("--fast");

  let maxPages = 2;
  const pageArg = args.find((a) => a.startsWith("--max-pages="));
  if (pageArg) {
    maxPages = Math.max(1, parseInt(pageArg.split("=")[1], 10) || 2);
  }

  if (isReset && fs.existsSync(CHECKPOINT_PATH)) {
    fs.unlinkSync(CHECKPOINT_PATH);
    console.log("🔄 Đã xóa checkpoint cũ, bắt đầu cào đồ uống từ đầu.");
  }

  // 1. Thành phố mục tiêu
  let targetCities = DRINK_CITIES;
  const cityArg = args.find((a) => a.startsWith("--city="));
  if (cityArg) {
    const citySlug = cityArg.split("=")[1].trim();
    const foundCity = DRINK_CITIES.find((c) => c.slug === citySlug);
    if (foundCity) {
      targetCities = [foundCity];
    } else {
      console.error(`❌ Thành phố không hợp lệ: "${citySlug}". Chọn: da-nang, ha-noi, ho-chi-minh`);
      process.exit(1);
    }
  }

  // 2. Món nước mục tiêu
  let targetDrinks = [];
  const groupArg = args.find((a) => a.startsWith("--group="));
  if (groupArg) {
    const groupKey = groupArg.split("=")[1].trim();
    if (groupKey === "all") {
      targetDrinks = ALL_DRINKS;
    } else if (DRINK_GROUPS[groupKey]) {
      targetDrinks = DRINK_GROUPS[groupKey];
    } else {
      console.error(`❌ Nhóm đồ uống không hợp lệ: "${groupKey}". Chọn: coffee, milktea, fruit_tea, juice, smoothie, traditional, all`);
      process.exit(1);
    }
  } else {
    const customList = args.filter((a) => !a.startsWith("--"));
    if (customList.length > 0) {
      targetDrinks = customList;
    } else {
      targetDrinks = ALL_DRINKS;
    }
  }

  const isForce = args.includes("--force");
  const completedCheckpoint = loadCheckpoint();

  console.log(`================================================================`);
  console.log(`🥤 SHOPEEFOOD DRINKS CRAWLER (HÀ NỘI · ĐÀ NẴNG · TP. HỒ CHÍ MINH)`);
  console.log(`📋 Tổng số món nước trong kế hoạch: ${targetDrinks.length} món`);
  console.log(`🏙️  Thành phố mục tiêu: ${targetCities.map((c) => c.name).join(", ")}`);
  console.log(`📑 Giới hạn: ${maxPages} trang mỗi quận/thành phố`);
  console.log(`💾 Checkpoint đã hoàn tất: ${completedCheckpoint.size} lượt (món × thành phố)`);
  console.log(`================================================================\n`);

  const dbState = await fetchExistingDbState();
  const existingCsvUrls = getExistingCsvUrls(CSV_OUTPUT_PATH);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  let currentContext = await createStealthContext(browser);
  let processedDrinksSinceRecycle = 0;
  const brandNewSpotsForCsv = [];

  for (let i = 0; i < targetDrinks.length; i++) {
    const drink = targetDrinks[i];

    const remainingCities = targetCities.filter(
      (c) => isForce || !isKeyInCheckpoint(completedCheckpoint, c.slug, drink),
    );

    if (remainingCities.length === 0) {
      console.log(`⏩ [${i + 1}/${targetDrinks.length}] Món "${drink}" đã cào xong (Checkpoint), bỏ qua.`);
      continue;
    }

    console.log(`\n🍹 [${i + 1}/${targetDrinks.length}] ĐANG XỬ LÝ: "${drink.toUpperCase()}"...`);

    if (processedDrinksSinceRecycle >= 6) {
      console.log("🔄 Làm mới Browser Context (reset token & cookies)...");
      await currentContext.close();
      currentContext = await createStealthContext(browser);
      processedDrinksSinceRecycle = 0;
      await randomDelay(2.0, 3.5);
    }

    for (const city of remainingCities) {
      const spots = await crawlDrinkInCity(
        currentContext,
        drink,
        city,
        dbState,
        maxPages,
        isFastMode,
      );

      if (spots.length > 0) {
        await syncToSupabase(spots, drink, dbState);

        for (const s of spots) {
          const cUrl = cleanUrl(s.original_url);
          if (s.isNew && !existingCsvUrls.has(cUrl)) {
            existingCsvUrls.add(cUrl);
            brandNewSpotsForCsv.push(s);
          }
        }
      }

      completedCheckpoint.add(`${city.slug}::${drink}`);
      saveCheckpoint(completedCheckpoint);
      await randomDelay(isFastMode ? 1.5 : 2.5, isFastMode ? 2.5 : 4.0);
    }

    processedDrinksSinceRecycle++;

    if (brandNewSpotsForCsv.length > 0) {
      const fileExists = fs.existsSync(CSV_OUTPUT_PATH);
      const rows = brandNewSpotsForCsv.map(
        (s) =>
          `"${s.name.replace(/"/g, '""')}","${s.city}","${s.district}","${s.original_url}",""`,
      );
      if (!fileExists) {
        const header = "Tên Quán,Thành Phố,Quận,Link ShopeeFood Gốc,Link Affiliate shope.ee (Điền vào đây)\n";
        fs.writeFileSync(CSV_OUTPUT_PATH, header + rows.join("\n") + "\n", "utf8");
      } else {
        fs.appendFileSync(CSV_OUTPUT_PATH, rows.join("\n") + "\n", "utf8");
      }
      console.log(`  📁 Đã lưu ${brandNewSpotsForCsv.length} quán mới vào CSV: ${path.basename(CSV_OUTPUT_PATH)}`);
      brandNewSpotsForCsv.length = 0;
    }

    if ((i + 1) % 15 === 0) {
      console.log(`\n☕ [COOL-DOWN] Nghỉ giải lao 25s để bảo vệ session...`);
      await sleep(25000);
    } else {
      await randomDelay(isFastMode ? 2.0 : 3.5, isFastMode ? 3.0 : 5.0);
    }
  }

  await currentContext.close();
  await browser.close();

  console.log(`\n================================================================`);
  console.log(`🎉 HOÀN TẤT TIẾN TRÌNH CÀO ĐỒ UỐNG!`);
  console.log(`   - Tổng số món × thành phố hoàn thành: ${completedCheckpoint.size}`);
  console.log(`   - Dữ liệu CSV lưu tại: ${CSV_OUTPUT_PATH}`);
  console.log(`   - Checkpoint: ${CHECKPOINT_PATH}`);
  console.log(`================================================================`);
}

if (isMain) main().catch((error) => { console.error(error); process.exitCode = 1; });
