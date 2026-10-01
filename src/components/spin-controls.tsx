import { useRef, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { copy, priceLabel, type Language } from "@/lib/i18n";
import type { useMealSettings } from "@/hooks/use-meal-settings";
import { budgetValidationMessage, servingUnit } from "@/lib/meal-settings";
import {
  TASTE_CATEGORIES,
  type DishTasteCategory,
} from "@/lib/dish-taxonomy";

export function SpinControls({
  settings,
  language,
  tasteCategory = "all",
  onSelectTasteCategory,
  spinning,
  hasResult,
  empty,
  onSpin,
  onOpenChange,
  categoryTabs,
}: {
  settings: ReturnType<typeof useMealSettings>;
  language: Language;
  tasteCategory?: DishTasteCategory;
  onSelectTasteCategory?: (cat: DishTasteCategory) => void;
  spinning: boolean;
  hasResult: boolean;
  empty: boolean;
  onSpin: () => void;
  onOpenChange: (open: boolean) => void;
  categoryTabs?: React.ReactNode;
}) {
  const {
    mealKind,
    mealConfig,
    budget,
    custom,
    applyBudget,
    ready,
  } = settings;

  const [budgetOpen, setBudgetOpen] = useState(false);
  const [tasteOpen, setTasteOpen] = useState(false);
  const [draftBudget, setDraftBudget] = useState(budget);
  const [draftTaste, setDraftTaste] = useState<DishTasteCategory>(tasteCategory);
  const [amount, setAmount] = useState(custom);
  const [error, setError] = useState(false);

  const budgetTrigger = useRef<HTMLButtonElement>(null);
  const tasteTrigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const vi = language === "vi";
  const t = copy[language];

  const currentTasteConfig =
    TASTE_CATEGORIES.find((c) => c.id === tasteCategory) || TASTE_CATEGORIES[0];

  const toggleBudget = (next: boolean) => {
    setBudgetOpen(next);
    onOpenChange(next);
  };

  const toggleTaste = (next: boolean) => {
    if (next) {
      setDraftTaste(tasteCategory);
    }
    setTasteOpen(next);
    onOpenChange(next);
  };

  const lunch = mealKind === "lunch";

  const spinButtonLabel = spinning
    ? t.opening
    : vi
      ? mealKind === "drink"
        ? "Quay đồ uống ngay thôi"
        : mealKind === "snack"
          ? "Quay ăn vặt ngay thôi"
          : mealKind === "nhau"
            ? "Quay mồi nhậu ngay thôi"
            : "Quay cơm ngay thôi"
      : hasResult
        ? t.openAgain
        : t.open;

  return (
    <div
      className="spin-controls"
      aria-label={vi ? "Chọn món theo gu" : "Pick your way"}
    >
      {categoryTabs && <div className="mobile-tabs-slot">{categoryTabs}</div>}
      <div className="controls-row">
        <div className="filters">
          {/* Bộ lọc Mức chi - Nằm bên trái theo đúng giao diện */}
          <button
            ref={budgetTrigger}
            type="button"
            className="budget-trigger"
            disabled={spinning || !ready}
            aria-haspopup="dialog"
            aria-label={`${vi ? "Mức chi dự kiến" : "Expected budget"}: ${priceLabel(budget === "custom" ? custom : budget, language, true)}`}
            onClick={() => {
              setDraftBudget(budget);
              setAmount(custom);
              setError(false);
              toggleBudget(true);
            }}
          >
            <Wallet size={18} aria-hidden="true" />
            <span>
              <small>{vi ? "Mức chi" : "Budget"}</small>
              <strong>
                {priceLabel(
                  budget === "custom" ? custom : budget,
                  language,
                  true,
                )}
              </strong>
            </span>
            <ChevronDown size={15} />
          </button>

          {/* Bộ lọc Gu món - Nằm bên phải thay thế cho Món chay */}
          {lunch && onSelectTasteCategory && (
            <button
              ref={tasteTrigger}
              type="button"
              className="taste-trigger"
              disabled={spinning || !ready}
              aria-haspopup="dialog"
              aria-label={`${vi ? "Gu món" : "Taste"}: ${vi ? currentTasteConfig.labelVi : currentTasteConfig.labelEn}`}
              onClick={() => toggleTaste(true)}
            >
              <span className="taste-icon" aria-hidden="true">
                {currentTasteConfig.icon}
              </span>
              <span>
                <small>{vi ? "Gu món" : "Taste"}</small>
                <strong>
                  {vi ? currentTasteConfig.labelVi : currentTasteConfig.labelEn}
                </strong>
              </span>
              <ChevronDown size={15} />
            </button>
          )}
        </div>

        {/* Nút Quay chính */}
        <button
          className="open-button"
          disabled={spinning || empty || !ready}
          onClick={onSpin}
          aria-busy={spinning}
        >
          {spinning ? (
            <AudioLines size={21} aria-hidden="true" />
          ) : (
            <Sparkles size={21} aria-hidden="true" />
          )}
          <span>{spinButtonLabel}</span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </div>

      {/* Dialog Chọn Gu Món */}
      <Dialog open={tasteOpen} onOpenChange={toggleTaste}>
        <DialogContent
          className="taste-dialog"
          finalFocus={tasteTrigger}
          closeLabel={vi ? "Đóng" : "Close"}
        >
          <DialogTitle>
            {vi ? "Hôm nay ăn theo gu nào?" : "Pick your taste"}
          </DialogTitle>
          <DialogDescription>
            {vi
              ? "Chọn kiểu món bạn muốn ăn lúc này. Hệ thống sẽ ưu tiên quay đúng gu của bạn."
              : "Choose what you're craving right now. We'll pick the best dish for your mood."}
          </DialogDescription>
          <div
            className="taste-options"
            role="radiogroup"
            aria-label={vi ? "Chọn gu món" : "Select taste category"}
          >
            {TASTE_CATEGORIES.map((cat) => {
              const isSelected = draftTaste === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`taste-option-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setDraftTaste(cat.id)}
                >
                  <span className="taste-card-icon-wrap" aria-hidden="true">
                    <span className="taste-icon">{cat.icon}</span>
                  </span>
                  <div className="taste-card-content">
                    <div className="taste-card-header">
                      <span className="taste-card-title">
                        {vi ? cat.labelVi : cat.labelEn}
                      </span>
                      {cat.id === "all" && (
                        <span className="taste-badge">
                          {vi ? "Mặc định" : "Default"}
                        </span>
                      )}
                    </div>
                    <span className="taste-card-desc">
                      {vi ? cat.descriptionVi : cat.labelEn}
                    </span>
                  </div>
                  <div className="taste-check-circle" aria-hidden="true">
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            className="apply-button taste-apply-btn"
            type="button"
            onClick={() => {
              onSelectTasteCategory?.(draftTaste);
              toggleTaste(false);
            }}
          >
            {vi ? "Áp dụng gu món" : "Apply taste"}
          </button>
        </DialogContent>
      </Dialog>

      {/* Dialog Chọn Mức Chi */}
      <Dialog open={budgetOpen} onOpenChange={toggleBudget}>
        <DialogContent
          className="budget-dialog"
          finalFocus={budgetTrigger}
          closeLabel={vi ? "Đóng" : "Close"}
        >
          <DialogTitle>
            {vi ? "Hôm nay chi bao nhiêu?" : "What’s your budget?"}
          </DialogTitle>
          <DialogDescription>
            {vi
              ? "Mức chi giúp ưu tiên món hợp túi tiền, không phải giá tối đa. Giá món chỉ để tham khảo."
              : "Your budget guides the selection; it isn’t a price cap. Prices are approximate."}
          </DialogDescription>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (applyBudget(draftBudget, amount)) toggleBudget(false);
              else {
                setError(true);
                input.current?.focus();
              }
            }}
          >
            <fieldset className="budget-options">
              <legend className="sr-only">{vi ? "Mức chi" : "Budget"}</legend>
              {[...mealConfig.budgets, "custom"].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="budget"
                    value={value}
                    checked={draftBudget === value}
                    onChange={() => {
                      setDraftBudget(value);
                      setError(false);
                    }}
                  />
                  <span>
                    {value === "custom"
                      ? t.custom
                      : priceLabel(value, language, true)}
                  </span>
                </label>
              ))}
            </fieldset>
            {draftBudget === "custom" && (
              <div className="custom-budget">
                <label htmlFor="budget-amount">
                  {vi ? "Nhập mức chi" : "Enter your budget"} (1.000đ /{" "}
                  {servingUnit(mealKind, language)})
                </label>
                <input
                  ref={input}
                  id="budget-amount"
                  type="number"
                  inputMode="numeric"
                  min={mealConfig.minPrice}
                  max={mealConfig.maxPrice}
                  step="1"
                  value={amount}
                  aria-invalid={error}
                  aria-describedby="budget-hint"
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setError(false);
                  }}
                />
                <p
                  id="budget-hint"
                  className={error ? "field-error" : "field-hint"}
                  role={error ? "alert" : undefined}
                >
                  {budgetValidationMessage(mealKind, language)}
                </p>
              </div>
            )}
            <button className="apply-button" type="submit">
              {vi ? "Áp dụng mức chi" : "Apply budget"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
