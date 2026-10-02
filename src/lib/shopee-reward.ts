import { AFFILIATE_CATALOG } from "./affiliate-catalog";

export const SHOPEE_RESTAURANT_OPEN_EVENT = "foodtour:shopee-restaurant-open";

function officialLink(value: string): URL | null {
  if (typeof value !== "string" || /[\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port ? url : null;
  } catch { return null; }
}

function isShortLink(url: URL): boolean {
  return ["s.shopee.vn", "spf.shopee.vn", "shope.ee"].includes(url.hostname)
    && /^\/[A-Za-z0-9]+\/?$/.test(url.pathname);
}

/** Eligibility is about a restaurant destination, never evidence of an order. */
export function isRewardableShopeeFoodLink(value: string): boolean {
  const url = officialLink(value);
  if (!url) return false;
  if (isShortLink(url)) {
    // An opaque short link alone cannot distinguish a restaurant from a generic hub.
    return AFFILIATE_CATALOG.some((item) => {
      const configured = officialLink(item.url);
      return configured?.origin === url.origin && configured.pathname === url.pathname;
    });
  }
  if (!["shopeefood.vn", "www.shopeefood.vn"].includes(url.hostname)) return false;
  if (url.pathname.replace(/\/$/, "") === "/now-food/affiliate/landing-page") {
    return /^[1-9]\d*$/.test(url.searchParams.get("restaurantId") ?? "");
  }
  // Public restaurant links have /city/restaurant-slug; exclude discovery routes.
  const parts = url.pathname.split("/").filter(Boolean);
  return parts.length === 2 && /^[a-z]+(?:-[a-z]+)*$/.test(parts[0])
    && !["now-food", "bo-suu-tap", "collection"].includes(parts[0])
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parts[1])
    && !/^(danh-sach|bo-suu-tap|tim-kiem|collection|search)(-|$)/.test(parts[1])
    && !url.searchParams.has("q");
}

/** Database short links can be associated with their existing restaurant URL. */
export function shopeeRestaurantRewardTarget(value: string, restaurantUrl?: string): string | null {
  if (isRewardableShopeeFoodLink(value)) return value;
  const url = officialLink(value);
  return url && isShortLink(url) && restaurantUrl && isRewardableShopeeFoodLink(restaurantUrl)
    ? restaurantUrl : null;
}
