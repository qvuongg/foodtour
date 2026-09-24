import { Beer, Coffee, Cookie, Utensils } from "lucide-react";
import type { Food } from "@/lib/foods";
import { foodName, type Language } from "@/lib/i18n";
import { getFoodAtlas } from "@/lib/food-atlas";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function FoodImage({
  food,
  language,
}: {
  food: Food;
  language: Language;
}) {
  const atlasStyle = !food.customId ? getFoodAtlas(food.image) : null;
  if (!atlasStyle) {
    const isDrink =
      (food.image >= 1000 && food.image < 2000) ||
      (food.image >= 132 && food.image <= 155) ||
      (food.image >= 500 && food.image <= 547);
    const isSnack =
      (food.image >= 2000 && food.image < 3000) ||
      (food.image >= 156 && food.image <= 167) ||
      (food.image >= 300 && food.image <= 383);
    const isPub = food.image >= 3000 || (food.image >= 400 && food.image <= 447);
    return (
      <div
        className={`food-image custom-food-art ${isDrink ? "drink-art" : isSnack ? "snack-art" : isPub ? "pub-art" : ""}`}
        role="img"
        aria-label={foodName(food, language)}
      >
        {isDrink ? (
          <Coffee size={56} />
        ) : isSnack ? (
          <Cookie size={56} />
        ) : isPub ? (
          <Beer size={56} />
        ) : (
          <Utensils size={56} />
        )}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={foodName(food, language)}
      className="food-image"
      style={{
        clipPath: atlasStyle.clipPath,
        backgroundImage: `url(${basePath}/${atlasStyle.atlas}.webp)`,
        backgroundSize: atlasStyle.backgroundSize,
        backgroundPosition: atlasStyle.backgroundPosition,
      }}
    />
  );
}
