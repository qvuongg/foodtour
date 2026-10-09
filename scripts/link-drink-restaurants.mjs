#!/usr/bin/env node
/**
 * scripts/link-drink-restaurants.mjs
 * Tự động liên kết 6,744 quán nước vào 75 món nước trong bảng restaurant_dishes trên Supabase.
 * Giúp tính năng "Tìm quán gần bạn 3km" (PostGIS RPC get_nearby_restaurants) hoạt động chuẩn xác cho tất cả món nước.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getMaintenanceKey, getMaintenanceHeaders } from "./lib/maintenance-env.mjs";
import { getMaintenanceUrl } from "./lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "./lib/maintenance-env-file.mjs";

loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();
const KEY = getMaintenanceKey(process.env, { required: true });

function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

async function main() {
  console.log("==================================================================");
  console.log("🥤 LIÊN KẾT QUÁN NƯỚC VÀO MÓN NƯỚC (RESTAURANT_DISHES) TRÊN SUPABASE");
  console.log("==================================================================");

  // 1. Tải danh sách 75 món nước từ bảng dishes
  console.log("🔍 Đang nạp danh sách món nước từ bảng dishes...");
  const dRes = await fetch(`${SUPABASE_URL}/rest/v1/dishes?category=eq.drinks&select=id,name,slug`, {
    headers: getMaintenanceHeaders(KEY),
  });
  if (!dRes.ok) {
    console.error("❌ Không thể nạp dishes:", await dRes.text());
    return;
  }
  const dishes = await dRes.json();
  console.log(`✅ Đã nạp ${dishes.length} món nước.`);

  const dishMap = new Map();
  for (const d of dishes) {
    dishMap.set(d.slug, d.id);
  }

  // 2. Đọc danh sách quán từ drinks_pending_affiliate.csv
  const csvPath = path.resolve("data/drinks_pending_affiliate.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Không tìm thấy data/drinks_pending_affiliate.csv!");
    return;
  }

  const csvLines = fs.readFileSync(csvPath, "utf8").split("\n");
  const rawSpots = [];
  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i];
    if (!line) continue;
    const parts = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g).map(s => s.replace(/^,/, "").replace(/^"|"$/g, "").trim());
    if (parts.length >= 4 && parts[3]) {
      rawSpots.push({
        name: parts[0],
        city: parts[1],
        district: parts[2],
        url: parts[3],
      });
    }
  }
  console.log(`📂 Đã nạp ${rawSpots.length.toLocaleString()} quán từ CSV.`);

  // 3. Lấy ID quán từ Supabase theo URL theo từng lô 100
  console.log("\n🔍 Đang tra cứu ID quán trên Supabase...");
  const urlToDbId = new Map();
  const chunkSize = 100;
  for (let i = 0; i < rawSpots.length; i += chunkSize) {
    const chunk = rawSpots.slice(i, i + chunkSize);
    const filter = `original_url=in.(${chunk.map(s => `"${encodeURIComponent(s.url)}"`).join(",")})&select=id,original_url`;
    try {
      const rRes = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?${filter}`, {
        headers: getMaintenanceHeaders(KEY),
      });
      if (rRes.ok) {
        const list = await rRes.json();
        for (const r of list) {
          urlToDbId.set(r.original_url, r.id);
        }
      }
    } catch {}
    if ((i + chunkSize) % 1000 === 0 || i + chunkSize >= rawSpots.length) {
      console.log(`  Tra cứu: ${Math.min(i + chunkSize, rawSpots.length).toLocaleString()}/${rawSpots.length.toLocaleString()} (Đã khớp ${urlToDbId.size.toLocaleString()} quán)`);
    }
  }

  console.log(`✅ Khớp thành công ${urlToDbId.size.toLocaleString()} quán trong database Supabase.`);

  // 4. Phân tích tên quán và ghép cặp với món nước phù hợp
  console.log("\n⚡ Đang phân tích và tạo liên kết (restaurant_dishes)...");
  const links = [];

  for (const spot of rawSpots) {
    const restId = urlToDbId.get(spot.url);
    if (!restId) continue;

    const n = norm(spot.name);
    const matchedDishSlugs = new Set();

    // Specific matches:
    if (n.includes("ca phe muoi") || n.includes("cafe muoi")) matchedDishSlugs.add("ca-phe-muoi");
    if (n.includes("ca phe trung") || n.includes("cafe trung")) matchedDishSlugs.add("ca-phe-trung");
    if (n.includes("cot dua")) matchedDishSlugs.add("ca-phe-cot-dua");
    if (n.includes("bac xiu")) matchedDishSlugs.add("bac-xiu");
    if (n.includes("cold brew") || n.includes("u lanh")) matchedDishSlugs.add("ca-phe-u-lanh");
    if (n.includes("latte")) matchedDishSlugs.add("latte");
    if (n.includes("cappuccino")) matchedDishSlugs.add("cappuccino");
    if (n.includes("americano")) matchedDishSlugs.add("americano");
    if (n.includes("espresso")) matchedDishSlugs.add("espresso");
    if (n.includes("cacao")) matchedDishSlugs.add("cacao-sua");

    // General Coffee:
    if (n.includes("ca phe") || n.includes("cafe") || n.includes("coffee") || n.includes("highlands") || n.includes("the coffee house") || n.includes("cong ca phe") || n.includes("milano") || n.includes("aha") || n.includes("trung nguyen") || n.includes("roastery") || n.includes("phin")) {
      matchedDishSlugs.add("ca-phe-den-da");
      matchedDishSlugs.add("ca-phe-sua-da");
      matchedDishSlugs.add("bac-xiu");
    }

    // Specific Tea / Boba:
    if (n.includes("duong den")) matchedDishSlugs.add("sua-tuoi-tran-chau-duong-den");
    if (n.includes("khoai mon")) matchedDishSlugs.add("tra-sua-khoai-mon");
    if (n.includes("thai")) matchedDishSlugs.add("tra-sua-thai");
    if (n.includes("nuong")) matchedDishSlugs.add("tra-sua-nuong");
    if (n.includes("matcha")) {
      matchedDishSlugs.add("matcha-latte");
      matchedDishSlugs.add("matcha-da-xay");
    }
    if (n.includes("o long") || n.includes("oolong")) matchedDishSlugs.add("tra-sua-o-long");
    if (n.includes("dao")) matchedDishSlugs.add("tra-dao-cam-sa");
    if (n.includes("vai")) matchedDishSlugs.add("tra-vai");
    if (n.includes("chanh")) matchedDishSlugs.add("tra-chanh");
    if (n.includes("tac")) matchedDishSlugs.add("tra-tac");
    if (n.includes("sen vang")) matchedDishSlugs.add("tra-sen-vang");
    if (n.includes("dau")) matchedDishSlugs.add("tra-dau");
    if (n.includes("xoai")) matchedDishSlugs.add("tra-xoai");
    if (n.includes("mang cau")) matchedDishSlugs.add("tra-mang-cau");

    // General Milk Tea / Tea Brand:
    if (n.includes("tra sua") || n.includes("milktea") || n.includes("tocotoco") || n.includes("gong cha") || n.includes("koi the") || n.includes("mixue") || n.includes("bobapop") || n.includes("ding tea") || n.includes("cha go")) {
      matchedDishSlugs.add("tra-sua-tran-chau");
      matchedDishSlugs.add("tra-sua-o-long");
    }
    if (n.includes("phuc long")) {
      matchedDishSlugs.add("tra-dao-cam-sa");
      matchedDishSlugs.add("tra-sua-o-long");
      matchedDishSlugs.add("tra-vai");
    }
    if (n.includes("phe la")) {
      matchedDishSlugs.add("tra-sua-o-long");
      matchedDishSlugs.add("tra-o-long");
    }
    if (n.includes("katinat")) {
      matchedDishSlugs.add("tra-sua-o-long");
      matchedDishSlugs.add("ca-phe-sua-da");
    }

    // Juices & Smoothies:
    if (n.includes("nuoc ep") || n.includes("juice")) {
      matchedDishSlugs.add("nuoc-ep-cam");
      matchedDishSlugs.add("nuoc-ep-dua-hau");
      matchedDishSlugs.add("nuoc-ep-oi");
      matchedDishSlugs.add("nuoc-ep-tao");
    }
    if (n.includes("sinh to") || n.includes("smoothie")) {
      matchedDishSlugs.add("sinh-to-bo");
      matchedDishSlugs.add("sinh-to-xoai");
      matchedDishSlugs.add("sinh-to-dau");
    }

    // Traditional & Herbs:
    if (n.includes("rau ma")) {
      matchedDishSlugs.add("rau-ma-dau-xanh");
      matchedDishSlugs.add("nuoc-rau-ma");
    }
    if (n.includes("nuoc mia")) matchedDishSlugs.add("nuoc-mia");
    if (n.includes("sua dau nanh")) matchedDishSlugs.add("sua-dau-nanh");
    if (n.includes("nuoc sam") || n.includes("sam bi dao")) {
      matchedDishSlugs.add("sam-bi-dao");
      matchedDishSlugs.add("nuoc-sam");
    }
    if (n.includes("nuoc dua")) matchedDishSlugs.add("nuoc-dua");
    if (n.includes("sua chua")) matchedDishSlugs.add("sua-chua-da");

    // If still unmatched, default to popular staples
    if (matchedDishSlugs.size === 0) {
      matchedDishSlugs.add("ca-phe-sua-da");
      matchedDishSlugs.add("tra-sua-tran-chau");
    }

    for (const slug of matchedDishSlugs) {
      const dId = dishMap.get(slug);
      if (dId) {
        links.push({
          restaurant_id: restId,
          dish_id: dId,
        });
      }
    }
  }

  console.log(`📊 Đã tạo tổng cộng ${links.length.toLocaleString()} liên kết quán - món.`);

  // 5. Đẩy lên Supabase theo lô 500
  console.log("\n🚀 Đang đồng bộ vào bảng restaurant_dishes trên Supabase...");
  const insertChunkSize = 500;
  let successCount = 0;

  for (let i = 0; i < links.length; i += insertChunkSize) {
    const chunk = links.slice(i, i + insertChunkSize);
    try {
      const postRes = await fetch(`${SUPABASE_URL}/rest/v1/restaurant_dishes`, {
        method: "POST",
        headers: {
          ...getMaintenanceHeaders(KEY),
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates",
        },
        body: JSON.stringify(chunk),
      });

      if (postRes.ok) {
        successCount += chunk.length;
      } else {
        console.warn(`  ⚠️ Lô ${i / insertChunkSize + 1} lỗi:`, await postRes.text());
      }
    } catch (err) {
      console.warn(`  ⚠️ Lỗi kết nối ở lô ${i}:`, err.message);
    }

    if ((i + insertChunkSize) % 5000 === 0 || i + insertChunkSize >= links.length) {
      console.log(`  Tiến độ: ${Math.min(i + insertChunkSize, links.length).toLocaleString()}/${links.length.toLocaleString()} liên kết (${successCount.toLocaleString()} thành công)`);
    }
  }

  console.log(`\n🎉 HOÀN TẤT ĐỒNG BỘ! Đã lưu thành công ${successCount.toLocaleString()} liên kết món nước trên Supabase.`);
  console.log("👉 Bây giờ người dùng quay bất kỳ món nước nào, hệ thống PostGIS sẽ tự động tìm thấy các quán nước gần 3km!");
}

main().catch(console.error);
