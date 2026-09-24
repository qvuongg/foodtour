import type { RefObject } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FoodImage } from "@/components/food-image";
import { FoodOrdering } from "@/components/food-ordering";
import type { Food } from "@/lib/foods";
import type { MealKind } from "@/lib/food-categories";
import { copy, foodName, priceLabel, type Language } from "@/lib/i18n";
import { foodServingUnit } from "@/lib/meal-settings";
import "./food-result-dialog.css";

export function FoodResultDialog({
  food,
  language,
  mealKind,
  open,
  isPreview,
  triggerRef,
  onClose,
}: {
  food: Food | null;
  language: Language;
  mealKind: MealKind;
  open: boolean;
  isPreview: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const vi = language === "vi";
  const t = copy[language];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className="winner-dialog food-result-dialog"
        closeLabel={vi ? "Đóng" : "Close"}
        finalFocus={triggerRef}
      >
        {food && (
          <>
            <div className="food-result-scroll">
              <div className="food-result-summary">
                <div className="winner-art">
                  <FoodImage food={food} language={language} />
                </div>
                <div className="food-result-heading">
                  <span className="winner-label">
                    {isPreview
                      ? vi
                        ? "Món bạn chọn"
                        : "Your pick"
                      : vi
                        ? "Kết quả quay"
                        : "Your spin result"}
                  </span>
                  <DialogTitle className="winner-title">
                    {foodName(food, language)}
                  </DialogTitle>
                  <DialogDescription className="winner-description">
                    <span>{t.referencePrice}</span>
                    <strong>{priceLabel(food.price, language, true)}</strong>
                    {" / "}
                    {foodServingUnit(food, mealKind, language)}
                  </DialogDescription>
                </div>
              </div>
              <FoodOrdering
                key={food.customId ?? food.name}
                dish={food.name}
                language={language}
              />
              <details className="ordering-alternatives">
                <summary>
                  {vi ? "Tìm bằng cách khác" : "More ways to find food"}
                </summary>
                <div className="ordering-alternative-links">
                  <a
                    className="find-button"
                    href={`https://www.google.com/maps/search/${encodeURIComponent(food.name + " " + t.nearby)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.find}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                  <a
                    className="grabfood-button"
                    href={`https://food.grab.com/vn/vi/restaurants?${new URLSearchParams({ search: food.name, "support-deeplink": "true", searchParameter: food.name })}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {vi ? "Đặt qua GrabFood" : "Order on GrabFood"}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </details>
            </div>
            <div className="food-result-footer">
              <button type="button" onClick={onClose}>
                {t.continue}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
