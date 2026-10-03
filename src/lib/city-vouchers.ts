import type { CitySlug } from "@/hooks/use-user-location";

export type CityVoucherCategory =
  | "all"
  | "freeship"
  | "megadeal"
  | "lunch"
  | "drinks"
  | "party";

export interface CityVoucher {
  id: string;
  city: CitySlug;
  subId: string; // Mã Sub_id chuẩn Shopee Affiliate (chỉ chữ và số, không dấu gạch ngang/dưới, <= 20 ký tự)
  titleVi: string;
  titleEn: string;
  badge: string; // e.g. "FREESHIP 0Đ", "GIẢM 50%", "GIẢM 35K"
  discountVi: string; // Tóm tắt ưu đãi: "Freeship tới 30k mọi đơn", "Giảm 50% quán tuyển chọn"
  discountEn: string;
  minOrderVi: string; // "Đơn từ 0đ", "Đơn từ 80k"
  minOrderEn: string;
  category: CityVoucherCategory;
  tagVi: string;
  tagEn: string;
  highlight?: boolean;
  originalUrl: string;
  affiliateUrl?: string; // Link rút gọn shope.ee nếu có
  icon:
    | "delivery"
    | "food"
    | "favorite"
    | "nearby"
    | "explore"
    | "city"
    | "groceries"
    | "drink"
    | "world"
    | "party"
    | "new"
    | "group";
}

