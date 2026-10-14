import { getMealConfig, MEAL_KINDS, type MealKind } from "./food-categories";
import type { Food } from "./foods";
import { priceLabel, type Language } from "./i18n";

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

/**
 * Normalizes user budget input in any customary format into integer thousands:
 * - "60000", "60.000", "60.000đ", "60000đ", "60k", "60" -> 60
 * - "500000", "500.000đ", "500k", "500" -> 500
 * - "1000000", "1.000.000đ", "1000k", "1000" -> 1000
 */
export function parseBudgetInput(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Reject scientific notation, hex, explicit signs
  if (/^0x/i.test(raw) || /[eE]/.test(raw) || /[-+]/.test(raw)) return null;

  // Check for 'k' / 'K' suffix, e.g. "60k", "60 K", "150k"
  const kMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*[kK]$/);
  if (kMatch) {
    const num = Number(kMatch[1].replace(/,/g, "."));
    if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) return null;
    return num;
  }

  // Strip currency symbols: đ, Đ, d, D, ₫, vnd, VND (case-insensitive)
  let cleaned = raw
    .replace(/[₫đĐ]/g, "")
    .replace(/\b(vnd|d)\b/gi, "")
    .trim();

  // Strip trailing 'd' or 'D' if left over (e.g. "60000d")
  cleaned = cleaned.replace(/[dD]$/, "").trim();

  if (!cleaned) return null;

  // Check if string contains Vietnamese or international thousand separators:
  // e.g. "60.000", "1.000.000", "60,000", "1,000,000"
  const dotThousandMatch = /^\d{1,3}(\.\d{3})+$/.test(cleaned);
  const commaThousandMatch = /^\d{1,3}(,\d{3})+$/.test(cleaned);

  if (dotThousandMatch || commaThousandMatch) {
    const digitsOnly = cleaned.replace(/[.,]/g, "");
    const fullAmount = Number(digitsOnly);
    if (!Number.isInteger(fullAmount) || fullAmount <= 0) return null;
    return Math.floor(fullAmount / 1000);
  }

  // Reject decimal points (e.g. "30.5", "85.0")
  if (/[.,]/.test(cleaned)) {
    return null;
  }

  // Pure digits only
  if (!/^\d+$/.test(cleaned)) return null;

  const num = Number(cleaned);
  if (!Number.isSafeInteger(num) || num <= 0) return null;

  // Values >= 10000 are entered in full VND (e.g. 10000, 35000, 60000, 500000, 1000000)
  if (num >= 10000) {
    return num % 1000 === 0 ? num / 1000 : Math.round(num / 1000);
  }

  // Values < 10000 are entered in thousands (e.g. 30, 50, 60, 150, 500, 1000)
  return num;
}

export function formatBudgetDisplay(
  thousands: number | string,
  language: Language,
): string {
  const parsed = parseBudgetInput(String(thousands));
  const val = parsed !== null ? parsed : Number(thousands);
  if (!Number.isFinite(val) || val <= 0) return String(thousands);
  const amount = val * 1000;
  return language === "vi"
    ? `${new Intl.NumberFormat("vi-VN").format(amount)}đ`
    : `₫${new Intl.NumberFormat("en-US").format(amount)}`;
}

export function validMealBudget(kind: MealKind, value: string): boolean {
  const config = getMealConfig(kind);
  const parsed = parseBudgetInput(value);
  if (parsed === null) return false;
  return parsed >= config.minPrice && parsed <= config.maxPrice;
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
  let normalizedCustom = "";
  if (typeof value.custom === "string" && value.custom.trim()) {
    const parsed = parseBudgetInput(value.custom);
    if (parsed !== null) {
      normalizedCustom = String(parsed);
    } else {
      const num = Number(value.custom);
      if (Number.isInteger(num)) {
        normalizedCustom = String(num);
      }
    }
  }
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
  const parsedCustom = parseBudgetInput(custom);
  if (
    (budget !== "custom" && !config.budgets.includes(budget)) ||
    (budget === "custom" &&
      (parsedCustom === null ||
        parsedCustom < config.minPrice ||
        parsedCustom > config.maxPrice))
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
          budget === "custom" && parsedCustom !== null
            ? String(parsedCustom)
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
  const minFormatted = priceLabel(minPrice, language);
  const maxFormatted = priceLabel(maxPrice, language);
  return language === "vi"
    ? `Nhập mức chi từ ${minFormatted} đến ${maxFormatted} (ví dụ: 60.000đ hoặc 60k).`
    : `Enter a budget from ${minFormatted} to ${maxFormatted} (e.g. 60,000₫ or 60k).`;
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
