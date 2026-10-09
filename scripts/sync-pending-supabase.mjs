/**
 * ============================================================================
 * 🔄 SUPABASE OFFLINE QUEUE SYNC & RECOVERY TOOL
 * ============================================================================
 * Công dụng:
 * 1. Đọc và đẩy toàn bộ dữ liệu tồn đọng trong hàng đợi offline (`data/crawler_pending_supabase_queue.json`)
 *    lên Supabase khi mạng đã ổn định trở lại.
 * 2. Sử dụng cơ chế Retry (tự động thử lại 4 lần) với Exponential Backoff chống rớt mạng.
 * 3. Tự động liên kết quán ăn với món tương ứng trong bảng `restaurant_dishes`.
 *
 * CÁCH CHẠY:
 *    node scripts/sync-pending-supabase.mjs
 * ============================================================================
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { getMaintenanceKey, getMaintenanceHeaders } from "./lib/maintenance-env.mjs";
import { getMaintenanceUrl } from "./lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "./lib/maintenance-env-file.mjs";
import { restaurantMetadata } from "./lib/restaurant-metadata.mjs";
import { isRestaurantRelevantForDish } from "../src/lib/dish-relevance.ts";

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();

const SUPABASE_SERVICE_ROLE_KEY = getMaintenanceKey();

const PENDING_QUEUE_PATH = path.resolve("data/crawler_pending_supabase_queue.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function main() {
  console.log(`================================================================`);
  console.log(`🔄 CÔNG CỤ ĐỒNG BỘ HÀNG ĐỢI OFFLINE LÊN SUPABASE`);
  console.log(`================================================================`);

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong file .env.local! Không thể đồng bộ.");
    process.exit(1);
  }

  if (!fs.existsSync(PENDING_QUEUE_PATH)) {
    console.log(`✅ Hàng đợi offline hiện đang trống (${path.basename(PENDING_QUEUE_PATH)} không tồn tại).`);
    console.log(`   Tất cả dữ liệu cào trước đó đã được đồng bộ thành công lên Supabase!`);
    return;
  }

  let queue = [];
  try {
    queue = JSON.parse(fs.readFileSync(PENDING_QUEUE_PATH, "utf8"));
  } catch (err) {
    console.error(`❌ File hàng đợi bị hỏng (${err.message}).`);
    return;
  }

  if (!Array.isArray(queue) || queue.length === 0) {
    console.log(`✅ Hàng đợi offline trống rỗng! Không có quán nào chờ đẩy.`);
    try { fs.unlinkSync(PENDING_QUEUE_PATH); } catch {}
    return;
  }

  console.log(`📦 Tìm thấy ${queue.length} đợt dữ liệu đang chờ đồng bộ...`);

  // Lấy dishMap từ Supabase
  const dishMap = new Map();
  try {
    const res = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/dishes?select=id,slug,name`, {
      headers: {
        ...getMaintenanceHeaders(SUPABASE_SERVICE_ROLE_KEY),
      },
    });
    if (res.ok) {
      const list = await res.json();
      for (const d of list) {
        dishMap.set(d.slug, d.id);
        dishMap.set(d.name.toLowerCase(), d.id);
      }
    }
  } catch (err) {
    console.error("⚠️ Không thể tải danh sách dishes từ Supabase:", err.message);
  }

  const remaining = [];
  let totalSpotsSynced = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const dish = item.dish || "Món ăn";
    const dishId = item.dishId || dishMap.get(slugify(dish)) || dishMap.get(dish.toLowerCase()) || null;
    const spotsCount = item.spots ? item.spots.length : 0;

    console.log(`\n⏳ [${i + 1}/${queue.length}] Đang đồng bộ "${dish}" (${spotsCount} quán)...`);
    try {
      await syncToSupabaseDirect(item.spots, dish, dishId);
      totalSpotsSynced += spotsCount;
      console.log(`  ✅ Đã đồng bộ thành công ${spotsCount} quán lên Supabase!`);
    } catch (err) {
      console.error(`  ❌ Thất bại: ${err.message}. Giữ lại đợt này trong hàng đợi.`);
      remaining.push(item);
    }
  }

  if (remaining.length === 0) {
    try { fs.unlinkSync(PENDING_QUEUE_PATH); } catch {}
    console.log(`\n================================================================`);
    console.log(`🎉 TOÀN BỘ ${totalSpotsSynced} QUÁN ĐÃ ĐƯỢC ĐỒNG BỘ THÀNH CÔNG LÊN SUPABASE!`);
    console.log(`   Đã dọn sạch hàng đợi offline.`);
    console.log(`================================================================`);
  } else {
    fs.writeFileSync(PENDING_QUEUE_PATH, JSON.stringify(remaining, null, 2), "utf8");
    console.log(`\n⚠️ Đã đồng bộ ${totalSpotsSynced} quán, còn lại ${remaining.length} đợt trong hàng đợi do lỗi kết nối.`);
    console.log(`   Hãy kiểm tra mạng và chạy lại script: node scripts/sync-pending-supabase.mjs`);
  }
}

if (isMain) main().catch((error) => { console.error(error); process.exitCode = 1; });
