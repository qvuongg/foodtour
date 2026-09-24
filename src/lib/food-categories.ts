import type { Food } from "./foods";
import {
  personalFoods,
  personalSelector,
  emptyProfile,
  type PoolProfile,
} from "./personal-pool";
import { drinkFoods } from "./foods-drinks";
import { snackFoods } from "./foods-snacks";
import { pubFoods } from "./foods-pub";

export type MealKind = "lunch" | "drink" | "snack" | "nhau";

export interface MealKindConfig {
  id: MealKind;
  labelVi: string;
  labelEn: string;
  budgets: string[];
  defaultBudget: string;
  minPrice: number;
  maxPrice: number;
  count: number;
  unitVi: string;
  unitEn: string;
}

export const MEAL_KINDS: MealKindConfig[] = [
  {
    id: "lunch",
    labelVi: "Ăn trưa",
    labelEn: "Lunch",
    budgets: ["35", "50", "75", "100", "150"],
    defaultBudget: "50",
    minPrice: 30,
    maxPrice: 180,
    count: 128,
    unitVi: "suất",
    unitEn: "serving",
  },
  {
    id: "drink",
    labelVi: "Đồ uống",
    labelEn: "Drinks",
    budgets: ["15", "20", "30", "40", "50"],
    defaultBudget: "30",
    minPrice: 10,
    maxPrice: 60,
    count: drinkFoods.length,
    unitVi: "ly",
    unitEn: "drink",
  },
  {
    id: "snack",
    labelVi: "Ăn vặt",
    labelEn: "Snacks",
    budgets: ["15", "20", "30", "45", "60"],
    defaultBudget: "30",
    minPrice: 10,
    maxPrice: 95,
    count: snackFoods.length,
    unitVi: "phần",
    unitEn: "portion",
  },
  {
    id: "nhau",
    labelVi: "Món nhậu",
    labelEn: "Pub Food",
    budgets: ["50", "75", "90", "120", "150"],
    defaultBudget: "90",
    minPrice: 20,
    maxPrice: 180,
    count: pubFoods.length,
    unitVi: "đĩa",
    unitEn: "plate",
  },
];

export function getMealConfig(kind: MealKind): MealKindConfig {
  return MEAL_KINDS.find((m) => m.id === kind) || MEAL_KINDS[0];
}

export function getMealFoods(kind: MealKind, profile?: PoolProfile): Food[] {
  switch (kind) {
    case "drink":
      return drinkFoods;
    case "snack":
      return snackFoods;
    case "nhau":
      return pubFoods;
    case "lunch":
    default:
      return profile ? personalFoods(profile) : [];
  }
}

export { personalFoods, personalSelector, emptyProfile };
