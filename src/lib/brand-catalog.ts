/**
 * Danh mục các thương hiệu đồ uống nổi tiếng hàng đầu tại Việt Nam (Brand Hub)
 * Phục vụ cho hành vi người dùng thường chọn đồ uống theo thương hiệu quen thuộc.
 */

import {
  DEFAULT_ORDERING_CITY,
  isSupportedCity,
  SHOPEEFOOD_HOME,
} from "./food-ordering";

export interface BeverageBrand {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  taglineVi?: string;
  taglineEn?: string;
  initials: string;
  themeColor: string;
  textColor: string;
  searchKeyword: string;
  subId: string;
  affiliateUrl?: string;
  restaurantUrl?: string;
  cityBranches?: Record<string, { originalUrl: string; affiliateUrl?: string }>;
}

export const TOP_BEVERAGE_BRANDS: BeverageBrand[] = [
  {
    id: "highlands",
    name: "Highlands Coffee",
    shortName: "Highlands",
    logoUrl: "/brands/highlands.webp",
    taglineVi: "Cà phê Phin · Trà Sen Vàng · Freeze",
    taglineEn: "Phin Coffee · Lotus Tea · Freeze",
    initials: "HL",
    themeColor: "#8B1E1E",
    textColor: "#FFFFFF",
    searchKeyword: "Highlands Coffee",
    subId: "brand_highlands",
    restaurantUrl: "https://shopeefood.vn/da-nang/highlands-coffee-tra-ca-phe-banh-vincom-da-nang",
    affiliateUrl: "https://shope.ee/3VkfEe8V7W",
    cityBranches: {
      "da-nang": {
        originalUrl: "https://shopeefood.vn/da-nang/highlands-coffee-tra-ca-phe-banh-vincom-da-nang",
        affiliateUrl: "https://shope.ee/3VkfEe8V7W",
      },
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/highlands-coffee-tra-ca-phe-banh-hateco-apollo-ha-noi",
        affiliateUrl: "https://shope.ee/6VOGo9x52q",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/highlands-coffee-tra-ca-phe-banh-no-7-binh-tan-fc",
        affiliateUrl: "https://shope.ee/8fSlO8opf4",
      },
    },
  },
  {
    id: "phuclong",
    name: "Phúc Long Coffee & Tea",
    shortName: "Phúc Long",
    logoUrl: "/brands/phuclong.png",
    taglineVi: "Trà Đào Cam Sả · Trà Ô Long Sữa",
    taglineEn: "Peach Tea · Oolong Milk Tea",
    initials: "PL",
    themeColor: "#0A5C36",
    textColor: "#FFFFFF",
    searchKeyword: "Phúc Long",
    subId: "brand_phuclong",
    restaurantUrl: "https://shopeefood.vn/ha-noi/phuc-long-cau-giay",
    affiliateUrl: "https://shope.ee/3VkfEeDepQ",
    cityBranches: {
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/phuc-long-cau-giay",
        affiliateUrl: "https://shope.ee/3VkfEeDepQ",
      },
      "da-nang": {
        originalUrl: "https://shopeefood.vn/da-nang/phuc-long-nguyen-van-linh-da-nang",
        affiliateUrl: "https://shope.ee/113KG3NAtA",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/phuc-long-cong-hoa",
        affiliateUrl: "https://shope.ee/60S0DF4PlP",
      },
    },
  },
  {
    id: "phela",
    name: "Phê La",
    shortName: "Phê La",
    logoUrl: "/brands/phela.png",
    taglineVi: "Ô Long Sữa Chao · Phù Vân · Gấm",
    taglineEn: "Artisanal Oolong & Milk Foam",
    initials: "PL",
    themeColor: "#7B3F00",
    textColor: "#FFFFFF",
    searchKeyword: "Phê La",
    subId: "brand_phela",
    restaurantUrl: "https://shopeefood.vn/da-nang/phe-la-tra-ca-phe-dac-san-vincom-plaza-ngo-quyen-da-nang",
    affiliateUrl: "https://shope.ee/9fLIZyl1c1",
    cityBranches: {
      "da-nang": {
        originalUrl: "https://shopeefood.vn/da-nang/phe-la-tra-ca-phe-dac-san-vincom-plaza-ngo-quyen-da-nang",
        affiliateUrl: "https://shope.ee/9fLIZyl1c1",
      },
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/phe-la-tra-ca-phe-dac-san-hang-cot",
        affiliateUrl: "https://shope.ee/4LJmEBEGW1",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/phe-la-tra-ca-phe-dac-san-dong-den",
        affiliateUrl: "https://shope.ee/AUuPZVn0a4",
      },
    },
  },
  {
    id: "katinat",
    name: "Katinat Saigon Kafe",
    shortName: "Katinat",
    logoUrl: "/brands/katinat.png",
    taglineVi: "Trà Sữa Chôm Chôm · Bơ Dừa Non",
    taglineEn: "Rambutan Milk Tea · Avocado Coconut",
    initials: "KT",
    themeColor: "#1C4957",
    textColor: "#FFFFFF",
    searchKeyword: "Katinat",
    subId: "brand_katinat",
    restaurantUrl: "https://shopeefood.vn/da-nang/katinat-nguyen-van-thoai",
    affiliateUrl: "https://shope.ee/1LgAefLuD4",
    cityBranches: {
      "da-nang": {
        originalUrl: "https://shopeefood.vn/da-nang/katinat-nguyen-van-thoai",
        affiliateUrl: "https://shope.ee/1LgAefLuD4",
      },
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/katinat-doi-can",
        affiliateUrl: "https://shope.ee/5AstDi7JRe",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/katinat-vong-xoay-dan-chu",
        affiliateUrl: "https://shope.ee/6VOGoA2VkS",
      },
    },
  },
  {
    id: "starbucks",
    name: "Starbucks Coffee",
    shortName: "Starbucks",
    logoUrl: "/brands/starbucks.png",
    taglineVi: "Caramel Macchiato · Frappuccino",
    taglineEn: "Caramel Macchiato · Frappuccino",
    initials: "SB",
    themeColor: "#006241",
    textColor: "#FFFFFF",
    searchKeyword: "Starbucks",
    subId: "brand_starbucks",
    restaurantUrl: "https://shopeefood.vn/ha-noi/starbucks-coffee-the-loop",
    affiliateUrl: "https://shope.ee/BUDGWUobK",
    cityBranches: {
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/starbucks-coffee-the-loop",
        affiliateUrl: "https://shope.ee/BUDGWUobK",
      },
    },
  },
  {
    id: "mixue",
    name: "Mixue",
    shortName: "Mixue",
    logoUrl: "/brands/mixue.png",
    taglineVi: "Trà Kem Bốn Mùa · Kem Ốc Quế",
    taglineEn: "Four Seasons Tea · Soft Cone",
    initials: "MX",
    themeColor: "#E60012",
    textColor: "#FFFFFF",
    searchKeyword: "Mixue",
    subId: "brand_mixue",
    restaurantUrl: "https://shopeefood.vn/ha-noi/tra-sua-mixue-kdt-do-nghia",
    affiliateUrl: "https://shope.ee/7VGo002tjT",
    cityBranches: {
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/tra-sua-mixue-kdt-do-nghia",
        affiliateUrl: "https://shope.ee/7VGo002tjT",
      },
      "da-nang": {
        originalUrl: "https://shopeefood.vn/da-nang/tra-sua-mixue-dung-si-thanh-khe",
        affiliateUrl: "https://shope.ee/6L4qbr5pK0",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/tra-sua-mixue-86-nguyen-gia-tri",
        affiliateUrl: "https://shope.ee/LndSpUBHM",
      },
    },
  },
  {
    id: "tocotoco",
    name: "ToCoToCo Tea",
    shortName: "ToCoToCo",
    logoUrl: "/brands/tocotoco.png",
    taglineVi: "Trà Sữa Ba Anh Em · Trân Châu Hoàng Kim",
    taglineEn: "Trio Milk Tea · Golden Pearl",
    initials: "TC",
    themeColor: "#D49B18",
    textColor: "#FFFFFF",
    searchKeyword: "ToCoToCo",
    subId: "brand_tocotoco",
    restaurantUrl: "https://shopeefood.vn/ha-noi/tra-sua-tocotoco-180-cau-giay",
    affiliateUrl: "https://shope.ee/60S0DFCBOU",
    cityBranches: {
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/tra-sua-tocotoco-180-cau-giay",
        affiliateUrl: "https://shope.ee/60S0DFCBOU",
      },
      "da-nang": {
        originalUrl: "https://shopeefood.vn/da-nang/tra-sua-tocotoco-152-chau-thi-vinh-te",
        affiliateUrl: "https://shope.ee/1An4DZqjn",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/tra-sua-tocotoco-no-trang-long",
        affiliateUrl: "https://shope.ee/9AP1z40x9n",
      },
    },
  },
  {
    id: "congcaphe",
    name: "Cộng Cà Phê",
    shortName: "Cộng",
    logoUrl: "/brands/congcaphe.png",
    taglineVi: "Cà Phê Cốt Dừa · Bạc Xỉu",
    taglineEn: "Coconut Coffee · Bac Xiu",
    initials: "CC",
    themeColor: "#4A5320",
    textColor: "#FFFFFF",
    searchKeyword: "Cộng Cà Phê",
    subId: "brand_congcaphe",
    restaurantUrl: "https://shopeefood.vn/ha-noi/cong-caphe-cau-go",
    affiliateUrl: "https://shope.ee/5fp9od5TfQ",
    cityBranches: {
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/cong-caphe-cau-go",
        affiliateUrl: "https://shope.ee/5fp9od5TfQ",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/cong-caphe-hai-ba-trung",
        affiliateUrl: "https://shope.ee/7pteObzykn",
      },
    },
  },
  {
    id: "gongcha",
    name: "Gong Cha",
    shortName: "Gong Cha",
    logoUrl: "/brands/gongcha.png",
    taglineVi: "Trà Alisan Kem Sữa · Trà Đen Macchiato",
    taglineEn: "Alisan Milk Foam · Black Tea",
    initials: "GC",
    themeColor: "#9B1B30",
    textColor: "#FFFFFF",
    searchKeyword: "Gong Cha",
    subId: "brand_gongcha",
    restaurantUrl: "https://shopeefood.vn/da-nang/gong-cha-tra-ca-phe-nguyen-van-linh",
    affiliateUrl: "https://shope.ee/W73f8P4u1",
    cityBranches: {
      "da-nang": {
        originalUrl: "https://shopeefood.vn/da-nang/gong-cha-tra-ca-phe-nguyen-van-linh",
        affiliateUrl: "https://shope.ee/W73f8P4u1",
      },
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/gong-cha-tra-ca-phe-hoang-dao-thuy",
        affiliateUrl: "https://shope.ee/1qcRFaWRdZ",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/gong-cha-tra-ca-phe-nguyen-xi",
        affiliateUrl: "https://shope.ee/6L4qbr395R",
      },
    },
  },
  {
    id: "koithe",
    name: "KOI Thé",
    shortName: "KOI Thé",
    logoUrl: "/brands/koithe.png",
    taglineVi: "Golden Bubble Milk Tea · Macchiato",
    taglineEn: "Golden Bubble Milk Tea · Macchiato",
    initials: "KT",
    themeColor: "#B58A46",
    textColor: "#FFFFFF",
    searchKeyword: "KOI Thé",
    subId: "brand_koithe",
    restaurantUrl: "https://shopeefood.vn/ha-noi/koi-the-cau-giay",
    cityBranches: {
      "ha-noi": {
        originalUrl: "https://shopeefood.vn/ha-noi/koi-the-cau-giay",
      },
      "ho-chi-minh": {
        originalUrl: "https://shopeefood.vn/ho-chi-minh/koi-the-aeon-mall-binh-tan",
      },
    },
  },
];

