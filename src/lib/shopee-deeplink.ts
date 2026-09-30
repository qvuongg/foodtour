/**
 * Utility mở thẳng ứng dụng Shopee / ShopeeFood bằng Deep Link trên Mobile
 * Tránh trang trung gian và giữ nguyên trang web Foodtour khi người dùng quay lại Safari / Browser.
 */

export function handleShopeeFoodClick(
  url: string,
  e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
): void {
  if (typeof window === "undefined" || !url || url === "#") return;

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) return;

  // Trên mobile: Chặn tạo tab mới và chặn chuyển hướng trang web
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }

  const appDeeplink = `shopeevn://main?apprl=${encodeURIComponent(url)}&push=1`;

  // Mở thẳng App Shopee bằng Deep Link. Trình duyệt không bị điều hướng đi đâu cả,
  // nên khi người dùng quay lại thì vẫn luôn ở trang web Foodtour.
  window.location.href = appDeeplink;
}
