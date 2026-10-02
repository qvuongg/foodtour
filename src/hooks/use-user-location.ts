import { useEffect, useState, useCallback } from "react";
import { readCookie, writeCookie } from "@/lib/cookies";

export type CitySlug = "da-nang" | "ha-noi" | "ho-chi-minh";

export interface UserCoordinates {
  lat: number;
  lng: number;
}

export function detectCityFromCoords(lat: number, lng: number): CitySlug {
  if (lat >= 19.0) return "ha-noi";
  if (lat >= 14.5 && lat <= 18.0) return "da-nang";
  return "ho-chi-minh";
}

export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [city, setCityState] = useState<CitySlug>(() => {
    try {
      const saved = readCookie<string>("foodtour_city");
      if (saved === "ha-noi" || saved === "da-nang" || saved === "ho-chi-minh") {
        return saved;
      }
    } catch {}
    return "da-nang";
  });
  const [gpsReady, setGpsReady] = useState(false);

  // Chỉ xin quyền vị trí của user khi người dùng tương tác (ví dụ: bấm chuyển sang Quay Quán)
  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGpsReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(nextCoords);
        setGpsReady(true);

        // Tự động nhận diện thành phố dựa theo toạ độ thực tế
        const autoCity = detectCityFromCoords(nextCoords.lat, nextCoords.lng);
        setCityState(autoCity);
        try {
          writeCookie("foodtour_city", autoCity);
        } catch {}
      },
      () => {
        setGpsReady(true);
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true },
    );
  }, []);

  const selectCity = useCallback((nextCity: CitySlug) => {
    setCityState(nextCity);
    try {
      writeCookie("foodtour_city", nextCity);
    } catch {}
  }, []);

  return {
    coords,
    city,
    requestLocation,
    selectCity,
    gpsReady,
  };
}
