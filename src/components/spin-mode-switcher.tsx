import { useEffect, useRef, useState } from "react";
import { Lock, Store, Utensils } from "lucide-react";
import type { Language } from "@/lib/i18n";
import "./spin-mode-switcher.css";

export type SpinMode = "dish" | "restaurant";

interface SpinModeSwitcherProps {
  mode: SpinMode;
  onChange: (mode: SpinMode) => void;
  language: Language;
  disabled?: boolean;
  restaurantLocked?: boolean;
}

export function SpinModeSwitcher({
  mode,
  onChange,
  language,
  disabled = false,
  restaurantLocked = true,
}: SpinModeSwitcherProps) {
  const vi = language === "vi";
  const [showComingSoon, setShowComingSoon] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRestaurantClick = () => {
    if (disabled) return;

    if (restaurantLocked) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowComingSoon(false);
      // Re-trigger animation on next frame so repeated clicks bounce cleanly
      requestAnimationFrame(() => {
        setShowComingSoon(true);
        timeoutRef.current = setTimeout(() => {
          setShowComingSoon(false);
        }, 2200);
      });
      return;
    }

    onChange("restaurant");
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="spin-mode-switcher-wrapper">
      <div
        className="spin-mode-switcher"
        role="radiogroup"
        aria-label={vi ? "Chế độ quay" : "Spin mode"}
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "dish"}
          className={`spin-mode-btn ${mode === "dish" ? "active" : ""}`}
          disabled={disabled}
          onClick={() => onChange("dish")}
        >
          <Utensils size={13} aria-hidden="true" />
          <span>{vi ? "Quay Món" : "Pick Dish"}</span>
        </button>

        <div className="spin-mode-btn-container">
          {showComingSoon && (
            <div
              className="spin-mode-coming-soon-tooltip"
              role="status"
              aria-live="polite"
            >
              <span>Coming soon</span>
              <span className="tooltip-arrow" aria-hidden="true" />
            </div>
          )}
          <button
            type="button"
            role="radio"
            aria-checked={!restaurantLocked && mode === "restaurant"}
            className={`spin-mode-btn ${!restaurantLocked && mode === "restaurant" ? "active" : ""} ${restaurantLocked ? "is-locked" : ""}`}
            disabled={disabled}
            onClick={handleRestaurantClick}
            aria-label={
              restaurantLocked
                ? vi
                  ? "Quay Quán — Tính năng sắp ra mắt (Coming soon)"
                  : "Pick Spot — Coming soon"
                : vi
                  ? "Quay Quán"
                  : "Pick Spot"
            }
          >
            <Store size={13} aria-hidden="true" />
            <span>{vi ? "Quay Quán" : "Pick Spot"}</span>
            {restaurantLocked && (
              <Lock size={10} aria-hidden="true" className="spin-mode-lock-badge" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
