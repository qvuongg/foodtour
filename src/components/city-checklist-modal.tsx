import { useRef, useState, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  X,
  MapPin,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Coffee,
  Utensils,
  ChevronDown,
} from "lucide-react";
import {
  CITY_CHECKLISTS,
  type CityChecklistData,
} from "@/lib/city-checklist";
import type { FoodieStreakState } from "@/lib/foodie-streak";
import { shopeeFoodSearchUrl } from "@/lib/food-ordering";
import type { Language } from "@/lib/i18n";
import "./city-checklist-modal.css";

const BADGE_LABELS_EN: Record<string, string> = {
  "Biểu tượng": "Iconic",
  "Đặc sản": "Local specialty",
  "Phải thử": "Must try",
  "Di sản": "Heritage",
  "Gây nghiện": "Local favorite",
  "Đặc trưng": "Signature",
  "Truyền thống": "Traditional",
  "Hà Nội xưa": "Old Hanoi",
  "Ăn vặt": "Snack",
  "Ăn sáng": "Breakfast",
  "Trứ danh": "Renowned",
  "Hút khách": "Popular",
  "Đồ uống hot": "Favorite drink",
  "Ăn trưa": "Lunch",
  "Độc đáo": "Distinctive",
  "Đậm đà": "Rich flavor",
  "Tráng miệng": "Dessert",
  "Nổi tiếng": "Famous",
  "Thói quen": "Daily favorite",
  "Kinh điển": "Classic",
  "Món nhậu": "Pub food",
  "Đậm vị": "Full of flavor",
};

export type LocalChecklistProps = {
  language: Language;
  state?: FoodieStreakState;
  onSetChecked?: (id: string, checked: boolean) => Promise<boolean>;
  storageError?: string | null;
  onRetrySave?: () => Promise<boolean>;
};

