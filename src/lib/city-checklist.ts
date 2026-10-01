export interface CityMustTryItem {
  id: string;
  name: string;
  kind: "food" | "drink";
  description?: string;
  descriptionEn?: string;
  signatureSpot?: string;
  district?: string;
  badge?: string;
  priceEstimate?: string;
}

export interface CityChecklistData {
  cityId: "ha-noi" | "da-nang" | "ho-chi-minh";
  cityName: string;
  subtitle: string;
  coverImage?: string;
  items: CityMustTryItem[];
}

// Stable IDs preserve saved checkmarks. Source notes: artifacts/foodie-companion/JOURNAL-SOURCES.md.
// Drinks are local discovery suggestions; not every drink originated in its listed city.
export const CITY_CHECKLISTS: CityChecklistData[] = [
  {
    cityId: "ha-noi",
    cityName: "Hà Nội",
    subtitle: "36 phố phường & tinh hoa ẩm thực Tràng An",
    items: [
      {
        id: "hn-1",
        name: "Phở Bò Tái Lăn",
        signatureSpot: "Phở Thìn Lò Đúc / Phở Bát Đàn",
        district: "Hoàn Kiếm",
        badge: "Biểu tượng",
        priceEstimate: "65.000đ",
        kind: "food",
      },
      {
        id: "hn-2",
        name: "Bún Chả Nướng Than Hoa",
        signatureSpot: "Bún chả Hương Liên (Obama) / Đắc Kim",
        district: "Hai Bà Trưng",
        badge: "Đặc sản",
        priceEstimate: "60.000đ",
        kind: "food",
      },
      {
        id: "hn-3",
        name: "Cà Phê Trứng",
        signatureSpot: "Cà phê Giảng 39 Nguyễn Hữu Huân",
        district: "Hoàn Kiếm",
        badge: "Phải thử",
        priceEstimate: "35.000đ",
        kind: "drink",
      },
      {
        id: "hn-4",
        name: "Chả Cá Lã Vọng",
        signatureSpot: "Chả cá Lã Vọng 14 Chả Cá / Thăng Long",
        district: "Hoàn Kiếm",
        badge: "Di sản",
        priceEstimate: "140.000đ",
        kind: "food",
      },
      {
        id: "hn-5",
        name: "Bún Đậu Mắm Tôm",
        signatureSpot: "Bún đậu ngõ Tràng Tiền / Hàng Khay",
        district: "Hoàn Kiếm",
        badge: "Gây nghiện",
        priceEstimate: "50.000đ",
        kind: "food",
      },
      {
        id: "hn-6",
        name: "Phở Cuốn & Phở Chiên Phồng",
        signatureSpot: "Phở cuốn Hương Mai Ngũ Xã",
        district: "Ba Đình",
        badge: "Đặc trưng",
        priceEstimate: "65.000đ",
        kind: "food",
      },
      {
        id: "hn-7",
        name: "Bánh Cuốn Nóng Cà Cuống",
        signatureSpot: "Bánh cuốn Bà Hoành Tô Hiến Thành",
        district: "Hai Bà Trưng",
        badge: "Truyền thống",
        priceEstimate: "45.000đ",
        kind: "food",
      },
      {
        id: "hn-8",
        name: "Bún Ốc Nguội Giấm Bỗng",
        signatureSpot: "Bún ốc Cô Huệ Đặng Dung / Phù Đổng",
        district: "Ba Đình",
        badge: "Hà Nội xưa",
        priceEstimate: "50.000đ",
        kind: "food",
      },
      {
        id: "hn-9",
        name: "Nộm Bò Khô Chim Quay",
        signatureSpot: "Nộm Mai Nga Hàm Long / Bờ Hồ",
        district: "Hoàn Kiếm",
        badge: "Ăn vặt",
        priceEstimate: "45.000đ",
        kind: "food",
      },
      {
        id: "hn-10",
        name: "Xôi Xéo Mỡ Hành Ruốc Chà Bông",
        signatureSpot: "Xôi Yến Nguyễn Hữu Huân / Xôi Mây",
        district: "Hoàn Kiếm",
        badge: "Ăn sáng",
        priceEstimate: "35.000đ",
        kind: "food",
      },
      {
        id: "hn-11",
        name: "Bún thang",
        kind: "food",
        description: "Gà xé, trứng và giò trong nước dùng thanh.",
        descriptionEn: "Chicken, egg and pork sausage in a light broth.",
      },
      {
        id: "hn-12",
        name: "Bún cá Hà Nội",
        kind: "food",
        description: "Cá chiên giòn, bún và nước dùng chua dịu.",
        descriptionEn: "Crisp fish with rice noodles in a gently sour broth.",
      },
      {
        id: "hn-13",
        name: "Mì vằn thắn",
        kind: "food",
        description: "Mì trứng, vằn thắn và nước dùng nóng.",
        descriptionEn: "Egg noodles and wontons in a warming broth.",
      },
      {
        id: "hn-14",
        name: "Miến lươn",
        kind: "food",
        description: "Miến dai cùng lươn; có bản nước hoặc trộn.",
        descriptionEn: "Glass noodles with eel, served in broth or tossed.",
      },
      {
        id: "hn-15",
        name: "Bánh tôm Hồ Tây",
        kind: "food",
        description: "Tôm và khoai chiên giòn, ăn kèm rau sống.",
        descriptionEn: "Crisp shrimp and sweet potato fritters with fresh herbs.",
      },
      {
        id: "hn-16",
        name: "Cháo sườn",
        kind: "food",
        description: "Cháo gạo sánh mịn, sườn mềm và quẩy giòn.",
        descriptionEn: "Smooth rice porridge with pork ribs and fried dough.",
      },
      {
        id: "hn-17",
        name: "Cốm làng Vòng",
        kind: "food",
        description: "Hạt nếp non dẻo thơm, thức quà mùa thu.",
        descriptionEn: "Tender young green rice, an autumn treat.",
      },
      {
        id: "hn-18",
        name: "Xôi khúc",
        kind: "food",
        description: "Nếp, lá khúc, đậu xanh và nhân thịt.",
        descriptionEn: "Sticky rice with cudweed, mung beans and pork.",
      },
      {
        id: "hn-19",
        name: "Bánh trôi tàu",
        kind: "food",
        description: "Bánh nếp mềm trong nước đường gừng ấm.",
        descriptionEn: "Filled sticky rice balls in warm ginger syrup.",
      },
      {
        id: "hn-20",
        name: "Trà sen Tây Hồ",
        kind: "drink",
        description: "Trà ướp hương sen, gắn với vùng Tây Hồ.",
        descriptionEn: "Lotus-scented tea associated with West Lake.",
      },
      {
        id: "hn-21",
        name: "Nước sấu",
        kind: "drink",
        description: "Sấu ngâm pha nước đá, vị chua ngọt.",
        descriptionEn: "Iced drink made with sweetened dracontomelon fruit.",
      },
      {
        id: "hn-22",
        name: "Cà phê sữa chua",
        kind: "drink",
        description: "Cà phê đậm quyện sữa chua mát, béo dịu.",
        descriptionEn: "Bold coffee with cool, gently tangy yoghurt.",
      },
      {
        id: "hn-23",
        name: "Trà quất",
        kind: "drink",
        description: "Trà thêm quất thơm; một lựa chọn giải khát.",
        descriptionEn: "Tea with fragrant calamansi, served as a refreshment.",
      },
      {
        id: "hn-24",
        name: "Nước mía",
        kind: "drink",
        description: "Mía ép với đá, có thể thêm chút quất.",
        descriptionEn: "Freshly pressed sugarcane juice, sometimes with calamansi.",
      }
    ],
  },
  {
    cityId: "da-nang",
    cityName: "Đà Nẵng",
    subtitle: "Hương vị miền Trung đậm đà gió biển",
    items: [
      {
        id: "dn-1",
        name: "Mì Quảng Ếch & Tôm Thịt",
        signatureSpot: "Mì Quảng Bếp Trang / Bà Vị / Bà Mua",
        district: "Hải Châu",
        badge: "Biểu tượng",
        priceEstimate: "45.000đ",
        kind: "food",
      },
      {
        id: "dn-2",
        name: "Bánh Tráng Cuốn Thịt Heo Đại Lộc",
        signatureSpot: "Đặc sản Trần Lê Duẩn / Quán Mậu",
        district: "Cẩm Lệ",
        badge: "Trứ danh",
        priceEstimate: "85.000đ",
        kind: "food",
      },
      {
        id: "dn-3",
        name: "Bún Chả Cá Đà Nẵng",
        signatureSpot: "Bún chả cá 109 Nguyễn Chí Thanh / Bà Lữ",
        district: "Hải Châu",
        badge: "Phải thử",
        priceEstimate: "40.000đ",
        kind: "food",
      },
      {
        id: "dn-4",
        name: "Bánh Xèo & Nem Lụi Nướng",
        signatureSpot: "Bánh xèo Bà Dưỡng kiệt 280 Hoàng Diệu",
        district: "Hải Châu",
        badge: "Hút khách",
        priceEstimate: "60.000đ",
        kind: "food",
      },
      {
        id: "dn-5",
        name: "Cà Phê Muối Xứ Huế & Đà Nẵng",
        signatureSpot: "Cà phê Muối Chú Long / 254 Trần Phú",
        district: "Hải Châu",
        badge: "Đồ uống hot",
        priceEstimate: "25.000đ",
        kind: "drink",
      },
      {
        id: "dn-6",
        name: "Cơm Gà Xé Tam Kỳ",
        signatureSpot: "Cơm gà Hồng Ngọc / Tài Ký",
        district: "Hải Châu",
        badge: "Ăn trưa",
        priceEstimate: "55.000đ",
        kind: "food",
      },
      {
        id: "dn-7",
        name: "Gỏi Cá Nam Ô Cay Nồng",
        signatureSpot: "Quán gỏi cá Thanh Hương Nam Ô",
        district: "Liên Chiểu",
        badge: "Độc đáo",
        priceEstimate: "80.000đ",
        kind: "food",
      },
      {
        id: "dn-8",
        name: "Bún Mắm Nêm Thịt Quay",
        signatureSpot: "Bún mắm Bà Thuyên Lê Duẩn / Ngọc",
        district: "Thanh Khê",
        badge: "Đậm đà",
        priceEstimate: "35.000đ",
        kind: "food",
      },
      {
        id: "dn-9",
        name: "Bánh Tráng Kẹp Bò Khô Trứng Cút",
        signatureSpot: "Bánh tráng kẹp Dì Hoa Núi Thành",
        district: "Hải Châu",
        badge: "Ăn vặt",
        priceEstimate: "20.000đ",
        kind: "food",
      },
      {
        id: "dn-10",
        name: "Chè Sầu Riêng Đà Nẵng",
        signatureSpot: "Chè Liên 189 Hoàng Diệu",
        district: "Hải Châu",
        badge: "Tráng miệng",
        priceEstimate: "35.000đ",
        kind: "food",
      },
      {
        id: "dn-11",
        name: "Bánh canh cá lóc",
        kind: "food",
        description: "Sợi bánh mềm dai, cá lóc và nước dùng nóng.",
        descriptionEn: "Thick noodles with snakehead fish in a warm broth.",
      },
      {
        id: "dn-12",
        name: "Bún bò Huế",
        kind: "food",
        description: "Món nước từ Huế, cũng quen thuộc ở Đà Nẵng.",
        descriptionEn: "Hue-style beef noodle soup, also enjoyed in Da Nang.",
      },
      {
        id: "dn-13",
        name: "Bánh bèo chén",
        kind: "food",
        description: "Bánh hấp mềm, phủ nhân tôm thịt đậm đà.",
        descriptionEn: "Small steamed rice cakes with savoury shrimp and pork.",
      },
      {
        id: "dn-14",
        name: "Bánh đập",
        kind: "food",
        description: "Bánh tráng giòn kẹp bánh ướt, chấm mắm nêm.",
        descriptionEn: "Crisp rice paper with soft rice sheets and fermented fish dip.",
      },
      {
        id: "dn-15",
        name: "Mít trộn",
        kind: "food",
        description: "Mít non trộn rau thơm, đậu phộng và gia vị.",
        descriptionEn: "Young jackfruit salad with herbs, peanuts and dressing.",
      },
      {
        id: "dn-16",
        name: "Kem bơ",
        kind: "food",
        description: "Bơ xay và kem dừa, quen thuộc ở chợ Bắc Mỹ An.",
        descriptionEn: "Blended avocado with coconut ice cream, a Bac My An market favourite.",
      },
      {
        id: "dn-17",
        name: "Ốc hút",
        kind: "food",
        description: "Món ốc ăn vặt thường gặp ở các khu chợ.",
        descriptionEn: "A snail snack found at local food markets.",
      },
      {
        id: "dn-18",
        name: "Cá nục hấp cuốn bánh tráng",
        kind: "food",
        description: "Cá hấp cuốn rau sống, chấm nước mắm.",
        descriptionEn: "Steamed scad wrapped with herbs and rice paper.",
      },
      {
        id: "dn-19",
        name: "Hến xào xúc bánh tráng",
        kind: "food",
        description: "Hương vị Hội An: hến xào ăn với bánh tráng giòn.",
        descriptionEn: "A Hoi An favourite: stir-fried clams with crisp rice crackers.",
      },
      {
        id: "dn-20",
        name: "Cà phê cốt dừa",
        kind: "drink",
        description: "Cà phê kết hợp cốt dừa béo, dùng lạnh.",
        descriptionEn: "Chilled coffee with creamy coconut milk.",
      },
      {
        id: "dn-21",
        name: "Nước mía",
        kind: "drink",
        description: "Mía ép mát lạnh cho một chặng nghỉ chân.",
        descriptionEn: "Fresh sugarcane juice for a refreshing break.",
      },
      {
        id: "dn-22",
        name: "Nước chanh dây",
        kind: "drink",
        description: "Chanh dây chua thơm, pha cùng nước đá.",
        descriptionEn: "A fragrant, tangy passion fruit drink over ice.",
      },
      {
        id: "dn-23",
        name: "Nước mơ",
        kind: "drink",
        description: "Mơ ngâm pha nước; đồ uống đổi vị sau bữa ăn.",
        descriptionEn: "A sweetened apricot drink to enjoy after a meal.",
      },
      {
        id: "dn-24",
        name: "Trà quất",
        kind: "drink",
        description: "Trà đá thêm vị quất, nhẹ và dễ uống.",
        descriptionEn: "Iced tea with a bright touch of calamansi.",
      }
    ],
  },
  {
    cityId: "ho-chi-minh",
    cityName: "TP. Hồ Chí Minh",
    subtitle: "Thiên đường ẩm thực sôi động không ngủ",
    items: [
      {
        id: "hcm-1",
        name: "Cơm Tấm Sườn Bì Chả",
        signatureSpot: "Cơm tấm Ba Ghiền Đặng Văn Ngữ / Phúc Lộc Thọ",
        district: "Phú Nhuận",
        badge: "Biểu tượng",
        priceEstimate: "65.000đ",
        kind: "food",
      },
      {
        id: "hcm-2",
        name: "Bánh Mì Thịt Nguội Pate",
        signatureSpot: "Bánh mì Huỳnh Hoa Lê Thị Riêng / Bảy Hổ",
        district: "Quận 1",
        badge: "Nổi tiếng",
        priceEstimate: "58.000đ",
        kind: "food",
      },
      {
        id: "hcm-3",
        name: "Hủ Tiếu Nam Vang Thập Cẩm",
        signatureSpot: "Hủ tiếu Nam Vang Nhân Quán / Đạt Thành",
        district: "Quận 3",
        badge: "Phải thử",
        priceEstimate: "65.000đ",
        kind: "food",
      },
      {
        id: "hcm-4",
        name: "Cà Phê Sữa Đá Sài Gòn",
        signatureSpot: "Highlands / Cà phê Vợt Phan Đình Phùng",
        district: "Phú Nhuận",
        badge: "Thói quen",
        priceEstimate: "25.000đ",
        kind: "drink",
      },
      {
        id: "hcm-5",
        name: "Phá Lấu Bò Nước Cốt Dừa",
        signatureSpot: "Phá lấu dì Nủi Tôn Đản / Chợ Lớn",
        district: "Quận 4",
        badge: "Đặc trưng",
        priceEstimate: "35.000đ",
        kind: "food",
      },
      {
        id: "hcm-6",
        name: "Bột Chiên Trứng Giòn Rụm",
        signatureSpot: "Bột chiên Đạt Thành Võ Văn Tần",
        district: "Quận 3",
        badge: "Kinh điển",
        priceEstimate: "40.000đ",
        kind: "food",
      },
      {
        id: "hcm-7",
        name: "Ốc Sài Gòn Đủ Món",
        signatureSpot: "Ốc Oanh Vĩnh Khánh / Ốc Đào Nguyễn Trãi",
        district: "Quận 4",
        badge: "Món nhậu",
        priceEstimate: "120.000đ",
        kind: "food",
      },
      {
        id: "hcm-8",
        name: "Bánh Tráng Trộn Long An",
        signatureSpot: "Bánh tráng trộn Chú Viên Nguyễn Thượng Hiền",
        district: "Quận 3",
        badge: "Ăn vặt",
        priceEstimate: "25.000đ",
        kind: "food",
      },
      {
        id: "hcm-9",
        name: "Bánh Canh Cua Giò Heo",
        signatureSpot: "Bánh canh cua Út Lệ Tô Hiến Thành",
        district: "Quận 10",
        badge: "Đậm vị",
        priceEstimate: "60.000đ",
        kind: "food",
      },
      {
        id: "hcm-10",
        name: "Chè Mâm 16 Món",
        signatureSpot: "Chè mâm Khánh Vy Su Sư Hạnh",
        district: "Quận 10",
        badge: "Tráng miệng",
        priceEstimate: "45.000đ",
        kind: "food",
      },
      {
        id: "hcm-11",
        name: "Gỏi cuốn tôm thịt",
        kind: "food",
        description: "Tôm, thịt, bún và rau cuốn trong bánh tráng.",
        descriptionEn: "Fresh rice paper rolls with shrimp, pork, noodles and herbs.",
      },
      {
        id: "hcm-12",
        name: "Bánh xèo miền Nam",
        kind: "food",
        description: "Vỏ bánh mỏng giòn, nhân tôm thịt và giá.",
        descriptionEn: "A large crisp pancake with shrimp, pork and bean sprouts.",
      },
      {
        id: "hcm-13",
        name: "Bò bía mặn",
        kind: "food",
        description: "Cuốn củ sắn, lạp xưởng và trứng, chấm tương.",
        descriptionEn: "Rice paper rolls with jicama, sausage, egg and a savoury dip.",
      },
      {
        id: "hcm-14",
        name: "Súp cua",
        kind: "food",
        description: "Súp sánh nóng, thịt cua và trứng mềm.",
        descriptionEn: "A warming thick soup with crab and egg.",
      },
      {
        id: "hcm-15",
        name: "Sủi cảo",
        kind: "food",
        description: "Món quen của Chợ Lớn, dùng với nước dùng nóng.",
        descriptionEn: "Dumplings in hot broth, a Cho Lon favourite.",
      },
      {
        id: "hcm-16",
        name: "Bún mắm",
        kind: "food",
        description: "Bún trong nước dùng mắm đậm vị, kèm rau.",
        descriptionEn: "Rice noodles in a bold fermented fish broth with herbs.",
      },
      {
        id: "hcm-17",
        name: "Bún thịt nướng",
        kind: "food",
        description: "Thịt nướng, bún, rau và nước mắm chua ngọt.",
        descriptionEn: "Grilled pork and rice noodles with herbs and sweet-sour dressing.",
      },
      {
        id: "hcm-18",
        name: "Phở kiểu miền Nam",
        kind: "food",
        description: "Nước dùng đậm, thường ăn kèm giá và rau thơm.",
        descriptionEn: "A rich pho broth, commonly served with sprouts and herbs.",
      },
      {
        id: "hcm-19",
        name: "Bánh flan",
        kind: "food",
        description: "Bánh trứng sữa mềm với lớp caramel.",
        descriptionEn: "Silky egg custard with a layer of caramel.",
      },
      {
        id: "hcm-20",
        name: "Bạc xỉu",
        kind: "drink",
        description: "Nhiều sữa, ít cà phê, thường dùng với đá.",
        descriptionEn: "A milky coffee with less coffee and plenty of ice.",
      },
      {
        id: "hcm-21",
        name: "Nước sâm",
        kind: "drink",
        description: "Nước thảo mộc thơm nhẹ, thường dùng lạnh.",
        descriptionEn: "A gently aromatic herbal drink, usually served cold.",
      },
      {
        id: "hcm-22",
        name: "Nước mía",
        kind: "drink",
        description: "Mía ép ngọt mát, có thể thêm tắc.",
        descriptionEn: "Fresh sugarcane juice, sometimes with calamansi.",
      },
      {
        id: "hcm-23",
        name: "Sinh tố trái cây",
        kind: "drink",
        description: "Trái cây xay cùng đá và sữa theo khẩu vị.",
        descriptionEn: "Fruit blended with ice and milk to taste.",
      },
      {
        id: "hcm-24",
        name: "Trà tắc",
        kind: "drink",
        description: "Trà đá với tắc chua thơm, dễ nhâm nhi.",
        descriptionEn: "Iced tea with fragrant calamansi.",
      }
    ],
  }
];

export const CHECKLIST_STORAGE_KEY = "foodtour_must_try_checklist_v1";

export function loadCheckedSpots(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCheckedSpots(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}
