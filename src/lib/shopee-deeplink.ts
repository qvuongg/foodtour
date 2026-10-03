import { SHOPEE_RESTAURANT_OPEN_EVENT, shopeeRestaurantRewardTarget } from "./shopee-reward";

/**
 * Utility mở thẳng ứng dụng Shopee / ShopeeFood bằng Deep Link trên Mobile
 * Tránh trang trung gian và giữ nguyên trang web Foodtour khi người dùng quay lại Safari / Browser.
 */

export function handleShopeeFoodClick(
  url: string,
  e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  restaurantUrl?: string,
): void {
  if (typeof window === "undefined" || !url || url === "#") return;

  // Keep navigation in the original click task. Reward persistence must not delay it.
  const rewardTarget = shopeeRestaurantRewardTarget(url, restaurantUrl);
  if (e && rewardTarget) {
    window.dispatchEvent(new CustomEvent(SHOPEE_RESTAURANT_OPEN_EVENT, { detail: { url: rewardTarget } }));
  }

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) return;

  // Với link rút gọn Shopee Affiliate (shope.ee hoặc s.shopee.vn):
  // Đây là Universal Link chính thức của Shopee, trình duyệt iOS/Android sẽ tự động
  // xử lý chuyển tiếp, ghi nhận cookie hoa hồng và mở app Shopee nếu có cài đặt.
  // Không được bọc vào `shopeevn://main?apprl=` vì apprl trong app Shopee không hỗ trợ
  // phân giải redirect HTTP 302 của link rút gọn bên ngoài, gây lỗi webview ("Rất tiếc, có lỗi xảy ra").
  if (url.includes("shope.ee") || url.includes("s.shopee.vn")) {
    return;
  }

  // Trên mobile với link trực tiếp shopeefood.vn / shopee.vn: Chặn tạo tab mới và mở deep link app
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }

  const appDeeplink = `shopeevn://main?apprl=${encodeURIComponent(url)}&push=1`;

  // Mở thẳng App Shopee bằng Deep Link. Trình duyệt không bị điều hướng đi đâu cả,
  // nên khi người dùng quay lại thì vẫn luôn ở trang web Foodtour.
  window.location.href = appDeeplink;
}
