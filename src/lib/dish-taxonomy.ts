import type { Food } from "./foods";
import { foods } from "./foods";
import { drinkFoods } from "./foods-drinks";
import { snackFoods } from "./foods-snacks";
import { pubFoods } from "./foods-pub";

import type { MealKind } from "./food-categories";

export type MealSession = "breakfast" | "lunch" | "afternoon" | "dinner" | "late";

export type DishTasteCategory = string;

export interface DishTasteConfig {
  id: string;
  labelVi: string;
  labelEn: string;
  icon: string;
  descriptionVi?: string;
}

// Bữa chính (Lunch)
export const LUNCH_TASTE_CATEGORIES: DishTasteConfig[] = [
  {
    id: "dry",
    labelVi: "Món khô/Cơm",
    labelEn: "Dry / Rice",
    icon: "🍚",
    descriptionVi: "Cơm tấm, cơm rang, bánh mì, xôi, món khô...",
  },
  {
    id: "broth",
    labelVi: "Món nước",
    labelEn: "Broth / Noodles",
    icon: "🍜",
    descriptionVi: "Phở, bún chả, bún bò, hủ tiếu, bánh canh...",
  },
  {
    id: "veg",
    labelVi: "Món chay",
    labelEn: "Vegetarian",
    icon: "🥗",
    descriptionVi: "Thuần chay, thanh đạm, rau củ đậu hũ...",
  },
];

// Đồ uống (Drink)
export const DRINK_TASTE_CATEGORIES: DishTasteConfig[] = [
  {
    id: "coffee",
    labelVi: "Cà phê",
    labelEn: "Coffee",
    icon: "☕",
    descriptionVi: "Đen đá, sữa đá, bạc xỉu, latte, cold brew...",
  },
  {
    id: "milktea",
    labelVi: "Trà sữa",
    labelEn: "Milk Tea",
    icon: "🧋",
    descriptionVi: "Trân châu, ô long, matcha, kem cheese...",
  },
  {
    id: "fruittea",
    labelVi: "Trà trái cây",
    labelEn: "Fruit Tea",
    icon: "🍹",
    descriptionVi: "Trà đào, trà vải, mãng cầu, chanh tắc...",
  },
  {
    id: "juice",
    labelVi: "Nước ép/Sinh tố",
    labelEn: "Juice / Smoothie",
    icon: "🥑",
    descriptionVi: "Sinh tố bơ, xoài, nước cam, dưa hấu, dừa...",
  },
];

// Ăn vặt (Snack)
export const SNACK_TASTE_CATEGORIES: DishTasteConfig[] = [
  {
    id: "fried",
    labelVi: "Chiên / Rán",
    labelEn: "Fried / Crispy",
    icon: "🍟",
    descriptionVi: "Cá viên, nem chua rán, khoai tây, gà rán...",
  },
  {
    id: "mixed",
    labelVi: "Bánh tráng / Trộn",
    labelEn: "Rice Paper / Mixed",
    icon: "🥢",
    descriptionVi: "Bánh tráng trộn, nướng, gỏi, xoài lắc...",
  },
  {
    id: "sweet",
    labelVi: "Chè / Bánh ngọt",
    labelEn: "Dessert / Sweet",
    icon: "🍨",
    descriptionVi: "Chè bưởi, chè thái, bánh flan, sữa chua...",
  },
  {
    id: "savory",
    labelVi: "Bánh mặn / Ăn nhẹ",
    labelEn: "Savory Cakes",
    icon: "🥟",
    descriptionVi: "Bánh giò, bánh đúc, bánh gối, há cảo...",
  },
];

// Món nhậu (Nhậu lai rai)
export const NHAU_TASTE_CATEGORIES: DishTasteConfig[] = [
  {
    id: "grill",
    labelVi: "Nướng / Chiên",
    labelEn: "Grilled / Fried",
    icon: "🍗",
    descriptionVi: "Chân gà nướng, sụn gà chiên mắm, dồi sụn...",
  },
  {
    id: "stirfry",
    labelVi: "Xào / Cháy tỏi",
    labelEn: "Stir-fried / Sauté",
    icon: "🥘",
    descriptionVi: "Lòng xào dưa, tóp mỡ, dạ dày cháy tỏi...",
  },
  {
    id: "hotpot",
    labelVi: "Lẩu / Món nước",
    labelEn: "Hotpot / Soup",
    icon: "🍲",
    descriptionVi: "Lẩu riêu cua, lẩu ếch, canh ngao...",
  },
  {
    id: "nibble",
    labelVi: "Mồi nhắm / Gỏi",
    labelEn: "Finger Food / Salad",
    icon: "🥜",
    descriptionVi: "Lạc rang, dưa chuột, mực khô, tai heo thính...",
  },
];

