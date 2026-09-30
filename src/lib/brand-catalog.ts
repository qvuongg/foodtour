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
  },
  {
    id: "phuclong",
    name: "Phúc Long Coffee & Tea",
    shortName: "Phúc Long",
    logoUrl: "/brands/phuclong.svg",
    taglineVi: "Trà Đào Cam Sả · Trà Ô Long Sữa",
    taglineEn: "Peach Tea · Oolong Milk Tea",
    initials: "PL",
    themeColor: "#0A5C36",
    textColor: "#FFFFFF",
    searchKeyword: "Phúc Long",
    subId: "brand_phuclong",
  },
  {
    id: "phela",
    name: "Phê La",
    shortName: "Phê La",
    logoUrl: "/brands/phela.svg",
    taglineVi: "Ô Long Sữa Chao · Phù Vân · Gấm",
    taglineEn: "Artisanal Oolong & Milk Foam",
    initials: "PL",
    themeColor: "#7B3F00",
    textColor: "#FFFFFF",
    searchKeyword: "Phê La",
    subId: "brand_phela",
  },
  {
    id: "katinat",
    name: "Katinat Saigon Kafe",
    shortName: "Katinat",
    logoUrl: "/brands/katinat.svg",
    taglineVi: "Trà Sữa Chôm Chôm · Bơ Dừa Non",
    taglineEn: "Rambutan Milk Tea · Avocado Coconut",
    initials: "KT",
    themeColor: "#1C4957",
    textColor: "#FFFFFF",
    searchKeyword: "Katinat",
    subId: "brand_katinat",
  },
  {
    id: "thecoffeehouse",
    name: "The Coffee House",
    shortName: "TCH",
    logoUrl: "/brands/thecoffeehouse.svg",
    taglineVi: "Trà Sữa Mắc Ca · Cà Phê Sữa Đá",
    taglineEn: "Macca Milk Tea · Iced Milk Coffee",
    initials: "CH",
    themeColor: "#D85820",
    textColor: "#FFFFFF",
    searchKeyword: "The Coffee House",
    subId: "brand_tch",
  },
  {
    id: "starbucks",
    name: "Starbucks Coffee",
    shortName: "Starbucks",
    logoUrl: "/brands/starbucks.svg",
    taglineVi: "Caramel Macchiato · Frappuccino",
    taglineEn: "Caramel Macchiato · Frappuccino",
    initials: "SB",
    themeColor: "#006241",
    textColor: "#FFFFFF",
    searchKeyword: "Starbucks",
    subId: "brand_starbucks",
  },
  {
    id: "mixue",
    name: "Mixue",
    shortName: "Mixue",
    logoUrl: "/brands/mixue.svg",
    taglineVi: "Trà Kem Bốn Mùa · Kem Ốc Quế",
    taglineEn: "Four Seasons Tea · Soft Cone",
    initials: "MX",
    themeColor: "#E60012",
    textColor: "#FFFFFF",
    searchKeyword: "Mixue",
    subId: "brand_mixue",
  },
  {
    id: "tocotoco",
    name: "ToCoToCo Tea",
    shortName: "ToCoToCo",
    logoUrl: "/brands/tocotoco.svg",
    taglineVi: "Trà Sữa Ba Anh Em · Trân Châu Hoàng Kim",
    taglineEn: "Trio Milk Tea · Golden Pearl",
    initials: "TC",
    themeColor: "#D49B18",
    textColor: "#FFFFFF",
    searchKeyword: "ToCoToCo",
    subId: "brand_tocotoco",
  },
  {
    id: "congcaphe",
    name: "Cộng Cà Phê",
    shortName: "Cộng",
    logoUrl: "/brands/congcaphe.svg",
    taglineVi: "Cà Phê Cốt Dừa · Bạc Xỉu",
    taglineEn: "Coconut Coffee · Bac Xiu",
    initials: "CC",
    themeColor: "#4A5320",
    textColor: "#FFFFFF",
    searchKeyword: "Cộng Cà Phê",
    subId: "brand_congcaphe",
  },
  {
    id: "gongcha",
    name: "Gong Cha",
    shortName: "Gong Cha",
    logoUrl: "/brands/gongcha.svg",
    taglineVi: "Trà Alisan Kem Sữa · Trà Đen Macchiato",
    taglineEn: "Alisan Milk Foam · Black Tea",
    initials: "GC",
    themeColor: "#9B1B30",
    textColor: "#FFFFFF",
    searchKeyword: "Gong Cha",
    subId: "brand_gongcha",
  },
  {
    id: "koithe",
    name: "KOI Thé",
    shortName: "KOI Thé",
    logoUrl: "/brands/koithe.svg",
    taglineVi: "Golden Bubble Milk Tea · Macchiato",
    taglineEn: "Golden Bubble Milk Tea · Macchiato",
    initials: "KT",
    themeColor: "#B58A46",
    textColor: "#FFFFFF",
    searchKeyword: "KOI Thé",
    subId: "brand_koithe",
  },
];

/**
 * Sinh link tìm kiếm gian hàng ShopeeFood cho thương hiệu kèm mã UTM Affiliate tracking
 */
export function resolveBrandShopeeLink(
  brand: BeverageBrand,
  city?: string,
): string {
  if (brand.affiliateUrl && typeof brand.affiliateUrl === "string") {
    const trimmed = brand.affiliateUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
  }

  const effectiveCity =
    typeof city === "string" && isSupportedCity(city)
      ? city
      : DEFAULT_ORDERING_CITY;

  try {
    const query = encodeURIComponent(brand.searchKeyword.trim());
    const rawUrl = `${SHOPEEFOOD_HOME}${effectiveCity}/danh-sach-dia-diem-giao-tan-noi?q=${query}`;
    const url = new URL(rawUrl);
    url.searchParams.set("mmp_pid", "an_17316810077");
    url.searchParams.set("utm_source", "an_17316810077");
    url.searchParams.set("utm_medium", "affiliate_food");
    url.searchParams.set("utm_campaign", "foodtour_brand_hub");
    if (brand.subId) url.searchParams.set("sub_id", brand.subId);
    return url.toString();
  } catch {
    return `${SHOPEEFOOD_HOME}${effectiveCity}`;
  }
}
