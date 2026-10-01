import { useRef } from "react";
import { Menu, Utensils } from "lucide-react";
import { FoodiePetWidget } from "./foodie-pet-widget";
import type { FoodieStreakState } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";

export function AppHeader({
  language,
  disabled,
  onOpenMenu,
  streak,
  onOpenPet,
  petOpen = false,
  petPaused = false,
}: {
  language: Language;
  disabled: boolean;
  onOpenMenu: () => void;
  streak?: FoodieStreakState;
  onOpenPet?: () => void;
  petOpen?: boolean;
  petPaused?: boolean;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const vi = language === "vi";

  return (
    <header className="app-header">
      {/* Logo thương hiệu nằm ở bên trái */}
      <a
        href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`}
        className="brand"
        aria-label="Trưa Nay Ăn Gì — Trang chủ"
      >
        <span className="brand-symbol">
          <Utensils size={22} aria-hidden="true" />
        </span>
        <span className="brand-wordmark">
          trưa nay
          <span>
            ăn gì<span className="brand-dot">?</span>
          </span>
        </span>
      </a>

      {/* Linh thú chuyển vào sân khấu carousel trên điện thoại dọc. */}
      <div className="header-actions">
        {streak && onOpenPet && (
          <FoodiePetWidget streak={streak} onClick={onOpenPet} language={language} placement="header" disabled={disabled} paused={petPaused || petOpen} expanded={petOpen} />
        )}

        <div
          className="country-badge"
          title="Khu vực Việt Nam"
          aria-label="Khu vực Việt Nam"
        >
          <span className="flag-icon" aria-hidden="true">
            🇻🇳
          </span>
          <span className="country-code">VN</span>
        </div>

        <button
          ref={trigger}
          className="main-menu-trigger"
          disabled={disabled}
          aria-label={vi ? "Menu chính" : "Main menu"}
          onClick={onOpenMenu}
        >
          <Menu size={19} aria-hidden="true" />
          <span className="menu-btn-label">{vi ? "Menu" : "Menu"}</span>
        </button>
      </div>
    </header>
  );
}