export const TASTE_CATEGORIES = LUNCH_TASTE_CATEGORIES;

export function getTasteCategoriesForMealKind(mealKind: MealKind): DishTasteConfig[] {
  switch (mealKind) {
    case "drink":
      return DRINK_TASTE_CATEGORIES;
    case "snack":
      return SNACK_TASTE_CATEGORIES;
    case "nhau":
      return NHAU_TASTE_CATEGORIES;
    case "lunch":
    default:
      return LUNCH_TASTE_CATEGORIES;
  }
}

export interface MealSessionConfig {
  id: MealSession;
  labelVi: string;
  labelEn: string;
  icon: string;
  timeRangeVi: string;
}

export const MEAL_SESSIONS: MealSessionConfig[] = [
  {
    id: "breakfast",
    labelVi: "Ăn sáng",
    labelEn: "Breakfast",
    icon: "🌅",
    timeRangeVi: "06:01 - 10:00",
  },
  {
    id: "lunch",
    labelVi: "Ăn trưa",
    labelEn: "Lunch",
    icon: "☀️",
    timeRangeVi: "10:01 - 14:00",
  },
  {
    id: "afternoon",
    labelVi: "Ăn xế",
    labelEn: "Afternoon Snack",
    icon: "☕",
    timeRangeVi: "14:01 - 17:00",
  },
  {
    id: "dinner",
    labelVi: "Ăn tối",
    labelEn: "Dinner",
    icon: "🌙",
    timeRangeVi: "17:01 - 23:00",
  },
  {
    id: "late",
    labelVi: "Ăn đêm",
    labelEn: "Late Night",
    icon: "🌃",
    timeRangeVi: "23:01 - 06:00",
  },
];

/**
 * Tự động nhận diện buổi ăn theo thời gian thực tế:
 * - Ăn sáng: 06:01 - 10:00
 * - Ăn trưa: 10:01 - 14:00
 * - Ăn xế: 14:01 - 17:00
 * - Ăn tối: 17:01 - 23:00
 * - Ăn đêm: 23:01 - 06:00
 */
export function detectCurrentMealSession(date = new Date()): MealSession {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 361 && minutes <= 600) return "breakfast";
  if (minutes >= 601 && minutes <= 840) return "lunch";
  if (minutes >= 841 && minutes <= 1020) return "afternoon";
  if (minutes >= 1021 && minutes <= 1380) return "dinner";
  return "late";
}

const BROTH_KEYWORDS = [
  "phở",
  "bún",
  "hủ tiếu",
  "hu tieu",
  "bánh canh",
  "mì",
  "miến",
  "cháo",
  "súp",
  "lẩu",
  "canh",
  "nước",
  "ramen",
  "udon",
  "súp lươn",
];

const VEG_KEYWORDS = [
  "chay",
  "đậu hũ",
  "đậu phụ",
  "nấm",
  "rau luộc",
  "salad",
];

/**
 * Kiểm tra xem món ăn có phải là món nước (nước dùng, phở, bún nước, mì nước, canh, cháo, lẩu...) hay không.
 * Đảm bảo phân loại chặt chẽ:
 * - Bánh mì, bánh mỳ, sandwich, burger, bánh cuốn, bánh ướt, bánh bao, bánh giò, bánh xèo, rolls: KHÔNG PHẢI MÓN NƯỚC.
 * - Cơm, xôi, bibimbap, gyudon, risotto, biryani: KHÔNG PHẢI MÓN NƯỚC.
 * - Mì xào, mì trộn, mì Ý, miến xào, nui xào, bún đậu, bún thịt nướng, bún bò Nam Bộ: KHÔNG PHẢI MÓN NƯỚC.
 * - Bánh đa cua, gà hầm sâm Samgyetang, canh kimchi, canh sườn bò, cháo, lẩu: ĐƯỢC XẾP ĐÚNG VÀO MÓN NƯỚC.
 */
