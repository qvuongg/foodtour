#!/usr/bin/env node
/**
 * Xuất danh sách Quán Ăn Hàng Đầu (Top Reviews & Rating) để ưu tiên tạo link Affiliate trước
 *
 * Cách dùng:
 * node scripts/export-top-affiliate-batch.mjs --limit=100
 * node scripts/export-top-affiliate-batch.mjs --limit=300 --city=da-nang
 */

import * as fs from "node:fs";
import * as path from "node:path";

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
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 100;
  
  const cityArg = args.find(a => a.startsWith("--city="));
  const city = cityArg ? cityArg.split("=")[1].trim() : null;

  let queryUrl = `${SUPABASE_URL}/rest/v1/restaurants?affiliate_url=is.null&select=name,city,district,original_url,rating,rating_count&order=rating_count.desc,rating.desc&limit=${limit}`;
  if (city) {
    queryUrl += `&city=eq.${city}`;
  }

  console.log(`🔍 Đang truy vấn Top ${limit} quán ăn nổi tiếng nhất${city ? ` tại [${city}]` : ""} chưa có link affiliate...`);
  const res = await fetch(queryUrl, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
    }
  });

  if (!res.ok) {
    console.error("❌ Lỗi truy vấn Supabase:", res.status, await res.text());
    return;
  }

  const spots = await res.json();
  console.log(`✅ Tìm thấy ${spots.length} quán hàng đầu.`);

  const outFile = path.resolve(`data/top_${limit}_restaurants_to_affiliate${city ? `_${city}` : ""}.csv`);
  const header = "Tên Quán,Thành Phố,Quận,Đánh Giá,Số Lượng Đánh Giá,Link ShopeeFood Gốc,Link Affiliate shope.ee (Điền vào đây)\n";
  const rows = spots.map(s => `"${s.name.replace(/"/g, '""')}","${s.city}","${s.district || ''}","${s.rating}","${s.rating_count}","${s.original_url}",""`);
  
  fs.writeFileSync(outFile, header + rows.join("\n") + "\n", "utf8");
  console.log(`📁 Đã xuất danh sách ưu tiên ra file: ${outFile}`);
  console.log(`👉 Bạn chỉ cần copy cột Link Gốc ném vào Shopee Affiliate Portal để xuất link rút gọn hàng loạt trong 2 phút!`);
}

main().catch(console.error);
