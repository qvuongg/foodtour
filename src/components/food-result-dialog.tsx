import type { RefObject } from "react";
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
                      ? "KẾT QUẢ QUAY"
                      : "SPIN RESULT"}
                </span>
                <DialogTitle className="winner-title">
                  {foodName(food, language)}
                </DialogTitle>
                <DialogDescription className="winner-description">
                  <span className="winner-price-val">
                    ~{priceLabel(food.price, language, false)} / {foodServingUnit(food, mealKind, language)}
                  </span>
                </DialogDescription>
              </div>
            </div>
            <FoodOrdering
              key={food.customId ?? food.name}
              dish={food.name}
              language={language}
              onClose={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
