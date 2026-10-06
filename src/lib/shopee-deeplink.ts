import { SHOPEE_RESTAURANT_OPEN_EVENT, shopeeRestaurantRewardTarget } from "./shopee-reward";

/**
 * Utility mở thẳng ứng dụng Shopee / ShopeeFood bằng Deep Link trên Mobile
 * Tránh trang trung gian và giữ nguyên trang web Foodtour khi người dùng quay lại Safari / Browser.
 */

/**
 * Điều hướng mở trực tiếp ứng dụng Shopee / ShopeeFood bằng Deep Link trên Mobile
 * Bọc cả link affiliate (shope.ee / s.shopee.vn) lẫn link quán gốc shopeefood.vn vào Native Deep Link:
 * `shopeevn://main?apprl=${encodeURIComponent(url)}&push=1`
 * Tránh qua trang web trung gian của Safari và giữ nguyên trang web Foodtour khi người dùng quay lại.
 */
export function openShopeeAppDeepLink(url: string, fallbackUrl?: string): void {
  if (typeof window === "undefined" || !url || url === "#") return;

  const targetFallback = fallbackUrl || url;
  const appDeeplink = `shopeevn://main?apprl=${encodeURIComponent(url)}&push=1`;

  // Fallback an toàn: Nếu thiết bị chưa cài App Shopee, sau 1.5s fallback về trang web
  if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
    const timer = window.setTimeout(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        window.location.href = targetFallback;
      }
    }, 1500);

    if (typeof timer === "object" && timer !== null && typeof (timer as any).unref === "function") {
      (timer as any).unref();
    }

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", cleanup);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && document.hidden) {
        window.clearTimeout(timer);
      }
    };

    window.addEventListener("pagehide", cleanup, { once: true });
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange, { once: true });
    }
  }

  window.location.href = appDeeplink;
}

export function handleShopeeFoodClick(
  url: string,
  e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  restaurantUrl?: string,
): void {
  if (typeof window === "undefined" || !url || url === "#") return;

  // Keep navigation in the original click task. Reward persistence must not delay it.
  const rewardTarget = shopeeRestaurantRewardTarget(url, restaurantUrl);
  if (e && rewardTarget) {
    try {
      window.dispatchEvent(new CustomEvent(SHOPEE_RESTAURANT_OPEN_EVENT, { detail: { url: rewardTarget } }));
    } catch {}
  }

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) return;

  // Trên mobile: Chặn điều hướng web mặc định để tránh chuyển sang trang trung gian của Safari
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }

  // Mở thẳng App Shopee bằng Native Deep Link (hỗ trợ cả link affiliate shope.ee / s.shopee.vn lẫn shopeefood.vn)
  openShopeeAppDeepLink(url, restaurantUrl);
}