export const CITY_VOUCHERS_CATALOG: readonly CityVoucher[] = [
  // =========================================================================
  // TP. HỒ CHÍ MINH (ho-chi-minh)
  // =========================================================================
  {
    id: "hcm-freeship-0d",
    city: "ho-chi-minh",
    subId: "hcmfreeship",
    titleVi: "Freeship 0Đ Toàn Sàn Sài Gòn",
    titleEn: "0Đ Freeship Across Saigon",
    badge: "FREESHIP 0Đ",
    discountVi: "Miễn phí vận chuyển tới 33.000đ",
    discountEn: "Free shipping up to 33,000đ",
    minOrderVi: "Đơn từ 0đ",
    minOrderEn: "Orders from 0đ",
    category: "freeship",
    tagVi: "Freeship",
    tagEn: "Freeship",
    highlight: true,
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=freeship",
    icon: "delivery",
  },
  {
    id: "hcm-dai-tiec-50",
    city: "ho-chi-minh",
    subId: "hcmdaitiec",
    titleVi: "Đại Tiệc Muôn Vị Sài Gòn",
    titleEn: "Saigon Grand Feast 50% Off",
    badge: "GIẢM 50%",
    discountVi: "Giảm 50% quán ngon tuyển chọn",
    discountEn: "50% off curated restaurants",
    minOrderVi: "Đơn từ 60.000đ",
    minOrderEn: "Orders from 60,000đ",
    category: "megadeal",
    tagVi: "Giảm sâu",
    tagEn: "Mega deal",
    highlight: true,
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=giam+50",
    icon: "food",
  },
  {
    id: "hcm-com-trua-35k",
    city: "ho-chi-minh",
    subId: "hcmcomtrua",
    titleVi: "Cơm Trưa Công Sở Sài Gòn",
    titleEn: "Saigon Office Lunch Deals",
    badge: "GIẢM 35K",
    discountVi: "Giảm tới 35.000đ bữa trưa",
    discountEn: "Up to 35,000đ off lunch meals",
    minOrderVi: "Đơn từ 80.000đ",
    minOrderEn: "Orders from 80,000đ",
    category: "lunch",
    tagVi: "Cơm trưa",
    tagEn: "Lunch",
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=com+trua",
    icon: "nearby",
  },
  {
    id: "hcm-tra-sua-30k",
    city: "ho-chi-minh",
    subId: "hcmtrasua",
    titleVi: "Trà Sữa & Cà Phê Sài Gòn",
    titleEn: "Saigon Milk Tea & Coffee",
    badge: "GIẢM 30K",
    discountVi: "Giảm 30.000đ đồ uống giờ chiều",
    discountEn: "30,000đ off afternoon drinks",
    minOrderVi: "Đơn từ 60.000đ",
    minOrderEn: "Orders from 60,000đ",
    category: "drinks",
    tagVi: "Trà sữa",
    tagEn: "Drinks",
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=tra+sua",
    icon: "drink",
  },
  {
    id: "hcm-den-sg-an-gi",
    city: "ho-chi-minh",
    subId: "hcmdensg",
    titleVi: "Đến Sài Gòn Ăn Gì - Món Chuẩn Vị",
    titleEn: "What to Eat in Saigon - Local Bites",
    badge: "HOT SÀI GÒN",
    discountVi: "Ưu đãi cơm tấm, hủ tiếu, bánh mì",
    discountEn: "Deals on broken rice, noodles, banh mi",
    minOrderVi: "Đơn từ 40.000đ",
    minOrderEn: "Orders from 40,000đ",
    category: "lunch",
    tagVi: "Đặc sản",
    tagEn: "Local",
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=com+tam",
    icon: "city",
  },
  {
    id: "hcm-quan-moi-40k",
    city: "ho-chi-minh",
    subId: "hcmquanmoi",
    titleVi: "Thử Quán Mới - Deal Làm Quen",
    titleEn: "New Spot Welcome Deals",
    badge: "GIẢM 40K",
    discountVi: "Giảm 40.000đ cho quán mới lên sàn",
    discountEn: "40,000đ off new restaurants",
    minOrderVi: "Đơn từ 70.000đ",
    minOrderEn: "Orders from 70,000đ",
    category: "megadeal",
    tagVi: "Quán mới",
    tagEn: "New spots",
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=quan+moi",
    icon: "new",
  },
  {
    id: "hcm-len-don-nhom-105k",
    city: "ho-chi-minh",
    subId: "hcmdonnhom",
    titleVi: "Lên Đơn Nhóm Sài Gòn",
    titleEn: "Saigon Group Order Deals",
    badge: "GIẢM 105K",
    discountVi: "Giảm tới 105.000đ khi đặt tiệc nhóm",
    discountEn: "Save up to 105,000đ for group meals",
    minOrderVi: "Đơn từ 250.000đ",
    minOrderEn: "Orders from 250,000đ",
    category: "party",
    tagVi: "Tiệc nhóm",
    tagEn: "Party",
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=dat+nhom",
    icon: "group",
  },
  {
    id: "hcm-quan-ruot-30k",
    city: "ho-chi-minh",
    subId: "hcmquanruot",
    titleVi: "Quán Ruột Dân Sành Ăn Sài Gòn",
    titleEn: "Foodie Favorites in Saigon",
    badge: "GIẢM 30K",
    discountVi: "Giảm 30.000đ quán rating cao",
    discountEn: "30,000đ off top-rated spots",
    minOrderVi: "Đơn từ 70.000đ",
    minOrderEn: "Orders from 70,000đ",
    category: "lunch",
    tagVi: "Quán quen",
    tagEn: "Favorites",
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=quan+quen",
    icon: "favorite",
  },
  {
    id: "hcm-di-cho-50",
    city: "ho-chi-minh",
    subId: "hcmdicho",
    titleVi: "Chợ Tươi Ngon Đỉnh Sài Gòn",
    titleEn: "Saigon Fresh Market 50% Off",
    badge: "GIẢM 50%",
    discountVi: "Thực phẩm tươi sống giảm nửa giá",
    discountEn: "Half-price fresh groceries & snacks",
    minOrderVi: "Đơn từ 99.000đ",
    minOrderEn: "Orders from 99,000đ",
    category: "megadeal",
    tagVi: "Đi chợ",
    tagEn: "Groceries",
    originalUrl: "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=mart",
    icon: "groceries",
  },

  // =========================================================================
  // HÀ NỘI (ha-noi)
  // =========================================================================
  {
    id: "hn-freeship-0d",
    city: "ha-noi",
    subId: "hnfreeship",
    titleVi: "Hà Nội Freeship Xtra 0Đ",
    titleEn: "0Đ Freeship Across Hanoi",
    badge: "FREESHIP 0Đ",
    discountVi: "Miễn phí vận chuyển các quận nội thành",
    discountEn: "Free shipping across urban districts",
    minOrderVi: "Đơn từ 0đ",
    minOrderEn: "Orders from 0đ",
    category: "freeship",
    tagVi: "Freeship",
    tagEn: "Freeship",
    highlight: true,
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=freeship",
    icon: "delivery",
  },
  {
    id: "hn-pho-co-35k",
    city: "ha-noi",
    subId: "hnphoco",
    titleVi: "Ăn Phố Cổ - Chuẩn Vị Hà Thành",
    titleEn: "Old Quarter Classics - Hanoi Tastes",
    badge: "CHUẨN VỊ",
    discountVi: "Giảm tới 35.000đ phở, bún chả, bún thang",
    discountEn: "Up to 35,000đ off pho & bun cha",
    minOrderVi: "Đơn từ 70.000đ",
    minOrderEn: "Orders from 70,000đ",
    category: "lunch",
    tagVi: "Đặc sản",
    tagEn: "Local",
    highlight: true,
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=pho",
    icon: "city",
  },
  {
    id: "hn-com-trua-50",
    city: "ha-noi",
    subId: "hncomtrua",
    titleVi: "Cơm Trưa Văn Phòng Hà Nội",
    titleEn: "Hanoi Office Lunch Deals",
    badge: "GIẢM 50%",
    discountVi: "Giảm 50% trưa Cầu Giấy, Ba Đình, Đống Đa",
    discountEn: "50% off lunch in business hubs",
    minOrderVi: "Đơn từ 60.000đ",
    minOrderEn: "Orders from 60,000đ",
    category: "lunch",
    tagVi: "Cơm trưa",
    tagEn: "Lunch",
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=com+trua",
    icon: "nearby",
  },
  {
    id: "hn-tra-chanh-30k",
    city: "ha-noi",
    subId: "hntrachanh",
    titleVi: "Trà Sữa & Cà Phê Trứng Hà Nội",
    titleEn: "Hanoi Egg Coffee & Milk Tea",
    badge: "GIẢM 30K",
    discountVi: "Giảm 30.000đ giải khát phố cổ",
    discountEn: "30,000đ off refreshing drinks",
    minOrderVi: "Đơn từ 60.000đ",
    minOrderEn: "Orders from 60,000đ",
    category: "drinks",
    tagVi: "Trà sữa",
    tagEn: "Drinks",
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=tra+sua",
    icon: "drink",
  },
  {
    id: "hn-lau-nuong-70k",
    city: "ha-noi",
    subId: "hnlaunuong",
    titleVi: "Lẩu & Nướng Hà Thành Tụ Tập",
    titleEn: "Hanoi Hotpot & BBQ Gathering",
    badge: "GIẢM 70K",
    discountVi: "Giảm 70.000đ lẩu riêu, nướng chảo",
    discountEn: "70,000đ off crab hotpot & BBQ",
    minOrderVi: "Đơn từ 200.000đ",
    minOrderEn: "Orders from 200,000đ",
    category: "party",
    tagVi: "Lẩu nướng",
    tagEn: "Hotpot",
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=lau+nuong",
    icon: "party",
  },
  {
    id: "hn-an-vat-25k",
    city: "ha-noi",
    subId: "hnanvat",
    titleVi: "Ăn Vặt Cổng Trường & Giờ Chiều",
    titleEn: "Hanoi Afternoon Street Snacks",
    badge: "ĂN VẶT",
    discountVi: "Giảm 25.000đ nem chua rán, bánh gối, chè",
    discountEn: "25,000đ off street food snacks",
    minOrderVi: "Đơn từ 50.000đ",
    minOrderEn: "Orders from 50,000đ",
    category: "megadeal",
    tagVi: "Ăn vặt",
    tagEn: "Snacks",
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=an+vat",
    icon: "explore",
  },
  {
    id: "hn-quan-moi-40k",
    city: "ha-noi",
    subId: "hnquanmoi",
    titleVi: "Quán Mới Đất Thủ Đô - Chào Bạn",
    titleEn: "New Spot Welcomes in Hanoi",
    badge: "GIẢM 40K",
    discountVi: "Ưu đãi quán mới gia nhập ShopeeFood",
    discountEn: "40,000đ off new restaurants in Hanoi",
    minOrderVi: "Đơn từ 80.000đ",
    minOrderEn: "Orders from 80,000đ",
    category: "megadeal",
    tagVi: "Quán mới",
    tagEn: "New spots",
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=quan+moi",
    icon: "new",
  },
  {
    id: "hn-dat-nhom-100k",
    city: "ha-noi",
    subId: "hndatnhom",
    titleVi: "Đặt Nhóm Đồng Nghiệp Hà Nội",
    titleEn: "Hanoi Team Group Orders",
    badge: "GIẢM 100K",
    discountVi: "Giảm 100.000đ tiệc công sở trưa & xế",
    discountEn: "100,000đ off team group lunches",
    minOrderVi: "Đơn từ 250.000đ",
    minOrderEn: "Orders from 250,000đ",
    category: "party",
    tagVi: "Tiệc nhóm",
    tagEn: "Party",
    originalUrl: "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=dat+nhom",
    icon: "group",
  },

  // =========================================================================
  // ĐÀ NẴNG (da-nang)
  // =========================================================================
  {
    id: "dn-freeship-0d",
    city: "da-nang",
    subId: "dnfreeship",
    titleVi: "Đà Nẵng Freeship 0Đ Phố Biển",
    titleEn: "0Đ Coastal Freeship Da Nang",
    badge: "FREESHIP 0Đ",
    discountVi: "Miễn phí ship Hải Châu, Sơn Trà, Ngũ Hành Sơn",
    discountEn: "Free shipping across Da Nang",
    minOrderVi: "Đơn từ 0đ",
    minOrderEn: "Orders from 0đ",
    category: "freeship",
    tagVi: "Freeship",
    tagEn: "Freeship",
    highlight: true,
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=freeship",
    icon: "delivery",
  },
  {
    id: "dn-mi-quang-35k",
    city: "da-nang",
    subId: "dnmiquang",
    titleVi: "Mì Quảng & Đặc Sản Miền Trung",
    titleEn: "Mi Quang & Central Specialties",
    badge: "ĐẶC SẢN",
    discountVi: "Giảm 35.000đ mì quảng, bánh tráng thịt heo",
    discountEn: "35,000đ off Mi Quang & local staples",
    minOrderVi: "Đơn từ 65.000đ",
    minOrderEn: "Orders from 65,000đ",
    category: "lunch",
    tagVi: "Đặc sản",
    tagEn: "Local",
    highlight: true,
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=mi+quang",
    icon: "city",
  },
  {
    id: "dn-hai-san-50k",
    city: "da-nang",
    subId: "dnhaisan",
    titleVi: "Hải Sản Tươi Sống Phố Biển",
    titleEn: "Fresh Coastal Seafood Da Nang",
    badge: "HẢI SẢN",
    discountVi: "Giảm 50.000đ tôm, cua, ghẹ, ốc biển",
    discountEn: "50,000đ off fresh seafood dishes",
    minOrderVi: "Đơn từ 150.000đ",
    minOrderEn: "Orders from 150,000đ",
    category: "megadeal",
    tagVi: "Hải sản",
    tagEn: "Seafood",
    highlight: true,
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=hai+san",
    icon: "food",
  },
  {
    id: "dn-tra-sua-25k",
    city: "da-nang",
    subId: "dntrasua",
    titleVi: "Trà Sữa & Cà Phê Gió Biển",
    titleEn: "Da Nang Coastal Milk Tea & Coffee",
    badge: "GIẢM 25K",
    discountVi: "Giảm 25.000đ ngắm cầu Rồng & Mỹ Khê",
    discountEn: "25,000đ off ocean breeze drinks",
    minOrderVi: "Đơn từ 50.000đ",
    minOrderEn: "Orders from 50,000đ",
    category: "drinks",
    tagVi: "Trà sữa",
    tagEn: "Drinks",
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=tra+sua",
    icon: "drink",
  },
  {
    id: "dn-an-vat-cho-dem-20k",
    city: "da-nang",
    subId: "dnanvat",
    titleVi: "Ăn Vặt Chợ Đêm & Cầu Rồng",
    titleEn: "Night Market & Dragon Bridge Snacks",
    badge: "ĂN VẶT",
    discountVi: "Giảm 20.000đ bánh tráng nướng, chè sầu",
    discountEn: "20,000đ off street food & desserts",
    minOrderVi: "Đơn từ 40.000đ",
    minOrderEn: "Orders from 40,000đ",
    category: "megadeal",
    tagVi: "Ăn vặt",
    tagEn: "Snacks",
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=an+vat",
    icon: "explore",
  },
  {
    id: "dn-com-ga-30k",
    city: "da-nang",
    subId: "dncomga",
    titleVi: "Cơm Gà & Bún Bò Đà Thành",
    titleEn: "Chicken Rice & Beef Noodles",
    badge: "GIẢM 30K",
    discountVi: "Giảm 30.000đ bữa trưa chuẩn vị",
    discountEn: "30,000đ off savory lunch sets",
    minOrderVi: "Đơn từ 70.000đ",
    minOrderEn: "Orders from 70,000đ",
    category: "lunch",
    tagVi: "Cơm trưa",
    tagEn: "Lunch",
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=com+ga",
    icon: "nearby",
  },
  {
    id: "dn-quan-moi-40k",
    city: "da-nang",
    subId: "dnquanmoi",
    titleVi: "Quán Mới Đà Nẵng - Deal Khám Phá",
    titleEn: "Da Nang New Spot Discovery",
    badge: "GIẢM 40K",
    discountVi: "Giảm 40.000đ khám phá hương vị mới",
    discountEn: "40,000đ off newly opened venues",
    minOrderVi: "Đơn từ 80.000đ",
    minOrderEn: "Orders from 80,000đ",
    category: "megadeal",
    tagVi: "Quán mới",
    tagEn: "New spots",
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=quan+moi",
    icon: "new",
  },
  {
    id: "dn-tiec-nhom-90k",
    city: "da-nang",
    subId: "dntiecnhom",
    titleVi: "Khui Tiệc Nhóm Bạn Đà Nẵng",
    titleEn: "Da Nang Friends Gathering",
    badge: "GIẢM 90K",
    discountVi: "Giảm 90.000đ tiệc lẩu, nướng ven sông Hàn",
    discountEn: "90,000đ off group dinners & gatherings",
    minOrderVi: "Đơn từ 220.000đ",
    minOrderEn: "Orders from 220,000đ",
    category: "party",
    tagVi: "Tiệc nhóm",
    tagEn: "Party",
    originalUrl: "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=dat+nhom",
    icon: "group",
  },
];

