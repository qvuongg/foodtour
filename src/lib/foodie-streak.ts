/**
 * Foodie Streak & Pet Engine
 * Quản lý điểm chuỗi, cấp độ ngọn lửa (Đỏ, Xanh, Tím) và thú cưng ẩm thực phong cách TikTok / Gen Z
 */

export type FlameTierId = "starter" | "red" | "blue" | "purple";

export interface FlameTierConfig {
  id: FlameTierId;
  minScore: number;
  maxScore: number;
  nameVi: string;
  nameEn: string;
  colorHex: string;
  glowColor: string;
  badgeLabel: string;
  petTitleVi: string;
  petTitleEn: string;
  petMood: "hungry" | "excited" | "super" | "divine";
}

export const FLAME_TIERS: FlameTierConfig[] = [
  {
    id: "starter",
    minScore: 0,
    maxScore: 2,
    nameVi: "Tia Lửa Nhỏ",
    nameEn: "Spark",
    colorHex: "#f97316", // Cam nhạt
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeLabel: "Khởi động",
    petTitleVi: "Bé Thèm Ăn",
    petTitleEn: "Hungry Baby",
    petMood: "hungry",
  },
  {
    id: "red",
    minScore: 3,
    maxScore: 99,
    nameVi: "Lửa Đỏ Rực Cháy",
    nameEn: "Red Flame",
    colorHex: "#ef4444", // Đỏ rực
    glowColor: "rgba(239, 68, 68, 0.6)",
    badgeLabel: "Rực cháy",
    petTitleVi: "Thánh Ăn Phố Cổ",
    petTitleEn: "Street Food Master",
    petMood: "excited",
  },
  {
    id: "blue",
    minScore: 100,
    maxScore: 199,
    nameVi: "Lửa Băng Plasma",
    nameEn: "Cyan Plasma Flame",
    colorHex: "#06b6d4", // Xanh băng tuyết / Cyan
    glowColor: "rgba(6, 182, 212, 0.65)",
    badgeLabel: "Siêu cấp",
    petTitleVi: "Siêu Xayda Ẩm Thực",
    petTitleEn: "Saiyan Foodie",
    petMood: "super",
  },
  {
    id: "purple",
    minScore: 200,
    maxScore: 999999,
    nameVi: "Lửa Tím Tối Thượng",
    nameEn: "Purple Divine Flame",
    colorHex: "#a855f7", // Tím hoàng kim / Amethyst
    glowColor: "rgba(168, 85, 247, 0.75)",
    badgeLabel: "Tối thượng",
    petTitleVi: "Thực Thần Vũ Trụ",
    petTitleEn: "Cosmic Food God",
    petMood: "divine",
  },
];

export interface FoodieStreakState {
  score: number;
  dailyStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalSpins: number;
  totalChecklistTested: number;
  petName: string;
}

const STORAGE_KEY = "foodtour_foodie_streak_v1";

export function getFlameTier(score: number): FlameTierConfig {
  if (score >= 200) return FLAME_TIERS[3];
  if (score >= 100) return FLAME_TIERS[2];
  if (score >= 3) return FLAME_TIERS[1];
  return FLAME_TIERS[0];
}

export function getTodayDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultStreakState(): FoodieStreakState {
  return {
    score: 3, // Khởi đầu mặc định 3 điểm để mở khóa Lửa Đỏ ngay cho người mới hào hứng!
    dailyStreak: 1,
    lastActiveDate: getTodayDateString(),
    totalSpins: 0,
    totalChecklistTested: 0,
    petName: "Bé Há Mồm",
  };
}