export function LocalChecklist({
  language,
  storageError,
  onRetrySave,
}: LocalChecklistProps) {
  const vi = language === "vi";
  const [activeCityId, setActiveCityId] = useState<
    "ha-noi" | "da-nang" | "ho-chi-minh"
  >("ha-noi");
  const [itemKind, setItemKind] = useState<"food" | "drink">("food");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentCityData: CityChecklistData =
    CITY_CHECKLISTS.find((city) => city.cityId === activeCityId) || CITY_CHECKLISTS[0];

  const filteredItems = currentCityData.items.filter((item) => item.kind === itemKind);

  return (
    <div className="local-checklist">
      <p className="local-checklist-intro">
        {vi
          ? "Đặc sản trứ danh 3 miền · Bấm Tìm quán để đặt ngay trên ShopeeFood"
          : "Famous regional specialties · Tap Find spots to order on ShopeeFood"}
      </p>

      {storageError && (
        <div className="checklist-save-error" role="alert">
          <p>
            {vi
              ? "Thay đổi chưa được lưu trên thiết bị. Đừng đóng trang trước khi thử lại."
              : "Changes are not saved on this device. Retry before leaving the page."}
          </p>
          {onRetrySave && (
            <button
              type="button"
              onClick={() => {
                void onRetrySave();
              }}
            >
              {vi ? "Thử lưu lại" : "Retry saving"}
            </button>
          )}
        </div>
      )}

      <section className="checklist-discovery" aria-label={vi ? "Món địa phương" : "Local dishes"}>
        {/* Thanh chọn 3 thành phố */}
        <div className="checklist-city-tabs" role="group" aria-label={vi ? "Chọn thành phố" : "Choose a city"}>
          {CITY_CHECKLISTS.map((city) => {
            const isSelected = activeCityId === city.cityId;
            return (
              <button
                key={city.cityId}
                type="button"
                aria-label={city.cityName}
                aria-pressed={isSelected}
                className={`checklist-city-tab ${isSelected ? "active" : ""}`}
                onClick={() => {
                  setActiveCityId(city.cityId);
                  setExpandedIds({});
                }}
              >
                <span>{city.cityId === "ho-chi-minh" ? "TP.HCM" : city.cityName}</span>
              </button>
            );
          })}
        </div>

        {/* Thông tin tổng quan thành phố */}
        <div className="checklist-city-summary">
          <span className="checklist-city-summary-text">
            <MapPin size={13} aria-hidden="true" />
            <span>
              {vi
                ? `${currentCityData.cityName} · ${currentCityData.items.length} món ngon đặc trưng`
                : `${currentCityData.cityName} · ${currentCityData.items.length} signature dishes`}
            </span>
          </span>
        </div>

        {/* Bộ lọc: Món ăn / Đồ uống */}
        <div className="checklist-filters">
          <div className="checklist-kind-tabs" role="group" aria-label={vi ? "Loại trải nghiệm" : "Experience type"}>
            {(["food", "drink"] as const).map((kind) => {
              const count = currentCityData.items.filter((item) => item.kind === kind).length;
              const isSelected = itemKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  data-kind={kind}
                  aria-pressed={isSelected}
                  className={isSelected ? "active" : ""}
                  onClick={() => setItemKind(kind)}
                >
                  {kind === "food" ? <Utensils size={15} aria-hidden="true" /> : <Coffee size={15} aria-hidden="true" />}
                  <span>{kind === "food" ? (vi ? "Món ăn" : "Food") : (vi ? "Đồ uống" : "Drinks")}</span>
                  <small>{count}</small>
                </button>
              );
            })}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="checklist-empty-state" role="status">
            <Sparkles size={28} aria-hidden="true" />
            <strong>{vi ? "Chưa có món trong mục này" : "No items in this category"}</strong>
            <p>{vi ? "Đổi nhóm hoặc thành phố để khám phá tiếp nhé." : "Choose another category or city to explore."}</p>
          </div>
        ) : (
          <div className="checklist-grid">
            {filteredItems.map((item) => {
              const isExpanded = Boolean(expandedIds[item.id]);
              return (
                <article key={item.id} data-item-id={item.id} className="checklist-item-card">
                  <div className="checklist-item-main-row">
                    {/* Bấm vào để xem mô tả / quán gợi ý */}
                    <button
                      type="button"
                      className="checklist-item-summary-btn"
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpand(item.id)}
                      aria-label={vi ? `Xem thông tin ${item.name}` : `Details for ${item.name}`}
                    >
                      <div className="checklist-item-name-group">
                        <span className="checklist-item-name">{item.name}</span>
                        <div className="checklist-item-subtags">
                          {item.badge && (
                            <span className="checklist-item-badge">
                              {vi ? item.badge : BADGE_LABELS_EN[item.badge] ?? "Local favorite"}
                            </span>
                          )}
                          {item.priceEstimate && (
                            <span className="checklist-item-price-tag">~{item.priceEstimate}</span>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`checklist-item-chevron ${isExpanded ? "is-expanded" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Nút Tìm quán để ở ngoài để người dùng bấm vào luôn */}
                    <a
                      href={shopeeFoodSearchUrl(item.name, activeCityId, { affiliate: true })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="checklist-find-btn"
                      title={vi ? `Tìm quán ${item.name} trên ShopeeFood` : `Find places for ${item.name} on ShopeeFood`}
                      aria-label={vi ? `Tìm quán ${item.name} trên ShopeeFood (mở tab mới)` : `Find places for ${item.name} on ShopeeFood`}
                    >
                      <span>{vi ? "Tìm quán" : "Find spots"}</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </div>

                  {/* Chi tiết khi bấm mở rộng: thông tin món, nguồn gốc, quán gợi ý (bỏ hoàn toàn +5XP) */}
                  {isExpanded && (
                    <div className="checklist-item-expanded-content">
                      {(vi ? item.description : item.descriptionEn) && (
                        <p className="checklist-item-desc">{vi ? item.description : item.descriptionEn}</p>
                      )}
                      {item.signatureSpot && (
                        <p className="checklist-item-spot">
                          <strong>{vi ? "Quán gợi ý: " : "Recommended spots: "}</strong>
                          {item.signatureSpot}
                        </p>
                      )}
                      {(item.district || item.priceEstimate) && (
                        <p className="checklist-item-meta">
                          {item.district && (
                            <>
                              <MapPin size={12} aria-hidden="true" />
                              <span>{item.district}</span>
                            </>
                          )}
                          {item.district && item.priceEstimate && <span aria-hidden="true">·</span>}
                          {item.priceEstimate && (
                            <span>{vi ? "Giá tham khảo" : "Est. price"} ~{item.priceEstimate}</span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function CityChecklistModal({
  open,
  onClose,
  onBack,
  finalFocus,
  ...checklistProps
}: LocalChecklistProps & {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  finalFocus?: RefObject<HTMLElement | null>;
}) {
  const vi = checklistProps.language === "vi";
  const closeRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="checklist-modal-overlay" />
        <Dialog.Popup className="checklist-modal-container checklist-journal-only" initialFocus={closeRef} finalFocus={finalFocus}>
          <header className="checklist-modal-header">
            {onBack && (
              <button
                type="button"
                className="checklist-back-btn"
                onClick={onBack}
                aria-label={vi ? "Quay lại linh thú" : "Back to your pet"}
              >
                <ArrowLeft size={20} aria-hidden="true" />
              </button>
            )}
            <div className="checklist-heading">
              <span className="checklist-eyebrow">{vi ? "Hành trình vị ngon" : "Your flavor journey"}</span>
              <Dialog.Title className="checklist-modal-title">{vi ? "Món ngon local" : "Local specialties"}</Dialog.Title>
              <Dialog.Description className="checklist-modal-description">
                {vi ? "Đặc sản trứ danh 3 miền · Tìm quán ăn liền tay" : "Curated regional specialties · Find places to eat"}
              </Dialog.Description>
            </div>
            <Dialog.Close ref={closeRef} className="checklist-close-btn" aria-label={vi ? "Đóng" : "Close"}><X size={20} aria-hidden="true" /></Dialog.Close>
          </header>
          <div className="checklist-body"><LocalChecklist {...checklistProps} /></div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
