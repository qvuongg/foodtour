import { useEffect, useState, useCallback } from "react";
import { ArrowUpRight, Loader2, MapPin, ShoppingBag } from "lucide-react";
import {
  DEFAULT_ORDERING_CITY,
  resolveSmartHubAffiliate,
} from "@/lib/food-ordering";
import {
  hasLocalRestaurants,
  getNearbyRestaurantsForDish,
} from "@/lib/nearby-food-service";
import {
  fetchNearbyRestaurantsFromDb,
  isSupabaseConfigured,
  type DbRestaurant,
} from "@/lib/supabase-client";
import { slugifySubId } from "@/lib/smart-category-hub";
import type { Language } from "@/lib/i18n";

function formatDistanceMeters(meters?: number): string {
  if (meters === undefined || meters === null || isNaN(meters)) return "";
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function resolveSpotLink(
  spot: { affiliate_url?: string | null; original_url?: string | null },
  dishName?: string,
): string {
  if (spot.affiliate_url && spot.affiliate_url.startsWith("http")) {
    return spot.affiliate_url;
  }
  if (!spot.original_url) return "#";
  try {
    const url = new URL(spot.original_url);
    url.searchParams.set("mmp_pid", "an_17316810077");
    url.searchParams.set("utm_source", "an_17316810077");
    url.searchParams.set("utm_medium", "affiliate_food");
    url.searchParams.set("utm_campaign", "foodtour_nearby");
    if (dishName) url.searchParams.set("sub_id", slugifySubId(dishName));
    return url.toString();
  } catch {
    return spot.original_url;
  }
}

export function FoodOrdering({
  dish,
  language,
}: {
  dish: string;
  language: Language;
}) {
  const vi = language === "vi";
  const destination = resolveSmartHubAffiliate(
    dish,
    DEFAULT_ORDERING_CITY,
    language,
  );

  const [geoStatus, setGeoStatus] = useState<
    "locating" | "found" | "not_found" | "denied"
  >("locating");
  const [nearbySpots, setNearbySpots] = useState<DbRestaurant[]>([]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("denied");
      return;
    }

    setGeoStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        let spots: DbRestaurant[] = [];

        // 1. Thử gọi Supabase PostGIS query trong bán kính 3000m
        if (isSupabaseConfigured()) {
          try {
            spots = await fetchNearbyRestaurantsFromDb(
              dish,
              latitude,
              longitude,
              3000,
              4,
            );
          } catch {}
        }

        // 2. Fallback sang local Haversine nếu Supabase rỗng
        if (spots.length === 0 && hasLocalRestaurants(dish)) {
          const localRes = getNearbyRestaurantsForDish(
            dish,
            latitude,
            longitude,
            3.0,
          );
          if (localRes.primary) {
            spots = [
              {
                id: localRes.primary.restaurant.id,
                name: localRes.primary.restaurant.name,
                address: localRes.primary.restaurant.address,
                district: localRes.primary.restaurant.district,
                city: localRes.primary.restaurant.city,
                rating: localRes.primary.restaurant.rating,
                rating_count: localRes.primary.restaurant.ratingCount,
                affiliate_url: localRes.primary.restaurant.affiliateUrl,
                original_url: localRes.primary.restaurant.originalUrl,
                distance_meters: localRes.primary.distanceKm * 1000,
              },
              ...localRes.alternatives.map((alt) => ({
                id: alt.restaurant.id,
                name: alt.restaurant.name,
                address: alt.restaurant.address,
                district: alt.restaurant.district,
                city: alt.restaurant.city,
                rating: alt.restaurant.rating,
                rating_count: alt.restaurant.ratingCount,
                affiliate_url: alt.restaurant.affiliateUrl,
                original_url: alt.restaurant.originalUrl,
                distance_meters: alt.distanceKm * 1000,
              })),
            ];
          }
        }

        if (spots.length > 0) {
          setNearbySpots(spots);
          setGeoStatus("found");
        } else {
          setGeoStatus("not_found");
        }
      },
      () => {
        setGeoStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [dish]);

  // Luồng: Tự động kích hoạt xin vị trí ngay khi mở popup món đó
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  if (!destination) return null;
  const isSpecific = destination.appDestinationType === "restaurant";

  const primarySpot = nearbySpots[0] ?? null;
  const altSpots = nearbySpots.slice(1, 4);

  return (
    <div className="food-ordering-action">
      {/* 1. Trạng thái: Đang xin quyền vị trí & dò tìm quán gần bạn */}
      {geoStatus === "locating" && (
        <div className="nearby-locating-box">
          <Loader2 size={16} className="animate-spin" />
          <span>
            {vi
              ? "Đang xác định vị trí để tìm quán gần bạn (trong 3km)…"
              : "Detecting location to find nearby spots (within 3km)…"}
          </span>
        </div>
      )}

      {/* 2. Trạng thái: Người dùng ĐÃ ĐỒNG Ý BẬT VỊ TRÍ & tìm thấy quán trong 3km */}
      {geoStatus === "found" && primarySpot && (
        <div className="nearby-restaurant-card">
          <div className="nearby-restaurant-header">
            <div className="nearby-badge">
              <MapPin size={13} aria-hidden="true" />
              <span>
                {vi ? "Cách bạn" : ""} {formatDistanceMeters(primarySpot.distance_meters)} · ⭐{" "}
                {primarySpot.rating} (
                {primarySpot.rating_count.toLocaleString()}+{" "}
                {vi ? "đánh giá" : "reviews"})
              </span>
            </div>
            <strong className="nearby-restaurant-name">
              {primarySpot.name}
            </strong>
            <p className="nearby-restaurant-address">
              {primarySpot.address}
            </p>
          </div>
          <a
            className="shopeefood-button"
            href={resolveSpotLink(primarySpot, dish)}
            target="_blank"
            rel="sponsored noopener"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span>
              {vi ? "Mở quán trên ShopeeFood" : "Open Restaurant in ShopeeFood"}
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>

          {altSpots.length > 0 && (
            <div className="nearby-alternatives">
              <span className="nearby-alt-title">
                {vi ? "Quán khác gần bạn:" : "Other spots nearby:"}
              </span>
              {altSpots.map((alt) => (
                <a
                  key={alt.id}
                  className="nearby-alt-item"
                  href={resolveSpotLink(alt, dish)}
                  target="_blank"
                  rel="sponsored noopener"
                >
                  <span className="alt-name">{alt.name}</span>
                  <small className="alt-dist">
                    {formatDistanceMeters(alt.distance_meters)} · ⭐{alt.rating}
                  </small>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Trạng thái: Người dùng ĐỒNG Ý vị trí nhưng KHÔNG CÓ QUÁN TRONG 3KM */}
      {geoStatus === "not_found" && (
        <>
          <p className="nearby-notice">
            {vi
              ? `Chưa tìm thấy quán "${dish}" trong bán kính 3km từ vị trí của bạn.`
              : `No "${dish}" spots found within 3km of your location.`}
          </p>
          <a
            className="shopeefood-button"
            href={destination.appHref}
            target="_blank"
            rel="sponsored noopener"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span>
              {vi ? "Tìm quán trên ShopeeFood" : "Search on ShopeeFood"}
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </>
      )}

      {/* 4. Trạng thái: Người dùng TỪ CHỐI cấp quyền vị trí (Denied / Blocked) */}
      {geoStatus === "denied" && (
        <>
          <p className="nearby-notice">
            {vi
              ? "Bạn chưa bật vị trí. Bật vị trí để tự động hiển thị các quán gần bạn nhất (trong 3km)."
              : "Location not enabled. Enable location to see spots near you (within 3km)."}
          </p>
          <button
            type="button"
            className="nearby-retry-button"
            onClick={requestLocation}
          >
            <MapPin size={15} />
            <span>{vi ? "Bật vị trí để tìm quán gần tôi" : "Enable location to find nearby"}</span>
          </button>
          <a
            className="shopeefood-button"
            href={destination.appHref}
            target="_blank"
            rel="sponsored noopener"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span>
              {isSpecific
                ? vi ? "Xem quán trên ShopeeFood" : "View on ShopeeFood"
                : vi ? "Đặt món trên ShopeeFood" : "Order on ShopeeFood"}
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          {isSpecific && (
            <p className="ordering-specific-restaurant">{destination.title}</p>
          )}
        </>
      )}
    </div>
  );
}
