import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Loader2,
  MapPin,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
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

function formatRatingCount(count?: number): string {
  if (count === undefined || count === null || isNaN(count)) return "";
  if (count >= 1000) return "999+";
  return `${count}`;
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
  onClose,
}: {
  dish: string;
  language: Language;
  onClose?: () => void;
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
  const [showAlternatives, setShowAlternatives] = useState(false);

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
              15,
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
          // Sắp xếp ưu tiên theo số lượng đánh giá (rating_count) giảm dần -> rating giảm dần -> khoảng cách gần nhất
          spots.sort((a, b) => {
            const countA = Number(a.rating_count) || 0;
            const countB = Number(b.rating_count) || 0;
            if (countB !== countA) {
              return countB - countA;
            }
            const ratingA = Number(a.rating) || 0;
            const ratingB = Number(b.rating) || 0;
            if (Math.abs(ratingB - ratingA) > 0.01) {
              return ratingB - ratingA;
            }
            return (a.distance_meters ?? 0) - (b.distance_meters ?? 0);
          });
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
              ? "Đang xác định vị trí để tìm quán gần bạn…"
              : "Detecting location to find nearby spots…"}
          </span>
        </div>
      )}

      {/* 2. Trạng thái: Người dùng ĐÃ ĐỒNG Ý BẬT VỊ TRÍ & tìm thấy quán trong 3km */}
      {geoStatus === "found" && primarySpot && (
        <>
          <div className="nearby-restaurant-card">
            <strong className="nearby-restaurant-name">
              {primarySpot.name}
            </strong>
            <div className="nearby-meta-row">
              <span className="nearby-meta-dist">
                <MapPin size={13} aria-hidden="true" />
                {formatDistanceMeters(primarySpot.distance_meters)}
              </span>
              <span className="nearby-meta-dot">·</span>
              <span className="nearby-meta-rating">
                ⭐ {Number(primarySpot.rating || 4.5).toFixed(1).replace(".", ",")}
                {primarySpot.rating_count !== undefined && primarySpot.rating_count > 0 && (
                  <span className="nearby-meta-count">
                    ({formatRatingCount(primarySpot.rating_count)}{" "}
                    {vi ? "đánh giá" : "reviews"})
                  </span>
                )}
              </span>
            </div>
            {primarySpot.address && (
              <p className="nearby-restaurant-address">
                {primarySpot.address}
              </p>
            )}
          </div>

          {/* Quán khác thu gọn (Accordion) */}
          {altSpots.length > 0 && (
            <div className="nearby-alternatives-accordion">
              <button
                type="button"
                className="nearby-accordion-header"
                onClick={() => setShowAlternatives((prev) => !prev)}
                aria-expanded={showAlternatives}
              >
                <span>
                  {vi
                    ? `Xem thêm ${altSpots.length} quán có ${dish.toLowerCase()} gần bạn`
                    : `See ${altSpots.length} more spots nearby`}
                </span>
                <ChevronDown
                  size={16}
                  className={`accordion-chevron ${showAlternatives ? "is-expanded" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {showAlternatives && (
                <div className="nearby-accordion-content">
                  {altSpots.map((alt) => (
                    <a
                      key={alt.id}
                      className="nearby-alt-row"
                      href={resolveSpotLink(alt, dish)}
                      target="_blank"
                      rel="sponsored noopener"
                    >
                      <div className="nearby-alt-info">
                        <span className="nearby-alt-name">{alt.name}</span>
                        <div className="nearby-alt-sub">
                          <span>{formatDistanceMeters(alt.distance_meters)}</span>
                          <span>·</span>
                          <span>
                            ⭐ {Number(alt.rating || 4.5).toFixed(1).replace(".", ",")}
                            {alt.rating_count ? ` (${formatRatingCount(alt.rating_count)})` : ""}
                          </span>
                          {alt.address && <span className="alt-addr">· {alt.address}</span>}
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="nearby-alt-icon" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 3. Trạng thái: Người dùng ĐỒNG Ý vị trí nhưng KHÔNG CÓ QUÁN TRONG 3KM */}
      {geoStatus === "not_found" && (
        <p className="nearby-notice">
          {vi
            ? `Chưa tìm thấy quán "${dish}" trong bán kính 3km từ vị trí của bạn.`
            : `No "${dish}" spots found within 3km of your location.`}
        </p>
      )}

      {/* 4. Trạng thái: Người dùng TỪ CHỐI cấp quyền vị trí (Denied / Blocked) */}
      {geoStatus === "denied" && (
        <div className="nearby-denied-box">
          <p className="nearby-notice">
            {vi
              ? "Bạn chưa bật vị trí. Bật vị trí để tự động hiển thị quán ngon gần bạn nhất (trong 3km)."
              : "Location not enabled. Enable location to see spots near you (within 3km)."}
          </p>
          <button
            type="button"
            className="nearby-retry-button"
            onClick={requestLocation}
          >
            <MapPin size={14} />
            <span>{vi ? "Bật vị trí để tìm quán gần tôi" : "Enable location to find nearby"}</span>
          </button>
        </div>
      )}

      {/* Hàng nút thay thế: "Tìm trên Maps" bên trái, "Mở GrabFood" bên phải (12px, nền trung tính, không đổ bóng) */}
      <div className="nearby-secondary-links">
        <a
          className="maps-button"
          href={`https://www.google.com/maps/search/${encodeURIComponent(
            primarySpot
              ? `${primarySpot.name} ${primarySpot.address}`
              : `${dish} ${vi ? "gần đây" : "nearby"}`
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          <MapPin size={13} aria-hidden="true" />
          <span>{vi ? "Tìm trên Maps" : "Find on Maps"}</span>
          <ArrowUpRight size={12} aria-hidden="true" />
        </a>
        <a
          className="grabfood-button"
          href={`https://food.grab.com/vn/vi/restaurants?${new URLSearchParams({
            search: dish,
            "support-deeplink": "true",
            searchParameter: dish,
          })}`}
          target="_blank"
          rel="noreferrer"
        >
          <span>{vi ? "Mở GrabFood" : "Open GrabFood"}</span>
          <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      </div>

      {/* Nút chính ShopeeFood: Rộng toàn hàng, cao tối thiểu 52–56px, màu cam đỏ nổi bật nhất */}
      <a
        className="shopeefood-button"
        href={
          primarySpot
            ? resolveSpotLink(primarySpot, dish)
            : destination.appHref
        }
        target="_blank"
        rel="sponsored noopener"
      >
        <ShoppingBag size={18} aria-hidden="true" />
        <span>
          {primarySpot
            ? vi
              ? "Mở quán trên ShopeeFood"
              : "Open on ShopeeFood"
            : isSpecific
              ? vi
                ? "Xem quán trên ShopeeFood"
                : "View on ShopeeFood"
              : vi
                ? "Đặt món trên ShopeeFood"
                : "Order on ShopeeFood"}
        </span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>

      {isSpecific && !primarySpot && (
        <p className="ordering-specific-restaurant">{destination.title}</p>
      )}

      {/* Quay lại chọn món: "Chọn món khác" - Nút nhẹ, dễ thấy và bấm */}
      {onClose && (
        <button
          type="button"
          className="change-food-button"
          onClick={onClose}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>{vi ? "Chọn món khác" : "Choose another dish"}</span>
        </button>
      )}
    </div>
  );
}
