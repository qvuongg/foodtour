/**
 * Dữ liệu và dịch vụ tuyển chọn Top Quán Ngon theo Quận (Curated District Spots Checklist)
 * Dành riêng cho trải nghiệm Food Tour & Đồ Uống tại các quận của Đà Nẵng
 */

import { slugifySubId } from "./smart-category-hub";

export interface DistrictSpot {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  ratingCount: number;
  specialties: string[];
  badge?: string;
  affiliateUrl?: string;
  originalUrl: string;
}

export interface DistrictInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const DA_NANG_DISTRICTS: DistrictInfo[] = [
  { id: "lien-chieu", name: "Liên Chiểu", lat: 16.0694, lng: 108.1475 },
  { id: "hai-chau", name: "Hải Châu", lat: 16.0602, lng: 108.2208 },
  { id: "thanh-khe", name: "Thanh Khê", lat: 16.0625, lng: 108.1882 },
  { id: "son-tra", name: "Sơn Trà", lat: 16.0754, lng: 108.245 },
  { id: "ngu-hanh-son", name: "Ngũ Hành Sơn", lat: 16.042, lng: 108.242 },
  { id: "cam-le", name: "Cẩm Lệ", lat: 16.0185, lng: 108.1952 },
];

export const CURATED_DRINK_SPOTS: DistrictSpot[] = [
  // === QUẬN LIÊN CHIỂU (Khu Đại học Bách Khoa, Sư Phạm, Hoà Khánh) ===
  {
    id: "lc_cafe_muoi_chu_long",
    name: "Cà Phê Muối Chú Long - Nguyễn Lương Bằng",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "482 Nguyễn Lương Bằng, P. Hoà Khánh Bắc, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.0735,
    lng: 108.1432,
    rating: 4.8,
    ratingCount: 1450,
    specialties: ["Cà phê muối", "Cà phê dừa"],
    badge: "🔥 #1 Cà Phê Muối Hot Trend",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/ca-phe-muoi-chu-long-nguyen-luong-bang",
  },
  {
    id: "lc_tra_sua_bong",
    name: "Trà Sữa Bông - Ngô Văn Sở",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "123 Ngô Văn Sở, P. Hoà Khánh Nam, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.0682,
    lng: 108.1518,
    rating: 4.8,
    ratingCount: 1280,
    specialties: ["Trà sữa nướng trân châu", "Trà dâu tây tằm"],
    badge: "⭐ Quán Ruột Sinh Viên BK",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/tra-sua-bong-ngo-van-so",
  },
  {
    id: "lc_phuc_long",
    name: "Phúc Long Coffee & Tea - Nguyễn Lương Bằng",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "328 Nguyễn Lương Bằng, P. Hoà Khánh Bắc, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.069,
    lng: 108.1485,
    rating: 4.7,
    ratingCount: 1850,
    specialties: ["Trà đào cam sả", "Trà ô long sữa"],
    badge: "👑 Trà Đậm Vị Chuẩn Gu",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/phuc-long-coffee-tea-nguyen-luong-bang",
  },
  {
    id: "lc_the_alley",
    name: "The Alley - Trà Sữa Tôn Đức Thắng",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "596 Tôn Đức Thắng, P. Hoà Khánh Nam, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.0622,
    lng: 108.1585,
    rating: 4.6,
    ratingCount: 920,
    specialties: ["Sữa tươi trân châu đường đen", "Lục trà nhài"],
    badge: "🏆 Top Trân Châu Đường Đen",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/the-alley-ton-duc-thang",
  },
  {
    id: "lc_rau_ma_mix",
    name: "Rau Má Mix & Bà Già - Nguyễn Lương Bằng",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "245 Nguyễn Lương Bằng, P. Hoà Khánh Bắc, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.0712,
    lng: 108.145,
    rating: 4.8,
    ratingCount: 860,
    specialties: ["Rau má sữa dừa", "Rau má đậu xanh sầu riêng"],
    badge: "🌿 Thanh Mát Tự Nhiên",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/rau-ma-mix-nguyen-luong-bang",
  },
  {
    id: "lc_tiem_tra_rau",
    name: "Tiệm Trà & Cafe Râu - Ngô Sĩ Liên",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "84 Ngô Sĩ Liên, P. Hoà Khánh Bắc, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.0655,
    lng: 108.1502,
    rating: 4.7,
    ratingCount: 790,
    specialties: ["Trà mãng cầu xiêm", "Cà phê kem béo"],
    badge: "✨ Hot Trend Giới Trẻ",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/tiem-tra-cafe-rau-ngo-si-lien",
  },
  {
    id: "lc_tocotoco",
    name: "TocoToco Bubble Tea - Nguyễn Lương Bằng",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "79 Nguyễn Lương Bằng, P. Hoà Khánh Bắc, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.0678,
    lng: 108.1512,
    rating: 4.6,
    ratingCount: 950,
    specialties: ["Trà sữa kim cương đen", "Trà xoài bưởi"],
    badge: "🥤 Trà Sữa Quốc Dân",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/tocotoco-nguyen-luong-bang",
  },
  {
    id: "lc_milano_coffee",
    name: "Milano Coffee - Phạm Như Xương",
    districtId: "lien-chieu",
    districtName: "Liên Chiểu",
    city: "da-nang",
    address: "42 Phạm Như Xương, P. Hoà Khánh Nam, Quận Liên Chiểu, Đà Nẵng",
    lat: 16.0638,
    lng: 108.1492,
    rating: 4.7,
    ratingCount: 680,
    specialties: ["Cà phê đen phin đậm", "Bạc xỉu đá"],
    badge: "☕ Cà Phê Gu Đậm",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/milano-coffee-pham-nhu-xuong",
  },

  // === QUẬN HẢI CHÂU (Trung tâm TP Đà Nẵng, Bạch Đằng, Nguyễn Văn Linh) ===
  {
    id: "hc_phe_la",
    name: "Phê La - Ô Long Đặc Sản - Nguyễn Văn Linh",
    districtId: "hai-chau",
    districtName: "Hải Châu",
    city: "da-nang",
    address: "36-38 Nguyễn Văn Linh, P. Nam Dương, Quận Hải Châu, Đà Nẵng",
    lat: 16.061,
    lng: 108.2185,
    rating: 4.9,
    ratingCount: 2400,
    specialties: ["Ô long sữa chảo", "Trà ô long nhiệt đới"],
    badge: "🔥 Hot Nhất Đà Nẵng",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/phe-la-nguyen-van-linh",
  },
  {
    id: "hc_gong_cha",
    name: "Gong Cha - Nguyễn Văn Linh",
    districtId: "hai-chau",
    districtName: "Hải Châu",
    city: "da-nang",
    address: "25 Nguyễn Văn Linh, P. Bình Hiên, Quận Hải Châu, Đà Nẵng",
    lat: 16.0605,
    lng: 108.2198,
    rating: 4.8,
    ratingCount: 1980,
    specialties: ["Alisan Milk Foam", "Trà sữa trân châu trắng"],
    badge: "👑 Top Milk Foam Đỉnh Cao",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/gong-cha-nguyen-van-linh",
  },
  {
    id: "hc_cong_caphe",
    name: "Cộng Cà Phê - Bạch Đằng",
    districtId: "hai-chau",
    districtName: "Hải Châu",
    city: "da-nang",
    address: "96 Bạch Đằng, P. Hải Châu 1, Quận Hải Châu, Đà Nẵng",
    lat: 16.0705,
    lng: 108.2255,
    rating: 4.8,
    ratingCount: 2200,
    specialties: ["Cà phê cốt dừa", "Bạc xỉu Cộng"],
    badge: "☕ Cà Phê Cốt Dừa Huyền Thoại",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/cong-ca-phe-bach-dang",
  },
  {
    id: "hc_cafe_muoi_dong_xanh",
    name: "Cà Phê Muối Đồng Xanh - Bạch Đằng",
    districtId: "hai-chau",
    districtName: "Hải Châu",
    city: "da-nang",
    address: "18 Bạch Đằng, P. Thạch Thang, Quận Hải Châu, Đà Nẵng",
    lat: 16.0765,
    lng: 108.2248,
    rating: 4.8,
    ratingCount: 1150,
    specialties: ["Cà phê muối béo", "Trà sen vàng"],
    badge: "🌊 View Sông Hàn Cực Chill",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/ca-phe-muoi-dong-xanh-bach-dang",
  },

  // === QUẬN THANH KHÊ (Điện Biên Phủ, Hà Huy Tập, Dũng Sĩ Thanh Khê) ===
  {
    id: "tk_chachago",
    name: "Trà Sữa Chachago - Điện Biên Phủ",
    districtId: "thanh-khe",
    districtName: "Thanh Khê",
    city: "da-nang",
    address: "32 Điện Biên Phủ, P. Chính Gián, Quận Thanh Khê, Đà Nẵng",
    lat: 16.0645,
    lng: 108.192,
    rating: 4.7,
    ratingCount: 890,
    specialties: ["Trà sữa trân châu hoàng kim", "Trà trái cây nhiệt đới"],
    badge: "🥤 Trà Sữa Đậm Vị Đài Loan",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/tra-sua-chachago-dien-bien-phu",
  },
  {
    id: "tk_cafe_long",
    name: "Cà Phê Long - Thương Hiệu Lâu Đời",
    districtId: "thanh-khe",
    districtName: "Thanh Khê",
    city: "da-nang",
    address: "123 Lê Lợi, P. Thạch Thang, Quận Thanh Khê, Đà Nẵng",
    lat: 16.0718,
    lng: 108.2195,
    rating: 4.9,
    ratingCount: 3100,
    specialties: ["Cà phê đen nguyên chất", "Cà phê sữa phin"],
    badge: "☕ Biểu Tượng Cà Phê Đà Nẵng",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/ca-phe-long-da-nang",
  },
  {
    id: "tk_tra_sua_money",
    name: "Trà Sữa Money - Nguyễn Hoàng",
    districtId: "thanh-khe",
    districtName: "Thanh Khê",
    city: "da-nang",
    address: "17 Nguyễn Hoàng, P. Vĩnh Trung, Quận Thanh Khê, Đà Nẵng",
    lat: 16.0612,
    lng: 108.2095,
    rating: 4.8,
    ratingCount: 1420,
    specialties: ["Trà sữa thạch củ năng", "Trà đào sả"],
    badge: "⭐ Topping Ngập Tràn Giá Học Sinh",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/tra-sua-money-nguyen-hoang",
  },
  {
    id: "tk_cafe_nia",
    name: "Nia Cafe - Không Gian Sinh Thái",
    districtId: "thanh-khe",
    districtName: "Thanh Khê",
    city: "da-nang",
    address: "K3/12 Phan Thành Tài, P. Hoà Thuận Tây, Quận Thanh Khê, Đà Nẵng",
    lat: 16.0535,
    lng: 108.212,
    rating: 4.8,
    ratingCount: 880,
    specialties: ["Cà phê muối béo", "Sinh tố bơ sầu riêng"],
    badge: "🌿 Cafe Vườn Sinh Thái Tuyệt Đẹp",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/nia-cafe-da-nang",
  },

  // === QUẬN SƠN TRÀ (Phạm Văn Đồng, Nguyễn Văn Thoại, Ven Biển) ===
  {
    id: "st_koi_the",
    name: "KOI Thé - Vincom Ngô Quyền",
    districtId: "son-tra",
    districtName: "Sơn Trà",
    city: "da-nang",
    address: "910A Ngô Quyền, P. An Hải Bắc, Quận Sơn Trà, Đà Nẵng",
    lat: 16.0732,
    lng: 108.2325,
    rating: 4.8,
    ratingCount: 1650,
    specialties: ["Golden Bubble Milk Tea", "Matcha Macchiato"],
    badge: "👑 Trân Châu Hoàng Kim Đỉnh",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/koi-the-vincom-ngo-quyen",
  },
  {
    id: "st_reply_1988",
    name: "Reply 1988 Cafe - Sơn Trà",
    districtId: "son-tra",
    districtName: "Sơn Trà",
    city: "da-nang",
    address: "20 Lê Hồng Phong, P. Phước Mỹ, Quận Sơn Trà, Đà Nẵng",
    lat: 16.064,
    lng: 108.2415,
    rating: 4.9,
    ratingCount: 1320,
    specialties: ["Cà phê muối kem tươi", "Trà sen macchiato"],
    badge: "📸 Check-in & Cà Phê Ngon",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/reply-1988-cafe-son-tra",
  },
  {
    id: "st_dau_ngot_cafe",
    name: "Dâu Ngọt Cafe - Hà Bổng Ven Biển",
    districtId: "son-tra",
    districtName: "Sơn Trà",
    city: "da-nang",
    address: "92 Hà Bổng, P. Phước Mỹ, Quận Sơn Trà, Đà Nẵng",
    lat: 16.0668,
    lng: 108.2435,
    rating: 4.8,
    ratingCount: 750,
    specialties: ["Trà dâu tươi đá tuyết", "Cold Brew cam vàng"],
    badge: "🍓 Best Trà Dâu Tươi Chill Biển",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/dau-ngot-cafe-ha-bong",
  },
  {
    id: "st_highlands_ngo_quyen",
    name: "Highlands Coffee - Vincom Ngô Quyền",
    districtId: "son-tra",
    districtName: "Sơn Trà",
    city: "da-nang",
    address: "Tầng 1 Vincom Plaza, 910A Ngô Quyền, P. An Hải Bắc, Quận Sơn Trà, Đà Nẵng",
    lat: 16.0728,
    lng: 108.232,
    rating: 4.7,
    ratingCount: 2100,
    specialties: ["Trà sen vàng", "Freeze trà xanh"],
    badge: "☕ Trà Sen Vàng Thương Hiệu",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/highlands-coffee-vincom-ngo-quyen",
  },

  // === QUẬN CẨM LỆ (Cách Mạng Tháng 8, Ông Ích Đường) ===
  {
    id: "cl_cafe_muoi_chu_long_cmt8",
    name: "Cà Phê Muối Chú Long - Cách Mạng Tháng 8",
    districtId: "cam-le",
    districtName: "Cẩm Lệ",
    city: "da-nang",
    address: "245 Cách Mạng Tháng 8, P. Khuê Trung, Quận Cẩm Lệ, Đà Nẵng",
    lat: 16.0245,
    lng: 108.2045,
    rating: 4.8,
    ratingCount: 980,
    specialties: ["Cà phê muối béo ngậy", "Cà phê kem trứng"],
    badge: "🔥 Cà Phê Muối Chuẩn Vị",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/ca-phe-muoi-chu-long-cach-mang-thang-8",
  },
  {
    id: "cl_tra_sua_simi",
    name: "Trà Sữa Simi - Ông Ích Đường",
    districtId: "cam-le",
    districtName: "Cẩm Lệ",
    city: "da-nang",
    address: "88 Ông Ích Đường, P. Hoà Thọ Đông, Quận Cẩm Lệ, Đà Nẵng",
    lat: 16.0175,
    lng: 108.196,
    rating: 4.7,
    ratingCount: 820,
    specialties: ["Trà sữa nướng trân châu", "Sữa tươi đường đen"],
    badge: "⭐ Quán Ruột Giới Trẻ Cẩm Lệ",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/tra-sua-simi-ong-ich-duong",
  },
  {
    id: "cl_dat_cafe",
    name: "Đất Cà Phê - Lê Đại Hành",
    districtId: "cam-le",
    districtName: "Cẩm Lệ",
    city: "da-nang",
    address: "15 Lê Đại Hành, P. Khuê Trung, Quận Cẩm Lệ, Đà Nẵng",
    lat: 16.0285,
    lng: 108.198,
    rating: 4.8,
    ratingCount: 710,
    specialties: ["Cà phê pha phin truyền thống", "Cacao đá"],
    badge: "☕ Không Gian Mộc Mạc Cổ Xưa",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/dat-ca-phe-le-dai-hanh",
  },

  // === QUẬN NGŨ HÀNH SƠN (An Thượng, Châu Thị Vĩnh Tế, Phố Tây) ===
  {
    id: "nhs_bread_salt_cafe",
    name: "Bread & Salt Cafe - An Thượng",
    districtId: "ngu-hanh-son",
    districtName: "Ngũ Hành Sơn",
    city: "da-nang",
    address: "84 An Thượng 2, P. Mỹ An, Quận Ngũ Hành Sơn, Đà Nẵng",
    lat: 16.052,
    lng: 108.2435,
    rating: 4.9,
    ratingCount: 1100,
    specialties: ["Specialty Coffee", "Cold Brew Floral"],
    badge: "🌍 Phố Tây Chill Đỉnh Cao",
    affiliateUrl: "https://shope.ee/3qNTRh1I9z",
    originalUrl: "https://shopeefood.vn/da-nang/bread-salt-cafe-an-thuong",
  },
  {
    id: "nhs_sharetea",
    name: "Trà Sữa Sharetea - Châu Thị Vĩnh Tế",
    districtId: "ngu-hanh-son",
    districtName: "Ngũ Hành Sơn",
    city: "da-nang",
    address: "128 Châu Thị Vĩnh Tế, P. Mỹ An, Quận Ngũ Hành Sơn, Đà Nẵng",
    lat: 16.0505,
    lng: 108.2395,
    rating: 4.8,
    ratingCount: 1350,
    specialties: ["Trà sữa xoài trân châu", "Hồng trà Macchiato"],
    badge: "🥤 Thiên Đường Ăn Vặt Sinh Viên Kinh Tế",
    affiliateUrl: "https://shope.ee/80D2PLlUvS",
    originalUrl: "https://shopeefood.vn/da-nang/sharetea-chau-thi-vinh-te",
  },
  {
    id: "nhs_the_local_beans",
    name: "The Local Beans - Roastery & Cafe",
    districtId: "ngu-hanh-son",
    districtName: "Ngũ Hành Sơn",
    city: "da-nang",
    address: "56 Ngũ Hành Sơn, P. Mỹ An, Quận Ngũ Hành Sơn, Đà Nẵng",
    lat: 16.0538,
    lng: 108.2365,
    rating: 4.8,
    ratingCount: 960,
    specialties: ["Cà phê ủ lạnh cam sả", "Flat White"],
    badge: "☕ Cà Phê Hạt Rang Mộc Chất Lượng",
    affiliateUrl: "https://shope.ee/AUuNNwbude",
    originalUrl: "https://shopeefood.vn/da-nang/the-local-beans-ngu-hanh-son",
  },
];

