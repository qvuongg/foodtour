import { useRef, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  ChevronDown,
  Sparkles,
  Sprout,
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

export function SpinControls({
  settings,
  language,
  spinning,
  hasResult,
  empty,
  onSpin,
  onOpenChange,
  categoryTabs,
}: {
  settings: ReturnType<typeof useMealSettings>;
  language: Language;
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
    vegetarianEnabled,
    setVeg,
    applyBudget,
    ready,
  } = settings;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(budget);
  const [amount, setAmount] = useState(custom);
  const [error, setError] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const vi = language === "vi",
    t = copy[language],
    lunch = mealKind === "lunch";
  const toggle = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };
  return (
    <div
      className="spin-controls"
      aria-label={vi ? "Chọn món theo gu" : "Pick your way"}
    >
      {categoryTabs && <div className="mobile-tabs-slot">{categoryTabs}</div>}
      <div className="controls-row">
        <div className="filters">
          <button
            ref={trigger}
            className="budget-trigger"
            disabled={spinning || !ready}
            aria-haspopup="dialog"
            aria-label={`${vi ? "Mức chi dự kiến" : "Expected budget"}: ${priceLabel(budget === "custom" ? custom : budget, language, true)}`}
            onClick={() => {
              setDraft(budget);
              setAmount(custom);
              setError(false);
              toggle(true);
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
          <button
            className="veg"
            type="button"
            role="switch"
            aria-checked={vegetarianEnabled}
            aria-label={vi ? "Chỉ chọn món ăn chay" : "Vegetarian dishes only"}
            aria-describedby={!lunch ? "veg-scope" : undefined}
            disabled={spinning || !ready || !lunch}
            onClick={() => setVeg((current) => !current)}
          >
            <Sprout size={21} aria-hidden="true" />
            <span>
              {t.vegetarian}
              {!lunch && (
                <small id="veg-scope">{vi ? "Chỉ ăn trưa" : "Lunch only"}</small>
              )}
            </span>
            <span className="veg-toggle" aria-hidden="true">
              <span />
            </span>
          </button>
        </div>
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
          <span>{spinning ? t.opening : hasResult ? t.openAgain : t.open}</span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </div>
      <Dialog open={open} onOpenChange={toggle}>
        <DialogContent
          className="budget-dialog"
          finalFocus={trigger}
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
              if (applyBudget(draft, amount)) toggle(false);
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
                    checked={draft === value}
                    onChange={() => {
                      setDraft(value);
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
            {draft === "custom" && (
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
