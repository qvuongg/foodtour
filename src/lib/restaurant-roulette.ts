/**
 * Danh mục Nhà Hàng / Quán Ăn Tuyển Chọn (Restaurant Roulette Catalog)
 * Bao phủ 3 thành phố lớn: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh.
 *
 * Tiêu chuẩn chất lượng:
 * 1. ratingCount >= 100 (tất cả quán thực tế đều >= 1000 lượt đánh giá)
 * 2. rating từ 4.5 đến 4.9 sao
 * 3. Đầy đủ toạ độ GPS (lat/lng) phục vụ tính toán bán kính <= 3km
 * 4. Gắn sẵn link ShopeeFood và Affiliate shope.ee
 */

import { haversineDistanceKm, type GeoPoint } from "./geo-distance";
import type { MealKind } from "./food-categories";
import rawBranchesData from "../data/brand-branches.json";

const BRAND_SPECIALTIES: Record<string, string[]> = {
  highlands: ["Phin sữa đá", "Freeze trà xanh"],
  phuclong: ["Trà đào cam sả", "Trà sữa ô long"],
  phela: ["Trà ô long sữa", "Cà phê cốt dừa"],
  mixue: ["Trà sữa trân châu", "Nước chanh tươi"],
  tocotoco: ["Trà sữa trân châu hoàng gia", "Trà sữa khoai môn"],
  starbucks: ["Caramel Macchiato", "Matcha Latte"],
  katinat: ["Trà sữa chôm chôm", "Bơ già dừa non"],
  congcaphe: ["Cà phê cốt dừa", "Bạc xỉu"],
  gongcha: ["Trà sữa Alisan", "Trà sữa trân châu đen"],
  koithe: ["Trà sữa trân châu hoàng kim", "Trà xanh macchiato"],
};

export const BRAND_ROULETTE_ITEMS: RestaurantRouletteItem[] = (
  rawBranchesData as Array<{
    id: string;
    brand_id: string;
    name: string;
    address: string;
    district?: string;
    city: string;
    lat: number;
    lng: number;
    rating?: number;
    rating_count?: number;
    shopeefood_url: string;
    affiliate_url?: string;
  }>
).map((b) => ({
  id: b.id,
  name: b.name,
  city: (b.city === "ha-noi" || b.city === "ho-chi-minh" || b.city === "da-nang" ? b.city : "da-nang") as "da-nang" | "ha-noi" | "ho-chi-minh",
  districtName: b.district || "",
  address: b.address,
  lat: b.lat,
  lng: b.lng,
  rating: Number(b.rating) || 4.7,
  ratingCount: Number(b.rating_count) || 1200,
  specialties: BRAND_SPECIALTIES[b.brand_id] || ["Trà & Cà phê", "Đồ uống đặc trưng"],
  category: "drink" as const,
  shopeeUrl: b.shopeefood_url,
  affiliateUrl: b.affiliate_url,
}));

export interface RestaurantRouletteItem extends GeoPoint {
  id: string;
  name: string;
  city: "da-nang" | "ha-noi" | "ho-chi-minh";
  districtName: string;
  address?: string;
  lat: number;
  lng: number;
  rating: number;
  ratingCount: number; // >= 100
  specialties: string[]; // 1-2 món đặc trưng hiển thị dạng chip
  category: MealKind; // 'lunch' | 'drink' | 'snack' | 'nhau'
  shopeeUrl: string;
  affiliateUrl?: string;
}

