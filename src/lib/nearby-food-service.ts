import bunchaHanoiData from "../../data/buncha_hanoi.json";
import {
  findNearbyRestaurants,
  type NearbyRestaurantResult,
} from "./geo-distance";

export interface LocalRestaurant {
  id: string;
  deliveryId?: number;
  name: string;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  ratingCount: number;
  originalUrl: string;
  affiliateUrl?: string;
  isVerified?: boolean;
}

// Danh mục ánh xạ các món ăn đã có dữ liệu quán định vị
const DISH_RESTAURANTS_MAP: Record<string, LocalRestaurant[]> = {
  "bún chả": bunchaHanoiData as LocalRestaurant[],
  "bún chả hà nội": bunchaHanoiData as LocalRestaurant[],
};

/**
 * Kiểm tra xem món ăn có dữ liệu quán định vị trong database hay không
 */
export function hasLocalRestaurants(dish: string): boolean {
  if (!dish) return false;
  const normalized = dish.trim().toLowerCase();
  return normalized in DISH_RESTAURANTS_MAP;
}

/**
 * Lấy danh sách toàn bộ quán có món này trong database
 */
export function getRestaurantsForDish(dish: string): LocalRestaurant[] {
  if (!dish) return [];
  const normalized = dish.trim().toLowerCase();
  return DISH_RESTAURANTS_MAP[normalized] || [];
}

/**
 * Tìm kiếm các quán phục vụ món ăn trong bán kính GPS (mặc định 3km)
 */
export function getNearbyRestaurantsForDish(
  dish: string,
  userLat: number,
  userLng: number,
  radiusKm = 3.0,
): {
  primary: NearbyRestaurantResult<LocalRestaurant> | null;
  alternatives: NearbyRestaurantResult<LocalRestaurant>[];
  totalFound: number;
} {
  const normalized = dish?.trim().toLowerCase() || "";
  const list = DISH_RESTAURANTS_MAP[normalized] || [];
  return findNearbyRestaurants(list, userLat, userLng, radiusKm);
}
