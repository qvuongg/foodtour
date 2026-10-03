import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, ChevronRight, Pencil, RotateCcw, Share2, ShoppingBag, Sparkles, X } from "lucide-react";
import { getPetLevel, getPetProgress, validatePetName, type FoodieProgressState } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";
import { FoodiePetLevels } from "./foodie-pet-levels";
import "./foodie-pet-modal.css";

export interface FoodiePetModalProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  state: FoodieProgressState;
  onRename: (name: string) => Promise<boolean>;
  onSpin: () => void;
  onOpenOrdering: () => void;
  orderingAvailable: boolean;
  storageError?: string | null;
  onRetrySave?: () => void;
  finalFocus?: RefObject<HTMLElement | null>;
  spinDisabled?: boolean;
}

/** A companion home; journal rows and filters live in their own dialog. */
export function FoodiePetModal({ open, onClose, language, state, onRename, onSpin, onOpenOrdering, orderingAvailable, storageError, onRetrySave, finalFocus, spinDisabled = false }: FoodiePetModalProps) {
  const vi = language === "vi";
  const nameInputId = useId();
  const nameErrorId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameButtonRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousXp = useRef(state.xp);
  const wasOpen = useRef(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.petName);
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [failedSaveName, setFailedSaveName] = useState<string | null>(null);
  const failedSaveObserved = useRef(false);
  const [reaction, setReaction] = useState<"hello" | "xp" | "level" | null>(null);
  const [tabHidden, setTabHidden] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const progress = getPetProgress(state.xp);
  const level = progress.level;
  const levelName = vi ? level.nameVi : level.nameEn;
  const restaurantRewardBadge = <b className="pet-home-reward">+2 XP</b>;

  useEffect(() => {
    const updateVisibility = () => setTabHidden(document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    // Reopening the sheet must not replay old rewards.
    if (!open || !wasOpen.current) {
      setReaction(null);
      setEditingName(false);
      setNameError("");
      setFailedSaveName(null);
      failedSaveObserved.current = false;
      setShareCopied(false);
      previousXp.current = state.xp;
    } else if (state.xp > previousXp.current && !document.hidden) {
      const gainedLevel = getPetLevel(previousXp.current).level < level.level;
      setReaction(gainedLevel ? "level" : "xp");
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      reactionTimer.current = setTimeout(() => setReaction(null), 1100);
    }
    previousXp.current = state.xp;
    wasOpen.current = open;
    if (!open && reactionTimer.current) clearTimeout(reactionTimer.current);
  }, [open, state.xp, level.level, level.nameVi, level.nameEn, vi]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    if (!failedSaveName) return;
    // The store exposes the name optimistically. Only reconcile a failed rename
    // after a real storage failure has been observed and then successfully cleared.
    if (storageError) {
      failedSaveObserved.current = true;
      return;
    }
    const draft = validatePetName(nameDraft);
    if (!savingName && failedSaveObserved.current && state.petName === failedSaveName) {
      setFailedSaveName(null);
      failedSaveObserved.current = false;
      if (open && editingName && draft.valid && draft.name === failedSaveName) {
        setNameError("");
        setEditingName(false);
        requestAnimationFrame(() => nameButtonRef.current?.focus());
      }
    }
  }, [failedSaveName, storageError, savingName, state.petName, nameDraft, open, editingName]);

  useEffect(() => () => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
  }, []);

  const cancelRename = () => {
    if (savingName) return;
    setEditingName(false);
    setNameError("");
    setFailedSaveName(null);
    failedSaveObserved.current = false;
    requestAnimationFrame(() => nameButtonRef.current?.focus());
  };

  const saveName = async () => {
    if (savingName) return;
    setFailedSaveName(null);
    failedSaveObserved.current = false;
    const validation = validatePetName(nameDraft);
    if (!validation.valid) {
      setNameError(validation.error === "characters"
        ? vi ? "Tên không được chứa ký tự điều khiển." : "The name cannot contain control characters."
        : vi ? "Đặt tên từ 2 đến 20 ký tự nhé." : "Use a name with 2–20 characters.");
      nameInputRef.current?.focus();
      return;
    }
    setSavingName(true);
    setNameError("");
    try {
      if (await onRename(validation.name)) {
        setEditingName(false);
        requestAnimationFrame(() => nameButtonRef.current?.focus());
      } else {
        setFailedSaveName(validation.name);
        setNameError(vi ? "Chưa lưu được tên trên thiết bị. Hãy thử lại." : "The name could not be saved on this device. Please retry.");
      }
    } catch {
      setFailedSaveName(validation.name);
      setNameError(vi ? "Chưa lưu được tên trên thiết bị. Hãy thử lại." : "The name could not be saved on this device. Please retry.");
    } finally {
      setSavingName(false);
    }
  };

  const greetPet = () => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction("hello");
    reactionTimer.current = setTimeout(() => setReaction(null), 600);
  };

  const sharePet = async () => {
    const text = vi
      ? `${state.petName} của tôi đạt cấp ${level.level} — ${levelName}, ${state.xp} XP trên Quay Cơm.online! Cùng khám phá món ngon nhé.`
      : `My foodie companion ${state.petName} reached level ${level.level} — ${levelName}, with ${state.xp} XP on Quay Com.online! Let’s discover delicious food.`;
    const data = { title: vi ? "Linh thú ẩm thực" : "Foodie companion", text, url: window.location.href };
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${data.url}`);
      setShareCopied(true);
    } catch {}
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="pet-home-backdrop" />
        <Dialog.Popup className={`pet-home${reaction ? ` is-${reaction}` : ""}`} initialFocus={closeRef} finalFocus={finalFocus}>
          <header className="pet-home-header">
            <div className="pet-home-heading">
              <Dialog.Title className="pet-home-eyebrow">{vi ? "Linh thú của bạn" : "Your foodie companion"}</Dialog.Title>
              <button ref={nameButtonRef} type="button" className="pet-home-name" disabled={savingName} aria-label={vi ? `Đổi tên ${state.petName}` : `Rename ${state.petName}`} onClick={() => { setNameDraft(state.petName); setNameError(""); setFailedSaveName(null); failedSaveObserved.current = false; setEditingName(true); }}>
                <span>{state.petName}</span><Pencil size={15} aria-hidden="true" />
              </button>
            </div>
            <button type="button" className="pet-home-icon pet-home-share" onClick={sharePet} aria-label={shareCopied ? vi ? "Đã sao chép nội dung chia sẻ" : "Share text copied" : vi ? "Chia sẻ linh thú" : "Share your companion"}>
              {shareCopied ? <Check size={19} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
            </button>
            <Dialog.Close ref={closeRef} className="pet-home-icon pet-home-close" aria-label={vi ? "Đóng linh thú" : "Close companion"}><X size={21} aria-hidden="true" /></Dialog.Close>
          </header>
          <Dialog.Description className="pet-home-sr-only">{vi ? "Một người bạn lớn lên cùng hành trình khám phá món ăn. Xem cấp, đổi tên và khám phá cách nhận XP." : "A little companion for your food adventures. See your level, rename your pet, and discover ways to earn XP."}</Dialog.Description>

          <div className="pet-home-body">
            {editingName && <form className="pet-home-rename" onSubmit={(event) => { event.preventDefault(); void saveName(); }} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancelRename(); } }}>
              <label htmlFor={nameInputId}>{vi ? "Đặt tên cho bé" : "Give your pet a name"}<span>{vi ? "2–20 ký tự" : "2–20 characters"}</span></label>
              <input ref={nameInputRef} id={nameInputId} value={nameDraft} onChange={(event) => { setNameDraft(event.target.value); setNameError(""); setFailedSaveName(null); failedSaveObserved.current = false; }} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? nameErrorId : undefined} autoComplete="off" enterKeyHint="done" disabled={savingName} />
              {nameError && <p id={nameErrorId} className="pet-home-error" role="alert">{nameError}</p>}
              <div className="pet-home-rename-actions"><button type="button" onClick={cancelRename} disabled={savingName}>{vi ? "Hủy" : "Cancel"}</button><button type="submit" disabled={savingName}>{savingName ? vi ? "Đang lưu…" : "Saving…" : vi ? "Lưu tên" : "Save name"}</button></div>
            </form>}

            {storageError && <div className="pet-home-storage-error" role="alert"><p>{vi ? "Tiến độ đang được giữ trong phiên này, nhưng chưa lưu được trên thiết bị. Hãy thử lưu lại trước khi đóng trang." : "Progress is kept in this session, but could not be saved on this device. Try saving again before closing the page."}</p>{onRetrySave && <button type="button" onClick={onRetrySave} disabled={savingName}><RotateCcw size={15} aria-hidden="true" />{vi ? "Thử lưu lại" : "Retry saving"}</button>}</div>}

            <section className="pet-home-hero" aria-label={vi ? "Linh thú và cấp hiện tại" : "Companion and current level"}>
              <FoodiePetLevels level={level} xp={state.xp} petName={state.petName} language={language} open={open} paused={!open || tabHidden} reaction={reaction} onGreet={greetPet} />

              <div className="pet-home-level-heading"><h2>{vi ? "Tiến độ cấp" : "Level progress"} <span>{level.level}</span></h2><strong>{state.xp.toLocaleString(vi ? "vi-VN" : "en-US")} <small>XP</small></strong></div>
              <div className="pet-home-xp-track" role="progressbar" aria-label={vi ? "Tiến độ trong cấp hiện tại" : "Progress within the current level"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percent)} aria-valuetext={progress.nextLevel ? vi ? `Còn ${progress.remainingXp} XP để lên cấp ${progress.nextLevel.level}` : `${progress.remainingXp} XP until level ${progress.nextLevel.level}` : vi ? "Đã mở khóa đủ 6 cấp" : "All 6 levels unlocked"}>
                <span style={{ width: `${progress.percent}%` }} />
              </div>
              <p className="pet-home-xp-caption">{progress.nextLevel ? <>{vi ? "Còn " : "Just "}<strong>{progress.remainingXp} XP</strong>{vi ? ` để lên cấp ${progress.nextLevel.level}` : ` to level ${progress.nextLevel.level}`}</> : <><Check size={13} aria-hidden="true" />{vi ? "Đã mở khóa đủ 6 cấp" : "All 6 levels unlocked"}</>}</p>
            </section>

            <section className="pet-home-activities" aria-labelledby={`${nameInputId}-activities`}>
              <div className="pet-home-activities-header">
                <h2 id={`${nameInputId}-activities`}>
                  <Sparkles size={16} className="pet-home-activities-icon" aria-hidden="true" />
                  <span>{vi ? "Cách nuôi bé" : "Help your pet grow"}</span>
                </h2>
                <span className="pet-home-activities-pill">{vi ? "Nhiệm vụ nhận XP" : "XP Quests"}</span>
              </div>
              <div className="pet-home-activity-list">
                <button type="button" className="pet-home-activity pet-home-spin" onClick={onSpin} disabled={spinDisabled}>
                  <div className="pet-home-activity-icon is-spin" aria-hidden="true">
                    <Sparkles size={19} strokeWidth={2.2} />
                  </div>
                  <span className="pet-home-activity-content">
                    <span className="pet-home-activity-title">{vi ? "Quay chọn món" : "Spin to pick a dish"}</span>
                    <small>{vi ? "Mỗi lượt hoàn tất · Không giới hạn" : "Every completed spin · No limit"}</small>
                  </span>
                  <b className="pet-home-reward">+1 XP</b>
                  <ChevronRight size={16} strokeWidth={2.4} className="pet-home-activity-arrow" aria-hidden="true" />
                </button>
                {orderingAvailable ? (
                  <button type="button" className="pet-home-activity pet-home-ordering" onClick={onOpenOrdering}>
                    <div className="pet-home-activity-icon is-ordering" aria-hidden="true">
                      <ShoppingBag size={19} strokeWidth={2.2} />
                    </div>
                    <span className="pet-home-activity-content">
                      <span className="pet-home-activity-title">{vi ? "Mở quán trên ShopeeFood" : "Open a ShopeeFood restaurant"}</span>
                      <small>{vi ? "Mỗi lượt mở quán · Không giới hạn" : "Every opened spot · No limit"}</small>
                    </span>
                    {restaurantRewardBadge}
                    <ChevronRight size={16} strokeWidth={2.4} className="pet-home-activity-arrow" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="pet-home-activity pet-home-ordering is-unavailable">
                    <div className="pet-home-activity-icon is-ordering" aria-hidden="true">
                      <ShoppingBag size={19} strokeWidth={2.2} />
                    </div>
                    <span className="pet-home-activity-content">
                      <span className="pet-home-activity-title">{vi ? "Mở quán trên ShopeeFood" : "Open a ShopeeFood restaurant"}</span>
                      <small>{vi ? "Chọn món rồi mở quán · Không giới hạn" : "Pick dish then open spot · No limit"}</small>
                    </span>
                    {restaurantRewardBadge}
                  </div>
                )}
              </div>
              <div className="pet-home-tip">
                <span className="pet-home-tip-bulb" aria-hidden="true">💡</span>
                <p className="pet-home-reward-note">{vi ? "Nhận +2 XP mỗi lần mở quán trên ShopeeFood, không giới hạn số lượt." : "Earn +2 XP every time you open a ShopeeFood restaurant, with no limits."}</p>
              </div>
            </section>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
