#!/usr/bin/env node
/**
 * Script đẩy 40 món ăn mới vào bảng `dishes` trên Supabase
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getMaintenanceKey, getMaintenanceHeaders } from "./lib/maintenance-env.mjs";
import { getMaintenanceUrl } from "./lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "./lib/maintenance-env-file.mjs";

loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();
const KEY = getMaintenanceKey(process.env, { required: true });

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

// 40 món mới
const NEW_DISHES = [
  // 16 món ẩm thực Á (168-183)
  { name: "Cơm đậu hũ Mapo", category: "lunch" },
  { name: "Cơm gà Kung Pao", category: "lunch" },
  { name: "Mì Dan Dan Tứ Xuyên", category: "lunch" },
  { name: "Cháo thịt nạc trứng bắc thảo", category: "breakfast" },
  { name: "Cơm heo xào cay Jeyuk", category: "lunch" },
  { name: "Gà hầm sâm Samgyetang", category: "dinner" },
  { name: "Canh sườn bò Galbitang kèm cơm", category: "dinner" },
  { name: "Mì Kalguksu hải sản", category: "lunch" },
  { name: "Cơm cuộn trứng Omurice", category: "lunch" },
  { name: "Cơm heo xào gừng Shogayaki", category: "lunch" },
  { name: "Cơm thịt băm Hambagu", category: "lunch" },
  { name: "Cơm trà cá hồi Ochazuke", category: "lunch" },
  { name: "Masala dosa", category: "breakfast" },
  { name: "Chole bhature", category: "lunch" },
  { name: "Palak paneer kèm cơm", category: "lunch" },
  { name: "Gà tandoori kèm naan", category: "dinner" },

  // 24 món Bữa sáng / Xế / Đêm / Tối nhóm (600-623)
  { name: "Bánh mì trứng", category: "breakfast" },
  { name: "Xôi xéo", category: "breakfast" },
  { name: "Xôi bắp", category: "breakfast" },
  { name: "Xôi đậu xanh", category: "breakfast" },
  { name: "Bánh bao nhân thịt", category: "breakfast" },
  { name: "Bánh giò nóng", category: "breakfast" },
  { name: "Bánh ướt chả lụa", category: "breakfast" },
  { name: "Bánh bao chay", category: "breakfast" },
  { name: "Cháo trắng ăn kèm", category: "late" },
  { name: "Cháo ếch", category: "late" },
  { name: "Miến ngan", category: "late" },
  { name: "Mì trộn trứng xúc xích", category: "late" },
  { name: "Lẩu Thái hải sản", category: "dinner" },
  { name: "Lẩu bò ăn nhóm", category: "dinner" },
  { name: "Lẩu gà lá é", category: "dinner" },
  { name: "Lẩu riêu cua bắp bò", category: "dinner" },
  { name: "Lẩu cá", category: "dinner" },
  { name: "Lẩu dê", category: "dinner" },
  { name: "Nướng Hàn Quốc", category: "dinner" },
  { name: "Nướng Nhật Yakiniku", category: "dinner" },
  { name: "Buffet lẩu", category: "dinner" },
  { name: "Buffet nướng", category: "dinner" },
  { name: "Hải sản hấp nướng", category: "dinner" },
  { name: "Gà mẹt", category: "dinner" },
];

async function syncNewDishes() {
  console.log(`📡 Đang kết nối tới Supabase: ${SUPABASE_URL}`);

  // 1. Lấy danh sách món hiện có
  const res = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=id,slug,name`, {
    headers: {
      ...getMaintenanceHeaders(KEY),
    },
  });

  if (!res.ok) {
    console.error(`❌ Không thể truy vấn bảng dishes! Mã lỗi: ${res.status}`);
    process.exit(1);
  }

  const existingDishes = await res.json();
  const existingSlugs = new Set(existingDishes.map((d) => d.slug));
  const existingNames = new Set(existingDishes.map((d) => d.name.toLowerCase().trim()));

  console.log(`📦 Đang có ${existingDishes.length} món trong bảng dishes.`);

  // 2. Lọc ra các món chưa có
  const toInsert = [];
  for (const item of NEW_DISHES) {
    const slug = slugify(item.name);
    if (!existingSlugs.has(slug) && !existingNames.has(item.name.toLowerCase().trim())) {
      toInsert.push({
        slug,
        name: item.name,
        category: item.category,
      });
    }
  }

  if (toInsert.length === 0) {
    console.log("✅ Tất cả 40 món đã có mặt trên Supabase! Không cần thêm mới.");
    return;
  }

  console.log(`🚀 Bắt đầu đẩy ${toInsert.length} món mới lên Supabase...`);

  // 3. Insert theo batch
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/dishes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getMaintenanceHeaders(KEY),
      Prefer: "return=representation",
    },
    body: JSON.stringify(toInsert),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    console.error(`❌ Lỗi khi thêm món vào Supabase (${insertRes.status}):`, errText);
    process.exit(1);
  }

  const inserted = await insertRes.json();
  console.log(`🎉 Đã thêm thành công ${inserted.length} món mới vào Supabase:`);
  for (const d of inserted) {
    console.log(`   ✨ [ID ${d.id}] ${d.name} (${d.slug}) - Nhóm: ${d.category}`);
  }

  // 4. Kiểm tra tổng số món hiện tại
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=id`, {
    headers: {
      ...getMaintenanceHeaders(KEY),
      Range: "0-0",
      Prefer: "count=exact",
    },
  });
  console.log(`\n📊 Tổng số món hiện tại trên Supabase: ${countRes.headers.get("content-range")?.split("/")[1]} món.`);
}

syncNewDishes().catch(console.error);
