import { useMemo, useRef, useState } from "react";
import {
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
import {
  budgetValidationMessage,
  formatBudgetDisplay,
  formatBudgetNumber,
  parseBudgetInput,
  servingUnit,
} from "@/lib/meal-settings";
import {
  getTasteCategoriesForMealKind,
  type MealSession,
} from "@/lib/dish-taxonomy";

export function SpinControls({
  settings,
  language,
  selectedTastes = [],
  onSelectTastes,
  session,
  spinning,
  hasResult,
  empty,
  onSpin,
  onOpenChange,
  categoryTabs,
  mode = "dish",
}: {
  settings: ReturnType<typeof useMealSettings>;
  language: Language;
  selectedTastes?: string[];
  onSelectTastes?: (tastes: string[]) => void;
  session?: MealSession;
  spinning: boolean;
  hasResult: boolean;
  empty: boolean;
  onSpin: () => void;
  onOpenChange: (open: boolean) => void;
  categoryTabs?: React.ReactNode;
  mode?: "dish" | "restaurant";
}) {
  const {
    mealKind,
    mealConfig,
    budget,
    custom,
    applyBudget,
    ready,
  } = settings;

  const categories = useMemo(
    () => getTasteCategoriesForMealKind(mealKind),
    [mealKind],
  );

  const [budgetOpen, setBudgetOpen] = useState(false);
  const [tasteOpen, setTasteOpen] = useState(false);
  const [draftBudget, setDraftBudget] = useState(budget);
  const [draftTastes, setDraftTastes] = useState<string[]>(selectedTastes);
  const [amount, setAmount] = useState(() => formatBudgetNumber(custom));
  const [error, setError] = useState(false);

  const parsedCustomAmount = useMemo(
    () => parseBudgetInput(amount),
    [amount],
  );
  const isValidCustomAmount =
    parsedCustomAmount !== null &&
    parsedCustomAmount >= mealConfig.minPrice &&
    parsedCustomAmount <= mealConfig.maxPrice;

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const cursorPos = event.target.selectionStart ?? raw.length;

    // Support typing 'k' / 'K' shorthand, e.g. "60k", "500k"
    if (/[kK]/.test(raw)) {
      const digitsBeforeK = raw.replace(/[^0-9]/g, "");
      if (digitsBeforeK) {
        const num = Number(digitsBeforeK) * 1000;
        const formatted = new Intl.NumberFormat("vi-VN").format(num);
        setAmount(formatted);
        setError(false);
        return;
      }
    }

    // Count pure digits before cursor to maintain stable cursor position
    const digitsBeforeCursor = raw.slice(0, cursorPos).replace(/\D/g, "").length;

    // Extract numeric digits, capped at 9 digits to prevent overflow
    const allDigits = raw.replace(/\D/g, "").slice(0, 9);

    if (!allDigits) {
      setAmount("");
      setError(false);
      return;
    }

    // Real-time dynamic thousand dot formatting on every keystroke
    const formatted = new Intl.NumberFormat("vi-VN").format(Number(allDigits));
    setAmount(formatted);
    setError(false);

    // Dynamically restore cursor position across the thousand separator shifts
    requestAnimationFrame(() => {
      if (!input.current) return;
      let targetPos = formatted.length;
      let countedDigits = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          countedDigits++;
        }
        if (countedDigits >= digitsBeforeCursor) {
          targetPos = i + 1;
          break;
        }
      }
      input.current.setSelectionRange(targetPos, targetPos);
    });
  };

  const handleAmountBlur = () => {
    if (isValidCustomAmount && parsedCustomAmount !== null) {
      setAmount(formatBudgetNumber(parsedCustomAmount));
    }
  };

  const budgetTrigger = useRef<HTMLButtonElement>(null);
  const tasteTrigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const vi = language === "vi";
  const t = copy[language];

  const toggleBudget = (next: boolean) => {
    setBudgetOpen(next);
    onOpenChange(next);
  };

  const toggleTaste = (next: boolean) => {
    if (next) {
      setDraftTastes(selectedTastes);
    }
    setTasteOpen(next);
    onOpenChange(next);
  };

  const toggleChip = (id: string) => {
    if (id === "all") {
      setDraftTastes([]);
      return;
    }
    setDraftTastes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectedCount = selectedTastes.length;
  const isAll = selectedCount === 0;

  const currentTasteLabel = useMemo(() => {
    if (isAll) return vi ? "Tất cả món" : "All";
    if (selectedCount === 1) {
      const match = categories.find((c) => c.id === selectedTastes[0]);
      return match ? (vi ? match.labelVi : match.labelEn) : (vi ? "1 gu" : "1 taste");
    }
    return vi ? `${selectedCount} gu` : `${selectedCount} tastes`;
  }, [isAll, selectedCount, categories, selectedTastes, vi]);

  const currentTasteIcon = useMemo(() => {
    if (isAll) return "🥢";
    if (selectedCount === 1) {
      const match = categories.find((c) => c.id === selectedTastes[0]);
      return match ? match.icon : "🥢";
    }
    return "✨";
  }, [isAll, selectedCount, categories, selectedTastes]);

  const spinButtonLabel = spinning
    ? t.opening
    : mode === "restaurant"
      ? vi
        ? "Quay quán ngay thôi"
        : hasResult
          ? "Spin for another spot"
          : "Spin for a spot"
      : vi
        ? mealKind === "drink"
          ? "Quay đồ uống ngay thôi"
          : mealKind === "snack"
            ? "Quay ăn vặt ngay thôi"
            : mealKind === "nhau"
              ? "Quay mồi nhậu ngay thôi"
              : session === "breakfast"
                ? "Quay món sáng ngay"
                : session === "afternoon"
                  ? "Quay ăn xế ngay thôi"
                  : session === "dinner"
                    ? "Quay bữa tối ngay"
                    : session === "late"
                      ? "Quay ăn đêm ngay"
                      : "Quay cơm ngay thôi"
        : hasResult
          ? t.openAgain
          : t.open;

  const tasteDialogTitle = vi
    ? mealKind === "drink"
      ? "Gu đồ uống"
      : mealKind === "snack"
        ? "Gu ăn vặt"
        : mealKind === "nhau"
          ? "Gu món nhậu"
          : "Gu bữa chính"
    : "Pick your taste";

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
              setAmount(formatBudgetNumber(custom));
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

          {/* Bộ lọc Gu món - Hiển thị cho TẤT CẢ các nhóm món (bữa chính, đồ uống, ăn vặt, nhậu) */}
          {onSelectTastes && (
            <button
              ref={tasteTrigger}
              type="button"
              className="taste-trigger"
              disabled={spinning || !ready}
              aria-haspopup="dialog"
              aria-label={`${vi ? "Gu món" : "Taste"}: ${currentTasteLabel}`}
              onClick={() => toggleTaste(true)}
            >
              <span className="taste-icon" aria-hidden="true">
                {currentTasteIcon}
              </span>
              <span>
                <small>{vi ? "Gu món" : "Taste"}</small>
                <strong>{currentTasteLabel}</strong>
              </span>
              <ChevronDown size={15} />
            </button>
          )}
        </div>

        {/* XP reward is distinct from the companion’s daily streak. */}
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
          <span className="spin-flame-badge" aria-hidden="true">
            +1 XP
          </span>
        </button>
      </div>

      {/* Dialog Chọn Gu Món - Tinh gọn, nhỏ gọn, hỗ trợ đa chọn (Multi-select) */}
      <Dialog open={tasteOpen} onOpenChange={toggleTaste}>
        <DialogContent
          className="taste-dialog"
          finalFocus={tasteTrigger}
          closeLabel={vi ? "Đóng" : "Close"}
        >
          <DialogTitle>{tasteDialogTitle}</DialogTitle>
          <DialogDescription>
            {vi
              ? "Chọn một hoặc nhiều gu bạn thích lúc này"
              : "Select one or more tastes you crave"}
          </DialogDescription>
          <div
            className="taste-compact-grid"
            role="group"
            aria-label={vi ? "Danh sách gu món" : "Taste categories"}
          >
            <button
              type="button"
              className={`taste-chip-btn ${draftTastes.length === 0 ? "active" : ""}`}
              onClick={() => toggleChip("all")}
            >
              <span className="taste-chip-icon" aria-hidden="true">
                🥢
              </span>
              <span className="taste-chip-label">
                {vi ? "Tất cả món" : "All dishes"}
              </span>
              <div className="taste-chip-check" aria-hidden="true">
                {draftTastes.length === 0 && <Check size={13} strokeWidth={3} />}
              </div>
            </button>
            {categories.map((cat) => {
              const isSelected = draftTastes.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`taste-chip-btn ${isSelected ? "active" : ""}`}
                  onClick={() => toggleChip(cat.id)}
                  aria-pressed={isSelected}
                >
                  <span className="taste-chip-icon" aria-hidden="true">
                    {cat.icon}
                  </span>
                  <span className="taste-chip-label">
                    {vi ? cat.labelVi : cat.labelEn}
                  </span>
                  <div className="taste-chip-check" aria-hidden="true">
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            className="apply-button taste-apply-btn"
            type="button"
            onClick={() => {
              onSelectTastes?.(draftTastes);
              toggleTaste(false);
            }}
          >
            {vi
              ? `Áp dụng ${draftTastes.length ? `(${draftTastes.length} gu)` : "(Tất cả)"}`
              : `Apply ${draftTastes.length ? `(${draftTastes.length})` : "(All)"}`}
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
                  {vi ? "Nhập mức chi mong muốn" : "Enter your budget"} (VND /{" "}
                  {servingUnit(mealKind, language)})
                </label>
                <div className="custom-budget-input-wrapper">
                  <input
                    ref={input}
                    id="budget-amount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Ví dụ: 60.000"
                    value={amount}
                    aria-invalid={error}
                    aria-describedby="budget-hint"
                    onFocus={(event) => event.target.select()}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                  />
                  {amount && (
                    <button
                      type="button"
                      className="budget-clear-btn"
                      aria-label={vi ? "Xóa mức chi" : "Clear budget"}
                      onClick={() => {
                        setAmount("");
                        setError(false);
                        input.current?.focus();
                      }}
                    >
                      ×
                    </button>
                  )}
                  <span className="currency-suffix" aria-hidden="true">
                    {vi ? "đ" : "₫"}
                  </span>
                </div>
                {isValidCustomAmount && parsedCustomAmount !== null && (
                  <div className="budget-live-preview">
                    <span>{vi ? "Tương đương:" : "Equivalent:"}</span>
                    <strong>{priceLabel(parsedCustomAmount, language)}</strong>
                    <span>/ {servingUnit(mealKind, language)}</span>
                  </div>
                )}
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
