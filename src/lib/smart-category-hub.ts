export type FoodCategory =
  | "noodles"
  | "rice"
  | "rolls_bread"
  | "vegetarian"
  | "drinks_desserts"
  | "international_hotpot"
  | "general";

export interface CategoryHubInfo {
  category: FoodCategory;
  nameVi: string;
  nameEn: string;
  badgeVi: string;
  badgeEn: string;
  hubUrl?: string; // Tùy chọn: Link riêng theo danh mục (https://s.shopee.vn/...)
}

export const CATEGORY_HUBS: Record<FoodCategory, CategoryHubInfo> = {
  noodles: {
    category: "noodles",
    nameVi: "Món Nước, Bún & Phở",
    nameEn: "Noodles & Soups",
    badgeVi: "Bún · Phở · Mì gần bạn",
    badgeEn: "Noodles & Soups near you",
  },
  rice: {
    category: "rice",
    nameVi: "Cơm & Món Mặn",
    nameEn: "Rice & Warm Meals",
    badgeVi: "Cơm ngon nóng hổi gần bạn",
    badgeEn: "Rice dishes near you",
  },
  rolls_bread: {
    category: "rolls_bread",
    nameVi: "Bánh Mì, Món Cuốn & Fastfood",
    nameEn: "Bread, Rolls & Fastfood",
    badgeVi: "Bánh mì · Món cuốn giao nhanh",
    badgeEn: "Fastfood & Rolls near you",
  },
  vegetarian: {
    category: "vegetarian",
    nameVi: "Món Chay & Healthy",
    nameEn: "Vegetarian & Healthy",
    badgeVi: "Món chay thanh tịnh gần bạn",
    badgeEn: "Vegetarian food near you",
  },
  drinks_desserts: {
    category: "drinks_desserts",
    nameVi: "Trà Sữa, Đồ Uống & Ăn Vặt",
    nameEn: "Drinks & Desserts",
    badgeVi: "Trà sữa · Đồ uống gần bạn",
    badgeEn: "Drinks & Desserts near you",
  },
  international_hotpot: {
    category: "international_hotpot",
    nameVi: "Lẩu, Nướng & Món Quốc Tế",
    nameEn: "Hotpot, BBQ & Global Cuisine",
    badgeVi: "Lẩu · Nướng · Món Quốc Tế",
    badgeEn: "Hotpot & Global Food",
  },
  general: {
    category: "general",
    nameVi: "Món Ngon Đặc Sắc",
    nameEn: "Popular Delicacies",
    badgeVi: "Quán ngon gần bạn",
    badgeEn: "Top spots near you",
  },
};

/**
 * Link ShopeeFood Universal Hub mặc định của tài khoản bạn.
 * Bạn có thể thay bằng Shortlink s.shopee.vn chiến dịch ShopeeFood của bạn.
 */
export const DEFAULT_SHOPEEFOOD_HUB_URL =
  "https://shopeefood.vn/now-food/affiliate/landing-page?mmp_pid=an_17316810077&shareChannel=copy_link&uls_trackid=56mc6ju601k1&utm_campaign=food_rLueyKdh9uJuAeR-id_7pCuiJhD5gf&utm_content=ShopeeFood&utm_medium=affiliate_food&utm_source=an_17316810077&utm_term=fjz82tfdd639";

/**
 * Tự động phân loại món ăn vào Category Hub thông minh dựa trên từ khóa tiếng Việt.
 */
export function detectFoodCategory(dish: string): FoodCategory {
  if (!dish || typeof dish !== "string") return "general";
  const name = dish.trim().normalize("NFC").toLowerCase();

  // 1. Kiểm tra Món Chay trước
  if (
    name.includes("chay") ||
    name.includes("salad") ||
    name.includes("nấm") ||
    name.includes("đậu hũ")
  ) {
    return "vegetarian";
  }

  // 2. Món Nước, Bún, Phở, Mì, Hủ tiếu
  if (
    name.includes("bún") ||
    name.includes("phở") ||
    name.includes("mì") ||
    name.includes("miến") ||
    name.includes("hủ tiếu") ||
    name.includes("bánh canh") ||
    name.includes("ramen") ||
    name.includes("udon") ||
    name.includes("nui") ||
    name.includes("súp") ||
    name.includes("cháo") ||
    name.includes("hoành thánh") ||
    name.includes("sủi cảo")
  ) {
    return "noodles";
  }

  // 3. Món Cơm, Xôi
  if (
    name.includes("cơm") ||
    name.includes("xôi") ||
    name.includes("sườn") ||
    name.includes("lúc lắc") ||
    name.includes("heo quay") ||
    name.includes("vịt quay")
  ) {
    return "rice";
  }

  // 4. Bánh mì, Món cuốn, Fastfood
  if (
    name.includes("bánh mì") ||
    name.includes("bánh cuốn") ||
    name.includes("bánh xèo") ||
    name.includes("bánh bèo") ||
    name.includes("bột lọc") ||
    name.includes("gỏi cuốn") ||
    name.includes("nem cuốn") ||
    name.includes("chả giò") ||
    name.includes("burger") ||
    name.includes("pizza") ||
    name.includes("sandwich") ||
    name.includes("gà rán") ||
    name.includes("taco")
  ) {
    return "rolls_bread";
  }

  // 5. Đồ uống, Trà sữa, Ăn vặt
  if (
    name.includes("trà") ||
    name.includes("cà phê") ||
    name.includes("sinh tố") ||
    name.includes("nước ép") ||
    name.includes("chè") ||
    name.includes("kem") ||
    name.includes("bánh tráng") ||
    name.includes("bánh ngọt") ||
    name.includes("tráng miệng")
  ) {
    return "drinks_desserts";
  }

  // 6. Lẩu, Nướng, Quốc tế
  if (
    name.includes("lẩu") ||
    name.includes("nướng") ||
    name.includes("bbq") ||
    name.includes("sushi") ||
    name.includes("sashimi") ||
    name.includes("kimbap") ||
    name.includes("tokbokki") ||
    name.includes("tteokbokki") ||
    name.includes("steak") ||
    name.includes("pasta") ||
    name.includes("curry") ||
    name.includes("dimsum")
  ) {
    return "international_hotpot";
  }

  return "general";
}

/**
 * Chuyển tên món thành mã tracking sub_id an toàn theo chuẩn URL.
 * Ví dụ: "Bún đậu mắm tôm" -> "bun_dau_mam_tom"
 */
export function slugifySubId(dish: string): string {
  if (!dish) return "food";
  return dish
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}

/**
 * Gắn tham số sub_id vào link affiliate để theo dõi từng món trong Shopee Affiliate Dashboard.
 */
export function attachSubIdToUrl(baseUrl: string, dish: string): string {
  if (!baseUrl) return baseUrl;
  const subId = slugifySubId(dish);
  try {
    const url = new URL(baseUrl);
    // Nếu URL chưa có sub_id hoặc muốn cập nhật sub_id theo món
    url.searchParams.set("sub_id", subId);
    return url.toString();
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}sub_id=${subId}`;
  }
}
