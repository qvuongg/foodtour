#!/usr/bin/env node
/**
 * ============================================================================
 * 🏪 CRAWLER CHI NHÁNH 10 THƯƠNG HIỆU LỚN (HÀ NỘI · TP.HCM · ĐÀ NẴNG)
 * ============================================================================
 * Cào toàn bộ chi nhánh có toạ độ GPS chính xác (lat, lng), địa chỉ, ShopeeFood URL.
 * Đồng bộ vào:
 *   1. Supabase (Bảng `restaurants`)
 *   2. File client static: `src/data/brand-branches.json`
 *   3. File backup master: `data/brand_branches_master.json`
 * ============================================================================
 */

import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { getMaintenanceKey, getMaintenanceHeaders } from "./lib/maintenance-env.mjs";
import { getMaintenanceUrl } from "./lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "./lib/maintenance-env-file.mjs";
import { restaurantMetadata, fetchAllRows, mergeCrawledBranch, preserveBranchAffiliates, mergeBranchSnapshots, withBrandSnapshotLock } from "./lib/restaurant-metadata.mjs";

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();

const SUPABASE_SERVICE_ROLE_KEY = getMaintenanceKey();

const OUTPUT_MASTER_JSON = path.resolve("data/brand_branches_master.json");
const OUTPUT_CLIENT_JSON = path.resolve("src/data/brand-branches.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(minSec, maxSec) {
  const ms = Math.floor((minSec + Math.random() * (maxSec - minSec)) * 1000);
  return sleep(ms);
}

function removeAccents(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

function slugify(str) {
  return removeAccents(str)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 10 Thương hiệu chuẩn
export const TARGET_BRANDS = [
  {
    id: "highlands",
    name: "Highlands Coffee",
    searchQuery: "Highlands Coffee",
    matchKeywords: ["highlands"],
  },
  {
    id: "phuclong",
    name: "Phúc Long",
    searchQuery: "Phúc Long",
    matchKeywords: ["phuc long"],
  },
  {
    id: "phela",
    name: "Phê La",
    searchQuery: "Phê La",
    matchKeywords: ["phe la"],
  },
  {
    id: "katinat",
    name: "Katinat",
    searchQuery: "Katinat",
    matchKeywords: ["katinat"],
  },
  {
    id: "starbucks",
    name: "Starbucks",
    searchQuery: "Starbucks",
    matchKeywords: ["starbucks"],
  },
  {
    id: "mixue",
    name: "Mixue",
    searchQuery: "Mixue",
    matchKeywords: ["mixue"],
  },
  {
    id: "tocotoco",
    name: "ToCoToCo",
    searchQuery: "ToCoToCo",
    matchKeywords: ["tocotoco", "toco toco"],
  },
  {
    id: "congcaphe",
    name: "Cộng Cà Phê",
    searchQuery: "Cộng Cà Phê",
    matchKeywords: ["cong ca phe", "cong caphe"],
  },
  {
    id: "gongcha",
    name: "Gong Cha",
    searchQuery: "Gong Cha",
    matchKeywords: ["gong cha", "gongcha"],
  },
  {
    id: "koithe",
    name: "KOI Thé",
    searchQuery: "KOI Thé",
    matchKeywords: ["koi the", "koi the"],
  },
];

// 3 Thành phố
export const TARGET_CITIES = [
  {
    slug: "ho-chi-minh",
    name: "TP. Hồ Chí Minh",
    latMin: 10.6,
    latMax: 11.1,
    lngMin: 106.4,
    lngMax: 106.9,
  },
  {
    slug: "ha-noi",
    name: "Hà Nội",
    latMin: 20.8,
    latMax: 21.4,
    lngMin: 105.6,
    lngMax: 106.1,
  },
  {
    slug: "da-nang",
    name: "Đà Nẵng",
    latMin: 15.9,
    latMax: 16.25,
    lngMin: 108.0,
    lngMax: 108.35,
  },
];

/**
 * Kiểm tra quán có thực sự thuộc thương hiệu không
 */
function isBrandStore(restaurantName, brand) {
  if (!restaurantName) return false;
  const cleanName = removeAccents(restaurantName);
  return brand.matchKeywords.some((keyword) => cleanName.includes(keyword));
}

/**
 * Tải dữ liệu đã cào trước đó từ file master và Supabase
 */
function readLocalBranches() {
  return mergeBranchSnapshots([OUTPUT_CLIENT_JSON, OUTPUT_MASTER_JSON]
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, "utf8"))));
}

