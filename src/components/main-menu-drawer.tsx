import { useState, useEffect } from "react";
import {
  X,
  Volume2,
  Volume1,
  VolumeX,
  MapPin,
  SlidersHorizontal,
  Languages,
  ChevronRight,
  Compass,
} from "lucide-react";
import { loadCheckedSpots, CITY_CHECKLISTS } from "@/lib/city-checklist";
import type { Language } from "@/lib/i18n";
import "./main-menu-drawer.css";

export function MainMenuDrawer({
  open,
  onClose,
  volume,
  onVolumeChange,
  language,
  onLanguageChange,
  onOpenPreferences,
  onOpenChecklist,
}: {
  open: boolean;
  onClose: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenPreferences?: () => void;
  onOpenChecklist?: () => void;
}) {
  const vi = language === "vi";
  const [totalChecked, setTotalChecked] = useState(0);
  const [lastVolumeBeforeMute, setLastVolumeBeforeMute] = useState(50);

  useEffect(() => {
    if (open) {
      const checked = loadCheckedSpots();
      setTotalChecked(checked.length);
    }
  }, [open]);

  if (!open) return null;

  const totalPossibleSpots = CITY_CHECKLISTS.reduce(
    (acc, city) => acc + city.items.length,
    0,
  );

  const toggleMute = () => {
    if (volume > 0) {
      setLastVolumeBeforeMute(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(lastVolumeBeforeMute || 50);
    }
  };

  return (
    <>
      <div className="main-menu-overlay" onClick={onClose} aria-hidden="true" />
      <aside
        className="compact-main-menu"
        role="dialog"
        aria-modal="true"
        aria-label={vi ? "Cài đặt & Tiện ích" : "Settings & Menu"}
      >
        {/* Drag handle pill on mobile */}
        <div className="compact-drag-handle" aria-hidden="true" />

        {/* Header */}
        <header className="compact-menu-header">
          <div className="compact-header-title">
            <Compass size={18} className="header-icon" />
            <span>{vi ? "Tiện ích & Cài đặt" : "Tools & Settings"}</span>
          </div>
          <button
            type="button"
            className="compact-close-btn"
            onClick={onClose}
            aria-label={vi ? "Đóng" : "Close"}
          >
            <X size={18} />
          </button>
        </header>

        {/* Menu Body */}
        <div className="compact-menu-body">
          {/* Row 1: Âm lượng thanh kéo (Interactive Draggable Slider) */}
          <div className="compact-slider-card">
            <div className="slider-card-top">
              <span className="slider-label">
                {vi ? "Âm lượng lúc quay" : "Spin sound"}
              </span>
              <span className={`slider-value-badge ${volume === 0 ? "muted" : ""}`}>
                {volume === 0 ? (vi ? "Tắt tiếng" : "Muted") : `${volume}%`}
              </span>
            </div>
            <div className="slider-controls-row">
              <button
                type="button"
                className="slider-mute-btn"
                onClick={toggleMute}
                title={volume === 0 ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {volume === 0 ? (
                  <VolumeX size={18} className="muted-icon" />
                ) : volume < 50 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <div className="slider-input-wrap">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="compact-range-slider"
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${volume}%, #e2d9cd ${volume}%, #e2d9cd 100%)`,
                  }}
                  aria-label={vi ? "Thanh trượt âm lượng" : "Volume slider"}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Ngôn ngữ (Language Segmented Switcher) */}
          <div className="compact-row-container">
            <div className="row-info-col">
              <Languages size={17} className="row-lead-icon" />
              <span className="row-text-title">{vi ? "Ngôn ngữ" : "Language"}</span>
            </div>
            <div className="lang-segmented-pills" role="group" aria-label="Language selection">
              <button
                type="button"
                className={`lang-pill-btn ${language === "vi" ? "active" : ""}`}
                onClick={() => onLanguageChange("vi")}
              >
                🇻🇳 VN
              </button>
              <button
                type="button"
                className={`lang-pill-btn ${language === "en" ? "active" : ""}`}
                onClick={() => onLanguageChange("en")}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          {/* Row 3: Món của tôi */}
          {onOpenPreferences && (
            <button
              type="button"
              className="compact-menu-action-row"
              onClick={() => {
                onClose();
                onOpenPreferences();
              }}
            >
              <div className="action-row-left">
                <div className="action-icon-squircle">
                  <SlidersHorizontal size={17} />
                </div>
                <div className="action-row-texts">
                  <span className="action-row-title">
                    {vi ? "Món của tôi" : "My dishes"}
                  </span>
                  <span className="action-row-desc">
                    {vi ? "Thêm bớt món ruột" : "Personal dish pool"}
                  </span>
                </div>
              </div>
              <ChevronRight size={17} className="action-chevron" />
            </button>
          )}

          {/* Row 4: Checklist Đặc Sản 3 Miền */}
          <button
            type="button"
            className="compact-menu-action-row checklist-accent-row"
            onClick={() => {
              onClose();
              onOpenChecklist?.();
            }}
          >
            <div className="action-row-left">
              <div className="action-icon-squircle accent">
                <MapPin size={17} />
              </div>
              <div className="action-row-texts">
                <div className="checklist-title-line">
                  <span className="action-row-title">
                    {vi ? "Checklist Ẩm Thực 3 Miền" : "Foodie City Checklist"}
                  </span>
                  <span className="checklist-mini-tag">
                    {totalChecked}/{totalPossibleSpots}
                  </span>
                </div>
                <span className="action-row-desc">
                  {vi ? "Hà Nội • Đà Nẵng • TP.HCM" : "Hanoi • Da Nang • HCM"}
                </span>
              </div>
            </div>
            <ChevronRight size={17} className="action-chevron" />
          </button>
        </div>
      </aside>
    </>
  );
}
