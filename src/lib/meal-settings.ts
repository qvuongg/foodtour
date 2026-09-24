import { getMealConfig, MEAL_KINDS, type MealKind } from "./food-categories";
import type { Food } from "./foods";
import type { Language } from "./i18n";

export const MEAL_SETTINGS_COOKIE = "meal-settings";

export interface MealBudget {
  budget: string;
  custom: string;
}

export interface MealSettings {
  version: 2;
  mealKind: MealKind;
  budgets: Record<MealKind, MealBudget>;
  // Remember lunch's preference even while browsing untagged categories.
  veg: boolean;
  sound: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isMealKind(value: unknown): value is MealKind {
  return MEAL_KINDS.some((config) => config.id === value);
}

export function defaultMealSettings(): MealSettings {
  return {
    version: 2,
    mealKind: "lunch",
    budgets: Object.fromEntries(
      MEAL_KINDS.map((config) => [
        config.id,
        { budget: config.defaultBudget, custom: config.defaultBudget },
      ]),
    ) as Record<MealKind, MealBudget>,
    veg: false,
    sound: true,
  };
}

export function validMealBudget(kind: MealKind, value: string): boolean {
  const config = getMealConfig(kind);
  const amount = Number(value);
  return (
    /^\d+$/.test(value.trim()) &&
    Number.isInteger(amount) &&
    amount >= config.minPrice &&
    amount <= config.maxPrice
  );
}

function restoreBudget(kind: MealKind, value: unknown): MealBudget {
  const config = getMealConfig(kind);
  const fallback = {
    budget: config.defaultBudget,
    custom: config.defaultBudget,
  };
  if (!isRecord(value)) return fallback;
  // The previous number input accepted equivalent integral representations,
  // such as "85.0" and "8.5e1". Preserve their value when migrating cookies.
  const normalizedCustom =
    typeof value.custom === "string" && value.custom.trim()
      ? String(Number(value.custom))
      : "";
  const validCustom =
    normalizedCustom !== "" && validMealBudget(kind, normalizedCustom);
  const custom = validCustom ? normalizedCustom : config.defaultBudget;
  const budget =
    typeof value.budget === "string" &&
    (config.budgets.includes(value.budget) ||
      (value.budget === "custom" && validCustom))
      ? value.budget
      : config.defaultBudget;
  return { budget, custom };
}

/** Read versioned settings first; migrate old budget only to its active category. */
export function restoreMealSettings(
  saved: unknown,
  legacySettings?: unknown,
  legacyMealKind?: unknown,
): MealSettings {
  const next = defaultMealSettings();
  if (isRecord(saved) && saved.version === 2 && isRecord(saved.budgets)) {
    next.mealKind = isMealKind(saved.mealKind) ? saved.mealKind : "lunch";
    for (const config of MEAL_KINDS) {
      next.budgets[config.id] = restoreBudget(
        config.id,
        saved.budgets[config.id],
      );
    }
    if (typeof saved.veg === "boolean") next.veg = saved.veg;
    if (typeof saved.sound === "boolean") next.sound = saved.sound;
    return next;
  }

  next.mealKind = isMealKind(legacyMealKind) ? legacyMealKind : "lunch";
  next.budgets[next.mealKind] = restoreBudget(next.mealKind, legacySettings);
  if (isRecord(legacySettings)) {
    if (typeof legacySettings.veg === "boolean") next.veg = legacySettings.veg;
    if (typeof legacySettings.sound === "boolean")
      next.sound = legacySettings.sound;
  }
  return next;
}

/** Invalid input leaves the previous, usable budget untouched. */
export function updateMealBudget(
  settings: MealSettings,
  budget: string,
  custom = settings.budgets[settings.mealKind].custom,
): MealSettings | null {
  const kind = settings.mealKind;
  const config = getMealConfig(kind);
  if (
    (budget !== "custom" && !config.budgets.includes(budget)) ||
    (budget === "custom" && !validMealBudget(kind, custom))
  ) {
    return null;
  }
  return {
    ...settings,
    budgets: {
      ...settings.budgets,
      [kind]: {
        budget,
        custom:
          budget === "custom"
            ? String(Number(custom))
            : settings.budgets[kind].custom,
      },
    },
  };
}

export function vegetarianFilterEnabled(
  settings: Pick<MealSettings, "mealKind" | "veg">,
) {
  return settings.mealKind === "lunch" && settings.veg;
}

export function budgetValidationMessage(
  kind: MealKind,
  language: Language,
): string {
  const { minPrice, maxPrice } = getMealConfig(kind);
  return language === "vi"
    ? `Nhập số nguyên từ ${minPrice} đến ${maxPrice} nghìn đồng.`
    : `Enter a whole number from ${minPrice} to ${maxPrice} thousand VND.`;
}

export function servingUnit(kind: MealKind, language: Language): string {
  const config = getMealConfig(kind);
  return language === "vi" ? config.unitVi : config.unitEn;
}

/** Use explicit serving metadata; never infer a dietary label from a dish name. */
export function foodServingUnit(
  food: Food,
  kind: MealKind,
  language: Language,
): string {
  const detail = food.sub.split("•").at(-1)?.trim().toLowerCase() ?? "";
  const isServing = /^(một |hai |ba |phần |chai )/.test(detail);
  if (!isServing) return servingUnit(kind, language);
  if (language === "vi") return detail.replace(/^một /, "");

  if (detail.startsWith("phần ")) {
    const quantity = detail.match(/\d+\s*g/)?.[0];
    return quantity ? `portion (${quantity})` : "portion";
  }
  const units: Record<string, string> = {
    "một ly": "drink",
    "một đĩa": "plate",
    "một đĩa nhỏ": "small plate",
    "một phần": "portion",
    "một phần nhỏ": "small portion",
    "một bát": "bowl",
    "một chén": "small bowl",
    "một hũ": "jar",
    "một hộp nhỏ": "small box",
    "một gói nhỏ": "small bag",
    "chai 500 ml": "500 ml bottle",
    "một lát": "slice",
    "hai lát": "2 slices",
  };
  return (
    units[detail] ??
    (detail.startsWith("hai ")
      ? "2 pieces"
      : detail.startsWith("ba ")
        ? "3 pieces"
        : "piece")
  );
}