export function isBrothDish(food: Food): boolean {
  const n = (food.name || "").toLowerCase().trim();

  // 1. Nhóm Bánh mì / Bánh mỳ / Sandwiches / Burgers / Rolls / Bánh hấp/nướng khô (ƯU TIÊN LOẠI TRỪ)
  if (
    n.includes("bánh mì") ||
    n.includes("bánh mỳ") ||
    n.includes("sandwich") ||
    n.includes("burger") ||
    n.includes("bánh bao") ||
    n.includes("bánh giò") ||
    n.includes("bánh ướt") ||
    n.includes("bánh cuốn") ||
    n.includes("bánh xèo") ||
    n.includes("bánh hỏi") ||
    n.includes("wrap") ||
    n.includes("taco") ||
    n.includes("burrito") ||
    n.includes("quesadilla")
  ) {
    return false;
  }

  // 2. Nhóm Cơm & Xôi & Rice bowls (trừ món canh có tên bắt đầu bằng "canh")
  if (
    n.startsWith("cơm") ||
    n.startsWith("xôi") ||
    n.includes("gyudon") ||
    n.includes("bibimbap") ||
    n.includes("biryani") ||
    n.includes("risotto")
  ) {
    return false;
  }

  // 3. Mì xào, Mì trộn, Mì Ý, Miến xào, Bún khô / Bún trộn / Bún chấm / Cuốn
  if (
    n.includes("phở cuốn") ||
    n.includes("gỏi cuốn") ||
    n.includes("nem cuốn") ||
    n.includes("nem nướng") ||
    n.includes("bún đậu") ||
    n.includes("bún thịt nướng") ||
    n.includes("bún bò nam bộ") ||
    n.includes("mì xào") ||
    n.includes("mì trộn") ||
    n.includes("miến xào") ||
    n.includes("nui xào") ||
    n.includes("udon xào") ||
    n.includes("pad thai") ||
    n.includes("mì tương đen") ||
    n.includes("mì ý") ||
    n.includes("spaghetti") ||
    n.includes("lasagna") ||
    n.includes("mac & cheese") ||
    n.includes("gnocchi")
  ) {
    return false;
  }

  // 4. Món Âu / Nướng / Chiên / Khô / Sushi
  if (
    n.includes("pizza") ||
    n.includes("sushi") ||
    n.includes("kimbap") ||
    n.includes("bít tết") ||
    n.includes("bò né") ||
    n.includes("bò lúc lắc") ||
    n.includes("gà rán") ||
    n.includes("bột chiên") ||
    n.includes("dimsum") ||
    n.includes("falafel") ||
    n.includes("fish & chips") ||
    n.includes("nướng") ||
    n.includes("gà mẹt")
  ) {
    return false;
  }

  // 5. Nhóm món nước chuẩn (Phở, Bún nước, Hủ tiếu, Bánh canh, Bánh đa cua, Mì nước, Miến nước, Cháo, Lẩu, Canh, Súp)
  if (
    n.includes("phở") ||
    n.includes("bún") ||
    n.includes("hủ tiếu") ||
    n.includes("hu tieu") ||
    n.includes("bánh canh") ||
    n.includes("bánh đa cua") ||
    n.includes("bánh đa") ||
    n.includes("mì") ||
    n.includes("miến") ||
    n.includes("cháo") ||
    n.includes("súp") ||
    n.includes("lẩu") ||
    n.includes("canh") ||
    n.includes("ramen") ||
    n.includes("udon") ||
    n.includes("soba") ||
    n.includes("kalguksu") ||
    n.includes("hoành thánh") ||
    n.includes("sủi cảo") ||
    n.includes("samgyetang") ||
    n.includes("galbitang")
  ) {
    return true;
  }

  return false;
}

/**
 * Phân loại khẩu vị của một món ăn
 */
export function classifyDishTaste(food: Food): "broth" | "dry" | "veg" {
  if (food.veg) return "veg";
  const n = (food.name || "").toLowerCase();
  if (VEG_KEYWORDS.some((k) => n.includes(k))) return "veg";
  if (isBrothDish(food)) return "broth";
  return "dry";
}

/**
 * Kiểm tra xem một món có phù hợp với một gu cụ thể theo mealKind hay không
 */