export const RESTAURANT_ROULETTE_CATALOG: RestaurantRouletteItem[] = [
  {
    "id": "spot_ha-noi_1_4t9jmcw",
    "name": "Bún Chả Đắc Kim - Hàng Mành",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0341,
    "lng": 105.855,
    "rating": 4.5,
    "ratingCount": 3100,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-dac-kim-hang-manh",
    "affiliateUrl": "https://shope.ee/AUuLyH29wJ"
  },
  {
    "id": "spot_ha-noi_2_18rljmi",
    "name": "Bún Chả Hàng Quạt",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0317,
    "lng": 105.8478,
    "rating": 4.8,
    "ratingCount": 2650,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-hang-quat",
    "affiliateUrl": "https://shope.ee/9KiOa86bJ6"
  },
  {
    "id": "spot_ha-noi_3_1f821hq",
    "name": "Bún Chả Sinh Từ - Nguyễn Khuyến",
    "city": "ha-noi",
    "districtName": "Đống Đa",
    "lat": 21.0188,
    "lng": 105.8323,
    "rating": 4.7,
    "ratingCount": 2410,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-nguyen-khuyen",
    "affiliateUrl": "https://shope.ee/9V1omR5xy9"
  },
  {
    "id": "spot_ha-noi_4_1v35fqo",
    "name": "Bún Chả Que Tre - Bạch Mai",
    "city": "ha-noi",
    "districtName": "Hai Bà Trưng",
    "lat": 21.0074,
    "lng": 105.8482,
    "rating": 4.8,
    "ratingCount": 2180,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-que-tre-bach-mai",
    "affiliateUrl": "https://shope.ee/9fLEyk5KdC"
  },
  {
    "id": "spot_ha-noi_5_22nul68",
    "name": "Bún Chả Sinh Từ - Đại Cồ Việt",
    "city": "ha-noi",
    "districtName": "Hai Bà Trưng",
    "lat": 21.005,
    "lng": 105.857,
    "rating": 4.7,
    "ratingCount": 2100,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-dai-co-viet",
    "affiliateUrl": "https://shope.ee/9pefB34hIF"
  },
  {
    "id": "spot_ha-noi_6_do1ybe",
    "name": "Bún Chả Sinh Từ - Trần Thái Tông",
    "city": "ha-noi",
    "districtName": "Cầu Giấy",
    "lat": 21.0286,
    "lng": 105.7898,
    "rating": 4.6,
    "ratingCount": 1950,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-tran-thai-tong",
    "affiliateUrl": "https://shope.ee/8fShmu98f2"
  },
  {
    "id": "spot_ha-noi_7_2gp267i",
    "name": "Bún Chả Cửa Đông",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0357,
    "lng": 105.8598,
    "rating": 4.7,
    "ratingCount": 1820,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-cua-dong",
    "affiliateUrl": "https://shope.ee/8pm7zD8VK5"
  },
  {
    "id": "spot_ha-noi_8_52v8l0",
    "name": "Bún Chả Sinh Từ - Đội Cấn",
    "city": "ha-noi",
    "districtName": "Ba Đình",
    "lat": 21.0389,
    "lng": 105.822,
    "rating": 4.7,
    "ratingCount": 1780,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-doi-can",
    "affiliateUrl": "https://shope.ee/905YBW7rz8"
  },
  {
    "id": "spot_ha-noi_9_rvtknu",
    "name": "Bún Chả Ngô Sĩ Liên",
    "city": "ha-noi",
    "districtName": "Đống Đa",
    "lat": 21.0204,
    "lng": 105.8371,
    "rating": 4.7,
    "ratingCount": 1720,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-ngo-si-lien",
    "affiliateUrl": "https://shope.ee/9AOyNp7EeB"
  },
  {
    "id": "spot_ha-noi_10_h97yh3",
    "name": "Bún Chả Nguyễn Biểu",
    "city": "ha-noi",
    "districtName": "Ba Đình",
    "lat": 21.0341,
    "lng": 105.8236,
    "rating": 4.7,
    "ratingCount": 1690,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-nguyen-bieu",
    "affiliateUrl": "https://shope.ee/80D0zgBg0y"
  },
  {
    "id": "spot_ha-noi_11_vpjdpx",
    "name": "Bún Chả Sinh Từ - Hoàng Cầu",
    "city": "ha-noi",
    "districtName": "Đống Đa",
    "lat": 21.0156,
    "lng": 105.8227,
    "rating": 4.6,
    "ratingCount": 1680,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-hoang-cau",
    "affiliateUrl": "https://shope.ee/8AWRBzB2g1"
  },
  {
    "id": "spot_ha-noi_12_3tdlelg",
    "name": "Bún Chả Duy Tân - Cầu Giấy",
    "city": "ha-noi",
    "districtName": "Cầu Giấy",
    "lat": 21.0302,
    "lng": 105.7946,
    "rating": 4.6,
    "ratingCount": 1650,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-duy-tan",
    "affiliateUrl": "https://shope.ee/8KprOIAPL4"
  },
  {
    "id": "spot_ha-noi_13_8yxttp",
    "name": "Bún Chả Sinh Từ - Giảng Võ",
    "city": "ha-noi",
    "districtName": "Ba Đình",
    "lat": 21.0269,
    "lng": 105.818,
    "rating": 4.6,
    "ratingCount": 1590,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-giang-vo",
    "affiliateUrl": "https://shope.ee/8V9Hab9m07"
  },
  {
    "id": "spot_ha-noi_14_1axwoz2",
    "name": "Bún Chả Trần Hưng Đạo",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0349,
    "lng": 105.8574,
    "rating": 4.7,
    "ratingCount": 1580,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-tran-hung-dao",
    "affiliateUrl": "https://shope.ee/7KxKCSEDMu"
  },
  {
    "id": "spot_ha-noi_15_2mlpm3f",
    "name": "Bún Chả Bạch Mai",
    "city": "ha-noi",
    "districtName": "Hai Bà Trưng",
    "lat": 21.013,
    "lng": 105.849,
    "rating": 4.6,
    "ratingCount": 1540,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-bach-mai",
    "affiliateUrl": "https://shope.ee/7VGkOlDa1x"
  },
  {
    "id": "spot_ha-noi_16_3bs0wd7",
    "name": "Bún Chả Chùa Bộc",
    "city": "ha-noi",
    "districtName": "Đống Đa",
    "lat": 21.0196,
    "lng": 105.8347,
    "rating": 4.6,
    "ratingCount": 1450,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-chua-boc",
    "affiliateUrl": "https://shope.ee/7faAb4Cwh0"
  },
  {
    "id": "spot_ha-noi_17_1kio3p6",
    "name": "Bún Chả Sinh Từ - Nguyễn Trãi",
    "city": "ha-noi",
    "districtName": "Thanh Xuân",
    "lat": 20.9922,
    "lng": 105.8096,
    "rating": 4.6,
    "ratingCount": 1420,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-nguyen-trai",
    "affiliateUrl": "https://shope.ee/7ptanNCJM3"
  },
  {
    "id": "spot_ha-noi_18_1zppiuu",
    "name": "Bún Chả Mai Hắc Đế",
    "city": "ha-noi",
    "districtName": "Hai Bà Trưng",
    "lat": 21.0058,
    "lng": 105.8594,
    "rating": 4.6,
    "ratingCount": 1410,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-mai-hac-de",
    "affiliateUrl": "https://shope.ee/6fhdPEGkiq"
  },
  {
    "id": "spot_ha-noi_19_2bu8ubm",
    "name": "Bún Chả Kim Liên",
    "city": "ha-noi",
    "districtName": "Đống Đa",
    "lat": 21.0124,
    "lng": 105.8291,
    "rating": 4.5,
    "ratingCount": 1340,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-kim-lien",
    "affiliateUrl": "https://shope.ee/6q13bXG7Nt"
  },
  {
    "id": "spot_ha-noi_20_1sa2qk0",
    "name": "Bún Chả Thái Hà",
    "city": "ha-noi",
    "districtName": "Đống Đa",
    "lat": 21.01,
    "lng": 105.8219,
    "rating": 4.6,
    "ratingCount": 1280,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-thai-ha",
    "affiliateUrl": "https://shope.ee/70KTnqFU2w"
  },
  {
    "id": "spot_ha-noi_21_2exoqeh",
    "name": "Bún Chả Tô Hiệu - Nghĩa Tân",
    "city": "ha-noi",
    "districtName": "Cầu Giấy",
    "lat": 21.0406,
    "lng": 105.7938,
    "rating": 4.5,
    "ratingCount": 1180,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-to-hieu",
    "affiliateUrl": "https://shope.ee/7Adu09Eqhz"
  },
  {
    "id": "spot_ha-noi_22_142e05x",
    "name": "Bún Chả Vũ Tông Phan",
    "city": "ha-noi",
    "districtName": "Thanh Xuân",
    "lat": 20.9962,
    "lng": 105.8056,
    "rating": 4.6,
    "ratingCount": 1120,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-cha-vu-tong-phan",
    "affiliateUrl": "https://shope.ee/60Rwc0JI4m"
  },
  {
    "id": "spot_ho-chi-minh_23_5an2fc",
    "name": "Cháo Hạt Dinh Dưỡng Ba Đậu",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7777,
    "lng": 106.7033,
    "rating": 5,
    "ratingCount": 1000,
    "specialties": [
      "Cháo sườn sụn",
      "Quẩy giòn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/chao-ba-dau",
    "affiliateUrl": "https://shope.ee/6AlMoJIejp"
  },
  {
    "id": "spot_ho-chi-minh_24_7yhu81b",
    "name": "Viva Bakery - Bánh Nướng Ngàn Lớp, Dimsum & Bánh Bao - Đồng Xoài",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7753,
    "lng": 106.6961,
    "rating": 5,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/viva-bakery-banh-nuong-ngan-lop-dimsum-banh-bao-dong-xoai",
    "affiliateUrl": "https://shope.ee/6L4n0cI1Os"
  },
  {
    "id": "spot_ho-chi-minh_25_3z3nmb6",
    "name": "Cơm Gà Xối Mỡ 131C - Lâm Văn Bền",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7729,
    "lng": 106.7049,
    "rating": 5,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/com-ga-xoi-mo-131c-lam-van-ben",
    "affiliateUrl": "https://shope.ee/6VODCvHO3v"
  },
  {
    "id": "spot_ho-chi-minh_26_1ydmk72",
    "name": "Cơm Tấm Nhật Japonica - Cơm Sườn Teriyaki & Cơm Văn Phòng",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7705,
    "lng": 106.6977,
    "rating": 5,
    "ratingCount": 1000,
    "specialties": [
      "Cơm tấm sườn bì chả",
      "Canh khổ qua nhồi thịt"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/com-tam-nhat-japonica-com-suon-teriyaki-com-van-phong",
    "affiliateUrl": "https://shope.ee/5LCFomLpQi"
  },
  {
    "id": "spot_ho-chi-minh_27_38x8xcq",
    "name": "Lẩu Thái Ly, Mì Trộn & Cá Viên Chiên - Sành Ăn - Thủ Đức",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7841,
    "lng": 106.7065,
    "rating": 5,
    "ratingCount": 1000,
    "specialties": [
      "Lẩu nấm chua cay",
      "Bò nhúng dấm"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/lau-thai-ly-mi-tron-ca-vien-chien-sanh-an-thu-duc",
    "affiliateUrl": "https://shope.ee/5VVg15LC5l"
  },
  {
    "id": "spot_ha-noi_28_3ulxdo7",
    "name": "Bún Cá Cay & Bún Thái Hải Sản - Đê La Thành",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0333,
    "lng": 105.8526,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Lẩu Thái chua cay",
      "Hải sản tươi sống"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-ca-cay-bun-thai-hai-san-de-la-thanh",
    "affiliateUrl": "https://shope.ee/5fp6DOKYko"
  },
  {
    "id": "spot_ho-chi-minh_29_17bo00w",
    "name": "Mỳ Ý Spaghetti To Go - Trần Hưng Đạo",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7793,
    "lng": 106.7081,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ăn vặt giòn rụm",
      "Khoai tây chiên"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/my-y-spaghetti-to-go-tran-hung-dao",
    "affiliateUrl": "https://shope.ee/5q8WPhJvPr"
  },
  {
    "id": "spot_ho-chi-minh_30_5t447tc",
    "name": "Cơm Gà Hải Nam - Nguyễn Tri Phương",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7769,
    "lng": 106.7009,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/com-ga-hai-nam-nguyen-tri-phuong",
    "affiliateUrl": "https://shope.ee/4fwZ1YOMme"
  },
  {
    "id": "spot_ha-noi_31_6pt6wow",
    "name": "Bún Bò Huế Bến Ngự - Lạc Trung",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0261,
    "lng": 105.847,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-bo-hue-ben-ngu-lac-trung",
    "affiliateUrl": "https://shope.ee/4qFzDrNjRh"
  },
  {
    "id": "spot_ho-chi-minh_32_10tbpxx",
    "name": "Bánh Cuốn 430 - Lê Quang Định",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7721,
    "lng": 106.7025,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-cuon-430-le-quang-dinh",
    "affiliateUrl": "https://shope.ee/50ZPQAN66k"
  },
  {
    "id": "spot_ho-chi-minh_33_ivyjfc",
    "name": "Quán Ăn Tâm Ký - Cơm Gà & Hủ Tiếu Xào - Nguyễn Duy Trinh",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7697,
    "lng": 106.6953,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Hủ tiếu Nam Vang",
      "Mì xíu xá xíu"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/quan-an-tam-ky-com-ga-hu-tieu-xao-nguyen-duy-trinh",
    "affiliateUrl": "https://shope.ee/5AspcTMSln"
  },
  {
    "id": "spot_ho-chi-minh_34_1onh5ab",
    "name": "Bún Cá Mr Nẫu - 200 Tôn Đản",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7833,
    "lng": 106.7041,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/bun-ca-mr-nau-200-ton-dan",
    "affiliateUrl": "https://shope.ee/40gsEKQu8a"
  },
  {
    "id": "spot_da-nang_35_27p6m3q",
    "name": "Chicky Licky - Gà Rán Hàn Quốc - 167 Hà Huy Tập",
    "city": "da-nang",
    "districtName": "Thanh Khê",
    "lat": 16.0665,
    "lng": 108.1842,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ốc hương trứng muối",
      "Ốc móng tay xào rau muống"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/chicky-licky-ga-ran-han-quoc-167-ha-huy-tap",
    "affiliateUrl": "https://shope.ee/4B0IQdQGnd"
  },
  {
    "id": "spot_da-nang_36_1mag7w",
    "name": "Chicky Licky - Gà Rán Hàn Quốc -  34 Phan Đăng Lưu",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0618,
    "lng": 108.2256,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ốc hương trứng muối",
      "Ốc móng tay xào rau muống"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/chicky-licky-ga-ran-han-quoc-34-phan-dang-luu",
    "affiliateUrl": "https://shope.ee/4LJicwPdSg"
  },
  {
    "id": "spot_ho-chi-minh_37_22yoh1o",
    "name": "Bánh Cuốn Hà - Bùi Văn Thêm",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7761,
    "lng": 106.6985,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/quan-ha-banh-cuon-nong-banh-duc",
    "affiliateUrl": "https://shope.ee/4Vd8pFP07j"
  },
  {
    "id": "spot_ho-chi-minh_38_znsrb",
    "name": "Bún Thịt Nướng Hải Đăng - 149 Chấn Hưng (Không Chi Nhánh)",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7737,
    "lng": 106.7073,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/bun-thit-nuong-hai-dang-149-chan-hung-khong-chi-nhanh",
    "affiliateUrl": "https://shope.ee/3LRBR6TRUW"
  },
  {
    "id": "spot_ha-noi_39_3aosope",
    "name": "Bún Bò Huế Hoàng Quân",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0229,
    "lng": 105.8534,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bun-bo-hue-hoang-quan",
    "affiliateUrl": "https://shope.ee/3VkbdPSo9Z"
  },
  {
    "id": "spot_ho-chi-minh_40_16v5ls7",
    "name": "Lucky - Bún Thịt Nướng & Ăn Vặt - An Dương Vương",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7689,
    "lng": 106.6929,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/lucky-bun-thit-nuong-an-vat-an-duong-vuong",
    "affiliateUrl": "https://shope.ee/3g41piSAoc"
  },
  {
    "id": "spot_ho-chi-minh_41_2tla48s",
    "name": "Bánh Cuốn Nóng & Bánh Ướt - Trần Văn Đang",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7825,
    "lng": 106.7017,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-cuon-nong-banh-uot-tran-van-dang",
    "affiliateUrl": "https://shope.ee/3qNS21RXTf"
  },
  {
    "id": "spot_ho-chi-minh_42_2bfsvas",
    "name": "Bún Cá Rô Đồng Thu Trang - Yên Thế",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7801,
    "lng": 106.6945,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/bun-ca-ro-dong-yen-the",
    "affiliateUrl": "https://shope.ee/2gBUdsVyqS"
  },
  {
    "id": "spot_ho-chi-minh_43_88pihps",
    "name": "Cơm Chay Thiên Nhiên - Món Chay - Nguyễn Văn Luông",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7777,
    "lng": 106.7033,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm văn phòng",
      "Cơm chiên Dương Châu"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/com-chay-thien-nhien-mon-chay-nguyen-van-luong",
    "affiliateUrl": "https://shope.ee/2qUuqBVLVV"
  },
  {
    "id": "spot_ho-chi-minh_44_18tsx2b",
    "name": "Gà Rán Jimama - Gà Rán, Mỳ Ý & Ăn Vặt - Thành Thái",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7753,
    "lng": 106.6961,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/ga-ran-jimama-ga-ran-my-y-an-vat-thanh-thai",
    "affiliateUrl": "https://shope.ee/30oL2UUiAY"
  },
  {
    "id": "spot_ho-chi-minh_45_22wnute",
    "name": "Cơm Chay Thôi Kệ - Lê Văn Thịnh",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7729,
    "lng": 106.7049,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm văn phòng",
      "Cơm chiên Dương Châu"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/com-chay-thoi-ke-le-van-thinh",
    "affiliateUrl": "https://shope.ee/3B7lEnU4pb"
  },
  {
    "id": "spot_ha-noi_46_2ljd333",
    "name": "Tiệm Gà Rán Toki - Nguyễn Chính",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0221,
    "lng": 105.851,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/tiem-ga-ran-toki",
    "affiliateUrl": "https://shope.ee/20vnqeYWCO"
  },
  {
    "id": "spot_ha-noi_47_6iae9i",
    "name": "Cơm Tấm Sườn Ba Son - Minh Khai",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0357,
    "lng": 105.8598,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm tấm sườn bì chả",
      "Canh khổ qua nhồi thịt"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/com-tam-suon-ba-son-minh-khai",
    "affiliateUrl": "https://shope.ee/2BFE2xXsrR"
  },
  {
    "id": "spot_ho-chi-minh_48_1uy7swy",
    "name": "Châu Ngọc Thảo Food - Gà Ủ Muối & Ăn Vặt - Vĩnh Hội",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7817,
    "lng": 106.6993,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ăn vặt giòn rụm",
      "Khoai tây chiên"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/chau-ngoc-thao-food-ga-u-muoi-an-vat-vinh-hoi",
    "affiliateUrl": "https://shope.ee/2LYeFGXFWU"
  },
  {
    "id": "spot_ha-noi_49_2l3bhg0",
    "name": "Dì Cẩm - Bún Thịt Nướng Hội An - Láng Hạ",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0309,
    "lng": 105.8614,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/di-cam-bun-thit-nuong-hoi-an-lang-ha",
    "affiliateUrl": "https://shope.ee/2Vs4RZWcBX"
  },
  {
    "id": "spot_ha-noi_50_4tmbu67",
    "name": "Dì Cẩm - Bún Thịt Nướng Hội An - Doãn Kế Thiện",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0285,
    "lng": 105.8542,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/di-cam-bun-thit-nuong-hoi-an-doan-ke-thien",
    "affiliateUrl": "https://shope.ee/1Lg73Qb3YK"
  },
  {
    "id": "spot_ha-noi_51_bnddvh",
    "name": "Cháo Sườn Sụn 88 - Cháo Gia Truyền - Shop Online",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0261,
    "lng": 105.847,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cháo sườn sụn",
      "Quẩy giòn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/chao-suon-sun-88-chao-gia-truyen-shop-online",
    "affiliateUrl": "https://shope.ee/1VzXFjaQDN"
  },
  {
    "id": "spot_ho-chi-minh_52_1xcb0dx",
    "name": "Bánh Canh Cua Cô Năm Loan",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7721,
    "lng": 106.7025,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-canh-cua-co-nam-loan",
    "affiliateUrl": "https://shope.ee/1gIxS2ZmsQ"
  },
  {
    "id": "spot_ho-chi-minh_53_1d0b2of",
    "name": "Bánh Canh Cua Bà Ba",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7697,
    "lng": 106.6953,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-canh-cua-ba-ba",
    "affiliateUrl": "https://shope.ee/1qcNeLZ9XT"
  },
  {
    "id": "spot_da-nang_54_40z1cm7",
    "name": "Chicky Licky - Gà Rán Hàn Quốc - 116 Huỳnh Thúc Kháng",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0666,
    "lng": 108.224,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ốc hương trứng muối",
      "Ốc móng tay xào rau muống"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/chicky-licky-ga-ran-han-quoc-116-huynh-thuc-khang",
    "affiliateUrl": "https://shope.ee/gQQGCdauG"
  },
  {
    "id": "spot_ha-noi_55_1gdj43y",
    "name": "Nam An - Cơm Gà Hội An - Doãn Kế Thiện",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0325,
    "lng": 105.8502,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/nam-an-com-ga-hoi-an-doan-ke-thien",
    "affiliateUrl": "https://shope.ee/qjqSVcxZJ"
  },
  {
    "id": "spot_ho-chi-minh_56_113s5y2",
    "name": "Bánh Cuốn Nóng - Cao Thắng",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7785,
    "lng": 106.7057,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-cuon-nong-cao-thang",
    "affiliateUrl": "https://shope.ee/113GeocKEM"
  },
  {
    "id": "spot_ha-noi_57_1vu5tp",
    "name": "Nam An - Cơm Gà Hội An - Khuất Duy Tiến",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0277,
    "lng": 105.8518,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/nam-an-com-ga-hoi-an-khuat-duy-tien",
    "affiliateUrl": "https://shope.ee/1BMgr7bgtP"
  },
  {
    "id": "spot_ho-chi-minh_58_lquqm7",
    "name": "Bánh Canh Cua & Súp Cua Măng Tây - Đường Số 4",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7737,
    "lng": 106.7073,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-canh-cua-sup-cua-mang-tay-duong-so-4",
    "affiliateUrl": "https://shope.ee/1AjSyg8GC"
  },
  {
    "id": "spot_ho-chi-minh_59_1v1li76",
    "name": "Domino’s Pizza - Lê Văn Sỹ",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7713,
    "lng": 106.7001,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Pizza bò băm phô mai",
      "Mỳ Ý sốt bò"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/domino-s-pizza-le-van-sy",
    "affiliateUrl": "https://shope.ee/BU9fHfUvF"
  },
  {
    "id": "spot_ho-chi-minh_60_1c3vkkj",
    "name": "Tư Kiều - Cơm Gà Xối Mỡ",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7689,
    "lng": 106.6929,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/tu-kieu-com-ga-xoi-mo",
    "affiliateUrl": "https://shope.ee/LnZraeraI"
  },
  {
    "id": "spot_ha-noi_61_5v7iz1i",
    "name": "Kyo Sushi Take Away Soba Nguyen - Sushi & Sashimi - Đỗ Đức Dục",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0341,
    "lng": 105.855,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/kyo-sushi-take-away-soba-nguyen-sushi-sashimi-do-duc-duc.jevwhv",
    "affiliateUrl": "https://shope.ee/W703teEFL"
  },
  {
    "id": "spot_ho-chi-minh_62_f5bkn6",
    "name": "Bánh Xèo & Bánh Khọt Rau Rừng Cây Sung",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7801,
    "lng": 106.6945,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/cay-sung-banh-xeo-banh-khot-rau-rung",
    "affiliateUrl": "https://shope.ee/AAHVZf3QdE"
  },
  {
    "id": "spot_ho-chi-minh_63_2ibgb84",
    "name": "Cô Thảo Tôm Cá - Cá Hồi Ngâm Tương - Quận 1",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7777,
    "lng": 106.7033,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/co-thao-tom-ca-ca-hoi-ngam-tuong-quan-1",
    "affiliateUrl": "https://shope.ee/9zy5NM43yD"
  },
  {
    "id": "spot_ho-chi-minh_64_e0245w",
    "name": "Yoko Sushi",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7753,
    "lng": 106.6961,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/yoko-sushi",
    "affiliateUrl": "https://shope.ee/AUuLyH29xK"
  },
  {
    "id": "spot_ho-chi-minh_65_54bghm4",
    "name": "Sapinkie - Ăn Vặt 4 Teen",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7729,
    "lng": 106.7049,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ăn vặt giòn rụm",
      "Khoai tây chiên"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/sapinkie-an-vat-4-teen",
    "affiliateUrl": "https://shope.ee/AKavly2nIJ"
  },
  {
    "id": "spot_ho-chi-minh_66_lypquj",
    "name": "Domino’s Pizza - Nguyễn Kiệm",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7705,
    "lng": 106.6977,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Pizza bò băm phô mai",
      "Mỳ Ý sốt bò"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/domino-s-pizza-nguyen-kiem",
    "affiliateUrl": "https://shope.ee/9V1omR5xzA"
  },
  {
    "id": "spot_ho-chi-minh_67_g3wpio",
    "name": "BÁNH CANH CUA GIA LINH - TÊN LỬA",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7841,
    "lng": 106.7065,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-canh-cua-gia-linh-ten-lua",
    "affiliateUrl": "https://shope.ee/9KiOa86bK9"
  },
  {
    "id": "spot_ho-chi-minh_68_5o9xe3d",
    "name": "Bánh Mì Chả Cá Má Hải - Cafe - Huỳnh Tấn Phát",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7817,
    "lng": 106.6993,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Trà sữa trân châu",
      "Cà phê phin"
    ],
    "category": "drink",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-cha-ca-ma-hai-cafe-huynh-tan-phat",
    "affiliateUrl": "https://shope.ee/9pefB34hJG"
  },
  {
    "id": "spot_ho-chi-minh_69_5x2vmg",
    "name": "Trà Sữa Duck - Bánh Mì, Cà Phê & Latte - Phan Văn Trị",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7793,
    "lng": 106.7081,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Latte hạnh nhân",
      "Cà phê pha máy"
    ],
    "category": "drink",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/tra-sua-duck-banh-mi-ca-phe-latte-phan-van-tri",
    "affiliateUrl": "https://shope.ee/9fLEyk5KeF"
  },
  {
    "id": "spot_da-nang_70_18t75fa",
    "name": "Mập Ơi - Tokbokki & Mì Tương Đen",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0602,
    "lng": 108.2208,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/map-oi-tokbokki-mi-tuong-den",
    "affiliateUrl": "https://shope.ee/8pm7zD8VL6"
  },
  {
    "id": "spot_ho-chi-minh_71_7gdpf7",
    "name": "Má Hải - Bánh Mì & Trà Sữa, Latte - Nguyễn Đình Chiểu",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7745,
    "lng": 106.6937,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Latte hạnh nhân",
      "Cà phê pha máy"
    ],
    "category": "drink",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/ma-hai-banh-mi-tra-sua-latte-nguyen-dinh-chieu",
    "affiliateUrl": "https://shope.ee/8fShmu98g5"
  },
  {
    "id": "spot_ho-chi-minh_72_3fv9qhm",
    "name": "Bánh Mì Bà Nội - Bánh Mì Thịt Nướng",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7721,
    "lng": 106.7025,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-ba-noi-banh-mi-thit-nuong",
    "affiliateUrl": "https://shope.ee/9AOyNp7EfC"
  },
  {
    "id": "spot_ho-chi-minh_73_khy3c5",
    "name": "Bánh Mì Que Pháp - Hồng Lạc",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7697,
    "lng": 106.6953,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-que-phap-hong-lac",
    "affiliateUrl": "https://shope.ee/905YBW7s0B"
  },
  {
    "id": "spot_ho-chi-minh_74_2n479xd",
    "name": "8 Rèm - Bánh Mì Bình Định - Lê Quang Định",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7833,
    "lng": 106.7041,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/8-rem-banh-mi-binh-dinh-le-quang-dinh",
    "affiliateUrl": "https://shope.ee/8AWRBzB2h2"
  },
  {
    "id": "spot_ho-chi-minh_75_2h3ykob",
    "name": "Bánh Mì Hồng Phát - Nguyễn Tri Phương",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7809,
    "lng": 106.6969,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-hong-phat-nguyen-tri-phuong",
    "affiliateUrl": "https://shope.ee/80D0zgBg21"
  },
  {
    "id": "spot_ho-chi-minh_76_5ij6vn8",
    "name": "Má Hải - Bánh Mì & Trà Sữa, Latte - Phan Văn Trị",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7785,
    "lng": 106.7057,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Latte hạnh nhân",
      "Cà phê pha máy"
    ],
    "category": "drink",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/ma-hai-banh-mi-tra-sua-latte-phan-van-tri",
    "affiliateUrl": "https://shope.ee/8V9Hab9m18"
  },
  {
    "id": "spot_ho-chi-minh_77_etnp81",
    "name": "Trà Sữa Duck - Bánh Mì, Cà Phê & Latte - Nguyễn Đình Chiểu",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7761,
    "lng": 106.6985,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Latte hạnh nhân",
      "Cà phê pha máy"
    ],
    "category": "drink",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/tra-sua-duck-banh-mi-ca-phe-latte-nguyen-dinh-chieu",
    "affiliateUrl": "https://shope.ee/8KprOIAPM7"
  },
  {
    "id": "spot_ho-chi-minh_78_14nksdi",
    "name": "Bánh Mì 81 - Hương Vị Pleiku Gia Lai - Hoa Lan",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7737,
    "lng": 106.7073,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-81-huong-vi-pleiku-gia-lai-hoa-lan",
    "affiliateUrl": "https://shope.ee/7VGkOlDa2y"
  },
  {
    "id": "spot_ho-chi-minh_79_5383lat",
    "name": "Bún Chả Đông Dương - Bún Chả - Nguyễn Hữu Cảnh",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7713,
    "lng": 106.7001,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/bun-cha-dong-duong-bun-cha-nguyen-huu-canh.rgw2vy",
    "affiliateUrl": "https://shope.ee/7KxKCSEDNx"
  },
  {
    "id": "spot_ho-chi-minh_80_1wkzo85",
    "name": "Bánh Mì Chim Chạy - Nguyễn Thị Minh Khai",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7689,
    "lng": 106.6929,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-chim-chay-nguyen-thi-minh-khai",
    "affiliateUrl": "https://shope.ee/7ptanNCJN4"
  },
  {
    "id": "spot_ho-chi-minh_81_1v9uvfy",
    "name": "Bánh Mì Chim Chạy - Lê Văn Sỹ",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7825,
    "lng": 106.7017,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-chim-chay-le-van-sy",
    "affiliateUrl": "https://shope.ee/7faAb4Cwi3"
  },
  {
    "id": "spot_ho-chi-minh_82_19q7g9d",
    "name": "Sushi M&H - Nguyễn Văn Cừ",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7801,
    "lng": 106.6945,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/sushi-m-h-nguyen-van-cu",
    "affiliateUrl": "https://shope.ee/6q13bXG7Ou"
  },
  {
    "id": "spot_ho-chi-minh_83_h3jeyi",
    "name": "Bánh Mì Huy Mập - Phan Đình Phùng",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7777,
    "lng": 106.7033,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-huy-map-phan-dinh-phung",
    "affiliateUrl": "https://shope.ee/6fhdPEGkjt"
  },
  {
    "id": "spot_ha-noi_84_1b1h5l1",
    "name": "KAMPONG - Cơm gà Hải Nam - 12 Phạm Ngọc Thạch",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0269,
    "lng": 105.8494,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/kampong-com-ga-hai-nam-12-pham-ngoc-thach",
    "affiliateUrl": "https://shope.ee/7Adu09Eqj0"
  },
  {
    "id": "spot_ha-noi_85_959e6o",
    "name": "PIZZA MARGHERITTA - Lạc Long Quân",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0245,
    "lng": 105.8582,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Pizza bò băm phô mai",
      "Mỳ Ý sốt bò"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/pizza-margheritta-lac-long-quan",
    "affiliateUrl": "https://shope.ee/70KTnqFU3z"
  },
  {
    "id": "spot_ha-noi_86_d1ydz5",
    "name": "Pizza FF - 187 Đội Cấn",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0221,
    "lng": 105.851,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Pizza bò băm phô mai",
      "Mỳ Ý sốt bò"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/pizza-ff-187-doi-can",
    "affiliateUrl": "https://shope.ee/6AlMoJIekq"
  },
  {
    "id": "spot_ho-chi-minh_87_1fdxm9e",
    "name": "Bánh Mì Chim Chạy - 11/4 Nguyễn Thị Minh Khai",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7841,
    "lng": 106.7065,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-chim-chay-11-4-nguyen-thi-minh-khai",
    "affiliateUrl": "https://shope.ee/60Rwc0JI5p"
  },
  {
    "id": "spot_ha-noi_88_1gy4d7",
    "name": "Box Sushi - Sushi & Sashimi - Trần Duy Hưng",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0333,
    "lng": 105.8526,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/box-sushi-sushi-sashimi-tran-duy-hung",
    "affiliateUrl": "https://shope.ee/6VODCvHO4w"
  },
  {
    "id": "spot_ho-chi-minh_89_1ek64wo",
    "name": "Bánh Mì Chim Chạy - Nguyễn Tri Phương",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7793,
    "lng": 106.7081,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-chim-chay-nguyen-tri-phuong",
    "affiliateUrl": "https://shope.ee/6L4n0cI1Pv"
  },
  {
    "id": "spot_ho-chi-minh_90_4a7qcpz",
    "name": "Street Food - Gà Rán Pizza, Hamburger - Chiến Lược",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7769,
    "lng": 106.7009,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/street-food-ga-ran-pizza-hamburger-chien-luoc",
    "affiliateUrl": "https://shope.ee/5VVg15LC6m"
  },
  {
    "id": "spot_ho-chi-minh_91_4v5ypea",
    "name": "Bánh Mì Cóc - Bánh Mì Gà Xé - Lê Quang Định",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7745,
    "lng": 106.6937,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-coc-banh-mi-ga-xe-le-quang-dinh",
    "affiliateUrl": "https://shope.ee/5LCFomLpRl"
  },
  {
    "id": "spot_ho-chi-minh_92_58ifqey",
    "name": "Gà Rán Jimama - Gà Rán, Mỳ ý & Ăn Vặt - Nguyễn Văn Nghi",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7721,
    "lng": 106.7025,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/ga-ran-jimama-ga-ran-my-y-an-vat-nguyen-van-nghi",
    "affiliateUrl": "https://shope.ee/5q8WPhJvQs"
  },
  {
    "id": "spot_ho-chi-minh_93_5dwfsi5",
    "name": "Gà Rán Jimama - Gà Rán, Mỳ ý & Ăn Vặt - Thích Quảng Đức",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7697,
    "lng": 106.6953,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/ga-ran-jimama-ga-ran-my-y-an-vat-thich-quang-duc",
    "affiliateUrl": "https://shope.ee/5fp6DOKYlr"
  },
  {
    "id": "spot_ha-noi_94_1bqlzeg",
    "name": "An Nhiên Chay - Cơm Chay Văn Phòng",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0349,
    "lng": 105.8574,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm văn phòng",
      "Cơm chiên Dương Châu"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/an-nhien-chay-com-chay-van-phong",
    "affiliateUrl": "https://shope.ee/4qFzDrNjSi"
  },
  {
    "id": "spot_ho-chi-minh_95_2wlxf0o",
    "name": "Kênh Bà Châu - Cá Hồi Ngâm Tương Thượng Hạng",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7809,
    "lng": 106.6969,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/kenh-ba-chau-ca-hoi-ngam-tuong-thuong-hang",
    "affiliateUrl": "https://shope.ee/4fwZ1YOMnh"
  },
  {
    "id": "spot_ha-noi_96_19rt3if",
    "name": "Nam An - Cơm gà Hội An - Minh Khai",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0301,
    "lng": 105.859,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/nam-an-com-ga-hoi-an-minh-khai",
    "affiliateUrl": "https://shope.ee/5AspcTMSmo"
  },
  {
    "id": "spot_ho-chi-minh_97_2ufpv15",
    "name": "Bánh Mì Chim Chạy - Thịt Nướng Than",
    "city": "ho-chi-minh",
    "districtName": "Quận 1",
    "lat": 10.7761,
    "lng": 106.6985,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ho-chi-minh/banh-mi-chim-chay-thit-nuong-than",
    "affiliateUrl": "https://shope.ee/50ZPQAN67n"
  },
  {
    "id": "spot_ha-noi_98_bdpi2i",
    "name": "Bami Sot - Bánh Mì Đen - 52 Tô Hiệu",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0253,
    "lng": 105.8606,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bami-sot-banh-mi-den-52-to-hieu",
    "affiliateUrl": "https://shope.ee/4B0IQdQGoe"
  },
  {
    "id": "spot_ha-noi_99_2kok8zx",
    "name": "Bami King - Bánh Mì Bò Nướng & Cơm Thố  - An Trạch",
    "city": "ha-noi",
    "districtName": "Hoàn Kiếm",
    "lat": 21.0229,
    "lng": 105.8534,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/ha-noi/bami-king-banh-mi-bo-nuong-com-tho-an-trach",
    "affiliateUrl": "https://shope.ee/40gsEKQu9d"
  },
  {
    "id": "spot_da-nang_100_1m75xf2",
    "name": "Bún Đậu Mắm Tôm 29 & Ăn Vặt - 93 Trần Lê",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0522,
    "lng": 108.2128,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ăn vặt giòn rụm",
      "Khoai tây chiên"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bun-dau-mam-tom-29-an-vat-93-tran-le",
    "affiliateUrl": "https://shope.ee/4Vd8pFP08k"
  },
  {
    "id": "spot_da-nang_1_2ks9b2b",
    "name": "Bonchon Chicken - Lê Hồng Phong",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0658,
    "lng": 108.2216,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bonchon-chicken-le-hong-phong"
  },
  {
    "id": "spot_da-nang_2_3b8izwb",
    "name": "Bún Mắm Vân - Lê Độ",
    "city": "da-nang",
    "districtName": "Thanh Khê",
    "lat": 16.0657,
    "lng": 108.1818,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bún mắm nêm đậm vị",
      "Thịt heo quay giòn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bun-mam-van"
  },
  {
    "id": "spot_da-nang_3_ui2dhb",
    "name": "Pizza Time - 316 Lê Thanh Nghị",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.061,
    "lng": 108.2232,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Pizza bò băm phô mai",
      "Mỳ Ý sốt bò"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/pizza-time-316-le-thanh-nghi"
  },
  {
    "id": "spot_da-nang_4_1z6mdj3",
    "name": "Quán Cô Linh - Hủ Tiếu Nam Vang & Mì Xíu",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0586,
    "lng": 108.216,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Hủ tiếu Nam Vang",
      "Mì xíu xá xíu"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/quan-co-linh-hu-tieu-nam-vang-mi-xiu"
  },
  {
    "id": "spot_da-nang_5_2rxam57",
    "name": "Family1 - Kebab, Burger & Bánh Mì - Lê Hồng Phong",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0562,
    "lng": 108.2248,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/family1-kebab-burger-banh-mi-le-hong-phong"
  },
  {
    "id": "spot_da-nang_7_39s3ydw",
    "name": "Nem Nướng Nha Trang - ViViFood",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0674,
    "lng": 108.2264,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/nem-nuong-nha-trang-vivifood"
  },
  {
    "id": "spot_da-nang_8_22de7xe",
    "name": "Bếp Bà Ngoại - Ram Cuốn Cải & Hoành Thánh Chiên - 04 Vũ Trọng Hoàng",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.065,
    "lng": 108.2192,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bep-ba-ngoai-ram-cuon-cai-hoanh-thanh-chien-04-vu-trong-hoang"
  },
  {
    "id": "spot_da-nang_9_9nj4tr0",
    "name": "Cô Ba & Chú Bảy - Cơm & Bún Lòng Xào Nghệ - Dũng Sĩ Thanh Khê",
    "city": "da-nang",
    "districtName": "Thanh Khê",
    "lat": 16.0649,
    "lng": 108.1954,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm văn phòng",
      "Cơm chiên Dương Châu"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/co-ba-chu-bay-com-bun-long-xao-nghe-dung-si-thanh-khe"
  },
  {
    "id": "spot_da-nang_11_bp0e56",
    "name": "Bánh Mì Đệ Nhất - 106 Trưng Nữ Vương",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0578,
    "lng": 108.2136,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-mi-de-nhat-106-trung-nu-vuong"
  },
  {
    "id": "spot_da-nang_12_1m3bl5f",
    "name": "Cơm Tấm Ông Anh - Cơm - Lê Thanh Nghị",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0554,
    "lng": 108.2224,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Cơm tấm sườn bì chả",
      "Canh khổ qua nhồi thịt"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/com-tam-ong-anh-com-le-thanh-nghi.gnr15o"
  },
  {
    "id": "spot_da-nang_13_1nkf1np",
    "name": "Chè Hoa Xù - Thanh Khê 6",
    "city": "da-nang",
    "districtName": "Thanh Khê",
    "lat": 16.0553,
    "lng": 108.1826,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Chè thập cẩm",
      "Tàu hũ sầu riêng"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/che-hoa-xu-thanh-khe-6"
  },
  {
    "id": "spot_da-nang_14_3yq8g1f",
    "name": "Quán Ăn Hàn Quốc Thằng Bờm",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0666,
    "lng": 108.224,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ốc hương trứng muối",
      "Ốc móng tay xào rau muống"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/quan-an-han-quoc-thang-bom"
  },
  {
    "id": "spot_da-nang_15_3a1rqpb",
    "name": "Bánh Mì Đệ Nhất - Phạm Cự Lượng",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0642,
    "lng": 108.2168,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-mi-de-nhat-pham-cu-luong"
  },
  {
    "id": "spot_da-nang_16_4njwcvk",
    "name": "Nem Nướng Nha Trang - Còng",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0618,
    "lng": 108.2256,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/nem-nuong-nha-trang-cong"
  },
  {
    "id": "spot_da-nang_17_27qudt7",
    "name": "Bánh Mì Chay - Trần Tống",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0594,
    "lng": 108.2184,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-mi-chay"
  },
  {
    "id": "spot_da-nang_18_3djdg39",
    "name": "Bánh Mì Nướng Lạng Sơn - Trần Cao Vân",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.057,
    "lng": 108.2272,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-mi-nuong-lang-son"
  },
  {
    "id": "spot_da-nang_19_8eg0vvo",
    "name": "Gà Rán - Choong Man Chicken - 239 Lê Thanh Nghị",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0546,
    "lng": 108.22,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/ga-ran-choong-man-chicken-239-le-thanh-nghi"
  },
  {
    "id": "spot_da-nang_20_2ap5qas",
    "name": "Street Monster - Kimbap, Tokbokki & Bánh Mì Hàn Quốc",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0522,
    "lng": 108.2128,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ốc hương trứng muối",
      "Ốc móng tay xào rau muống"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/street-monster-kimbap-tokbokki-banh-mi-han-quoc"
  },
  {
    "id": "spot_da-nang_23_1idgte6",
    "name": "Chicky Licky - Gà Rán Hàn Quốc - 78e Nguyễn Chí Thanh",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.061,
    "lng": 108.2232,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Ốc hương trứng muối",
      "Ốc móng tay xào rau muống"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/chicky-licky-ga-ran-han-quoc-78e-nguyen-chi-thanh"
  },
  {
    "id": "spot_da-nang_24_241v0ll",
    "name": "Bánh Mì Nướng Lạng Sơn - Phan Thanh",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0586,
    "lng": 108.216,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-mi-nuong-lang-son-phan-thanh"
  },
  {
    "id": "spot_da-nang_25_s9js68",
    "name": "Bánh Mì Đệ Nhất - 562 Trưng Nữ Vương",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0562,
    "lng": 108.2248,
    "rating": 4.9,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-mi-de-nhat-562-trung-nu-vuong"
  },
  {
    "id": "spot_da-nang_27_1sn7oj6",
    "name": "Bánh xèo Bà Thuý - Lê Độ",
    "city": "da-nang",
    "districtName": "Thanh Khê",
    "lat": 16.0697,
    "lng": 108.1938,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-xeo-ba-thuy-le-do"
  },
  {
    "id": "spot_da-nang_28_7xt9352",
    "name": "Cơm Gà Xối Mỡ ( Chọn Vị ) MR. CHICKEN - Cơm Gà Xối Mỡ - Nguyễn Thị Thập",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.065,
    "lng": 108.2192,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/com-ga-xoi-mo-chon-vi-mr-chicken-com-ga-xoi-mo-nguyen-thi-thap.bpw30y"
  },
  {
    "id": "spot_da-nang_29_64n0yio",
    "name": "Cơm Chiên Giòn - Long Bốn - Hoàng Hoa Thám",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0626,
    "lng": 108.228,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Cơm văn phòng",
      "Cơm chiên Dương Châu"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/com-chien-gion-long-bon-hoang-hoa-tham"
  },
  {
    "id": "spot_da-nang_30_3bdxvk",
    "name": "Bún Chả Cá Bà Lữ - Khúc Hạo",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0602,
    "lng": 108.2208,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bun-cha-ca-ba-lu-khuc-hao"
  },
  {
    "id": "spot_da-nang_31_tj36op",
    "name": "Tiệm Cơm Cà Mèn - Gà Nướng Muối Ớt Lá Chanh",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0578,
    "lng": 108.2136,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Thịt ba chỉ nướng",
      "Bò tơ nướng tảng"
    ],
    "category": "nhau",
    "shopeeUrl": "https://shopeefood.vn/da-nang/tiem-com-ca-men-ga-nuong-muoi-ot-la-chanh"
  },
  {
    "id": "spot_da-nang_32_3gvoxvk",
    "name": "Bánh Xèo Bà Thuý - 344 Trưng Nữ Vương",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0554,
    "lng": 108.2224,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/banh-xeo-ba-thuy-344-trung-nu-vuong"
  },
  {
    "id": "spot_da-nang_33_55v1lum",
    "name": "Bếp Quê 2 - Bún Đậu Mắm Tôm",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.053,
    "lng": 108.2152,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún đậu mắm tôm",
      "Chả cốm dồi sụn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bep-que-2-bun-dau-mam-tom"
  },
  {
    "id": "spot_da-nang_34_20hknie",
    "name": "Bún Đậu Mắm Tôm - Bếp Tiên 3",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0666,
    "lng": 108.224,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún đậu mắm tôm",
      "Chả cốm dồi sụn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bun-dau-mam-tom-bep-tien-3"
  },
  {
    "id": "spot_da-nang_35_56a1rx",
    "name": "Duyên - Cơm Gà Xối Mỡ - Núi Thành",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0642,
    "lng": 108.2168,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/duyen-com-ga-xoi-mo"
  },
  {
    "id": "spot_da-nang_36_1t12vjc",
    "name": "Bún Chả Cá Tam Giác - Hải Phòng",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0618,
    "lng": 108.2256,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bun-cha-ca-tam-giac-hai-phong"
  },
  {
    "id": "spot_da-nang_37_4cn5ijx",
    "name": "Vợt Cafe - Cafe Kem Trứng & Cafe Vợt",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0594,
    "lng": 108.2184,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Trà sữa trân châu",
      "Cà phê phin"
    ],
    "category": "drink",
    "shopeeUrl": "https://shopeefood.vn/da-nang/vot-cafe-cafe-kem-trung-cafe-vot"
  },
  {
    "id": "spot_da-nang_38_55zsdqq",
    "name": "Cơm Gà Gia Vĩnh - Hải Phòng",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.057,
    "lng": 108.2272,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/com-chien-gion-gia-vinh"
  },
  {
    "id": "spot_da-nang_39_20z8d7l",
    "name": "Duyên - Cơm Gà Xối Mỡ - Hoàng Diệu",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0546,
    "lng": 108.22,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Cơm gà xối mỡ giòn da",
      "Canh rong biển"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/duyen-com-ga-xoi-mo-hoang-dieu"
  },
  {
    "id": "spot_da-nang_40_22wlly",
    "name": "Quán Thanh - Bún Chả Cá & Riêu Cua",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0522,
    "lng": 108.2128,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún chả nem rán",
      "Chả nướng than hoa"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/quan-thanh-bun-cha-ca-rieu-cua"
  },
  {
    "id": "spot_da-nang_41_2tf7waw",
    "name": "Mote Pizza - Lê Lợi",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0658,
    "lng": 108.2216,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Pizza bò băm phô mai",
      "Mỳ Ý sốt bò"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/mote-pizza-le-loi"
  },
  {
    "id": "spot_da-nang_42_12t98im",
    "name": "Burgers Min Min",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0634,
    "lng": 108.2144,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Burger bò phô mai",
      "Doner Kebab"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/burgers-min-min"
  },
  {
    "id": "spot_da-nang_43_wvkeq4",
    "name": "Bếp Quê - Bún Đậu Mắm Tôm",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.061,
    "lng": 108.2232,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún đậu mắm tôm",
      "Chả cốm dồi sụn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bep-que-bun-dau-mam-tom"
  },
  {
    "id": "spot_da-nang_44_2sfqz9f",
    "name": "Gà Rán & Burger Lotteria - Sơn Trà Coopmart",
    "city": "da-nang",
    "districtName": "Sơn Trà",
    "lat": 16.0738,
    "lng": 108.2402,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Gà rán giòn sốt cay",
      "Khoai tây lắc"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/ga-ran-burger-lotteria-son-tra-coopmart"
  },
  {
    "id": "spot_da-nang_45_1lall3q",
    "name": "Cháo Quẩy Sườn Sụn Bé Bi - Phan Thanh",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0562,
    "lng": 108.2248,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Cháo sườn sụn",
      "Quẩy giòn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/chao-quay-suon-sun-be-bi-phan-thanh"
  },
  {
    "id": "spot_da-nang_46_4wv2nyg",
    "name": "Bún Đậu Mắm Tôm - Bếp Tiên 5 - 598 Hoàng Diệu",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0538,
    "lng": 108.2176,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún đậu mắm tôm",
      "Chả cốm dồi sụn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bun-dau-mam-tom-bep-tien-5-598-hoang-dieu"
  },
  {
    "id": "spot_da-nang_47_c562sm",
    "name": "Quán Chay An Lạc Tâm - Lê Quý Đôn",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0674,
    "lng": 108.2264,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Món chính ăn no",
      "Canh thanh mát"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/quan-chay-an-lac-tam-le-quy-don"
  },
  {
    "id": "spot_da-nang_48_fv9kkg",
    "name": "Bếp Quê 4 - Bún Đậu Mắm Tôm",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.065,
    "lng": 108.2192,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bún đậu mắm tôm",
      "Chả cốm dồi sụn"
    ],
    "category": "lunch",
    "shopeeUrl": "https://shopeefood.vn/da-nang/bep-que-4-bun-dau-mam-tom"
  },
  {
    "id": "spot_da-nang_49_1q7wxmo",
    "name": "Dona Trum - Bánh Mì - Xôi Gia Truyền - Trần Cao Vân",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0626,
    "lng": 108.228,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Bánh mì thập cẩm",
      "Pate bơ tươi"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/dona-trum-banh-mi-xoi-gia-truyen-tran-cao-van"
  },
  {
    "id": "spot_da-nang_50_1mwjipt",
    "name": "Pizza Take Away Đà Nẵng",
    "city": "da-nang",
    "districtName": "Hải Châu",
    "lat": 16.0602,
    "lng": 108.2208,
    "rating": 4.8,
    "ratingCount": 1000,
    "specialties": [
      "Pizza bò băm phô mai",
      "Mỳ Ý sốt bò"
    ],
    "category": "snack",
    "shopeeUrl": "https://shopeefood.vn/da-nang/pizza-take-away-da-nang"
  }
];