/**
 * Gắn các tham số UTM Affiliate tracking chuẩn vào link quán ShopeeFood gốc
 */
export function buildTrackedShopeeFoodUrl(rawUrl: string, subId?: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set("mmp_pid", "an_17316810077");
    url.searchParams.set("utm_source", "an_17316810077");
    url.searchParams.set("utm_medium", "affiliate_food");
    url.searchParams.set("utm_campaign", "foodtour_brand_hub");
    if (subId) url.searchParams.set("sub_id", subId);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Lấy link đặt món ShopeeFood cho thương hiệu:
 * Ưu tiên link quán cụ thể trong database (kèm mã affiliate) để khi mở trên ShopeeFood mobile,
 * ứng dụng sẽ nhận diện chuỗi và tự động chuyển về chi nhánh gần người dùng nhất.
 */
export function resolveBrandShopeeLink(
  brand: BeverageBrand,
  city?: string,
): string {
  const effectiveCity =
    typeof city === "string" && isSupportedCity(city)
      ? city
      : undefined;

  // 1. Nếu có chi nhánh theo thành phố tương ứng của người dùng
  if (effectiveCity && brand.cityBranches?.[effectiveCity]) {
    const branch = brand.cityBranches[effectiveCity];
    if (branch.affiliateUrl && /^https?:\/\//i.test(branch.affiliateUrl)) {
      return branch.affiliateUrl.trim();
    }
    if (branch.originalUrl && /^https?:\/\//i.test(branch.originalUrl)) {
      return buildTrackedShopeeFoodUrl(branch.originalUrl.trim(), brand.subId);
    }
  }

  // 2. Link affiliate chính thức của 1 quán trong chuỗi (từ database)
  if (brand.affiliateUrl && typeof brand.affiliateUrl === "string") {
    const trimmed = brand.affiliateUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
  }

  // 3. Link quán gốc ShopeeFood của thương hiệu trong database
  if (brand.restaurantUrl && typeof brand.restaurantUrl === "string") {
    const trimmed = brand.restaurantUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return buildTrackedShopeeFoodUrl(trimmed, brand.subId);
    }
  }

  // 4. Fallback link tìm kiếm gian hàng nếu không có quán nào trong DB
  const fallbackCity = effectiveCity || DEFAULT_ORDERING_CITY;
  try {
    const query = encodeURIComponent(brand.searchKeyword.trim());
    const rawUrl = `${SHOPEEFOOD_HOME}${fallbackCity}/danh-sach-dia-diem-giao-tan-noi?q=${query}`;
    return buildTrackedShopeeFoodUrl(rawUrl, brand.subId);
  } catch {
    return `${SHOPEEFOOD_HOME}${fallbackCity}`;
  }
}
