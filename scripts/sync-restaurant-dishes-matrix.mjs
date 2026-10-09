#!/usr/bin/env node
/**
 * scripts/sync-restaurant-dishes-matrix.mjs
 *
 * Script thông minh đồng bộ ma trận liên kết giữa các quán ăn và món ăn vào bảng `public.restaurant_dishes`.
 * Mục tiêu: Giải quyết dứt điểm 10,966 quán mồ côi (chưa có liên kết món) trên Supabase,
 * đặc biệt là phủ sóng toàn bộ 75 món nước và các chuỗi thương hiệu lớn.
 *
 * Cách dùng:
 *   node scripts/sync-restaurant-dishes-matrix.mjs --dry-run
 *   node scripts/sync-restaurant-dishes-matrix.mjs
 *   node scripts/sync-restaurant-dishes-matrix.mjs --batch-size=200
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getMaintenanceKey, getMaintenanceHeaders } from "./lib/maintenance-env.mjs";
import { getMaintenanceUrl } from "./lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "./lib/maintenance-env-file.mjs";

loadMaintenanceEnvFile();

const SUPABASE_URL = getMaintenanceUrl();
const KEY = getMaintenanceKey(process.env, { required: true });

function norm(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

// 1. Ánh xạ Menu thực tế của 10 Thương hiệu lớn (Brand Catalog)
const BRAND_MENU_SLUGS = {
  highlands: [
    "ca-phe-den-da", "ca-phe-sua-da", "bac-xiu", "espresso",
    "americano", "latte", "cappuccino", "tra-sen-vang", "tra-dao-cam-sa"
  ],
  phuclong: [
    "tra-dao-cam-sa", "tra-vai", "tra-sua-o-long", "ca-phe-sua-da",
    "hong-tra", "tra-xanh", "tra-nhan-sen", "tra-lai"
  ],
  phela: [
    "tra-sua-o-long", "tra-o-long", "ca-phe-cot-dua", "ca-phe-sua-da", "hojicha-latte"
  ],
  mixue: [
    "tra-sua-tran-chau", "tra-chanh", "tra-dao-cam-sa", "tra-xoai", "nuoc-chanh"
  ],
  tocotoco: [
    "tra-sua-tran-chau", "tra-sua-khoai-mon", "sua-tuoi-tran-chau-duong-den",
    "tra-sua-thai", "tra-sua-o-long"
  ],
  starbucks: [
    "latte", "cappuccino", "espresso", "americano", "ca-phe-u-lanh", "matcha-latte", "hojicha-latte"
  ],
  katinat: [
    "tra-sua-o-long", "ca-phe-sua-da", "bac-xiu", "tra-dao-cam-sa", "sinh-to-bo"
  ],
  congcaphe: [
    "ca-phe-cot-dua", "ca-phe-den-da", "ca-phe-sua-da", "ca-phe-trung", "bac-xiu"
  ],
  gongcha: [
    "tra-sua-tran-chau", "tra-sua-o-long", "tra-xanh", "tra-xoai", "matcha-latte", "hojicha-latte"
  ],
  koithe: [
    "tra-sua-tran-chau", "tra-sua-o-long", "hong-tra", "tra-xanh"
  ],
};

function getBrandFromText(nText) {
  if (nText.includes("highlands")) return "highlands";
  if (nText.includes("phuc long")) return "phuclong";
  if (nText.includes("phe la")) return "phela";
  if (nText.includes("mixue")) return "mixue";
  if (nText.includes("tocotoco") || nText.includes("toco toco")) return "tocotoco";
  if (nText.includes("starbucks")) return "starbucks";
  if (nText.includes("katinat")) return "katinat";
  if (nText.includes("cong ca phe") || nText.includes("cong cafe")) return "congcaphe";
  if (nText.includes("gong cha") || nText.includes("gongcha")) return "gongcha";
  if (nText.includes("koi the") || nText.includes("koi thé")) return "koithe";
  return null;
}

// 2. Hàm suy luận danh sách món từ tên quán độc lập
function inferDishesForRestaurant(name, url = "") {
  const n = norm(name + " " + url);
  const matchedSlugs = new Set();

  // 2.1. Kiểm tra 10 thương hiệu lớn
  const brandKey = getBrandFromText(n);
  if (brandKey && BRAND_MENU_SLUGS[brandKey]) {
    for (const slug of BRAND_MENU_SLUGS[brandKey]) {
      matchedSlugs.add(slug);
    }
    return Array.from(matchedSlugs);
  }

  // 2.2. Nhóm Cà phê & Cafe
  if (
    n.includes("ca phe") || n.includes("cafe") || n.includes("coffee") ||
    n.includes("roastery") || n.includes("phin") || n.includes("milano") ||
    n.includes("aha") || n.includes("trung nguyen") || n.includes("the coffee house")
  ) {
    matchedSlugs.add("ca-phe-den-da");
    matchedSlugs.add("ca-phe-sua-da");
    matchedSlugs.add("bac-xiu");

    if (n.includes("muoi")) matchedSlugs.add("ca-phe-muoi");
    if (n.includes("trung")) matchedSlugs.add("ca-phe-trung");
    if (n.includes("cot dua")) matchedSlugs.add("ca-phe-cot-dua");
    if (n.includes("cold brew") || n.includes("u lanh")) matchedSlugs.add("ca-phe-u-lanh");
    if (n.includes("espresso")) matchedSlugs.add("espresso");
    if (n.includes("latte")) matchedSlugs.add("latte");
    if (n.includes("cappuccino")) matchedSlugs.add("cappuccino");
    if (n.includes("americano")) matchedSlugs.add("americano");
    if (n.includes("cacao")) {
      matchedSlugs.add("cacao-sua");
      matchedSlugs.add("cacao-kem-muoi");
    }
  }

  // 2.3. Nhóm Trà Sữa & Milk Tea & Boba
  if (
    n.includes("tra sua") || n.includes("milktea") || n.includes("boba") ||
    n.includes("ding tea") || n.includes("bobapop") || n.includes("chago") ||
    n.includes("do do") || n.includes("dau dau") || n.includes("hidu") ||
    n.includes("tra tien huong") || n.includes("tealive")
  ) {
    matchedSlugs.add("tra-sua-tran-chau");
    matchedSlugs.add("tra-sua-o-long");
    matchedSlugs.add("tra-sua-lai");
    matchedSlugs.add("tra-sua-tra-xanh");
    matchedSlugs.add("tra-sua-khoai-mon");
    matchedSlugs.add("hong-tra");
    matchedSlugs.add("tra-xanh");

    if (n.includes("duong den") || n.includes("sua tuoi tran chau")) {
      matchedSlugs.add("sua-tuoi-tran-chau-duong-den");
    }
    if (n.includes("thai")) matchedSlugs.add("tra-sua-thai");
    if (n.includes("nuong")) matchedSlugs.add("tra-sua-nuong");
    if (n.includes("matcha")) {
      matchedSlugs.add("matcha-latte");
      matchedSlugs.add("matcha-latte-dau");
      matchedSlugs.add("matcha-da-xay");
    }
    if (n.includes("hojicha")) matchedSlugs.add("hojicha-latte");
  }

  // 2.4. Nhóm Trà Trái Cây & Trà Chanh
  if (
    n.includes("tiem tra") || n.includes("tra trai cay") || n.includes("tra hoa qua") ||
    n.includes("tra chanh") || n.includes("tra tac") || n.includes("tra dao")
  ) {
    matchedSlugs.add("tra-dao-cam-sa");
    matchedSlugs.add("tra-vai");
    matchedSlugs.add("tra-chanh");
    matchedSlugs.add("tra-tac");
    matchedSlugs.add("tra-mang-cau");
    matchedSlugs.add("tra-xoai");
    matchedSlugs.add("tra-dau");
    matchedSlugs.add("nuoc-chanh");
    matchedSlugs.add("nuoc-chanh-day");

    if (n.includes("sen")) matchedSlugs.add("tra-sen-vang");
    if (n.includes("nhan")) matchedSlugs.add("tra-nhan-sen");
  }

  // 2.5. Nhóm Sinh Tố & Nước Ép & Detox
  if (
    n.includes("sinh to") || n.includes("nuoc ep") || n.includes("juice") ||
    n.includes("smoothie") || n.includes("detox") || n.includes("trai cay")
  ) {
    matchedSlugs.add("nuoc-ep-cam");
    matchedSlugs.add("nuoc-ep-dua-hau");
    matchedSlugs.add("nuoc-ep-oi");
    matchedSlugs.add("nuoc-ep-tao");
    matchedSlugs.add("nuoc-ep-ca-rot");
    matchedSlugs.add("nuoc-ep-dua");
    matchedSlugs.add("nuoc-ep-buoi");
    matchedSlugs.add("nuoc-chanh-day");
    matchedSlugs.add("sinh-to-bo");
    matchedSlugs.add("sinh-to-xoai");
    matchedSlugs.add("sinh-to-dau");
    matchedSlugs.add("sinh-to-mang-cau");
    matchedSlugs.add("sinh-to-chuoi");
    matchedSlugs.add("sinh-to-sapoche");
    matchedSlugs.add("sinh-to-dua-gang");
    if (n.includes("coc")) matchedSlugs.add("nuoc-ep-coc");
  }

  // 2.6. Nhóm Giải Khát & Nước Truyền Thống
  if (n.includes("rau ma")) {
    matchedSlugs.add("nuoc-rau-ma");
    matchedSlugs.add("rau-ma-dau-xanh");
  }
  if (n.includes("nuoc mia") || n.includes("mia sieu sach")) matchedSlugs.add("nuoc-mia");
  if (n.includes("nuoc dua") || n.includes("dua tuoi")) matchedSlugs.add("nuoc-dua");
  if (n.includes("sam") || n.includes("bi dao")) {
    matchedSlugs.add("nuoc-sam");
    matchedSlugs.add("sam-bi-dao");
  }
  if (n.includes("sua dau") || n.includes("dau nanh") || n.includes("sua hat")) {
    matchedSlugs.add("sua-dau-nanh");
    matchedSlugs.add("sua-dau-xanh-cot-dua");
    matchedSlugs.add("sua-hat-sen-me-den");
  }
  if (n.includes("sua chua") || n.includes("yogurt")) {
    matchedSlugs.add("sua-chua-da");
    matchedSlugs.add("sua-chua-viet-quat");
    matchedSlugs.add("sua-chua-chanh-day");
  }
  if (n.includes("soda")) {
    matchedSlugs.add("soda-chanh");
    matchedSlugs.add("soda-dau");
    matchedSlugs.add("soda-viet-quat");
  }
  if (n.includes("nuoc mo") || n.includes(" tra mo ") || n.includes("mo ngam")) matchedSlugs.add("nuoc-mo");
  if (n.includes("nuoc sau") || n.includes(" tra sau ") || n.includes("sau ngam")) matchedSlugs.add("nuoc-sau");
  if (n.includes("chanh muoi")) matchedSlugs.add("nuoc-chanh-muoi");
  if (n.includes("chanh day") || n.includes("chanh leo")) matchedSlugs.add("nuoc-chanh-day");
  if (n.includes("da xay") || n.includes("ice blended")) {
    matchedSlugs.add("matcha-da-xay");
    matchedSlugs.add("so-co-la-da-xay");
    matchedSlugs.add("banh-quy-kem-da-xay");
  }

  // Quán cafe & giải khát tổng hợp thường có chanh muối, nước lọc, đá xay
  if (n.includes("ca phe") || n.includes("cafe") || n.includes("coffee")) {
    matchedSlugs.add("nuoc-chanh-muoi");
    matchedSlugs.add("nuoc-loc-dong-chai");
    if (n.includes("ha-noi") || n.includes("hanoi")) {
      matchedSlugs.add("nuoc-sau");
      matchedSlugs.add("nuoc-mo");
    }
  }
  if (n.includes("chanh day") || n.includes("chanh leo")) matchedSlugs.add("nuoc-chanh-day");
  if (n.includes("da xay") || n.includes("ice blended")) {
    matchedSlugs.add("matcha-da-xay");
    matchedSlugs.add("so-co-la-da-xay");
    matchedSlugs.add("banh-quy-kem-da-xay");
  }

  // 2.7. Nhóm Cơm & Bữa Chính (Food Categories)
  if (n.includes("com tam")) {
    matchedSlugs.add("com-tam");
  } else if (n.includes("com ga")) {
    matchedSlugs.add("com-ga-xoi-mo");
    matchedSlugs.add("com-ga-hoi-an");
  } else if (n.includes("com rang") || n.includes("com chien")) {
    matchedSlugs.add("com-rang-dua-bo");
  } else if (n.includes("com nieu")) {
    matchedSlugs.add("com-nieu-singapore");
  } else if (n.includes("com van phong") || n.includes("com phan") || n.includes("com binh dan") || n.includes("com que")) {
    matchedSlugs.add("com-binh-dan");
    matchedSlugs.add("com-tam");
  } else if (n.includes("com chay") || n.includes("quan chay") || n.includes("thuan chay")) {
    matchedSlugs.add("com-chay");
  } else if (n.includes("com ca ri")) {
    matchedSlugs.add("com-ca-ri-nhat");
  }

  // 2.8. Nhóm Bún / Phở / Mì / Sợi
  if (n.includes("pho bo")) {
    matchedSlugs.add("pho-bo");
  } else if (n.includes("pho ga")) {
    matchedSlugs.add("pho-ga");
  } else if (n.includes("pho cuốn")) {
    matchedSlugs.add("pho-cuon");
  } else if (n.includes("pho ") || n.startsWith("pho-") || n.includes("phở")) {
    matchedSlugs.add("pho-bo");
    matchedSlugs.add("pho-ga");
  }

  if (n.includes("bun bo hue") || n.includes("bun bo")) {
    matchedSlugs.add("bun-bo-hue");
  } else if (n.includes("bun cha")) {
    matchedSlugs.add("bun-cha");
  } else if (n.includes("bun dau")) {
    matchedSlugs.add("bun-dau-mam-tom");
  } else if (n.includes("bun rieu")) {
    matchedSlugs.add("bun-rieu");
  } else if (n.includes("bun ca")) {
    matchedSlugs.add("bun-ca");
  } else if (n.includes("bun thit nuong")) {
    matchedSlugs.add("bun-thit-nuong");
  } else if (n.includes("bun mam")) {
    matchedSlugs.add("bun-mam");
  } else if (n.includes("bun moc")) {
    matchedSlugs.add("bun-moc");
  } else if (n.includes("bun mang vit") || (n.includes("bun") && n.includes("vit"))) {
    matchedSlugs.add("bun-mang-vit");
  }

  if (n.includes("banh canh cua")) {
    matchedSlugs.add("banh-canh-cua");
  } else if (n.includes("banh canh")) {
    matchedSlugs.add("banh-canh-cua");
    matchedSlugs.add("banh-canh-gio-heo");
  } else if (n.includes("hu tieu")) {
    matchedSlugs.add("hu-tieu");
  } else if (n.includes("mi quang")) {
    matchedSlugs.add("mi-quang");
  } else if (n.includes("banh da cua")) {
    matchedSlugs.add("banh-da-cua");
  } else if (n.includes("mi cay")) {
    matchedSlugs.add("mi-cay-han-quoc");
  } else if (n.includes("mi vit tiem") || (n.includes("mi") && n.includes("vit"))) {
    matchedSlugs.add("mi-vit-tiem");
  } else if (n.includes("hoanh thanh") || n.includes("sui cao")) {
    matchedSlugs.add("mi-hoanh-thanh");
  } else if (n.includes("mi xao")) {
    matchedSlugs.add("mi-xao-bo");
  } else if (n.includes("ramen")) {
    matchedSlugs.add("ramen");
  } else if (n.includes("udon")) {
    matchedSlugs.add("udon");
  } else if (n.includes("spaghetti") || n.includes("mi y")) {
    matchedSlugs.add("mi-y-bo-bam");
  }

  // 2.9. Bò bít tết & Bò né & Món Bò
  if (n.includes("bit tet") || n.includes("beefsteak") || n.includes("steak")) {
    matchedSlugs.add("bo-bit-tet");
  } else if (n.includes("bo ne")) {
    matchedSlugs.add("bo-ne");
  } else if (n.includes("bo luc lac")) {
    matchedSlugs.add("bo-luc-lac");
  } else if (n.includes("bo kho")) {
    matchedSlugs.add("bo-kho-banh-mi");
  }

  // 2.10. Vịt quay & Các món vịt
  if (n.includes("vit") || n.includes("ngan")) {
    matchedSlugs.add("com-vit-quay");
    matchedSlugs.add("mi-vit-tiem");
    matchedSlugs.add("bun-mang-vit");
    matchedSlugs.add("chao-vit");
    if (n.includes("ngan")) matchedSlugs.add("mien-ngan");
  }

  // 2.11. Bánh mì, Xôi & Bánh cuốn
  if (n.includes("banh mi chao")) {
    matchedSlugs.add("banh-mi-chao");
  } else if (n.includes("banh mi")) {
    matchedSlugs.add("banh-mi");
  } else if (n.includes("xoi xeo")) {
    matchedSlugs.add("xoi-xeo");
  } else if (n.includes("xoi ga") || n.includes("xoi")) {
    matchedSlugs.add("xoi-man");
    matchedSlugs.add("xoi-xeo");
  } else if (n.includes("banh cuon")) {
    matchedSlugs.add("banh-cuon");
  } else if (n.includes("banh xeo")) {
    matchedSlugs.add("banh-xeo");
  } else if (n.includes("banh hoi")) {
    matchedSlugs.add("banh-hoi-heo-quay");
  } else if (n.includes("banh gio")) {
    matchedSlugs.add("banh-gio-nong");
  } else if (n.includes("banh bao")) {
    matchedSlugs.add("banh-bao-nhan-thit");
  } else if (n.includes("banh uot")) {
    matchedSlugs.add("banh-uot-cha-lua");
  }

  // 2.12. Lẩu, Nướng & Hải Sản
  if (n.includes("lau thai") || n.includes("lau hai san")) {
    matchedSlugs.add("lau-thai-hai-san");
  } else if (n.includes("lau bo")) {
    matchedSlugs.add("lau-bo-an-nhom");
  } else if (n.includes("lau ga")) {
    matchedSlugs.add("lau-ga-la-e");
  } else if (n.includes("lau rieu")) {
    matchedSlugs.add("lau-rieu-cua-bap-bo");
  } else if (n.includes("lau ca")) {
    matchedSlugs.add("lau-ca");
  } else if (n.includes("lau de")) {
    matchedSlugs.add("lau-de");
  } else if (n.includes("buffet lau")) {
    matchedSlugs.add("buffet-lau");
  } else if (n.includes("lau")) {
    matchedSlugs.add("lau-thai-hai-san");
    matchedSlugs.add("lau-bo-an-nhom");
  }

  if (n.includes("nuong han quoc") || n.includes("korean bbq")) {
    matchedSlugs.add("nuong-han-quoc");
  } else if (n.includes("nuong nhat") || n.includes("yakiniku")) {
    matchedSlugs.add("nuong-nhat-yakiniku");
  } else if (n.includes("buffet nuong")) {
    matchedSlugs.add("buffet-nuong");
  } else if (n.includes("nuong") || n.includes("bbq")) {
    matchedSlugs.add("nuong-han-quoc");
    matchedSlugs.add("suon-nuong-bbq");
  }

  if (n.includes("hai san") || n.includes("oc ") || n.includes("cua ") || n.includes("tom ")) {
    matchedSlugs.add("hai-san-hap-nuong");
  }
  if (n.includes("ga ran") || n.includes("burger") || n.includes("kfc") || n.includes("lotteria") || n.includes("jollibee")) {
    matchedSlugs.add("ga-ran");
    matchedSlugs.add("burger-bo");
  }
  if (n.includes("pizza")) {
    matchedSlugs.add("pizza");
  }
  if (n.includes("sushi") || n.includes("sashimi")) {
    matchedSlugs.add("sushi-ca-hoi");
  }
  if (n.includes("dimsum")) {
    matchedSlugs.add("dimsum");
  }
  if (n.includes("nem nuong")) {
    matchedSlugs.add("nem-nuong");
  }
  if (n.includes("ga met") || n.includes("ga ta") || n.includes("manh hoach")) {
    matchedSlugs.add("ga-met");
    matchedSlugs.add("com-ga");
  }
  if (n.includes("mexican") || n.includes("taco") || n.includes("burrito")) {
    matchedSlugs.add("taco");
    matchedSlugs.add("burrito");
    matchedSlugs.add("quesadilla");
  }
  if (n.includes("ca hoi") || n.includes("ca tam")) {
    matchedSlugs.add("ca-hoi-ap-chao");
    matchedSlugs.add("sushi-ca-hoi");
  }
  if (n.includes("chao ech")) {
    matchedSlugs.add("chao-ech");
  } else if (n.includes("chao suon")) {
    matchedSlugs.add("chao-suon");
  } else if (n.includes("chao long")) {
    matchedSlugs.add("chao-long");
  } else if (n.includes("chao vit")) {
    matchedSlugs.add("chao-vit");
  } else if (n.includes("chao ga") || n.includes("chao")) {
    matchedSlugs.add("chao-ga");
  }
  if (n.includes("mien ga")) {
    matchedSlugs.add("mien-ga");
  } else if (n.includes("mien luon")) {
    matchedSlugs.add("mien-luon");
  } else if (n.includes("mien ngan")) {
    matchedSlugs.add("mien-ngan");
  }

  return Array.from(matchedSlugs);
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  let batchSize = 200;
  for (const a of args) {
    if (a.startsWith("--batch-size=")) {
      batchSize = parseInt(a.split("=")[1], 10) || 200;
    }
  }

  console.log("==================================================================");
  console.log("🔄 ĐỒNG BỘ MA TRẬN LIÊN KẾT NHÀ HÀNG - MÓN ĂN (RESTAURANT_DISHES)");
  console.log(`   Chế độ: ${isDryRun ? "🛡️ DRY-RUN (Chỉ kiểm tra, không ghi DB)" : "🚀 LIVE RUN (Ghi trực tiếp vào Supabase)"}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log("==================================================================");

  // 1. Tải danh mục món ăn (dishes)
  console.log("📥 Đang tải danh sách món ăn từ Supabase 'dishes'...");
  const dRes = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=id,slug,name,category`, {
    headers: getMaintenanceHeaders(KEY),
  });
  if (!dRes.ok) {
    console.error("❌ Lỗi tải bảng dishes:", await dRes.text());
    process.exit(1);
  }
  const dishes = await dRes.json();
  const slugToId = new Map(dishes.map((d) => [d.slug, d.id]));
  const idToDish = new Map(dishes.map((d) => [d.id, d]));
  console.log(`✅ Đã nạp ${dishes.length} món ăn (${dishes.filter(d => d.category === "drinks").length} món nước).`);

  // 2. Lấy danh sách ID các quán ĐÃ CÓ trong restaurant_dishes
  console.log("\n📥 Đang quét danh sách các quán đã liên kết trong 'restaurant_dishes'...");
  const linkedRestIds = new Set();
  let offset = 0;
  const fetchLimit = 1000;
  while (true) {
    const rdRes = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurant_dishes?select=restaurant_id&offset=${offset}&limit=${fetchLimit}`,
      { headers: getMaintenanceHeaders(KEY) }
    );
    if (!rdRes.ok) {
      console.error("❌ Lỗi tải restaurant_dishes:", await rdRes.text());
      break;
    }
    const data = await rdRes.json();
    for (const row of data) {
      linkedRestIds.add(row.restaurant_id);
    }
    if (data.length === 0) break;
    offset += data.length;
    if (data.length < fetchLimit) break;
    process.stdout.write(`  Đã quét ${linkedRestIds.size.toLocaleString()} quán đã liên kết...\r`);
  }
  console.log(`\n✅ Hiện có ${linkedRestIds.size.toLocaleString()} quán đã có liên kết món.`);

  // 3. Tải toàn bộ danh sách quán (restaurants) theo phân trang
  console.log("\n📥 Đang tải toàn bộ danh sách quán từ 'restaurants'...");
  const allRestaurants = [];
  offset = 0;
  while (true) {
    const rRes = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?select=id,name,city,original_url&offset=${offset}&limit=${fetchLimit}`,
      { headers: getMaintenanceHeaders(KEY) }
    );
    if (!rRes.ok) {
      console.error("❌ Lỗi tải bảng restaurants:", await rRes.text());
      break;
    }
    const data = await rRes.json();
    for (const r of data) {
      allRestaurants.push(r);
    }
    if (data.length === 0) break;
    offset += data.length;
    if (data.length < fetchLimit) break;
    process.stdout.write(`  Đã nạp ${allRestaurants.length.toLocaleString()} quán...\r`);
  }
  console.log(`\n✅ Tổng cộng có ${allRestaurants.length.toLocaleString()} quán trong database.`);

  // 4. Lọc ra các quán mồ côi (chưa có liên kết món)
  const orphanRestaurants = allRestaurants.filter((r) => !linkedRestIds.has(r.id));
  console.log(`🔍 Tìm thấy ${orphanRestaurants.length.toLocaleString()} quán MỒ CÔI (chưa có liên kết món).`);

  // 5. Phân tích và tạo ma trận liên kết
  console.log("\n⚡ Đang phân tích từ khóa và tạo liên kết mới...");
  const candidateLinks = [];
  const dishMatchStats = new Map();
  let matchedOrphansCount = 0;
  let unhandledOrphans = [];

  for (const rest of orphanRestaurants) {
    const matchedSlugs = inferDishesForRestaurant(rest.name, rest.original_url);
    if (matchedSlugs.length > 0) {
      matchedOrphansCount++;
      for (const slug of matchedSlugs) {
        const dishId = slugToId.get(slug);
        if (dishId) {
          candidateLinks.push({
            restaurant_id: rest.id,
            dish_id: dishId,
          });
          dishMatchStats.set(slug, (dishMatchStats.get(slug) || 0) + 1);
        }
      }
    } else {
      unhandledOrphans.push(rest);
    }
  }

  console.log("------------------------------------------------------------------");
  console.log(`📊 KẾT QUẢ PHÂN TÍCH:`);
  console.log(`   • Số quán mồ côi được ghép món thành công: ${matchedOrphansCount.toLocaleString()} / ${orphanRestaurants.length.toLocaleString()} (${((matchedOrphansCount / orphanRestaurants.length) * 100).toFixed(1)}%)`);
  console.log(`   • Số quán chưa nhận diện được: ${unhandledOrphans.length.toLocaleString()}`);
  console.log(`   • Tổng số liên kết mới sẽ tạo: ${candidateLinks.length.toLocaleString()}`);
  console.log("------------------------------------------------------------------");

  // Thống kê riêng cho 75 món nước
  console.log("\n🥤 THỐNG KÊ BỔ SUNG QUÁN CHO CÁC MÓN NƯỚC (DRINKS):");
  const drinkDishes = dishes.filter((d) => d.category === "drinks");
  let zeroBeforeCount = 0;
  let enrichedCount = 0;
  for (const d of drinkDishes) {
    const added = dishMatchStats.get(d.slug) || 0;
    if (added > 0) enrichedCount++;
    console.log(`   • [${d.slug}] ${d.name}: +${added.toLocaleString()} quán mới`);
  }
  console.log(`✅ Đã bổ sung quán mới cho ${enrichedCount} / ${drinkDishes.length} món nước.`);

  if (unhandledOrphans.length > 0) {
    console.log("\n🔍 Mẫu 5 quán chưa nhận diện được:");
    for (const u of unhandledOrphans.slice(0, 5)) {
      console.log(`   - [${u.id}] ${u.name} (${u.city})`);
    }
  }

  // 6. Thực thi ghi vào Supabase nếu không phải Dry-run
  if (isDryRun) {
    console.log("\n🛡️ CHẾ ĐỘ DRY-RUN HOÀN TẤT: Không có dữ liệu nào bị thay đổi.");
    console.log("👉 Chạy lệnh sau để ghi trực tiếp vào Supabase:");
    console.log("   node scripts/sync-restaurant-dishes-matrix.mjs");
    return;
  }

  console.log(`\n🚀 Bắt đầu ghi ${candidateLinks.length.toLocaleString()} liên kết vào 'restaurant_dishes' theo từng lô ${batchSize}...`);
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < candidateLinks.length; i += batchSize) {
    const batch = candidateLinks.slice(i, i + batchSize);
    let attempts = 0;
    let ok = false;

    while (attempts < 3 && !ok) {
      attempts++;
      try {
        const postRes = await fetch(`${SUPABASE_URL}/rest/v1/restaurant_dishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getMaintenanceHeaders(KEY),
            Prefer: "resolution=ignore-duplicates",
          },
          body: JSON.stringify(batch),
        });

        if (postRes.ok) {
          ok = true;
          successCount += batch.length;
        } else {
          const errText = await postRes.text();
          console.warn(`  ⚠️ Batch ${Math.floor(i / batchSize) + 1} lỗi (thử lại ${attempts}/3):`, errText);
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      } catch (err) {
        console.warn(`  ⚠️ Batch ${Math.floor(i / batchSize) + 1} lỗi mạng (thử lại ${attempts}/3):`, err.message);
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    if (!ok) {
      failCount += batch.length;
    }

    if ((i + batchSize) % 2000 === 0 || i + batchSize >= candidateLinks.length) {
      const current = Math.min(i + batchSize, candidateLinks.length);
      console.log(`  Đã đồng bộ: ${current.toLocaleString()} / ${candidateLinks.length.toLocaleString()} (${((current / candidateLinks.length) * 100).toFixed(1)}%)`);
    }

    // Delay 100ms giữa các batch để tránh nghẽn
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("\n==================================================================");
  console.log(`🎉 HOÀN THÀNH ĐỒNG BỘ RESTAURANT_DISHES TRÊN SUPABASE!`);
  console.log(`   • Thành công: ${successCount.toLocaleString()} liên kết`);
  console.log(`   • Thất bại: ${failCount.toLocaleString()} liên kết`);
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("❌ Lỗi nghiêm trọng:", err);
  process.exit(1);
});
