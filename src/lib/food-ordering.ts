import {
  CATEGORY_HUBS,
  DEFAULT_SHOPEEFOOD_HUB_URL,
  detectFoodCategory,
  attachSubIdToUrl,
  slugifySubId,
  type FoodCategory,
} from "./smart-category-hub";

export type ShopeeFoodLink = {
  href: string;
  affiliate: boolean;
};

const SHOPEEFOOD_HOME = "https://shopeefood.vn/";
const ALLOWED_HOSTS = ["shopeefood.vn", "shopee.vn", "spf.shopee.vn"];

// These city routes have been verified using ShopeeFood's public router and search UI.
export const ORDERING_CITIES = [
  { value: "da-nang", label: "Đà Nẵng" },
  { value: "ho-chi-minh", label: "TP. HCM" },
  { value: "ha-noi", label: "Hà Nội" },
  { value: "hai-phong", label: "Hải Phòng" },
  { value: "can-tho", label: "Cần Thơ" },
] as const;

export const DEFAULT_ORDERING_CITY = "da-nang";

function isSupportedCity(city: string): boolean {
  return ORDERING_CITIES.some(({ value }) => value === city);
}

export function shopeeFoodSearchUrl(
  dish: string,
  city?: string,
  options?: { affiliate?: boolean; subId?: string },
): string {
  const isAff = options?.affiliate;
  const subId = options?.subId || (dish ? slugifySubId(dish) : undefined);

  if (typeof dish !== "string" || !dish.trim()) {
    if (isAff) {
      return attachSubIdToUrl(DEFAULT_SHOPEEFOOD_HUB_URL, "food");
    }
    return SHOPEEFOOD_HOME;
  }

  // Without affiliate options: maintain backwards compatibility with existing tests
  if (!isAff) {
    if (!city || !isSupportedCity(city)) {
      return SHOPEEFOOD_HOME;
    }
    try {
      const query = encodeURIComponent(dish.trim());
      return `${SHOPEEFOOD_HOME}${city}/danh-sach-dia-diem-giao-tan-noi?q=${query}`;
    } catch {
      return SHOPEEFOOD_HOME;
    }
  }

  // With affiliate options:
  // ShopeeFood's SPA router strictly requires a valid city prefix (e.g. /da-nang/, /ho-chi-minh/, /ha-noi/).
  // Omitting the city slug causes the router to fallback and redirect to "/" (homepage).
  const effectiveCity =
    typeof city === "string" && isSupportedCity(city)
      ? city
      : DEFAULT_ORDERING_CITY;

  try {
    const query = encodeURIComponent(dish.trim());
    const rawUrl = `${SHOPEEFOOD_HOME}${effectiveCity}/danh-sach-dia-diem-giao-tan-noi?q=${query}`;
    const url = new URL(rawUrl);
    url.searchParams.set("mmp_pid", "an_17316810077");
    url.searchParams.set("utm_source", "an_17316810077");
    url.searchParams.set("utm_medium", "affiliate_food");
    url.searchParams.set("utm_campaign", "foodtour_search");
    if (subId) url.searchParams.set("sub_id", subId);
    return url.toString();
  } catch {
    if (isAff) {
      return attachSubIdToUrl(DEFAULT_SHOPEEFOOD_HUB_URL, dish || "food");
    }
    return SHOPEEFOOD_HOME;
  }
}

function normalizedDish(dish: string): string {
  return dish.trim().normalize("NFC").toLowerCase();
}

/**
 * Resolve an operator-provided link without altering its tracking parameters.
 * Domain validation cannot prove attribution or a ShopeeFood destination:
 * the operator must verify both before configuring an affiliate URL.
 */
export function resolveShopeeFoodLink(value?: string): ShopeeFoodLink {
  const fallback = { href: SHOPEEFOOD_HOME, affiliate: false };
  if (typeof value !== "string") return fallback;

  const href = value.trim();
  // URL() silently strips some embedded control characters. Reject them first.
  if (!/^https:\/\//i.test(href) || /[\u0000-\u001f\u007f]/.test(href)) {
    return fallback;
  }

  try {
    const url = new URL(href);
    const officialHost = ALLOWED_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
    if (
      url.protocol !== "https:" ||
      !officialHost ||
      url.username ||
      url.password ||
      url.port
    ) {
      return fallback;
    }

    // Preserve the original URL: reserializing may change signed tracking data.
    return { href, affiliate: true };
  } catch {
    return fallback;
  }
}

/**
 * A restaurant suggestion is only usable for the dishes the operator has
 * explicitly verified. This does not establish delivery availability or distance.
 */
