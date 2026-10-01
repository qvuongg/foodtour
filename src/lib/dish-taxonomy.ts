import type { Food } from "./foods";
import { foods } from "./foods";
import { drinkFoods } from "./foods-drinks";
import { snackFoods } from "./foods-snacks";
import { pubFoods } from "./foods-pub";

export type MealSession = "breakfast" | "lunch" | "afternoon" | "dinner" | "late";

export type DishTasteCategory =
  | "all"
  | "dry"
  | "broth"
  | "veg";

export interface DishTasteConfig {
  id: DishTasteCategory;
  labelVi: string;
  labelEn: string;
  icon: string;
  descriptionVi: string;
}

export const TASTE_CATEGORIES: DishTasteConfig[] = [
  {
    id: "all",
    labelVi: "Tất cả món",
    labelEn: "All dishes",
    icon: "🥢",
    descriptionVi: "Không giới hạn, quay ngẫu nhiên mọi món ngon",
  },
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
    timeRangeVi: "05:00 - 10:00",
  },
  {
    id: "lunch",
    labelVi: "Ăn trưa",
    labelEn: "Lunch",
    icon: "☀️",
    timeRangeVi: "10:00 - 14:00",
  },
  {
    id: "afternoon",
    labelVi: "Ăn xế",
    labelEn: "Afternoon Snack",
    icon: "☕",
    timeRangeVi: "14:00 - 17:00",
  },
  {
    id: "dinner",
    labelVi: "Ăn tối",
    labelEn: "Dinner",
    icon: "🌙",
    timeRangeVi: "17:00 - 21:30",
  },
  {
    id: "late",
    labelVi: "Ăn đêm",
    labelEn: "Late Night",
    icon: "🌃",
    timeRangeVi: "21:30 - 05:00",
  },
];

/**
 * Tự động nhận diện buổi ăn theo thời gian thực tế
 */
export function detectCurrentMealSession(date = new Date()): MealSession {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21.5) return "dinner";
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

const SNACK_KEYWORDS = [
  "bánh tráng",
  "nem chua",
  "cá viên",
  "khoai tây",
  "chè",
  "bột chiên",
  "ốc",
  "chân gà",
  "trứng cút",
  "bánh tiêu",
];

/**
 * Phân loại khẩu vị của một món ăn
 */
export function classifyDishTaste(food: Food): "broth" | "dry" | "veg" {
  if (food.veg) return "veg";
  const n = (food.name || "").toLowerCase();
  if (VEG_KEYWORDS.some((k) => n.includes(k))) return "veg";
  if (BROTH_KEYWORDS.some((k) => n.includes(k))) return "broth";
  return "dry";
}

/**
 * Kiểm tra xem một món có phù hợp với session và taste category hay không
 */
export function matchesTasteCategory(food: Food, category: DishTasteCategory): boolean {
  if (category === "all") return true;
  if (category === "veg") return food.veg === true || (food.name || "").toLowerCase().includes("chay");
  if (category === "broth") {
    const n = (food.name || "").toLowerCase();
    return BROTH_KEYWORDS.some((k) => n.includes(k));
  }
  if (category === "dry") {
    const n = (food.name || "").toLowerCase();
    // Khô: không phải món nước dùng
    return !BROTH_KEYWORDS.some((k) => n.includes(k));
  }
  return true;
}

/**
 * Lấy danh sách món ăn theo Session và Taste Category
 */
export function getFoodsForSessionAndTaste(
  session: MealSession,
  category: DishTasteCategory,
  lunchPool: Food[] = foods,
): Food[] {
  let pool: Food[] = [];

  switch (session) {
    case "breakfast": {
      // Bữa sáng: Phở, bún, bánh mì, xôi, bánh cuốn, cháo, hủ tiếu, cơm tấm
      pool = lunchPool.filter((f) => {
        const n = f.name.toLowerCase();
        return (
          n.includes("phở") ||
          n.includes("bún") ||
          n.includes("bánh mì") ||
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
      // Bữa xế: Bánh mì, bánh cuốn, bún, xôi, cháo hoặc món trưa
      pool = lunchPool.filter((f) => {
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
      // Bữa tối: Món ăn trưa + Món nhậu/lẩu
      pool = [...lunchPool, ...pubFoods];
      break;
    }
    case "late": {
      // Ăn đêm: Phở, mì, cháo, bún, bánh mì, món nhậu
      pool = [
        ...lunchPool.filter((f) => {
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
      pool = lunchPool;
      break;
  }

  // Sau đó lọc theo Gu món (category) nếu người dùng chọn
  if (category === "all") return pool;
  const filtered = pool.filter((f) => matchesTasteCategory(f, category));
  return filtered.length > 0 ? filtered : pool;
}
