export const SOURCE_URL = "https://shopeefood.vn/food/collection-list";

export type ShopeeCollection = {
  id: string;
  labelVi: string;
  labelEn: string;
  url: string;
  icon: "delivery" | "food" | "favorite" | "nearby" | "explore" | "city" | "groceries" | "drink" | "world" | "party" | "new" | "group";
};

// Public collection links listed by ShopeeFood for TP.HCM on 2026-10-02.
// Labels describe browsing categories, not current discounts or eligibility.
// These are source links, not account-specific affiliate URLs.
export const SHOPEE_COLLECTIONS: readonly ShopeeCollection[] = [
  { id: "delivery", labelVi: "Giao hàng", labelEn: "Delivery", icon: "delivery", url: "https://shopeefood.vn/bo-suu-tap/mon-ngon-hoi-tu-freeship-0d" },
  { id: "feast", labelVi: "Đại tiệc", labelEn: "Food feast", icon: "food", url: "https://shopeefood.vn/bo-suu-tap/dai-tiec-muon-vi-giam-50" },
  { id: "favorites", labelVi: "Quán quen", labelEn: "Familiar favorites", icon: "favorite", url: "https://shopeefood.vn/bo-suu-tap/quan-ruot-dan-sanh-an---giam-30000d" },
  { id: "neighborhood", labelVi: "Quanh nhà", labelEn: "Around the neighborhood", icon: "nearby", url: "https://shopeefood.vn/bo-suu-tap/quan-ngon-gan-nha-giam-toi-35000d-8" },
  { id: "discover", labelVi: "Khám phá quán", labelEn: "Discover restaurants", icon: "explore", url: "https://shopeefood.vn/bo-suu-tap/quan-moi-deal-hoi-giam-50000d-3" },
  { id: "saigon", labelVi: "Ăn ở Sài Gòn", labelEn: "Eating in Saigon", icon: "city", url: "https://shopeefood.vn/bo-suu-tap/den-sai-gon-an-gi" },
  { id: "groceries", labelVi: "Đi chợ", labelEn: "Groceries", icon: "groceries", url: "https://shopeefood.vn/bo-suu-tap/cho-tuoi-ngon-dinh-giam-50-t10" },
  { id: "drinks", labelVi: "Giờ uống nước", labelEn: "Time for a drink", icon: "drink", url: "https://shopeefood.vn/bo-suu-tap/tra-sua-ca-phe-giam-30000d-oth" },
  { id: "international", labelVi: "Ẩm thực quốc tế", labelEn: "Around the world", icon: "world", url: "https://shopeefood.vn/bo-suu-tap/mon-ngon-au-a-giam-50000d-toicol" },
  { id: "banquet", labelVi: "Tiệc đông người", labelEn: "Party menus", icon: "party", url: "https://shopeefood.vn/bo-suu-tap/tiec-to-deal-hoi-giam-toi-1010000d-3" },
  { id: "new-restaurants", labelVi: "Thử quán mới", labelEn: "Try somewhere new", icon: "new", url: "https://shopeefood.vn/bo-suu-tap/deal-lam-quen-giam-40000d-1" },
  { id: "group-order", labelVi: "Đặt theo nhóm", labelEn: "Order together", icon: "group", url: "https://shopeefood.vn/bo-suu-tap/len-don-nhomgiam-toi-105000d" },
];
