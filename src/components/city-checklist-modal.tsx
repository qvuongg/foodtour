import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  X,
  MapPin,
  Check,
  Sparkles,
  ExternalLink,
  Flame,
  CalendarDays,
  Share2,
  Coffee,
  Utensils,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import {
  CITY_CHECKLISTS,
  loadCheckedSpots,
  saveCheckedSpots,
  type CityChecklistData,
} from "@/lib/city-checklist";
import {
  addChecklistStreak,
  getFlameTier,
  getNextTierProgress,
  type FoodieStreakState,
} from "@/lib/foodie-streak";
import { shopeeFoodSearchUrl } from "@/lib/food-ordering";
import { FoodiePet } from "./foodie-pet";
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

export function CityChecklistModal({
  open,
  onClose,
  language,
  streak,
  onStreakChange,
}: {
  open: boolean;
  onClose: () => void;
  language: Language;
  streak: FoodieStreakState;
  onStreakChange: (next: FoodieStreakState) => void;
}) {
  const vi = language === "vi";
  const [activeCityId, setActiveCityId] = useState<
    "ha-noi" | "da-nang" | "ho-chi-minh"
  >("ha-noi");
  const [checkedSpots, setCheckedSpots] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "untested" | "tested">("all");
  const [itemKind, setItemKind] = useState<"food" | "drink">("food");
  const [isPetEating, setIsPetEating] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [feedback, setFeedback] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const eatingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setCheckedSpots(loadCheckedSpots());
      setFeedback("");
    } else {
      setIsPetEating(false);
      setCopiedShare(false);
    }
    return () => {
      if (eatingTimer.current) clearTimeout(eatingTimer.current);
      if (shareTimer.current) clearTimeout(shareTimer.current);
    };
  }, [open]);

  const currentCityData: CityChecklistData =
    CITY_CHECKLISTS.find((city) => city.cityId === activeCityId) || CITY_CHECKLISTS[0];
  const cityCheckedCount = currentCityData.items.filter((item) =>
    checkedSpots.includes(item.id),
  ).length;
  const percentComplete = Math.round(
    (cityCheckedCount / currentCityData.items.length) * 100,
  );
  const flameTier = getFlameTier(streak.score);
  const tierProgress = getNextTierProgress(streak.score);
  const tierName = vi ? flameTier.nameVi : flameTier.nameEn;
  const filteredItems = currentCityData.items.filter((item) => {
    if (item.kind !== itemKind) return false;
    const isChecked = checkedSpots.includes(item.id);
    if (filterMode === "tested") return isChecked;
    if (filterMode === "untested") return !isChecked;
    return true;
  });

  const toggleCheckSpot = (spotId: string) => {
    const isChecked = checkedSpots.includes(spotId);
    const nextChecked = isChecked
      ? checkedSpots.filter((id) => id !== spotId)
      : [...checkedSpots, spotId];
    setCheckedSpots(nextChecked);
    saveCheckedSpots(nextChecked);

    // Keep existing checklist rewards and persistence unchanged.
    const { nextState } = addChecklistStreak(streak, !isChecked);
    onStreakChange(nextState);
    setFeedback(
      vi
        ? `${isChecked ? "Đã bỏ đánh dấu" : "Đã đánh dấu món đã thử"}. ${nextState.score} điểm lửa.`
        : `${isChecked ? "Dish unchecked" : "Dish marked as tried"}. ${nextState.score} flame points.`,
    );

    if (eatingTimer.current) clearTimeout(eatingTimer.current);
    setIsPetEating(!isChecked);
    if (!isChecked) {
      eatingTimer.current = setTimeout(() => setIsPetEating(false), 1200);
    }
    if (
      typeof navigator !== "undefined" &&
      "vibrate" in navigator &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      try {
        navigator.vibrate(!isChecked ? [20, 50, 30] : 15);
      } catch {}
    }
  };

  const handleShareStreak = async () => {
    const shareText = vi
      ? `Linh thú ẩm thực của tôi đã đạt ${streak.score} điểm lửa (${tierName}) trên Trưa Nay Ăn Gì! Cùng khám phá món ngon nhé.`
      : `My foodie pet reached ${streak.score} flame points (${tierName}) on Trưa Nay Ăn Gì! Let's discover something delicious.`;
    const shareData = {
      title: vi ? "Trưa Nay Ăn Gì? — Linh thú ẩm thực" : "Trưa Nay Ăn Gì? — Foodie companion",
      text: shareText,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopiedShare(true);
      setFeedback(vi ? "Đã sao chép nội dung chia sẻ." : "Share text copied.");
      if (shareTimer.current) clearTimeout(shareTimer.current);
      shareTimer.current = setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      setFeedback(vi ? "Chưa thể chia sẻ. Bạn thử lại nhé." : "Sharing is unavailable. Please try again.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="checklist-modal-overlay" />
        <Dialog.Popup className="checklist-modal-container" initialFocus={closeRef}>
          <header className="checklist-modal-header">
            <div className="checklist-heading">
              <span className="checklist-eyebrow">{vi ? "Bạn đồng hành" : "Your companion"}</span>
              <Dialog.Title className="checklist-modal-title">
                {vi ? "Linh thú ẩm thực" : "Your foodie pet"}
              </Dialog.Title>
              <Dialog.Description className="checklist-modal-description">
                {vi ? "Thử món mới. Lớn lên cùng nhau." : "Discover new dishes. Grow together."}
              </Dialog.Description>
            </div>
            <Dialog.Close ref={closeRef} className="checklist-close-btn" aria-label={vi ? "Đóng" : "Close"}>
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="checklist-body">
            <section
              className={`checklist-pet-hero tier-${flameTier.id}`}
              aria-label={vi ? "Linh thú và tiến độ" : "Companion and progress"}
              style={{ "--hero-tier-color": flameTier.colorHex } as CSSProperties}
            >
              <div className="checklist-pet-intro">
                <div className="checklist-pet-avatar">
                  <FoodiePet tier={flameTier} score={streak.score} isEating={isPetEating} size="md" language={language} decorative />
                </div>
                <div className="checklist-pet-details">
                  <span className="checklist-tier-label"><span aria-hidden="true" />{tierName}</span>
                  <h3>{streak.petName}</h3>
                  <p>{vi ? flameTier.petTitleVi : flameTier.petTitleEn}</p>
                </div>
                <button type="button" className="checklist-share-btn" onClick={handleShareStreak} aria-label={copiedShare ? vi ? "Đã sao chép" : "Copied" : vi ? "Chia sẻ linh thú" : "Share your pet"} title={vi ? "Chia sẻ linh thú" : "Share your pet"}>
                  {copiedShare ? <Check size={17} aria-hidden="true" /> : <Share2 size={17} aria-hidden="true" />}
                </button>
              </div>

              <dl className="checklist-pet-stats">
                <div>
                  <dt><Flame size={15} aria-hidden="true" />{vi ? "Điểm lửa" : "Flame points"}</dt>
                  <dd>{streak.score}<span>{vi ? "điểm" : "pts"}</span></dd>
                </div>
                <div>
                  <dt><CalendarDays size={15} aria-hidden="true" />{vi ? "Chuỗi ngày" : "Daily streak"}</dt>
                  <dd>{streak.dailyStreak}<span>{vi ? "ngày" : streak.dailyStreak === 1 ? "day" : "days"}</span></dd>
                </div>
              </dl>

              <div className="checklist-level-progress">
                <div className="checklist-progress-caption">
                  <span>{tierProgress.nextTier
                    ? vi ? `Còn ${tierProgress.pointsNeeded} điểm để lên cấp` : `${tierProgress.pointsNeeded} pts to the next level`
                    : vi ? "Đã đạt cấp cao nhất" : "Highest level reached"}</span>
                  <strong>{tierProgress.nextTier ? `${streak.score}/${tierProgress.nextTier.minScore}` : vi ? "Tối thượng" : "Max level"}</strong>
                </div>
                <div
                  className="checklist-progress-track"
                  role="progressbar"
                  aria-label={vi ? "Tiến độ lên cấp linh thú" : "Pet level progress"}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={tierProgress.progressPercent}
                  aria-valuetext={tierProgress.nextTier
                    ? vi ? `Còn ${tierProgress.pointsNeeded} điểm để đạt ${tierProgress.nextTier.nameVi}` : `${tierProgress.pointsNeeded} points to ${tierProgress.nextTier.nameEn}`
                    : vi ? "Đã đạt cấp cao nhất" : "Highest level reached"}
                >
                  <span style={{ width: `${tierProgress.progressPercent}%` }} />
                </div>
              </div>
              <div className="checklist-pet-footer">
                <p>{vi ? "Quay món +1 · Đánh dấu đã thử +5 điểm" : "Spin +1 · Mark as tried +5 points"}</p>
              </div>
            </section>

            <section className="checklist-discovery" aria-labelledby="checklist-discovery-title">
              <div className="checklist-discovery-heading">
                <div>
                  <h3 id="checklist-discovery-title">{vi ? "Sổ tay món đã thử" : "Your food journal"}</h3>
                </div>
                <MapPin size={20} aria-hidden="true" />
              </div>
              <div className="checklist-city-tabs" role="group" aria-label={vi ? "Chọn thành phố" : "Choose a city"}>
                {CITY_CHECKLISTS.map((city) => {
                  const isSelected = activeCityId === city.cityId;
                  return (
                    <button key={city.cityId} type="button" aria-pressed={isSelected} className={`checklist-city-tab ${isSelected ? "active" : ""}`} onClick={() => setActiveCityId(city.cityId)}>
                      <span>{city.cityName}</span>
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
                        <button type="button" className="checklist-item-toggle" role="checkbox" aria-checked={isChecked} aria-label={`${vi ? "Đã thử" : "Tried"}: ${item.name}`} onClick={() => toggleCheckSpot(item.id)}>
                          <span className="checklist-check-square" aria-hidden="true">{isChecked && <Check size={16} strokeWidth={2.5} />}</span>
                          <span className="checklist-item-main">
                            <span className="checklist-item-name">{item.name}</span>
                          </span>
                        </button>
                        <details className="checklist-item-details" name="city-journal-item">
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
                              <span className="checklist-item-reward"><Flame size={12} aria-hidden="true" />{isChecked ? vi ? "+5 đã nhận" : "+5 earned" : vi ? "Đánh dấu đã thử +5" : "Mark as tried +5"}</span>
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
          </div>
          <p className="checklist-feedback" role="status" aria-live="polite">{feedback}</p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
