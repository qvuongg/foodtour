export interface AffiliateRestaurantItem {
  id: string;
  restaurant: string;
  dishes: string[];
  url: string; // Shortlink (https://s.shopee.vn/...) hoặc link affiliate đầy đủ
  city?: string; // 'ha-noi', 'ho-chi-minh', hoặc để trống nếu áp dụng toàn quốc
}

/**
 * Danh mục quán ăn có liên kết Affiliate ShopeeFood.
 * Bạn có thể thêm hàng trăm, hàng ngàn quán trực tiếp vào đây mà không cần khai báo biến môi trường trên Vercel.
 *
 * MẸO: Ưu tiên dùng link rút gọn 'https://s.shopee.vn/...' để trên điện thoại mở thẳng App Shopee mà không qua trang trung gian.
 */
export const AFFILIATE_CATALOG: AffiliateRestaurantItem[] = [
  {
    id: "bun-dau-pho-co",
    restaurant: "Bún Đậu Phố Cổ",
    dishes: ["Bún đậu mắm tôm", "Bún chả"],
    // Hỗ trợ Shortlink s.shopee.vn hoặc link landing-page ShopeeFood
    url: "https://shopeefood.vn/now-food/affiliate/landing-page?brandId=15544&mmp_pid=an_17316810077&restaurantId=947982&shareChannel=copy_link&uls_trackid=56mc6ju601k1&utm_campaign=food_rLueyKdh9uJuAeR-id_7pCuiJhD5gf&utm_content=ShopeeFood&utm_medium=affiliate_food&utm_source=an_17316810077&utm_term=fjz82tfdd639",
    city: "ha-noi",
  },
];