export function matchSingleTaste(food: Food, tasteId: string, mealKind: MealKind): boolean {
  if (!tasteId || tasteId === "all") return true;
  const n = (food.name || "").toLowerCase();
  const sub = (food.sub || "").toLowerCase();
  const text = `${n} ${sub}`;

  if (mealKind === "lunch") {
    if (tasteId === "veg") return food.veg === true || text.includes("chay");
    if (tasteId === "broth") return isBrothDish(food);
    if (tasteId === "dry") return !isBrothDish(food);
    return true;
  }

  if (mealKind === "drink") {
    if (tasteId === "coffee") {
      const COFFEE_KEYWORDS = [
        "cà phê", "cafe", "bạc xỉu", "latte", "cappuccino",
        "cold brew", "espresso", "americano", "đen đá", "sữa đá"
      ];
      return COFFEE_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "milktea") {
      const MILKTEA_KEYWORDS = [
        "trà sữa", "ô long sữa", "matcha", "trân châu", "sữa chua uống",
        "khoai môn", "thái xanh", "thái đỏ", "thái", "cacao", "sô cô la",
        "socola", "bánh quy kem", "sữa đậu nành", "sữa hạt sen", "sữa chua"
      ];
      return MILKTEA_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "fruittea") {
      const FRUITTEA_KEYWORDS = [
        "trà đào", "trà vải", "trà dâu", "trà chanh", "trà tắc", "trà hoa quả",
        "trà trái cây", "trà mãng cầu", "trà ổi", "trà sen", "trà nhãn", "trà xoài",
        "trà táo", "trà mận", "trà quất", "trà lài", "trà ô long", "trà xanh",
        "hồng trà", "trà đen", "trà thảo mộc", "trà hoa", "trà"
      ];
      return FRUITTEA_KEYWORDS.some((k) => text.includes(k)) && !text.includes("trà sữa") && !text.includes("sữa");
    }
    if (tasteId === "juice") {
      const JUICE_KEYWORDS = [
        "nước ép", "sinh tố", "nước mía", "nước dừa", "nước chanh", "cam vắt",
        "sắn dây", "me đá", "chanh leo", "chanh dây", "dừa", "rau má",
        "nước sâm", "sâm bí đao", "nước mơ", "nước sấu", "soda", "nước lọc"
      ];
      return JUICE_KEYWORDS.some((k) => text.includes(k));
    }
    return true;
  }

  if (mealKind === "snack") {
    if (tasteId === "fried") {
      const FRIED_KEYWORDS = ["chiên", "rán", "que", "gà", "xúc xích", "viên", "khoai", "bột chiên", "bánh cam", "bánh rán"];
      return FRIED_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "mixed") {
      const MIXED_KEYWORDS = [
        "bánh tráng", "trộn", "cuốn", "lắc", "chân gà", "gỏi", "nộm", "sốt thái",
        "bắp xào", "bắp nướng", "ốc xào", "sò điệp", "trứng cút lộn",
        "hạt", "đậu phộng", "đậu nành", "hướng dương", "khô bò", "rong biển"
      ];
      return MIXED_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "sweet") {
      const SWEET_KEYWORDS = [
        "chè", "flan", "kem", "cake", "bánh trứng", "sữa chua", "dầm", "ngọt", "trái cây", "hoa quả",
        "dưa hấu", "dưa lưới", "ổi", "xoài", "cóc", "thơm", "dứa", "bưởi", "cam", "quýt",
        "thanh long", "đu đủ", "chuối", "mít", "sầu riêng", "măng cụt", "chôm chôm", "nhãn",
        "vải", "mãng cầu", "sapoche", "vú sữa", "nho", "táo", "roi", "mận",
        "tào phớ", "bánh bò", "bánh chuối", "bánh da lợn", "bông lan"
      ];
      return SWEET_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "savory") {
      const SAVORY_KEYWORDS = [
        "bánh giò", "bánh đúc", "bánh gối", "há cảo", "sủi cảo", "bánh rán", "takoyaki",
        "bánh bao", "bánh bèo", "bánh bột lọc", "bánh tiêu", "bánh nậm", "bắp luộc", "ốc luộc"
      ];
      return SAVORY_KEYWORDS.some((k) => text.includes(k));
    }
    return true;
  }

  if (mealKind === "nhau") {
    if (tasteId === "grill") {
      const GRILL_KEYWORDS = ["nướng", "chiên", "rang muối", "dồi", "ngô", "khoai", "quay"];
      return GRILL_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "stirfry") {
      const STIRFRY_KEYWORDS = ["xào", "cháy tỏi", "rang riềng", "hấp", "lúc lắc"];
      return STIRFRY_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "hotpot") {
      const HOTPOT_KEYWORDS = ["lẩu", "canh", "om", "súp"];
      return HOTPOT_KEYWORDS.some((k) => text.includes(k));
    }
    if (tasteId === "nibble") {
      const NIBBLE_KEYWORDS = ["lạc", "dưa", "mực", "gỏi", "nộm", "chân gà", "tai heo", "đậu", "khô", "nem"];
      return NIBBLE_KEYWORDS.some((k) => text.includes(k));
    }
    return true;
  }

  return true;
}

/**
 * Lọc danh sách món ăn theo nhiều gu cùng lúc (Multi-select OR logic)
 * User có thể chọn 1 hoặc nhiều gu. Món ăn thuộc bất kỳ gu nào đã chọn sẽ được hiển thị.
 */