async function loadExistingBranches() {
  const map = new Map(readLocalBranches().map((row) => [Number(row.delivery_id), row]));

  // Nạp thêm từ Supabase nếu có
  if (SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const rows = await fetchAllRows(
        `${SUPABASE_URL}/rest/v1/restaurants?select=id,name,city,lat,lng,original_url,affiliate_url,delivery_id,district,address,rating,rating_count`,
        {
          headers: {
            ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
          },
        },
      );
        for (const r of rows) {
          if (!r.delivery_id || !r.lat || !r.lng) continue;
          for (const brand of TARGET_BRANDS) {
            if (isBrandStore(r.name, brand)) {
              const dId = Number(r.delivery_id);
              if (!map.has(dId)) {
                map.set(dId, {
                  id: `brand_${brand.id}_${dId}`,
                  brand_id: brand.id,
                  brand_name: brand.name,
                  delivery_id: dId,
                  name: r.name,
                  address: r.address || "",
                  district: r.district || "",
                  city: r.city,
                  city_name: TARGET_CITIES.find((c) => c.slug === r.city)?.name || r.city,
                  lat: Number(r.lat),
                  lng: Number(r.lng),
                  rating: Number(r.rating || 4.5),
                  rating_count: Number(r.rating_count || 100),
                  shopeefood_url: r.original_url,
                  affiliate_url: r.affiliate_url,
                  updated_at: new Date().toISOString(),
                });
              } else if (r.affiliate_url && !map.get(dId).affiliate_url) {
                // Backfill a missing local link from the importer-owned DB
                // column; never replace an existing local mapping here.
                map.set(dId, { ...map.get(dId), affiliate_url: r.affiliate_url });
              }
              break;
            }
          }
        }
    } catch (err) {
      console.warn("⚠️ Không thể tải trước từ Supabase:", err.message);
    }
  }

  return map;
}

/**
 * Đồng bộ danh sách chi nhánh lên Supabase `restaurants`
 */
