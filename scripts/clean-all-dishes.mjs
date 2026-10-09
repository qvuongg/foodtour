#!/usr/bin/env node
/**
 * Dọn dẹp toàn bộ liên kết sai lệch trong bảng restaurant_dishes của Supabase
 * Sử dụng bộ lọc dish-relevance để phát hiện và xóa các quán không phù hợp
 */

import { isRestaurantRelevantForDish } from "../src/lib/dish-relevance.ts";
import { getMaintenanceKey, getMaintenanceHeaders } from "./lib/maintenance-env.mjs";
import { getMaintenanceUrl } from "./lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "./lib/maintenance-env-file.mjs";

loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();
const KEY = getMaintenanceKey(process.env, { required: true });

async function main() {
  console.log("🔍 Đang tải danh sách 128 món ăn...");
  const dRes = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=id,name,slug&order=id.asc`, {
    headers: getMaintenanceHeaders(KEY),
  });
  const dishes = await dRes.json();
  console.log(`✅ Đã nạp ${dishes.length} món ăn.`);

  let totalRemoved = 0;

  for (const dish of dishes) {
    // 1. Lấy danh sách restaurant_dishes cho món này
    const rdRes = await fetch(`${SUPABASE_URL}/rest/v1/restaurant_dishes?dish_id=eq.${dish.id}&select=restaurant_id`, {
      headers: getMaintenanceHeaders(KEY),
    });
    if (!rdRes.ok) continue;
    const rds = await rdRes.json();
    if (!rds.length) continue;

    const rIds = rds.map((r) => r.restaurant_id);

    // 2. Tải thông tin quán theo chunk 100
    const invalidRestaurantIds = [];
    for (let i = 0; i < rIds.length; i += 100) {
      const chunk = rIds.slice(i, i + 100);
      const rRes = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?id=in.(${chunk.join(",")})&select=id,name`, {
        headers: getMaintenanceHeaders(KEY),
      });
      if (!rRes.ok) continue;
      const rests = await rRes.json();
      for (const r of rests) {
        if (!isRestaurantRelevantForDish(r.name, dish.name)) {
          invalidRestaurantIds.push(r.id);
        }
      }
    }

    if (invalidRestaurantIds.length > 0) {
      console.log(`⚠️ [${dish.name}]: Phát hiện ${invalidRestaurantIds.length} quán không phù hợp. Đang dọn dẹp...`);

      // Xóa theo lô 100
      for (let i = 0; i < invalidRestaurantIds.length; i += 100) {
        const delChunk = invalidRestaurantIds.slice(i, i + 100);
        await fetch(`${SUPABASE_URL}/rest/v1/restaurant_dishes?dish_id=eq.${dish.id}&restaurant_id=in.(${delChunk.join(",")})`, {
          method: "DELETE",
          headers: getMaintenanceHeaders(KEY),
        });
      }
      totalRemoved += invalidRestaurantIds.length;
    }
  }

  console.log(`\n🎉 Hoàn thành dọn dẹp! Đã gỡ bỏ ${totalRemoved} liên kết quán sai lệch trên Supabase.`);
}

main().catch(console.error);