export function filterFoodsByTastes(
  foodList: Food[],
  selectedTastes: string[],
  mealKind: MealKind,
): Food[] {
  if (!selectedTastes || selectedTastes.length === 0 || selectedTastes.includes("all")) {
    return foodList;
  }
  const filtered = foodList.filter((food) =>
    selectedTastes.some((tId) => matchSingleTaste(food, tId, mealKind)),
  );
  return filtered.length > 0 ? filtered : foodList;
}

/**
 * Kiểm tra xem một món có phù hợp với session và taste category hay không (hỗ trợ legacy tests)
 */
export function matchesTasteCategory(food: Food, category: DishTasteCategory): boolean {
  if (!category || category === "all") return true;
  return matchSingleTaste(food, category, "lunch");
}

/**
 * Lấy danh sách món ăn theo Session và Taste Categories (hỗ trợ cả string đơn lẻ lẫn mảng nhiều gu)
 */
export function getFoodsForSessionAndTaste(
  session: MealSession,
  categoryOrList: string | string[],
  lunchPool: Food[] = foods,
): Food[] {
  let pool: Food[] = [];

  switch (session) {
    case "breakfast": {
      // Bữa sáng: Món có gắn nhãn breakfast hoặc phở, bún, bánh mì, xôi, bánh cuốn, cháo, hủ tiếu, cơm tấm, bánh đa cua
      pool = lunchPool.filter((f) => {
        if (f.meals && f.meals.includes("breakfast")) return true;
        if (f.meals && f.meals.length > 0 && !f.meals.includes("breakfast")) return false;
        const n = f.name.toLowerCase();
        return (
          n.includes("phở") ||
          n.includes("bún") ||
          n.includes("bánh mì") ||
          n.includes("bánh mỳ") ||
          n.includes("bánh đa") ||
          n.includes("xôi") ||
          n.includes("bánh cuốn") ||
          n.includes("cháo") ||
          n.includes("hủ tiếu") ||
          n.includes("cơm tấm")
        );
      });
      if (pool.length < 10) pool = lunchPool;
      break;
    }
    case "afternoon": {
      // Bữa xế: Món có gắn nhãn afternoon hoặc bánh mì, bánh cuốn, xôi, cháo, ăn vặt nhẹ
      pool = lunchPool.filter((f) => {
        if (f.meals && f.meals.includes("afternoon")) return true;
        if (f.meals && f.meals.length > 0 && !f.meals.includes("afternoon")) return false;
        const n = f.name.toLowerCase();
        return (
          n.includes("bánh mì") ||
          n.includes("bánh cuốn") ||
          n.includes("bún") ||
          n.includes("xôi") ||
          n.includes("cháo")
        );
      });
      if (pool.length < 10) pool = lunchPool;
      break;
    }
    case "dinner": {
      // Bữa tối: Món ăn trưa + Món lẩu/nướng/ăn nhóm + Món nhậu
      pool = [
        ...lunchPool.filter((f) => !f.meals || f.meals.includes("dinner")),
        ...pubFoods,
      ];
      break;
    }
    case "late": {
      // Ăn đêm: Món có gắn nhãn late/night hoặc phở, mì, cháo, bún, bánh mì, món nhậu
      pool = [
        ...lunchPool.filter((f) => {
          if (f.meals && (f.meals.includes("late") || (f.meals as unknown as string[]).includes("night"))) return true;
          if (f.meals && f.meals.length > 0 && !f.meals.includes("late") && !(f.meals as unknown as string[]).includes("night")) return false;
          const n = f.name.toLowerCase();
          return (
            n.includes("phở") ||
            n.includes("mì") ||
            n.includes("cháo") ||
            n.includes("bún") ||
            n.includes("bánh mì")
          );
        }),
        ...pubFoods,
      ];
      if (pool.length < 10) pool = lunchPool;
      break;
    }
    case "lunch":
    default:
      pool = lunchPool.filter((f) => !f.meals || f.meals.includes("lunch"));
      break;
  }

  const selectedList = Array.isArray(categoryOrList)
    ? categoryOrList
    : categoryOrList && categoryOrList !== "all"
      ? [categoryOrList]
      : [];

  return filterFoodsByTastes(pool, selectedList, "lunch");
}

/**
 * Lấy danh sách món ăn chuyên biệt theo từng bữa ăn (sáng, trưa, xế, tối, đêm)
 */
export function getFoodsByMealSession(session: MealSession): Food[] {
  return getFoodsForSessionAndTaste(session, "all");
}

