export type ShopeeFoodLink = {
  href: string;
  affiliate: boolean;
};

const SHOPEEFOOD_HOME = "https://shopeefood.vn/";
const ALLOWED_HOSTS = ["shopeefood.vn", "shopee.vn"];

// These city routes have been verified using ShopeeFood's public search UI.
export const ORDERING_CITIES = [
  { value: "ho-chi-minh", label: "TP. HCM" },
  { value: "ha-noi", label: "Hà Nội" },
] as const;

function isSupportedCity(city: string): boolean {
  return ORDERING_CITIES.some(({ value }) => value === city);
}

export function shopeeFoodSearchUrl(dish: string, city: string): string {
  if (typeof dish !== "string" || !dish.trim() || !isSupportedCity(city)) {
    return SHOPEEFOOD_HOME;
  }
  try {
    const query = encodeURIComponent(dish.trim());
    return `${SHOPEEFOOD_HOME}${city}/danh-sach-dia-diem-giao-tan-noi?q=${query}`;
  } catch {
    // Malformed Unicode in a custom dish must not prevent showing its result.
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