/**
 * Tạo URL gắn mã Affiliate ShopeeFood chuẩn UTM & MMP
 */
export function resolveVoucherAffiliateLink(voucher: CityVoucher): string {
  // Nếu đã cấu hình sẵn link rút gọn shope.ee thì ưu tiên trả về
  if (voucher.affiliateUrl && typeof voucher.affiliateUrl === "string") {
    const trimmed = voucher.affiliateUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          return trimmed;
        }
      } catch {}
    }
  }

  // Tự động gắn bộ tham số Affiliate tracking chuẩn ShopeeFood với sub_id chuẩn alphanumeric
  try {
    const url = new URL(voucher.originalUrl);
    url.searchParams.set("mmp_pid", "an_17316810077");
    url.searchParams.set("utm_source", "an_17316810077");
    url.searchParams.set("utm_medium", "affiliate_food");
    url.searchParams.set("utm_campaign", `foodtour_voucher_${voucher.city}`);
    url.searchParams.set("sub_id", voucher.subId);
    return url.toString();
  } catch {
    return voucher.originalUrl;
  }
}

/**
 * Lấy danh sách voucher theo thành phố và danh mục bộ lọc
 */
export function getVouchersForCity(
  city: CitySlug,
  category: CityVoucherCategory = "all",
): CityVoucher[] {
  return CITY_VOUCHERS_CATALOG.filter((voucher) => {
    if (voucher.city !== city) return false;
    if (category !== "all" && voucher.category !== category) return false;
    return true;
  });
}

/**
 * Link landing page tổng của ShopeeFood theo từng thành phố (kèm mã affiliate)
 */
export function getCityShopeeHubUrl(city: CitySlug): string {
  const cityPath =
    city === "ha-noi"
      ? "ha-noi"
      : city === "da-nang"
        ? "da-nang"
        : "ho-chi-minh";

  const hubUrl = new URL(`https://shopeefood.vn/${cityPath}`);
  hubUrl.searchParams.set("mmp_pid", "an_17316810077");
  hubUrl.searchParams.set("utm_source", "an_17316810077");
  hubUrl.searchParams.set("utm_medium", "affiliate_food");
  hubUrl.searchParams.set("utm_campaign", `foodtour_voucher_hub_${city}`);
  hubUrl.searchParams.set("sub_id", `hub${city.replace(/-/g, "")}`);
  return hubUrl.toString();
}
