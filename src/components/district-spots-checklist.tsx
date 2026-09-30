import { useState, useEffect, useMemo } from "react";
import {
  Check,
  Compass,
  MapPin,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import {
  DA_NANG_DISTRICTS,
  detectClosestDistrict,
  getSpotsForDistrict,
  formatRatingCount,
  resolveDistrictSpotLink,
  type DistrictSpot,
} from "@/lib/district-spots";
import { haversineDistanceKm, formatDistance } from "@/lib/geo-distance";
import { handleShopeeFoodClick } from "@/lib/shopee-deeplink";
import type { Language } from "@/lib/i18n";
import "./district-spots-checklist.css";

const STORAGE_KEY = "foodtour_visited_spots_v1";

export function DistrictSpotsChecklist({
  language,
}: {
  language: Language;
}) {
  const vi = language === "vi";
  const [selectedDistrict, setSelectedDistrict] = useState("lien-chieu");
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(null);
  const [visitedSpots, setVisitedSpots] = useState<string[]>([]);

  // Load visited spots from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVisitedSpots(parsed);
        }
      }
    } catch {}
  }, []);

  // Detect GPS location & determine nearest district
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });

        // Tự động nhận diện quận gần nhất nếu toạ độ hợp lệ
        const nearest = detectClosestDistrict(lat, lng);
        setDetectedDistrict(nearest);
        setSelectedDistrict(nearest);
      },
      () => {
        // Nếu không cho phép định vị hoặc lỗi: giữ nguyên mặc định Liên Chiểu
      },
      { timeout: 7000, maximumAge: 300000, enableHighAccuracy: false },
    );
  }, []);

  const toggleVisited = (spotId: string) => {
    setVisitedSpots((prev) => {
      const isVisited = prev.includes(spotId);
      const next = isVisited
        ? prev.filter((id) => id !== spotId)
        : [...prev, spotId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(15);
        } catch {}
      }
      return next;
    });
  };

  const districtInfo =
    DA_NANG_DISTRICTS.find((d) => d.id === selectedDistrict) ||
    DA_NANG_DISTRICTS[0];

  const spots = useMemo(
    () => getSpotsForDistrict(selectedDistrict),
    [selectedDistrict],
  );

  const spotsWithDistance = useMemo(() => {
    return spots.map((spot) => {
      let distKm: number | undefined;
      let distFormatted = "";
      if (userCoords) {
        distKm = haversineDistanceKm(
          userCoords.lat,
          userCoords.lng,
          spot.lat,
          spot.lng,
        );
        distFormatted = formatDistance(distKm);
      }
      return {
        ...spot,
        distanceKm: distKm,
        distanceFormatted: distFormatted,
      };
    });
  }, [spots, userCoords]);

  const visitedInDistrict = spots.filter((s) =>
    visitedSpots.includes(s.id),
  ).length;
  const totalInDistrict = spots.length;
  const percentage =
    totalInDistrict > 0
      ? Math.round((visitedInDistrict / totalInDistrict) * 100)
      : 0;

  return (
    <section
      className="district-spots-section"
      aria-labelledby="district-checklist-title"
    >
      {/* Header section */}
      <div className="district-checklist-header">
        <div className="checklist-heading-meta">
          <span className="checklist-eyebrow">
            <Compass size={13} className="eyebrow-icon" />
            {vi ? "FOOD TOUR CHECKLIST" : "FOOD TOUR CHECKLIST"}
          </span>
          <h2 id="district-checklist-title" className="checklist-title">
            {vi ? (
              <>
                Checklist Quán Ngon Nhất{" "}
                <span className="district-highlight">{districtInfo.name}</span>
              </>
            ) : (
              <>
                Best Drink Spots in{" "}
                <span className="district-highlight">{districtInfo.name}</span>
              </>
            )}
          </h2>
          <p className="checklist-desc">
            {vi
              ? "Tuyển chọn các quán cà phê, trà sữa & nước uống chuẩn gu giới trẻ. Tích điểm hành trình food tour của bạn!"
              : "Curated top coffee, boba & chill drink spots. Check off places you’ve experienced!"}
          </p>
        </div>

        {/* District selector pills */}
        <div
          className="district-tabs"
          role="tablist"
          aria-label={vi ? "Chọn quận tại Đà Nẵng" : "Select Da Nang District"}
        >
          {DA_NANG_DISTRICTS.map((d) => {
            const isSelected = d.id === selectedDistrict;
            const isDetected = d.id === detectedDistrict;
            return (
              <button
                key={d.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                className={`district-tab-btn ${isSelected ? "is-active" : ""}`}
                onClick={() => setSelectedDistrict(d.id)}
              >
                {isDetected && <MapPin size={12} className="gps-pill-icon" />}
                <span>{d.name}</span>
                {isSelected && (
                  <span className="active-dot" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gamification Progress Bar */}
      <div className="checklist-progress-card">
        <div className="progress-top-row">
          <div className="progress-counter">
            <Trophy size={16} className="trophy-icon" />
            <span>
              {vi
                ? `Đã khám phá ${visitedInDistrict}/${totalInDistrict} quán`
                : `Explored ${visitedInDistrict}/${totalInDistrict} spots`}
            </span>
          </div>
          <span className="progress-badge">{percentage}%</span>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="progress-quote">
          {percentage === 100 ? (
            <>
              🎉{" "}
              {vi
                ? `Đỉnh chóp! Bạn đã là "Thổ địa đồ uống" của ${districtInfo.name}!`
                : `Awesome! You are a certified drink connoisseur of ${districtInfo.name}!`}
            </>
          ) : percentage >= 50 ? (
            <>
              ⚡{" "}
              {vi
                ? `Tuyệt vời! Bạn đã hoàn thành hơn nửa danh sách, chỉ còn ${totalInDistrict - visitedInDistrict} quán nữa!`
                : `Great job! More than halfway there, only ${totalInDistrict - visitedInDistrict} spots left!`}
            </>
          ) : percentage > 0 ? (
            <>
              ✨{" "}
              {vi
                ? "Khởi đầu tuyệt vời! Thử thêm quán tiếp theo để lên cấp nhé."
                : "Great start! Try the next spot to level up your food tour."}
            </>
          ) : (
            <>
              📌{" "}
              {vi
                ? `Chưa thử quán nào tại ${districtInfo.name}. Bắt đầu check-in ngay thôi!`
                : `Haven’t tried any yet in ${districtInfo.name}. Check your first spot!`}
            </>
          )}
        </p>
      </div>

      {/* Spots Grid */}
      <div className="district-spots-grid">
        {spotsWithDistance.map((spot, index) => {
          const isVisited = visitedSpots.includes(spot.id);
          const orderLink = resolveDistrictSpotLink(spot, spot.name);
          const formattedCount = formatRatingCount(spot.ratingCount);

          return (
            <article
              key={spot.id}
              className={`spot-card ${isVisited ? "spot-visited" : ""}`}
            >
              {/* Badge & Rank */}
              <div className="spot-header-row">
                <div className="spot-rank-badge">#{index + 1}</div>
                {spot.badge && (
                  <span className="spot-highlight-badge">
                    {spot.badge}
                  </span>
                )}
                {isVisited && (
                  <span className="spot-status-pill">
                    <Check size={11} /> {vi ? "Đã thử" : "Visited"}
                  </span>
                )}
              </div>

              {/* Spot Name */}
              <h3 className="spot-name">{spot.name}</h3>

              {/* Rating & Distance */}
              <div className="spot-meta-row">
                <div className="spot-meta-rating">
                  <Star size={13} className="star-icon" fill="currentColor" />
                  <strong>{spot.rating.toFixed(1)}</strong>
                  {formattedCount && (
                    <span className="spot-rating-count">
                      ({formattedCount} {vi ? "đánh giá" : "reviews"})
                    </span>
                  )}
                </div>

                {spot.distanceFormatted && (
                  <>
                    <span className="spot-meta-dot">•</span>
                    <div className="spot-meta-distance">
                      <MapPin size={12} className="pin-icon" />
                      <span>{spot.distanceFormatted}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Address */}
              <p className="spot-address" title={spot.address}>
                {spot.address}
              </p>

              {/* Specialties / Tag Pills */}
              {spot.specialties && spot.specialties.length > 0 && (
                <div className="spot-specialties">
                  {spot.specialties.map((spec) => (
                    <span key={spec} className="specialty-pill">
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions: Checklist Checkbox + ShopeeFood Order CTA */}
              <div className="spot-card-actions">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isVisited}
                  className={`spot-check-btn ${isVisited ? "checked" : ""}`}
                  onClick={() => toggleVisited(spot.id)}
                >
                  <span className="checkbox-box">
                    {isVisited && <Check size={14} />}
                  </span>
                  <span>{isVisited ? (vi ? "Đã thử" : "Tried") : (vi ? "Chưa thử" : "Not yet")}</span>
                </button>

                <a
                  href={orderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spot-order-cta"
                  onClick={(e) => handleShopeeFoodClick(orderLink, e)}
                  title={`${vi ? "Mở quán trên ShopeeFood" : "Open in ShopeeFood"}: ${spot.name}`}
                >
                  <ShoppingBag size={14} />
                  <span>{vi ? "Đặt ShopeeFood" : "Order"}</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
