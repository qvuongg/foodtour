import type { Food } from "./foods";
import { foods } from "./foods";
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

export type HappyHourCategory =
  | "combo"
  | "main"
  | "drink"
  | "snack-savory"
  | "snack-sweet";

export interface HappyHourCategoryConfig {
  id: HappyHourCategory;
  labelVi: string;
  labelEn: string;
  shortVi: string;
  icon: string;
}

export const HAPPY_HOUR_CATEGORIES: readonly HappyHourCategoryConfig[] = [
  {
    id: "main",
    labelVi: "Món chính",
    labelEn: "Main meals",
    shortVi: "Món chính",
    icon: "🍱",
  },
  {
    id: "drink",
    labelVi: "Đồ uống",
    labelEn: "Drinks",
    shortVi: "Đồ uống",
    icon: "🧋",
  },
  {
    id: "snack-savory",
    labelVi: "Đồ ăn vặt (mặn)",
    labelEn: "Savory snacks",
    shortVi: "Ăn vặt (mặn)",
    icon: "🍟",
  },
  {
    id: "snack-sweet",
    labelVi: "Đồ ăn vặt (ngọt)",
    labelEn: "Sweet snacks",
    shortVi: "Ăn vặt (ngọt)",
    icon: "🍨",
  },
] as const;

export type HappyHourLine = {
  food: Food;
  kind: "main" | "drink" | "snack";
  quantity: number;
  subtotal: number;
};

export type HappyHourMenu = {
  id: string;
  lines: HappyHourLine[];
  total: number;
  perPerson: number;
  remaining: number;
};

export type HappyHourPlan = {
  status: "ready" | "insufficient" | "invalid";
  menus: HappyHourMenu[];
  minimumBudget: number | null;
};

/**
 * Phân loại món ăn vặt ngọt / tráng miệng
 */
export function isSweetSnack(food: Food): boolean {
  if (food.image >= 360 && food.image <= 383) return true;
  const name = (food.name || "").toLowerCase();
  const sub = (food.sub || "").toLowerCase();
  const text = `${name} ${sub}`;
  const SAVORY_OVERRIDE = [
    "mực", "cá", "tôm", "thịt", "gà", "bò", "trứng muối", "ốc", "sò",
    "nem", "giò", "chả", "há cảo", "sủi cảo", "bột chiên", "bánh tráng", "khoai tây"
  ];
  if (SAVORY_OVERRIDE.some((k) => name.includes(k))) return false;
  const SWEET_KEYWORDS = [
    "chè", "flan", "kem", "cake", "bánh trứng nướng", "sữa chua", "dầm", "ngọt",
    "trái cây", "hoa quả", "bánh chuối", "chuối chiên", "bánh bò", "bánh da lợn",
    "bánh khoai mì", "bánh su", "tào phớ", "tàu hũ", "thạch", "bánh tiêu",
    "bánh cam", "bánh đúc lá dứa"
  ];
  return SWEET_KEYWORDS.some((k) => text.includes(k));
}

// Existing individual fruit portions and easy group snacks. No prices or
// serving sizes are invented: each person gets one full catalog portion.
const snackPriority = [
  165, 360, 361, 362, 363, 366, 374, 381, 372, 369, 370, 365, 383,
  159, 158, 160, 156, 157, 167, 163, 166, 161, 354, 355, 371,
];
const drinkPriority = [140, 141, 138, 136, 137, 144, 148, 149, 145, 142, 143];

const validPrice = (food: Food) => Number.isFinite(food.price) && food.price > 0;
const mainFoods = foods.filter(validPrice);
const drinks = drinkFoods.filter(validPrice);
const allSnacks = snackFoods.filter(validPrice);
const savorySnacks = allSnacks.filter((food) => !isSweetSnack(food));
const sweetSnacks = allSnacks.filter((food) => isSweetSnack(food));
const comboSnacks = snackPriority
  .map((image) => snackFoods.find((food) => food.image === image))
  .filter((food): food is Food => Boolean(food && validPrice(food)));