/**
 * Tự động xác định Quận gần nhất dựa trên toạ độ GPS
 */
export function detectClosestDistrict(lat?: number, lng?: number): string {
  if (
    lat === undefined ||
    lng === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return "lien-chieu";
  }

  let closestId = "lien-chieu";
  let minDistance = Infinity;

  for (const d of DA_NANG_DISTRICTS) {
    const dLat = lat - d.lat;
    const dLng = lng - d.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closestId = d.id;
    }
  }

  return closestId;
}

/**
 * Lấy danh sách quán thuộc về quận chỉ định
 */
export function getSpotsForDistrict(districtId: string): DistrictSpot[] {
  return CURATED_DRINK_SPOTS.filter((s) => s.districtId === districtId);
}

/**
 * Định dạng số lượt đánh giá: hiển thị 999+ nếu >= 1000 theo yêu cầu người dùng
 */
export function formatRatingCount(count?: number): string {
  if (
    count === undefined ||
    count === null ||
    typeof count !== "number" ||
    !Number.isFinite(count) ||
    count <= 0
  ) {
    return "";
  }
  if (count >= 1000) return "999+";
  return `${Math.floor(count)}`;
}

/**
 * Tạo link đặt hàng an toàn kèm mã UTM / affiliate tracking
 */
export function resolveDistrictSpotLink(
  spot: DistrictSpot,
  dishName?: string,
): string {
  if (spot.affiliateUrl && typeof spot.affiliateUrl === "string") {
    const trimmedAff = spot.affiliateUrl.trim();
    if (/^https?:\/\//i.test(trimmedAff)) {
      try {
        const parsed = new URL(trimmedAff);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          return trimmedAff;
        }
      } catch {}
    }
  }

  if (!spot.originalUrl || typeof spot.originalUrl !== "string") return "#";
  const trimmedOrig = spot.originalUrl.trim();
  if (!/^https?:\/\//i.test(trimmedOrig)) return "#";

  try {
    const url = new URL(trimmedOrig);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "#";

    url.searchParams.set("mmp_pid", "an_17316810077");
    url.searchParams.set("utm_source", "an_17316810077");
    url.searchParams.set("utm_medium", "affiliate_food");
    url.searchParams.set("utm_campaign", "foodtour_district_spots");
    if (dishName) url.searchParams.set("sub_id", slugifySubId(dishName));
    return url.toString();
  } catch {
    return "#";
  }
}