export async function syncBranchesToSupabase(branches) {
  if (!SUPABASE_SERVICE_ROLE_KEY || branches.length === 0) return;

  // Lấy map delivery_id -> id thực tế đã có trong database để tránh đổi ID vi phạm khoá ngoại
  const allDeliveryIds = branches.map((b) => b.delivery_id);
  const existingMap = new Map();

  for (let i = 0; i < allDeliveryIds.length; i += 150) {
    const chunk = allDeliveryIds.slice(i, i + 150);
    try {
      const res = await fetch(
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
          if (r.delivery_id) existingMap.set(Number(r.delivery_id), r.id);
        }
      }
    } catch {
      throw new Error("Cannot resolve existing restaurant IDs; metadata sync stopped without writing.");
    }
  }

  const payload = branches.map((b) => {
    const existingId = existingMap.get(b.delivery_id);
    return restaurantMetadata({
      id: existingId || b.id,
      delivery_id: b.delivery_id,
      name: b.name,
      address: b.address,
      district: b.district || "",
      city: b.city,
      lat: b.lat,
      lng: b.lng,
      rating: b.rating || 4.5,
      rating_count: b.rating_count || 100,
      original_url: b.shopeefood_url,

      is_verified: true,
      is_active: true,
    });
  });

  const BATCH_SIZE = 100;
  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const chunk = payload.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/restaurants?on_conflict=delivery_id`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(chunk),
        },
      );
      if (!res.ok) {
        throw new Error(`Supabase metadata sync failed: HTTP ${res.status}`);
      }
    } catch (err) {
      throw err;
    }
  }
}

/**
 * Thu thập các chi nhánh của Brand trong City
 */
async function crawlBrandInCity(context, brand, city, branchMap) {
  console.log(`\n🔍 Đang cào thương hiệu: [${brand.name}] tại [${city.name}]...`);
  const page = await context.newPage();

  let foundThisSession = 0;
  let newThisSession = 0;

  // Lắng nghe API phản hồi từ ShopeeFood
  page.on("response", async (response) => {
    const url = response.url();
    if (
      url.includes("/api/delivery/") ||
      url.includes("search_global") ||
      url.includes("get_infos")
    ) {
      try {
        const ct = response.headers()["content-type"] || "";
        if (!ct.includes("application/json")) return;

        const json = await response.json();
        const items =
          json?.reply?.delivery_infos ||
          json?.reply?.deliveries ||
          json?.reply?.search_result ||
          [];

        const list = Array.isArray(items) ? items : [items];
        for (const item of list) {
          if (!item || typeof item !== "object") continue;

          const rawId = item.delivery_id || item.id || item.restaurant_id;
          const name = (item.name || item.restaurant_name || "").trim();
          if (!rawId || !name) continue;

          // Kiểm tra đúng quán thuộc thương hiệu
          if (!isBrandStore(name, brand)) continue;

          const pos = item.position || item.location || {};
          const lat = Number(pos.latitude || item.latitude || item.lat);
          const lng = Number(pos.longitude || item.longitude || item.lng);

          if (!lat || !lng || isNaN(lat) || isNaN(lng)) continue;
          if (
            lat < city.latMin ||
            lat > city.latMax ||
            lng < city.lngMin ||
            lng > city.lngMax
          ) {
            continue;
          }

          const deliveryId = Number(rawId);
          const slug = item.restaurant_url || item.url_rewrite_name || slugify(name);
          const restaurantUrl = item.url
            ? (item.url.startsWith("http") ? item.url : `https://shopeefood.vn/${item.url}`)
            : `https://shopeefood.vn/${city.slug}/${slug}`;

          const address = (item.address || item.full_address || "").trim();
          const district = (item.district_name || item.district || "").trim();
          const ratingCount = Number(
            item.rating?.total_review ??
            item.rating?.review_count ??
            item.rating_count ??
            100,
          );
          const ratingAvg = Number(item.rating?.avg || item.rating || 4.5);

          const branchRecord = {
            id: `brand_${brand.id}_${deliveryId}`,
            brand_id: brand.id,
            brand_name: brand.name,
            delivery_id: deliveryId,
            name,
            address,
            district,
            city: city.slug,
            city_name: city.name,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            rating: Number(ratingAvg.toFixed(1)),
            rating_count: ratingCount,
            shopeefood_url: restaurantUrl,
            updated_at: new Date().toISOString(),
          };

          foundThisSession++;
          if (!branchMap.has(deliveryId)) {
            newThisSession++;
          }
          branchMap.set(deliveryId, mergeCrawledBranch(branchMap.get(deliveryId), branchRecord));
        }
      } catch {}
    }
  });

  const searchUrl = `https://shopeefood.vn/${city.slug}/danh-sach-dia-diem-giao-tan-noi?q=${encodeURIComponent(
    brand.searchQuery,
  )}`;

  try {
    const initPromise = page
      .waitForResponse((r) => r.url().includes("delivery/get_infos"), { timeout: 10000 })
      .catch(() => null);

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await initPromise;
    await randomDelay(1.2, 2.0);

    // Kiểm tra phân trang và lướt qua các trang
    let pageNumbers = await page
      .$$eval(".pagination a", (els) =>
        els
          .map((e) => e.innerText.trim())
          .filter((t) => /^\d+$/.test(t))
          .map(Number),
      )
      .catch(() => []);

    const maxPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
    console.log(`  └─ Trang 1: Tìm thấy ${foundThisSession} chi nhánh (Tổng số trang: ${maxPage})`);

    for (let p = 2; p <= Math.min(maxPage, 10); p++) {
      const pageBtn = page.locator(".pagination a", { hasText: new RegExp(`^${p}$`) });
      if ((await pageBtn.count()) > 0) {
        const nextPromise = page
          .waitForResponse((r) => r.url().includes("delivery/get_infos"), { timeout: 9000 })
          .catch(() => null);
        await pageBtn.first().click();
        await nextPromise;
        await randomDelay(1.0, 1.8);
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ Lỗi khi tải trang [${brand.name}] - [${city.name}]: ${err.message}`);
  } finally {
    await page.close().catch(() => {});
  }

  console.log(
    `  ✅ Hoàn tất [${brand.name}] tại [${city.name}]: +${newThisSession} mới (Tổng tích luỹ: ${branchMap.size})`,
  );
}

async function main() {
  console.log(`================================================================`);
  console.log(`🏪 CRAWLER CHI NHÁNH 10 THƯƠNG HIỆU LỚN TẠI 3 THÀNH PHỐ`);
  console.log(`================================================================`);

  // Đảm bảo thư mục lưu trữ tồn tại
  const clientDir = path.dirname(OUTPUT_CLIENT_JSON);
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }

  const masterDir = path.dirname(OUTPUT_MASTER_JSON);
  if (!fs.existsSync(masterDir)) {
    fs.mkdirSync(masterDir, { recursive: true });
  }

  const branchMap = await loadExistingBranches();
  console.log(`📦 Đã nạp từ bộ nhớ cache trước đó: ${branchMap.size} chi nhánh.`);

  // Khởi động Playwright Chromium
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  // Quét qua 10 Thương hiệu x 3 Thành phố
  for (const brand of TARGET_BRANDS) {
    for (const city of TARGET_CITIES) {
      await crawlBrandInCity(context, brand, city, branchMap);
      await randomDelay(1.0, 2.0);

      // Lưu checkpoint liên tục sau mỗi thành phố
      // An affiliate import may have finished since this crawl began. Read the
      // snapshots again so checkpointing does not replace it with stale data.
      withBrandSnapshotLock(() => {
        const currentList = preserveBranchAffiliates(Array.from(branchMap.values()), readLocalBranches());
        for (const row of currentList) branchMap.set(Number(row.delivery_id), row);
        fs.writeFileSync(OUTPUT_MASTER_JSON, JSON.stringify(currentList, null, 2), "utf8");
        fs.writeFileSync(OUTPUT_CLIENT_JSON, JSON.stringify(currentList, null, 2), "utf8");
      });
    }
  }

  await browser.close();

  const finalList = Array.from(branchMap.values());
  console.log(`\n================================================================`);
  console.log(`🎉 ĐÃ CÀO XONG TỔNG CỘNG: ${finalList.length} CHI NHÁNH`);
  console.log(`================================================================`);

  // Thống kê theo thương hiệu
  for (const b of TARGET_BRANDS) {
    const count = finalList.filter((item) => item.brand_id === b.id).length;
    console.log(`   • ${b.name.padEnd(20)}: ${count} chi nhánh`);
  }

  // Đồng bộ lên Supabase
  if (SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`\n☁️  Đang đồng bộ ${finalList.length} chi nhánh lên Supabase 'restaurants'...`);
    await syncBranchesToSupabase(finalList);
    console.log(`✅ Đồng bộ Supabase hoàn tất!`);
  }

  console.log(`📁 File lưu trữ:`);
  console.log(`   - Master: ${OUTPUT_MASTER_JSON}`);
  console.log(`   - Client: ${OUTPUT_CLIENT_JSON}`);
}

if (isMain) main().catch((err) => {
  console.error("❌ Lỗi thực thi:", err);
  process.exit(1);
});