export function loadStreakState(): FoodieStreakState {
  if (typeof window === "undefined") return getDefaultStreakState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultStreakState();
      saveStreakState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      score: typeof parsed.score === "number" ? parsed.score : 3,
      dailyStreak: typeof parsed.dailyStreak === "number" ? parsed.dailyStreak : 1,
      lastActiveDate: typeof parsed.lastActiveDate === "string" ? parsed.lastActiveDate : getTodayDateString(),
      totalSpins: typeof parsed.totalSpins === "number" ? parsed.totalSpins : 0,
      totalChecklistTested: typeof parsed.totalChecklistTested === "number" ? parsed.totalChecklistTested : 0,
      petName: parsed.petName || "Bé Há Mồm",
    };
  } catch {
    return getDefaultStreakState();
  }
}

export function saveStreakState(state: FoodieStreakState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Ghi nhận 1 lượt quay món (Spin)
 * Tăng +1 điểm ngọn lửa, kiểm tra streak theo ngày
 */
export function addSpinStreak(currentState: FoodieStreakState): {
  nextState: FoodieStreakState;
  pointsAdded: number;
  streakIncremented: boolean;
} {
  const today = getTodayDateString();
  let nextDailyStreak = currentState.dailyStreak;
  let streakIncremented = false;

  if (currentState.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getTodayDateString(yesterday);

    if (currentState.lastActiveDate === yesterdayStr) {
      nextDailyStreak += 1;
      streakIncremented = true;
    } else {
      nextDailyStreak = 1;
    }
  }

  const pointsAdded = 1;
  const nextState: FoodieStreakState = {
    ...currentState,
    score: currentState.score + pointsAdded,
    dailyStreak: nextDailyStreak,
    lastActiveDate: today,
    totalSpins: currentState.totalSpins + 1,
  };

  saveStreakState(nextState);
  return { nextState, pointsAdded, streakIncremented };
}

/**
 * Ghi nhận 1 món được tick trong Checklist
 * Tăng +5 điểm ngọn lửa
 */
export function addChecklistStreak(
  currentState: FoodieStreakState,
  isTicking: boolean,
): {
  nextState: FoodieStreakState;
  pointsAdded: number;
} {
  const pointsDelta = isTicking ? 5 : -5;
  const newScore = Math.max(0, currentState.score + pointsDelta);

  const nextState: FoodieStreakState = {
    ...currentState,
    score: newScore,
    totalChecklistTested: Math.max(
      0,
      currentState.totalChecklistTested + (isTicking ? 1 : -1),
    ),
  };

  saveStreakState(nextState);
  return { nextState, pointsAdded: pointsDelta };
}

/**
 * Tính toán tiến trình lên cấp lửa tiếp theo (0% -> 100%)
 */
export function getNextTierProgress(score: number): {
  currentTier: FlameTierConfig;
  nextTier: FlameTierConfig | null;
  progressPercent: number;
  pointsNeeded: number;
} {
  const currentTier = getFlameTier(score);
  let nextTier: FlameTierConfig | null = null;
  let progressPercent = 100;
  let pointsNeeded = 0;

  if (currentTier.id === "starter") {
    nextTier = FLAME_TIERS[1]; // Lên đỏ (cần 3)
    progressPercent = Math.min(100, Math.round((score / 3) * 100));
    pointsNeeded = Math.max(0, 3 - score);
  } else if (currentTier.id === "red") {
    nextTier = FLAME_TIERS[2]; // Lên xanh (cần 100)
    const range = 100 - 3;
    const current = score - 3;
    progressPercent = Math.min(100, Math.round((current / range) * 100));
    pointsNeeded = Math.max(0, 100 - score);
  } else if (currentTier.id === "blue") {
    nextTier = FLAME_TIERS[3]; // Lên tím (cần 200)
    const range = 200 - 100;
    const current = score - 100;
    progressPercent = Math.min(100, Math.round((current / range) * 100));
    pointsNeeded = Math.max(0, 200 - score);
  } else {
    // Đã ở cấp tím tối thượng
    nextTier = null;
    progressPercent = 100;
    pointsNeeded = 0;
  }

  return { currentTier, nextTier, progressPercent, pointsNeeded };
}
