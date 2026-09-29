#!/usr/bin/env node
/**
 * Dọn dẹp toàn bộ liên kết sai lệch trong bảng restaurant_dishes của Supabase
 * Sử dụng bộ lọc dish-relevance để phát hiện và xóa các quán không phù hợp
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { isRestaurantRelevantForDish } from "../src/lib/dish-relevance.ts";

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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://cfjahscecuviajbemznx.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  if (!KEY) {
    console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local!");
    return;
  }

  console.log("🔍 Đang tải danh sách 128 món ăn...");
  const dRes = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=id,name,slug&order=id.asc`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const dishes = await dRes.json();
  console.log(`✅ Đã nạp ${dishes.length} món ăn.`);

  let totalRemoved = 0;

  for (const dish of dishes) {
    // 1. Lấy danh sách restaurant_dishes cho món này
    const rdRes = await fetch(`${SUPABASE_URL}/rest/v1/restaurant_dishes?dish_id=eq.${dish.id}&select=restaurant_id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
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
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
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
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        });
      }
      totalRemoved += invalidRestaurantIds.length;
    }
  }

  console.log(`\n🎉 Hoàn thành dọn dẹp! Đã gỡ bỏ ${totalRemoved} liên kết quán sai lệch trên Supabase.`);
}

main().catch(console.error);
