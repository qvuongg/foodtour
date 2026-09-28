#!/usr/bin/env node
/**
 * Công cụ Nhập Link Affiliate ShopeeFood từ CSV vào Supabase
 *
 * Cách dùng:
 * 1. Mở file data/crawler_urls_pending_affiliate.csv
 * 2. Điền link rút gọn (https://shope.ee/... hoặc https://s.shopee.vn/...) vào cột cuối
 * 3. Chạy lệnh:
 *    node scripts/import-affiliate-csv.mjs
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

function cleanUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const u = new URL(rawUrl);
    return `${u.origin}${u.pathname}`.toLowerCase();
  } catch {
    return rawUrl.toLowerCase();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => a.startsWith("--file="));
  const rawFile = fileArg ? fileArg.split("=")[1].trim() : "data/crawler_urls_pending_affiliate.csv";
  const csvPath = path.resolve(rawFile);

  if (!fs.existsSync(csvPath)) {
    console.log(`❌ Không tìm thấy file: ${csvPath}`);
    return;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local!");
    return;
  }

  console.log(`📂 Đang đọc file CSV: ${path.basename(csvPath)}...`);
  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content.split("\n");

  const updates = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Phân tích linh hoạt mọi cột CSV (hỗ trợ cả file 5 cột và file 7 cột)
    const cells = [];
    const cellRegex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    let m;
    while ((m = cellRegex.exec(line)) !== null) {
      cells.push((m[1] ? m[1].replace(/""/g, '"') : m[2] || "").trim());
    }

    const originalUrl = cells.find(
      (c) => c.includes("shopeefood.vn") && !c.includes("shope.ee") && !c.includes("s.shopee.vn")
    );
    const affiliateUrl = cells.find(
      (c) => (c.includes("shope.ee") || c.includes("s.shopee.vn")) && c.startsWith("http")
    );

    if (originalUrl && affiliateUrl) {
      updates.push({ original_url: originalUrl, affiliate_url: affiliateUrl });
    }
  }

  if (updates.length === 0) {
    console.log("ℹ️ Chưa có dòng nào được điền link affiliate trong CSV.");
    console.log("👉 Hãy điền link https://shope.ee/... vào cột thứ 5 trong file CSV rồi chạy lại nhé!");
    return;
  }

  console.log(`🚀 Tìm thấy ${updates.length} link affiliate cần cập nhật vào Supabase...`);

  let successCount = 0;
  const CHUNK_SIZE = 10;
  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (item) => {
        try {
          const cUrl = cleanUrl(item.original_url);
          const pathOnly = cUrl.replace(/^https?:\/\/[^/]+/, "");
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/restaurants?original_url=ilike.*${encodeURIComponent(pathOnly)}*`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                affiliate_url: item.affiliate_url,
              }),
            },
          );

          if (res.ok) {
            successCount++;
          }
        } catch (err) {
          console.warn("⚠️ Lỗi cập nhật quán:", item.original_url, err.message);
        }
      })
    );
  }

  console.log(`🎉 Đã cập nhật thành công ${successCount}/${updates.length} link affiliate lên Supabase!`);
}

main().catch(console.error);