export function resolveDishAffiliateLink(
  url?: string,
  allowedDishes?: string,
  dish?: string,
): ShopeeFoodLink {
  const fallback = resolveShopeeFoodLink();
  if (
    typeof allowedDishes !== "string" ||
    typeof dish !== "string" ||
    !dish.trim()
  ) {
    return fallback;
  }

  try {
    const dishes: unknown = JSON.parse(allowedDishes);
    if (
      !Array.isArray(dishes) ||
      dishes.length === 0 ||
      !dishes.every(
        (item) => typeof item === "string" && item.trim().length > 0,
      ) ||
      !dishes.some(
        (item: string) => normalizedDish(item) === normalizedDish(dish),
      )
    ) {
      return fallback;
    }
    const link = resolveShopeeFoodLink(url);
    return link.affiliate ? link : fallback;
  } catch {
    return fallback;
  }
}

export type AffiliateMatchResult = {
  href: string;
  restaurant: string;
  affiliate: boolean;
  city?: string;
};

import { AFFILIATE_CATALOG } from "./affiliate-catalog";

export function findAffiliateRestaurant(
  dish?: string,
  city?: string,
): AffiliateMatchResult | null {
  if (typeof dish !== "string" || !dish.trim()) return null;

  const targetDish = normalizedDish(dish);

  // 1. Prioritize matching from catalog (scalable to 1000+ restaurants without Vercel env limits)
  for (const item of AFFILIATE_CATALOG) {
    const matchesDish = item.dishes.some(
      (d) => normalizedDish(d) === targetDish,
    );
    if (!matchesDish) continue;

    // If catalog item specifies a city, check against user's selected city
    if (item.city && city && item.city !== city) {
      continue;
    }

    const resolved = resolveShopeeFoodLink(item.url);
    if (resolved.affiliate) {
      return {
        href: resolved.href,
        restaurant: item.restaurant,
        affiliate: true,
        city: item.city,
      };
    }
  }

  // 2. Fallback to environment variables if catalog doesn't have it
  try {
    const envUrl =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_SHOPEEFOOD_AFFILIATE_URL
        : undefined;
    const envDishes =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_SHOPEEFOOD_AFFILIATE_DISHES
        : undefined;
    const envRestaurant =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_SHOPEEFOOD_AFFILIATE_RESTAURANT?.trim()
        : undefined;

    if (envUrl && envDishes && envRestaurant) {
      const resolved = resolveDishAffiliateLink(envUrl, envDishes, dish);
      if (resolved.affiliate) {
        const catalogEntry = AFFILIATE_CATALOG.find(
          (item) => item.url === resolved.href,
        );
        // The environment fallback must not bypass a known city restriction.
        if (catalogEntry?.city && city && catalogEntry.city !== city)
          return null;
        return {
          href: resolved.href,
          restaurant: envRestaurant,
          affiliate: true,
          city: catalogEntry?.city,
        };
      }
    }
  } catch {}

  return null;
}

export type SmartHubAffiliateResult = {
  href: string;
  appHref: string;
  appDestinationType: "restaurant" | "app-hub";
  webHref: string;
  webDestinationType: "web-search";
  city: string;
  restaurantCity?: string;
  title: string;
  badge: string;
  category: FoodCategory;
  isSpecificRestaurant: boolean;
  affiliate: boolean;
};

export function resolveSmartHubAffiliate(
  dish?: string,
  city?: string,
  language: "vi" | "en" = "vi",
): SmartHubAffiliateResult | null {
  if (typeof dish !== "string" || !dish.trim()) return null;

  const effectiveCity =
    city && isSupportedCity(city) ? city : DEFAULT_ORDERING_CITY;
  const searchHref = shopeeFoodSearchUrl(dish, effectiveCity, {
    affiliate: true,
  });

  // A configured restaurant must keep the same exact destination in the CTA
  // and QR code. City metadata is not proof of delivery availability.
  const specificMatch = findAffiliateRestaurant(dish, effectiveCity);
  if (specificMatch && specificMatch.affiliate) {
    return {
      href: specificMatch.href,
      appHref: specificMatch.href,
      appDestinationType: "restaurant",
      webHref: searchHref,
      webDestinationType: "web-search",
      city: effectiveCity,
      restaurantCity: specificMatch.city,
      title: specificMatch.restaurant,
      badge:
        language === "vi"
          ? "Quán có món này"
          : "A restaurant serving this dish",
      category: detectFoodCategory(dish),
      isSpecificRestaurant: true,
      affiliate: true,
    };
  }

  // The generic hub does not preselect a dish, restaurant or delivery address.
  // Tracking parameters do not establish that a search or order is attributed.
  const cat = detectFoodCategory(dish);
  const hub = CATEGORY_HUBS[cat];
  const appHref = attachSubIdToUrl(
    hub.hubUrl || DEFAULT_SHOPEEFOOD_HUB_URL,
    dish,
  );

  return {
    href: searchHref,
    appHref,
    appDestinationType: "app-hub",
    webHref: searchHref,
    webDestinationType: "web-search",
    city: effectiveCity,
    title: dish.trim(),
    badge: language === "vi" ? hub.badgeVi : hub.badgeEn,
    category: cat,
    isSpecificRestaurant: false,
    affiliate: true,
  };
}
