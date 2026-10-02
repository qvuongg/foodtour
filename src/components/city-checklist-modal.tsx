import { useId, useRef, useState, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  X,
  MapPin,
  Check,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Coffee,
  Utensils,
  ChevronDown,
  SlidersHorizontal,
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
  state: FoodieStreakState;
  onSetChecked: (id: string, checked: boolean) => Promise<boolean>;
  storageError?: string | null;
  onRetrySave?: () => Promise<boolean>;
};

export function LocalChecklist({
  language,
  state,
  onSetChecked,
  storageError,
  onRetrySave,
}: LocalChecklistProps) {
  const vi = language === "vi";
  const [activeCityId, setActiveCityId] = useState<
    "ha-noi" | "da-nang" | "ho-chi-minh"
  >("ha-noi");
  const checkedSpots = state.checkedSpotIds;
  const [pendingSpot, setPendingSpot] = useState<string | null>(null);
  const pending = useRef(false);
  const [filterMode, setFilterMode] = useState<"all" | "untested" | "tested">("all");
  const [itemKind, setItemKind] = useState<"food" | "drink">("food");
  const [feedback, setFeedback] = useState("");
  const instanceId = useId();

  const currentCityData: CityChecklistData =
    CITY_CHECKLISTS.find((city) => city.cityId === activeCityId) || CITY_CHECKLISTS[0];
  const cityCheckedCount = currentCityData.items.filter((item) =>
    checkedSpots.includes(item.id),
  ).length;
  const percentComplete = Math.round(
    (cityCheckedCount / currentCityData.items.length) * 100,
  );
  const filteredItems = currentCityData.items.filter((item) => {
    if (item.kind !== itemKind) return false;
    const isChecked = checkedSpots.includes(item.id);
    if (filterMode === "tested") return isChecked;
    if (filterMode === "untested") return !isChecked;
    return true;
  });

  const toggleCheckSpot = async (spotId: string) => {
    if (pending.current) return;
    pending.current = true;
    setPendingSpot(spotId);
    const checked = !checkedSpots.includes(spotId);
    try {
      const saved = await onSetChecked(spotId, checked);
      setFeedback(saved
        ? vi ? checked ? "Đã đánh dấu món đã thử. +5 XP." : "Đã bỏ đánh dấu. Hoàn tác 5 XP."
          : checked ? "Marked as tried. +5 XP." : "Unchecked. 5 XP undone."
        : vi ? "Chưa lưu được thay đổi. Bạn có thể thử lưu lại." : "Changes could not be saved. Please retry saving.");
    } finally {
      pending.current = false;
      setPendingSpot(null);
    }
  };

  return (
    <div className="local-checklist">
      <p className="local-checklist-intro">{vi ? "Đánh dấu món đã thử · +5 XP mỗi món" : "Mark a dish as tried · +5 XP each"}</p>
      {storageError && <div className="checklist-save-error" role="alert">
        <p>{vi ? "Thay đổi chưa được lưu trên thiết bị. Đừng đóng trang trước khi thử lại." : "Changes are not saved on this device. Retry before leaving the page."}</p>
        {onRetrySave && <button type="button" onClick={() => { void onRetrySave(); }}>{vi ? "Thử lưu lại" : "Retry saving"}</button>}
      </div>}
      <section className="checklist-discovery" aria-label={vi ? "Món địa phương" : "Local dishes"}>
        <div className="checklist-city-tabs" role="group" aria-label={vi ? "Chọn thành phố" : "Choose a city"}>
          {CITY_CHECKLISTS.map((city) => {
            const isSelected = activeCityId === city.cityId;
            return (
              <button key={city.cityId} type="button" aria-label={city.cityName} aria-pressed={isSelected} className={`checklist-city-tab ${isSelected ? "active" : ""}`} onClick={() => setActiveCityId(city.cityId)}>
                <span>{city.cityId === "ho-chi-minh" ? "TP.HCM" : city.cityName}</span>
              </button>
            );
          })}
        </div>
        <div className="checklist-city-progress">
          <p><strong>{cityCheckedCount}/{currentCityData.items.length}</strong> {vi ? "món đã thử" : "dishes tried"}</p>
          <span aria-hidden="true">{percentComplete}%</span>
        </div>
        <div className="checklist-progress-track checklist-city-track" role="progressbar" aria-label={vi ? `Món đã thử tại ${currentCityData.cityName}` : `Dishes tried in ${currentCityData.cityName}`} aria-valuemin={0} aria-valuemax={currentCityData.items.length} aria-valuenow={cityCheckedCount}>
          <span style={{ width: `${percentComplete}%` }} />
        </div>

        <div className="checklist-filters">
          <div className="checklist-kind-tabs" role="group" aria-label={vi ? "Loại trải nghiệm" : "Experience type"}>
            {(["food", "drink"] as const).map((kind) => (
              <button key={kind} type="button" data-kind={kind} aria-pressed={itemKind === kind} onClick={() => setItemKind(kind)}>
                {kind === "food" ? <Utensils size={15} aria-hidden="true" /> : <Coffee size={15} aria-hidden="true" />}
                <span>{kind === "food" ? vi ? "Món ăn" : "Food" : vi ? "Đồ uống" : "Drinks"}</span>
                <small>{currentCityData.items.filter((item) => item.kind === kind).length}</small>
              </button>
            ))}
          </div>
          <div className="checklist-status-field" data-filtered={filterMode !== "all"}>
            <span className="checklist-status-display" aria-hidden="true">
              <SlidersHorizontal size={14} />
              <span>{filterMode === "all" ? vi ? "Tất cả" : "All" : filterMode === "untested" ? vi ? "Chưa thử" : "To try" : vi ? "Đã thử" : "Tried"}</span>
              <ChevronDown size={12} />
            </span>
            <select className="checklist-status-select" aria-label={vi ? "Trạng thái trải nghiệm" : "Experience status"} value={filterMode} onChange={(event) => setFilterMode(event.target.value as typeof filterMode)}>
              <option value="all">{vi ? "Tất cả" : "All"}</option>
              <option value="untested">{vi ? "Chưa thử" : "To try"}</option>
              <option value="tested">{vi ? "Đã thử" : "Tried"}</option>
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="checklist-empty-state" role="status">
            <Sparkles size={28} aria-hidden="true" />
            <strong>{filterMode === "tested" ? vi ? "Chưa có trải nghiệm trong nhóm này" : "No experiences in this group yet" : vi ? "Bạn đã thử hết nhóm này!" : "You have tried this whole group!"}</strong>
            <p>{filterMode === "tested"
              ? vi ? "Đánh dấu món bạn đã thưởng thức để lưu vào sổ tay." : "Mark a dish you have enjoyed to add it to your journal."
              : vi ? "Đổi nhóm hoặc thành phố để khám phá tiếp nhé." : "Choose another group or city to keep exploring."}</p>
          </div>
        ) : (
          <div className="checklist-grid">
            {filteredItems.map((item) => {
              const isChecked = checkedSpots.includes(item.id);
              return (
                <article key={item.id} data-item-id={item.id} className={`checklist-item-card ${isChecked ? "checked" : ""}`}>
                  <button type="button" className="checklist-item-toggle" role="checkbox" aria-checked={isChecked} disabled={pendingSpot !== null} aria-label={`${vi ? "Đã thử" : "Tried"}: ${item.name}`} onClick={() => toggleCheckSpot(item.id)}>
                    <span className="checklist-check-square" aria-hidden="true">{isChecked && <Check size={16} strokeWidth={2.5} />}</span>
                    <span className="checklist-item-main">
                      <span className="checklist-item-name">{item.name}</span>
                    </span>
                  </button>
                  <details className="checklist-item-details" name={`${instanceId}-items`}>
                    <summary aria-label={vi ? `Thông tin ${item.name}` : `Details for ${item.name}`}>
                      <ChevronDown size={17} aria-hidden="true" />
                    </summary>
                    <div className="checklist-item-detail-content">
                      {item.badge && <p className="checklist-item-category">{vi ? item.badge : BADGE_LABELS_EN[item.badge] ?? "Local favorite"}</p>}
                      {(vi ? item.description : item.descriptionEn) && <p>{vi ? item.description : item.descriptionEn}</p>}
                      {item.signatureSpot && <p><strong>{vi ? "Gợi ý tham khảo: " : "Suggestions: "}</strong>{item.signatureSpot}</p>}
                      {(item.district || item.priceEstimate) && <p className="checklist-item-meta">
                        {item.district && <><MapPin size={12} aria-hidden="true" />{item.district}</>}
                        {item.district && item.priceEstimate && <span aria-hidden="true">·</span>}
                        {item.priceEstimate && <span>{vi ? "Giá tham khảo" : "Est. price"} ~{item.priceEstimate}</span>}
                      </p>}
                      <div className="checklist-item-actions">
                        <span className="checklist-item-reward"><Sparkles size={12} aria-hidden="true" />{isChecked ? vi ? "+5 XP đã nhận" : "+5 XP earned" : vi ? "Đánh dấu đã thử +5 XP" : "Mark as tried +5 XP"}</span>
                        <a href={shopeeFoodSearchUrl(item.name, activeCityId)} target="_blank" rel="noopener noreferrer" className="checklist-order-link" aria-label={vi ? `Tìm ${item.name} trên ShopeeFood (mở tab mới)` : `Find ${item.name} on ShopeeFood (opens a new tab)`}>
                          {vi ? "Tìm món" : "Find dish"}<ExternalLink size={14} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <p className="checklist-feedback" role="status" aria-live="polite">{feedback}</p>
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
            {onBack && <button type="button" className="checklist-back-btn" onClick={onBack} aria-label={vi ? "Quay lại linh thú" : "Back to your pet"}><ArrowLeft size={20} aria-hidden="true" /></button>}
            <div className="checklist-heading">
              <span className="checklist-eyebrow">{vi ? "Hành trình vị ngon" : "Your flavor journey"}</span>
              <Dialog.Title className="checklist-modal-title">{vi ? "Sổ tay ẩm thực" : "Food journal"}</Dialog.Title>
              <Dialog.Description className="checklist-modal-description">{vi ? "Đánh dấu món đã thử · +5 XP mỗi món" : "Mark a dish as tried · +5 XP each"}</Dialog.Description>
            </div>
            <Dialog.Close ref={closeRef} className="checklist-close-btn" aria-label={vi ? "Đóng" : "Close"}><X size={20} aria-hidden="true" /></Dialog.Close>
          </header>
          <div className="checklist-body"><LocalChecklist {...checklistProps} /></div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
