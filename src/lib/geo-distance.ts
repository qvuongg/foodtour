/**
 * Module tính toán khoảng cách địa lý (Haversine Formula) & Lọc quán ăn theo bán kính GPS
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface NearbyRestaurantResult<T extends GeoPoint> {
  restaurant: T;
  distanceKm: number;
  distanceFormatted: string; // VD: "1.2 km" hoặc "850 m"
  score: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Tính khoảng cách đường chim bay giữa 2 toạ độ GPS theo công thức Haversine
 * @returns Khoảng cách theo đơn vị Kilomet (km)
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  if (
    typeof lat1 !== "number" ||
    typeof lng1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lng2 !== "number" ||
    isNaN(lat1) ||
    isNaN(lng1) ||
    isNaN(lat2) ||
    isNaN(lng2)
  ) {
    return Infinity;
  }

  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Định dạng khoảng cách thân thiện với người dùng mobile
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Lọc và xếp hạng danh sách quán ăn theo bán kính định vị (mặc định 3.0 km)
 */
export function findNearbyRestaurants<
  T extends GeoPoint & { rating?: number; ratingCount?: number },
>(
  restaurants: T[],
  userLat: number,
  userLng: number,
  maxRadiusKm = 3.0,
): {
  primary: NearbyRestaurantResult<T> | null;
  alternatives: NearbyRestaurantResult<T>[];
  totalFound: number;
} {
  if (!Array.isArray(restaurants) || !restaurants.length) {
    return { primary: null, alternatives: [], totalFound: 0 };
  }

  const inRange: NearbyRestaurantResult<T>[] = [];

  for (const restaurant of restaurants) {
    const distanceKm = haversineDistanceKm(
      userLat,
      userLng,
      restaurant.lat,
      restaurant.lng,
    );

    if (distanceKm <= maxRadiusKm) {
      const rating = Number(restaurant.rating) || 4.5;
      const ratingCount = Number(restaurant.ratingCount) || 100;

      // Hàm điểm xếp hạng: Ưu tiên khoảng cách gần (60%) + Chất lượng quán (40%)
      const distanceFactor = 1 / (distanceKm + 0.3);
      const ratingFactor = rating * Math.log10(Math.max(10, ratingCount));
      const score = distanceFactor * 0.65 + ratingFactor * 0.35;

      inRange.push({
        restaurant,
        distanceKm,
        distanceFormatted: formatDistance(distanceKm),
        score,
      });
    }
  }

  // Sắp xếp theo rating giảm dần -> số lượt đánh giá giảm dần -> khoảng cách gần nhất
  inRange.sort((a, b) => {
    const ratingA = Number(a.restaurant.rating) || 0;
    const ratingB = Number(b.restaurant.rating) || 0;
    if (Math.abs(ratingB - ratingA) > 0.01) {
      return ratingB - ratingA;
    }
    const countA = Number(a.restaurant.ratingCount) || 0;
    const countB = Number(b.restaurant.ratingCount) || 0;
    if (countB !== countA) {
      return countB - countA;
    }
    return a.distanceKm - b.distanceKm;
  });

  if (!inRange.length) {
    return { primary: null, alternatives: [], totalFound: 0 };
  }

  return {
    primary: inRange[0],
    alternatives: inRange.slice(1, 4),
    totalFound: inRange.length,
  };
}
