import { useRef } from "react";
import { Beer, Coffee, Cookie, Utensils } from "lucide-react";
import { MEAL_KINDS, type MealKind } from "@/lib/food-categories";
import type { Language } from "@/lib/i18n";

export function MealKindTabs({
  value,
  language,
  disabled,
  onChange,
  idPrefix = "main",
  className,
}: {
  value: MealKind;
  language: Language;
  disabled: boolean;
  onChange: (kind: MealKind) => void;
  idPrefix?: string;
  className?: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const icons = { lunch: Utensils, drink: Coffee, snack: Cookie, nhau: Beer };
  return (
    <nav
      className={`meal-kind-nav ${className ?? ""}`.trim()}
      aria-label={language === "vi" ? "Chọn nhóm món" : "Choose a category"}
    >
      <div
        className="meal-kind-tabs"
        role="tablist"
        aria-label={language === "vi" ? "Nhóm món" : "Categories"}
      >
        {MEAL_KINDS.map((item, index) => {
          const Icon = icons[item.id];
          return (
            <button
              key={item.id}
              ref={(el) => {
                buttons.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-meal-tab-${item.id}`}
              aria-controls="meal-panel"
              aria-selected={value === item.id}
              tabIndex={value === item.id ? 0 : -1}
              className="meal-kind-tab"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % 4
                    : event.key === "ArrowLeft"
                      ? (index + 3) % 4
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 3
                          : -1;
                if (next < 0) return;
                event.preventDefault();
                onChange(MEAL_KINDS[next].id);
                buttons.current[next]?.focus();
              }}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{language === "vi" ? item.labelVi : item.labelEn}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