export function createHappyHourPlan(
  budget: number,
  people: number,
  category: HappyHourCategory = "combo",
  includeDrink = true,
): HappyHourPlan {
  const limits = HAPPY_HOUR_LIMITS;
  if (
    !Number.isInteger(budget) || budget < limits.minBudget || budget > limits.maxBudget ||
    (budget - limits.minBudget) % limits.budgetStep !== 0 ||
    !Number.isInteger(people) || people < limits.minPeople || people > limits.maxPeople
  ) {
    return { status: "invalid", menus: [], minimumBudget: null };
  }

  if (category === "combo") {
    if (!drinks.length || !comboSnacks.length) {
      return { status: "invalid", menus: [], minimumBudget: null };
    }

    const minimumBudget = people * (
      Math.min(...drinks.map((food) => food.price)) +
      Math.min(...comboSnacks.map((food) => food.price))
    );
    if (budget < minimumBudget) {
      return { status: "insufficient", menus: [], minimumBudget };
    }

    const candidates = drinks.flatMap((drink) => comboSnacks.flatMap((snack, snackRank) => {
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

  // Single category modes: "main", "drink", "snack-savory", "snack-sweet"
  let pool: Food[];
  let kind: "main" | "drink" | "snack";
  if (category === "main") {
    pool = mainFoods;
    kind = "main";
  } else if (category === "drink") {
    pool = drinks;
    kind = "drink";
  } else if (category === "snack-savory") {
    pool = savorySnacks;
    kind = "snack";
  } else {
    pool = sweetSnacks;
    kind = "snack";
  }

  if (!pool.length) {
    return { status: "invalid", menus: [], minimumBudget: null };
  }

  // When includeDrink is enabled and not already on "drink" category, pair food + drink
  const withDrink = category === "drink" ? false : includeDrink;

  if (withDrink) {
    const minimumBudget = people * (
      Math.min(...pool.map((food) => food.price)) +
      Math.min(...drinks.map((food) => food.price))
    );
    if (budget < minimumBudget) {
      return { status: "insufficient", menus: [], minimumBudget };
    }

    const candidates = pool.flatMap((food, fRank) => drinks.flatMap((drink) => {
      const perPerson = food.price + drink.price;
      const total = perPerson * people;
      if (total > budget) return [];
      const drinkRank = drinkPriority.indexOf(drink.image);
      let foodBonus = fRank * 0.4;
      if (kind === "snack") {
        const sRank = snackPriority.indexOf(food.image);
        foodBonus = sRank === -1 ? 12 : sRank * 0.4;
      }
      const score = (1 - total / budget) * 100 +
        Math.abs(food.price - drink.price) * 0.35 +
        foodBonus + (drinkRank === -1 ? 8 : drinkRank * 0.3);
      const menu: HappyHourMenu = {
        id: `${category}-${food.image}-${drink.image}`,
        lines: [
          { food, kind, quantity: people, subtotal: food.price * people },
          { food: drink, kind: "drink", quantity: people, subtotal: drink.price * people },
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

    const menus: HappyHourMenu[] = [];
    const usedFoods = new Set<number>();
    const usedDrinks = new Set<number>();
    for (const { menu } of candidates) {
      const [fItem, dItem] = menu.lines;
      if (usedFoods.has(fItem.food.image) || usedDrinks.has(dItem.food.image)) continue;
      menus.push(menu);
      usedFoods.add(fItem.food.image);
      usedDrinks.add(dItem.food.image);
      if (menus.length === limits.maxVariants) break;
    }
    for (const { menu } of candidates) {
      if (menus.length === limits.maxVariants) break;
      if (!menus.some((selected) => selected.id === menu.id)) menus.push(menu);
    }
    return { status: "ready", menus, minimumBudget };
  }

  // Without drink (or drink category itself)
  const minimumBudget = people * Math.min(...pool.map((food) => food.price));
  if (budget < minimumBudget) {
    return { status: "insufficient", menus: [], minimumBudget };
  }

  const candidates = pool.flatMap((food, index) => {
    const total = food.price * people;
    if (total > budget) return [];
    let priorityBonus = index * 0.35;
    if (kind === "drink") {
      const rank = drinkPriority.indexOf(food.image);
      priorityBonus = rank === -1 ? 12 : rank * 0.4;
    } else if (kind === "snack") {
      const rank = snackPriority.indexOf(food.image);
      priorityBonus = rank === -1 ? 12 : rank * 0.4;
    }
    const score = (1 - total / budget) * 100 + priorityBonus;
    const menu: HappyHourMenu = {
      id: `${category}-${food.image}`,
      lines: [
        { food, kind, quantity: people, subtotal: total },
      ],
      total,
      perPerson: food.price,
      remaining: budget - total,
    };
    return [{ menu, score }];
  });

  candidates.sort((a, b) => a.score - b.score ||
    a.menu.lines[0].food.image - b.menu.lines[0].food.image);

  const menus: HappyHourMenu[] = [];
  const used = new Set<number>();
  for (const { menu } of candidates) {
    const food = menu.lines[0].food;
    if (used.has(food.image)) continue;
    menus.push(menu);
    used.add(food.image);
    if (menus.length === limits.maxVariants) break;
  }
  for (const { menu } of candidates) {
    if (menus.length === limits.maxVariants) break;
    if (!menus.some((selected) => selected.id === menu.id)) menus.push(menu);
  }

  return { status: "ready", menus, minimumBudget };
}
