import { useState, useEffect, useMemo } from "react";
import { Check, MapPin, ArrowUpRight } from "lucide-react";
import {
  DA_NANG_DISTRICTS,
  detectClosestDistrict,
  getSpotsForDistrict,
  resolveDistrictSpotLink,
  convertDbRestaurantToDistrictSpot,
  type DistrictSpot,
} from "@/lib/district-spots";
import { fetchDistrictDrinkSpotsFromDb } from "@/lib/supabase-client";
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

        const nearest = detectClosestDistrict(lat, lng);
        setDetectedDistrict(nearest);
        setSelectedDistrict(nearest);
      },
      () => {},
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

  const [dbSpots, setDbSpots] = useState<DistrictSpot[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const info = DA_NANG_DISTRICTS.find((d) => d.id === selectedDistrict);
    if (!info) return;

    fetchDistrictDrinkSpotsFromDb(info.name, "da-nang", 12)
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((r) =>
            convertDbRestaurantToDistrictSpot(r, info.id, info.name),
          );
          setDbSpots(mapped);
        } else {
          setDbSpots(null);
        }
      })
      .catch(() => {
        if (!cancelled) setDbSpots(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDistrict]);

  const spots = useMemo(() => {
    if (dbSpots && dbSpots.length > 0) {
      return dbSpots;
    }
    return getSpotsForDistrict(selectedDistrict);
  }, [dbSpots, selectedDistrict]);

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
      aria-label={vi ? "Checklist quán nước ngon" : "Drink spots checklist"}
    >
      {/* District Pill Tabs (Horizontal swipe) */}
      <div className="district-tabs-wrapper">
        <div
          className="district-tabs"
          role="tablist"
          aria-label={vi ? "Chọn quận tại Đà Nẵng" : "Select District"}
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
                className={`district-pill ${isSelected ? "is-active" : ""}`}
                onClick={() => setSelectedDistrict(d.id)}
              >
                {isDetected && <MapPin size={11} className="gps-pill-icon" />}
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimalist Progress Row */}
      <div className="checklist-progress-bar-wrap">
        <div className="checklist-progress-meta">
          <span className="checklist-progress-title">
            {vi
              ? `Checklist ${districtInfo.name}`
              : `Top ${districtInfo.name}`}
            <span className="checklist-progress-count">
              ({visitedInDistrict}/{totalInDistrict})
            </span>
          </span>
          <span className="checklist-progress-percent">{percentage}%</span>
        </div>
        <div
          className="checklist-progress-line"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="checklist-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Compact Mobile-Friendly Spots List */}
      <div className="district-spots-list">
        {spotsWithDistance.map((spot, index) => {
          const isVisited = visitedSpots.includes(spot.id);
          const orderLink = resolveDistrictSpotLink(spot, spot.name);
          const specialty = spot.specialties?.[0] || "";

          return (
            <div
              key={spot.id}
              className={`spot-row ${isVisited ? "is-visited" : ""}`}
            >
              {/* Checkbox circle */}
              <button
                type="button"
                role="checkbox"
                aria-checked={isVisited}
                aria-label={`${isVisited ? "Bỏ chọn" : "Đánh dấu đã thử"}: ${spot.name}`}
                className="spot-check-circle"
                onClick={() => toggleVisited(spot.id)}
              >
                {isVisited && <Check size={12} strokeWidth={3} />}
              </button>

              {/* Spot Info */}
              <div
                className="spot-row-info"
                onClick={() => toggleVisited(spot.id)}
              >
                <div className="spot-row-title">
                  <span className="spot-rank">#{index + 1}</span>
                  <span className="spot-name">{spot.name}</span>
                </div>
                <div className="spot-row-meta">
                  <span className="spot-rating">⭐ {spot.rating.toFixed(1)}</span>
                  {spot.distanceFormatted && (
                    <>
                      <span className="spot-dot">·</span>
                      <span className="spot-dist">{spot.distanceFormatted}</span>
                    </>
                  )}
                  {specialty && (
                    <>
                      <span className="spot-dot">·</span>
                      <span className="spot-spec">{specialty}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Direct Order CTA */}
              <a
                href={orderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="spot-order-cta"
                onClick={(e) => handleShopeeFoodClick(orderLink, e)}
                title={`${vi ? "Mở ShopeeFood" : "Order on ShopeeFood"}: ${spot.name}`}
              >
                <span>{vi ? "Đặt" : "Order"}</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
