import type { RefObject } from "react";
import { Menu, Settings, Utensils } from "lucide-react";
import { FoodiePetWidget } from "./foodie-pet-widget";
import type { FoodieStreakState } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";

export function AppHeader({
  language,
  disabled,
  onOpenMenu,
  onOpenSettings,
  menuOpen = false,
  settingsOpen = false,
  menuTrigger,
  settingsTrigger,
  streak,
  onOpenPet,
  petOpen = false,
  petPaused = false,
}: {
  language: Language;
  disabled: boolean;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  menuOpen?: boolean;
  settingsOpen?: boolean;
  menuTrigger?: RefObject<HTMLButtonElement | null>;
  settingsTrigger?: RefObject<HTMLButtonElement | null>;
  streak?: FoodieStreakState;
  onOpenPet?: () => void;
  petOpen?: boolean;
  petPaused?: boolean;
}) {
  const vi = language === "vi";

  return (
    <header className="app-header">
      {/* Logo thương hiệu nằm ở bên trái */}
      <a
        href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`}
        className="brand"
        aria-label="Quay cơm online. — Trang chủ"
      >
        <span className="brand-symbol">
          <Utensils size={22} aria-hidden="true" />
        </span>
        <span className="brand-wordmark">
          <span className="brand-title">Quay cơm</span>
          <span className="brand-sub">
            online<span className="brand-dot">.</span>
          </span>
        </span>
      </a>

      {/* Linh thú chuyển vào sân khấu carousel trên điện thoại dọc. */}
      <div className="header-actions">
        {streak && onOpenPet && (
          <FoodiePetWidget streak={streak} onClick={onOpenPet} language={language} placement="header" disabled={disabled} paused={petPaused || petOpen} expanded={petOpen} />
        )}

        <button type="button" ref={settingsTrigger} className="settings-trigger" disabled={disabled} aria-label={vi ? "Cài đặt" : "Settings"} aria-haspopup="dialog" aria-expanded={settingsOpen} onClick={onOpenSettings}>
          <Settings size={18} aria-hidden="true" />
        </button>

        <button
          ref={menuTrigger}
          type="button"
          className="main-menu-trigger"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          disabled={disabled}
          aria-label={vi ? "Menu chính" : "Main menu"}
          onClick={onOpenMenu}
        >
          <Menu size={19} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
