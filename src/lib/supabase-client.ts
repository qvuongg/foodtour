/**
 * Supabase Client & RPC Service cho FoodTour
 * Dự án: https://cfjahscecuviajbemznx.supabase.co
 */

export interface DbRestaurant {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  lat?: number;
  lng?: number;
  rating: number;
  rating_count: number;
  affiliate_url?: string | null;
  original_url: string;
  distance_meters?: number;
}

export function slugifyDish(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SUPABASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_SUPABASE_URL) ||
  "https://cfjahscecuviajbemznx.supabase.co";

const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  "";

/**
 * Kiểm tra xem Supabase đã được cấu hình anon key chưa
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Gọi hàm RPC PostGIS: Tìm quán trong bán kính R mét từ toạ độ GPS
 */
export async function fetchNearbyRestaurantsFromDb(
  dish: string,
  lat: number,
  lng: number,
  radiusMeters = 3000,
  limit = 15,
): Promise<DbRestaurant[]> {
  if (!isSupabaseConfigured() || !dish) return [];

  // Xác thực tọa độ hợp lệ, hữu hạn và nằm trong giới hạn địa lý GPS
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return [];
  }

  const safeRadius = Math.min(Math.max(100, Math.floor(radiusMeters) || 3000), 50000);
  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 15), 50);
  const slug = slugifyDish(dish);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_nearby_restaurants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_dish_slug: slug,
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: safeRadius,
        p_limit: safeLimit,
      }),
    });

    if (!res.ok) {
      console.warn("Supabase nearby query failed with status:", res.status);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Supabase nearby query error:", err);
    return [];
  }
}

/**
 * Gọi hàm RPC: Lấy danh sách quán tốt nhất của món theo rating (khi chưa bật GPS hoặc test trực tiếp)
 */
export async function fetchTopRestaurantsFromDb(
  dish: string,
  city?: string,
  limit = 4,
): Promise<DbRestaurant[]> {
  if (!isSupabaseConfigured() || !dish) return [];

  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 4), 50);
  const slug = slugifyDish(dish);
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_top_restaurants_for_dish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_dish_slug: slug,
          p_city: city || null,
          p_limit: safeLimit,
        }),
      },
    );

    if (!res.ok) {
      console.warn("Supabase top restaurants query failed with status:", res.status);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Supabase top restaurants query error:", err);
    return [];
  }
}

/**
 * Gọi Supabase REST: Lấy top quán nước ngon nhất theo quận (Đà Nẵng, Hà Nội, TP.HCM)
 * Sắp xếp theo rating giảm dần và rating_count giảm dần.
 */
export async function fetchDistrictDrinkSpotsFromDb(
  districtName: string,
  city = "da-nang",
  limit = 12,
): Promise<DbRestaurant[]> {
  if (!isSupabaseConfigured() || !districtName) return [];

  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 12), 30);
  try {
    const url = `${SUPABASE_URL}/rest/v1/restaurants?select=id,name,address,district,city,lat,lng,rating,rating_count,affiliate_url,original_url&city=eq.${encodeURIComponent(city)}&district=ilike.*${encodeURIComponent(districtName)}*&order=rating.desc,rating_count.desc&limit=${safeLimit}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

