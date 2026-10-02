import type { Food } from "./foods";
import { drinkFoods } from "./foods-drinks";
import { snackFoods } from "./foods-snacks";

// All amounts use the existing catalog's unit: thousands of VND.
export const HAPPY_HOUR_LIMITS = {
  minBudget: 100,
  maxBudget: 2000,
  budgetStep: 25,
  defaultBudget: 500,
  minPeople: 2,
  maxPeople: 20,
  defaultPeople: 5,
  maxVariants: 6,
} as const;

export type HappyHourLine = {
  food: Food;
  kind: "drink" | "snack";
  quantity: number;
  subtotal: number;
};

export type HappyHourMenu = {
  id: string;
  lines: [HappyHourLine, HappyHourLine];
  total: number;
  perPerson: number;
  remaining: number;
};

export type HappyHourPlan = {
  status: "ready" | "insufficient" | "invalid";
  menus: HappyHourMenu[];
  minimumBudget: number | null;
};

// Existing individual fruit portions and easy group snacks. No prices or
// serving sizes are invented: each person gets one full catalog portion.
const snackPriority = [
  165, 360, 361, 362, 363, 366, 374, 381, 372, 369, 370, 365, 383,
  159, 158, 160, 156, 157, 167, 163, 166, 161, 354, 355, 371,
];
const drinkPriority = [140, 141, 138, 136, 137, 144, 148, 149, 145, 142, 143];

const validPrice = (food: Food) => Number.isFinite(food.price) && food.price > 0;
const drinks = drinkFoods.filter(validPrice);
const snacks = snackPriority
  .map((image) => snackFoods.find((food) => food.image === image))
  .filter((food): food is Food => Boolean(food && validPrice(food)));

export function createHappyHourPlan(budget: number, people: number): HappyHourPlan {
  const limits = HAPPY_HOUR_LIMITS;
  if (
    !Number.isInteger(budget) || budget < limits.minBudget || budget > limits.maxBudget ||
    (budget - limits.minBudget) % limits.budgetStep !== 0 ||
    !Number.isInteger(people) || people < limits.minPeople || people > limits.maxPeople ||
    !drinks.length || !snacks.length
  ) {
    return { status: "invalid", menus: [], minimumBudget: null };
  }

  const minimumBudget = people * (
    Math.min(...drinks.map((food) => food.price)) +
    Math.min(...snacks.map((food) => food.price))
  );
  if (budget < minimumBudget) {
    return { status: "insufficient", menus: [], minimumBudget };
  }

  const candidates = drinks.flatMap((drink) => snacks.flatMap((snack, snackRank) => {
    const perPerson = drink.price + snack.price;
    const total = perPerson * people;
    if (total > budget) return [];
    // Prefer a useful budget fit, familiar drinks and fruit, with balanced
    // drink/snack prices. Keeping change is fine; never pad a menu to spend it.
    const drinkRank = drinkPriority.indexOf(drink.image);
    const score = (1 - total / budget) * 100 +
      Math.abs(drink.price - snack.price) * 0.35 +
      snackRank * 0.55 + (drinkRank === -1 ? 8 : drinkRank * 0.3);
    const menu: HappyHourMenu = {
      id: `${drink.image}-${snack.image}`,
      lines: [
        { food: drink, kind: "drink", quantity: people, subtotal: drink.price * people },
        { food: snack, kind: "snack", quantity: people, subtotal: snack.price * people },
      ],
      total,
      perPerson,
      remaining: budget - total,
    };
    return [{ menu, score }];
  }));
  candidates.sort((a, b) => a.score - b.score ||
    a.menu.lines[0].food.image - b.menu.lines[0].food.image ||
    a.menu.lines[1].food.image - b.menu.lines[1].food.image);

  // Distinct foods make "another menu" useful. With a tight budget there may
  // only be a few valid pairs; exhaust those pairs instead of inventing more.
  const menus: HappyHourMenu[] = [];
  const usedDrinks = new Set<number>();
  const usedSnacks = new Set<number>();
  for (const { menu } of candidates) {
    const [drink, snack] = menu.lines;
    if (usedDrinks.has(drink.food.image) || usedSnacks.has(snack.food.image)) continue;
    menus.push(menu);
    usedDrinks.add(drink.food.image);
    usedSnacks.add(snack.food.image);
    if (menus.length === limits.maxVariants) break;
  }
  for (const { menu } of candidates) {
    if (menus.length === limits.maxVariants) break;
    if (!menus.some((selected) => selected.id === menu.id)) menus.push(menu);
  }
  return { status: "ready", menus, minimumBudget };
}
