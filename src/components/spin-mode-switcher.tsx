import { Store, Utensils } from "lucide-react";
import type { Language } from "@/lib/i18n";
import "./spin-mode-switcher.css";

export type SpinMode = "dish" | "restaurant";

interface SpinModeSwitcherProps {
  mode: SpinMode;
  onChange: (mode: SpinMode) => void;
  language: Language;
  disabled?: boolean;
}

export function SpinModeSwitcher({
  mode,
  onChange,
  language,
  disabled = false,
}: SpinModeSwitcherProps) {
  const vi = language === "vi";

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

        <button
          type="button"
          role="radio"
          aria-checked={mode === "restaurant"}
          className={`spin-mode-btn ${mode === "restaurant" ? "active" : ""}`}
          disabled={disabled}
          onClick={() => onChange("restaurant")}
        >
          <Store size={13} aria-hidden="true" />
          <span>{vi ? "Quay Quán" : "Pick Spot"}</span>
        </button>
      </div>
    </div>
  );
}