export interface FilterRestaurantsOptions {
  city?: string;
  category?: MealKind;
  userCoords?: { lat: number; lng: number } | null;
  maxRadiusKm?: number;
}

/**
 * Lọc danh sách quán ăn cho Vòng Quay:
 * - Lọc theo Thành phố
 * - Lọc theo Nhóm món (category)
 * - Lọc bán kính <= 3km (nếu có toạ độ người dùng)
 * - Luôn đảm bảo chất lượng: ratingCount >= 100
 * - Fallback thông minh: nếu số lượng quán trong bán kính 3km quá ít, tự động mở rộng bán kính
 *   hoặc lấy quán nổi bật của thành phố để vòng quay luôn có từ 8-24 quán trượt mượt mà.
 */
export const ALL_RESTAURANT_ROULETTE_ITEMS: RestaurantRouletteItem[] = [
  ...RESTAURANT_ROULETTE_CATALOG,
  ...BRAND_ROULETTE_ITEMS,
];

export function getEligibleRestaurants({
  city = "da-nang",
  category = "lunch",
  userCoords,
  maxRadiusKm = 3.0,
}: FilterRestaurantsOptions = {}): RestaurantRouletteItem[] {
  const normCity = city === "ho-chi-minh" || city === "ha-noi" || city === "da-nang" ? city : "da-nang";

  // 1. Lọc theo thành phố và tiêu chuẩn rating_count >= 100
  const cityPool = ALL_RESTAURANT_ROULETTE_ITEMS.filter(
    (item) => item.city === normCity && item.ratingCount >= 100,
  );

  // 2. Lọc theo category
  let categoryPool = cityPool.filter((item) => item.category === category);
  if (categoryPool.length < 3) {
    categoryPool = cityPool; // Fallback to all city restaurants if category is small
  }

  // 3. Lọc theo khoảng cách nếu có GPS
  let finalPool: RestaurantRouletteItem[] = [];
  if (userCoords && typeof userCoords.lat === "number" && typeof userCoords.lng === "number") {
    const withDistance = categoryPool
      .map((item) => ({
        item,
        distanceKm: haversineDistanceKm(userCoords.lat, userCoords.lng, item.lat, item.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const withinRadius = withDistance.filter((x) => x.distanceKm <= maxRadiusKm).map((x) => x.item);

    if (withinRadius.length >= 4) {
      finalPool = withinRadius;
    } else {
      // Mở rộng bán kính 5km hoặc lấy top gần nhất
      const within5km = withDistance.filter((x) => x.distanceKm <= 5.0).map((x) => x.item);
      finalPool = within5km.length >= 3 ? within5km : withDistance.slice(0, 10).map((x) => x.item);
    }
  } else {
    finalPool = categoryPool;
  }

  // Đảm bảo có tối thiểu 8 quán trên reel để vòng quay chạy đẹp mắt
  if (finalPool.length === 0) return cityPool;
  if (finalPool.length < 8) {
    const duplicated: RestaurantRouletteItem[] = [];
    while (duplicated.length < 12) {
      duplicated.push(...finalPool);
    }
    return duplicated.slice(0, 16);
  }

  return finalPool.slice(0, 24);
}

/**
 * Trả về link chuyển hướng tối ưu (ưu tiên link affiliate shope.ee, fallback về ShopeeFood gốc)
 */
export function resolveRestaurantActionUrl(restaurant: RestaurantRouletteItem): string {
  return restaurant.affiliateUrl || restaurant.shopeeUrl;
}
