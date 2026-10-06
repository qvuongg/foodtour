/**
 * Module định vị chi nhánh thương hiệu gần nhất & Mở trực tiếp App ShopeeFood
 * Hỗ trợ:
 * - 10 thương hiệu lớn tại Hà Nội, TP.HCM, Đà Nẵng
 * - Tính toán khoảng cách Haversine chuẩn xác
 * - Không qua bất kỳ trang web trung gian nào
 */

import { haversineDistanceKm, formatDistance } from "./geo-distance";
import { SHOPEE_RESTAURANT_OPEN_EVENT } from "./shopee-reward";
import { openShopeeAppDeepLink } from "./shopee-deeplink";
import rawBranchesData from "../data/brand-branches.json";

export interface BrandBranch {
  id: string;
  brand_id: string;
  brand_name: string;
  delivery_id: number;
  name: string;
  address: string;
  district?: string;
  city: string;
  city_name?: string;
  lat: number;
  lng: number;
  rating: number;
  rating_count: number;
  shopeefood_url: string;
  affiliate_url?: string;
  updated_at?: string;
}

export interface NearestBranchMatch {
  branch: BrandBranch;
  distanceKm: number | null;
  distanceFormatted: string | null;
  isNearestByGps: boolean;
}

const ALL_BRANCHES: BrandBranch[] = Array.isArray(rawBranchesData)
  ? (rawBranchesData as BrandBranch[])
  : [];

const SESSION_LAT_KEY = "foodtour_gps_lat";
const SESSION_LNG_KEY = "foodtour_gps_lng";
const SESSION_TIMESTAMP_KEY = "foodtour_gps_time";
const GPS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

/**
 * Lấy toạ độ GPS đã lưu trong Session (nếu còn hạn)
 */
export function getCachedUserCoordinates(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const latStr = sessionStorage.getItem(SESSION_LAT_KEY);
    const lngStr = sessionStorage.getItem(SESSION_LNG_KEY);
    const timeStr = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (!latStr || !lngStr) return null;

    if (timeStr) {
      const age = Date.now() - Number(timeStr);
      if (age > GPS_CACHE_TTL_MS) {
        sessionStorage.removeItem(SESSION_LAT_KEY);
        sessionStorage.removeItem(SESSION_LNG_KEY);
        sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
        return null;
      }
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  } catch {}
  return null;
}

/**
 * Lưu toạ độ GPS vào Session
 */
export function cacheUserCoordinates(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_LAT_KEY, String(lat));
    sessionStorage.setItem(SESSION_LNG_KEY, String(lng));
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(Date.now()));
  } catch {}
}

/**
 * Xin quyền vị trí người dùng trên trình duyệt (với timeout giới hạn tránh đơ)
 */
export async function requestUserCoordinates(
  timeoutMs = 4000,
): Promise<{ lat: number; lng: number } | null> {
  // 1. Kiểm tra cache trước
  const cached = getCachedUserCoordinates();
  if (cached) return cached;

  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("geolocation" in navigator)
  ) {
    return null;
  }

  return new Promise((resolve) => {
    let hasResolved = false;

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(null);
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        const { latitude, longitude } = pos.coords;
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          cacheUserCoordinates(latitude, longitude);
          resolve({ lat: latitude, lng: longitude });
        } else {
          resolve(null);
        }
      },
      () => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 60000,
      },
    );
  });
}

/**
 * Lọc toàn bộ chi nhánh của 1 thương hiệu
 */
export function getBranchesForBrand(brandId: string): BrandBranch[] {
  if (!brandId) return [];
  const normalizedId = brandId.toLowerCase().trim();
  return ALL_BRANCHES.filter(
    (b) => b.brand_id && b.brand_id.toLowerCase() === normalizedId,
  );
}

/**
 * Tìm chi nhánh gần nhất của thương hiệu dựa trên toạ độ GPS hoặc Thành phố
 */
export function findNearestBrandBranch(
  brandId: string,
  userCoords: { lat: number; lng: number } | null,
  activeCity = "ho-chi-minh",
): NearestBranchMatch | null {
  const branches = getBranchesForBrand(brandId);
  if (!branches.length) return null;

  // 1. Nếu có toạ độ GPS người dùng: Tính Haversine tìm quán gần nhất
  if (
    userCoords &&
    Number.isFinite(userCoords.lat) &&
    Number.isFinite(userCoords.lng)
  ) {
    let nearest: BrandBranch = branches[0];
    let minDistance = Infinity;

    for (const b of branches) {
      if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) continue;
      const dist = haversineDistanceKm(
        userCoords.lat,
        userCoords.lng,
        b.lat,
        b.lng,
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = b;
      }
    }

    if (minDistance < Infinity) {
      return {
        branch: nearest,
        distanceKm: minDistance,
        distanceFormatted: formatDistance(minDistance),
        isNearestByGps: true,
      };
    }
  }

  // 2. Nếu không có GPS: Fallback về chi nhánh tốt nhất tại Thành phố hiện tại
  const cityBranches = branches.filter((b) => b.city === activeCity);
  const candidatePool = cityBranches.length > 0 ? cityBranches : branches;

  // Ưu tiên quán có rating_count cao nhất & rating cao nhất trong thành phố
  const sorted = [...candidatePool].sort((a, b) => {
    if ((b.rating_count || 0) !== (a.rating_count || 0)) {
      return (b.rating_count || 0) - (a.rating_count || 0);
    }
    return (b.rating || 0) - (a.rating || 0);
  });

  const bestFallback = sorted[0];
  return {
    branch: bestFallback,
    distanceKm: null,
    distanceFormatted: null,
    isNearestByGps: false,
  };
}

export function openShopeeFoodDirect(
  shopeefoodUrl: string,
  affiliateUrl?: string,
): void {
  if (typeof window === "undefined" || !shopeefoodUrl) return;

  const targetUrl = affiliateUrl || shopeefoodUrl;

  // Ghi nhận sự kiện tích điểm Foodie Pet (+2 XP)
  try {
    window.dispatchEvent(
      new CustomEvent(SHOPEE_RESTAURANT_OPEN_EVENT, {
        detail: { url: targetUrl },
      }),
    );
  } catch {}

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Mở thẳng App Shopee bằng Native Deep Link (hỗ trợ cả link affiliate và link quán gốc)
    openShopeeAppDeepLink(targetUrl, shopeefoodUrl);
  } else {
    // Trên Desktop: Mở tab mới với URL của quán hoặc link affiliate
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
