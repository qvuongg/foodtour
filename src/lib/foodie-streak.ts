import { isRewardableShopeeFoodLink } from "./shopee-reward";

/** Foodie progress v2: pet levels, atomic journal XP and daily restaurant exploration rewards. */

/** A single versioned snapshot owns both points and journal checkmarks. */
export interface FoodieProgressState {
  schemaVersion: 2;
  xp: number;
  dailyStreak: number;
  lastActiveDate: string;
  totalSpins: number;
  totalChecklistTested: number;
  petName: string;
  checkedSpotIds: string[];
  completedSpinIds: string[];
  /** Dates are retained so delayed retries cannot reward an earlier day twice. */
  rewardedRestaurantDates: string[];
  /** Derived maximum of rewardedRestaurantDates; never moves backwards on a late retry. */
  lastRestaurantRewardDate: string;
}
export type FoodieStreakState = FoodieProgressState;
export interface PetLevel {
  level: number;
  minXp: number;
  nameVi: string;
  nameEn: string;
  colorHex: string;
  accessory: "sprout" | "spoon" | "cap" | "glasses" | "chef" | "crown";
}
export const PET_LEVELS: readonly PetLevel[] = [
  { level: 1, minXp: 0, nameVi: "Mầm vị ngon", nameEn: "Little sprout", colorHex: "#537340", accessory: "sprout" },
  { level: 2, minXp: 10, nameVi: "Bé khám phá", nameEn: "Curious explorer", colorHex: "#AD542D", accessory: "spoon" },
  { level: 3, minXp: 25, nameVi: "Bạn sành ăn", nameEn: "Foodie friend", colorHex: "#AF462A", accessory: "cap" },
  { level: 4, minXp: 50, nameVi: "Sành vị phố", nameEn: "Street food scout", colorHex: "#2A7271", accessory: "glasses" },
  { level: 5, minXp: 100, nameVi: "Đầu bếp vị giác", nameEn: "Little chef", colorHex: "#996125", accessory: "chef" },
  { level: 6, minXp: 200, nameVi: "Thực thần", nameEn: "Food legend", colorHex: "#76517E", accessory: "crown" },
];
export const FOODIE_STORAGE_KEY = "foodtour_foodie_progress_v2";
export const LEGACY_STREAK_STORAGE_KEY = "foodtour_foodie_streak_v1";
export const LEGACY_CHECKLIST_STORAGE_KEY = "foodtour_must_try_checklist_v1";
export const FOODIE_RECOVERY_KEY = "foodtour_foodie_progress_v2_recovery";
const DEFAULT_PET_NAME = "Bé Há Mồm";
const TIME_ZONE = "Asia/Ho_Chi_Minh";
export type FoodieStorage = Pick<Storage, "getItem" | "setItem">;
export type FoodieStorageError = "unavailable" | "write-failed" | null;

function nonnegativeInteger(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : fallback;
}
function uniqueIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 256))] : [];
}
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function parse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function validDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? value : "";
}
export function getTodayDateString(date = new Date()): string {
  // Calendar dates always follow Vietnam, including devices travelling abroad.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function dayBefore(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}
export function getDefaultStreakState(): FoodieProgressState {
  return { schemaVersion: 2, xp: 3, dailyStreak: 0, lastActiveDate: "", totalSpins: 0,
    totalChecklistTested: 0, petName: DEFAULT_PET_NAME, checkedSpotIds: [], completedSpinIds: [],
    rewardedRestaurantDates: [], lastRestaurantRewardDate: "" };
}
export function hasRestaurantRewardToday(state: FoodieProgressState, now = new Date()): boolean {
  return state.rewardedRestaurantDates.includes(getTodayDateString(now));
}
export function getPetLevel(xp: number): PetLevel {
  const safeXp = nonnegativeInteger(xp);
  return [...PET_LEVELS].reverse().find((level) => safeXp >= level.minXp)!;
}
export function getPetProgress(xp: number): {
  level: PetLevel; nextLevel: PetLevel | null; percent: number; remainingXp: number;
} {
  const safeXp = nonnegativeInteger(xp);
  const level = getPetLevel(safeXp);
  const nextLevel = PET_LEVELS[level.level] ?? null;
  return { level, nextLevel,
    percent: nextLevel ? ((safeXp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100 : 100,
    remainingXp: nextLevel ? nextLevel.minXp - safeXp : 0 };
}
export function getStreakSummary(state: FoodieProgressState, now = new Date()): {
  currentDays: number; previousDays: number; activeToday: boolean; needsRestart: boolean;
} {
  const today = getTodayDateString(now);
  const activeToday = state.lastActiveDate === today && state.dailyStreak > 0;
  const stillCurrent = activeToday || state.lastActiveDate === dayBefore(today);
  return { currentDays: stillCurrent ? state.dailyStreak : 0,
    previousDays: stillCurrent ? 0 : state.dailyStreak,
    activeToday, needsRestart: state.dailyStreak > 0 && !stillCurrent };
}
export function validatePetName(value: string): {
  valid: boolean; name: string; error: "length" | "characters" | null;
} {
  const name = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  // Do not reject Vietnamese accents or joined emoji; reject invisible control overrides.
  if (/[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u.test(name)) {
    return { valid: false, name, error: "characters" };
  }
  const length = [...new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(name)].length;
  return length < 2 || length > 20 ? { valid: false, name, error: "length" }
    : { valid: true, name, error: null };
}

/** Read sanitizers never recalculate XP from the journal or grant migration rewards. */
export function migrateFoodieProgress(legacy: unknown, legacyChecks: unknown): FoodieProgressState {
  const source = record(legacy);
  const fallback = getDefaultStreakState();
  if (!source) return { ...fallback, checkedSpotIds: uniqueIds(legacyChecks) };
  return { ...fallback,
    xp: nonnegativeInteger(source.score, fallback.xp),
    dailyStreak: nonnegativeInteger(source.dailyStreak),
    lastActiveDate: validDate(source.lastActiveDate),
    totalSpins: nonnegativeInteger(source.totalSpins),
    totalChecklistTested: nonnegativeInteger(source.totalChecklistTested),
    // Keep legacy names even if they predate the new rename length limit.
    petName: typeof source.petName === "string" && source.petName.trim() ? source.petName : fallback.petName,
    checkedSpotIds: uniqueIds(legacyChecks),
  };
}
export function parseFoodieProgress(raw: string | null): FoodieProgressState | null {
  const source = record(parse(raw));
  if (source?.schemaVersion !== 2) return null;
  const fallback = getDefaultStreakState();
  const rewardedRestaurantDates = [...new Set([
    ...uniqueIds(source.rewardedRestaurantDates).filter((date) => Boolean(validDate(date))),
    validDate(source.lastRestaurantRewardDate),
  ].filter(Boolean))].sort();
  return { schemaVersion: 2, xp: nonnegativeInteger(source.xp, fallback.xp),
    dailyStreak: nonnegativeInteger(source.dailyStreak), lastActiveDate: validDate(source.lastActiveDate),
    totalSpins: nonnegativeInteger(source.totalSpins), totalChecklistTested: nonnegativeInteger(source.totalChecklistTested),
    petName: typeof source.petName === "string" && source.petName.trim() ? source.petName : fallback.petName,
    checkedSpotIds: uniqueIds(source.checkedSpotIds), completedSpinIds: uniqueIds(source.completedSpinIds),
    rewardedRestaurantDates, lastRestaurantRewardDate: rewardedRestaurantDates.at(-1) ?? "" };
}
function readSnapshot(storage: FoodieStorage): { state: FoodieProgressState; corruptRaw: string | null } {
  const raw = storage.getItem(FOODIE_STORAGE_KEY);
  const saved = parseFoodieProgress(raw);
  if (saved) return { state: saved, corruptRaw: null };
  return { state: migrateFoodieProgress(parse(storage.getItem(LEGACY_STREAK_STORAGE_KEY)),
    parse(storage.getItem(LEGACY_CHECKLIST_STORAGE_KEY))), corruptRaw: raw };
}

export type FoodieProgressEvent =
  | { type: "spinCompleted"; id: string; date: string }
  | { type: "restaurantOpened"; url: string; date: string }
  | { type: "setChecked"; id: string; checked: boolean }
  | { type: "rename"; name: string };
export function reduceFoodieProgress(state: FoodieProgressState, event: FoodieProgressEvent): FoodieProgressState {
  if (event.type === "rename") {
    const validation = validatePetName(event.name);
    return validation.valid && validation.name !== state.petName ? { ...state, petName: validation.name } : state;
  }
  if (event.type === "restaurantOpened") {
    if (!isRewardableShopeeFoodLink(event.url) || !validDate(event.date)
      || state.rewardedRestaurantDates.includes(event.date)) return state;
    const rewardedRestaurantDates = [...state.rewardedRestaurantDates, event.date].sort();
    return { ...state, xp: nonnegativeInteger(state.xp + 2), rewardedRestaurantDates,
      lastRestaurantRewardDate: rewardedRestaurantDates.at(-1)! };
  }
  if (!event.id || event.id.length > 256) return state;
  if (event.type === "setChecked") {
    const wasChecked = state.checkedSpotIds.includes(event.id);
    if (wasChecked === event.checked) return state;
    return { ...state, xp: nonnegativeInteger(state.xp + (event.checked ? 5 : -5)),
      totalChecklistTested: nonnegativeInteger(state.totalChecklistTested + (event.checked ? 1 : -1)),
      checkedSpotIds: event.checked ? [...state.checkedSpotIds, event.id]
        : state.checkedSpotIds.filter((id) => id !== event.id) };
  }
  if (!validDate(event.date) || state.completedSpinIds.includes(event.id)) return state;
  let dailyStreak = state.dailyStreak;
  let lastActiveDate = state.lastActiveDate;
  // A delayed retry from yesterday may add its XP, but cannot move today's streak backwards.
  if (!lastActiveDate || event.date > lastActiveDate) {
    dailyStreak = lastActiveDate === dayBefore(event.date) ? dailyStreak + 1 : 1;
    lastActiveDate = event.date;
  } else if (event.date === lastActiveDate && dailyStreak === 0) dailyStreak = 1;
  return { ...state, xp: nonnegativeInteger(state.xp + 1), dailyStreak, lastActiveDate,
    totalSpins: nonnegativeInteger(state.totalSpins + 1), completedSpinIds: [...state.completedSpinIds, event.id] };
}

export interface FoodieProgressSnapshot {
  state: FoodieProgressState;
  storageError: FoodieStorageError;
}
export type FoodieExclusive = <T>(operation: () => T | Promise<T>) => Promise<T>;
/** Serial transaction coordinator. Pending events stay visible and retryable after a failed write. */
export function createFoodieProgressStore(storage: FoodieStorage | null,
  exclusive: FoodieExclusive = async (operation) => operation()) {
  let initial: FoodieProgressSnapshot;
  try {
    initial = { state: storage ? readSnapshot(storage).state : getDefaultStreakState(),
      storageError: storage ? null : "unavailable" };
  } catch { initial = { state: getDefaultStreakState(), storageError: "unavailable" }; }
  let snapshot = initial;
  let pending: FoodieProgressEvent[] = [];
  let queue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const publish = (state: FoodieProgressState, storageError: FoodieStorageError) => {
    snapshot = { state, storageError };
    listeners.forEach((listener) => listener());
  };
  const replay = (state: FoodieProgressState) => pending.reduce(reduceFoodieProgress, state);
  const flush = () => {
    const transaction = async (): Promise<boolean> => {
      if (!storage) { publish(snapshot.state, "unavailable"); return false; }
      try {
        return await exclusive(() => {
          let saved: ReturnType<typeof readSnapshot>;
          try { saved = readSnapshot(storage); }
          catch { publish(snapshot.state, "unavailable"); return false; }
          const state = replay(saved.state);
          try {
            // Preserve a malformed v2 before recovering from v1. Never remove or overwrite v1.
            if (saved.corruptRaw && !storage.getItem(FOODIE_RECOVERY_KEY)) {
              storage.setItem(FOODIE_RECOVERY_KEY, saved.corruptRaw);
            }
            storage.setItem(FOODIE_STORAGE_KEY, JSON.stringify(state));
          } catch { publish(state, "write-failed"); return false; }
          pending = [];
          publish(state, null);
          return true;
        });
      } catch { publish(snapshot.state, "unavailable"); return false; }
    };
    const result = queue.then(transaction, transaction);
    queue = result;
    return result;
  };
  const dispatch = (event: FoodieProgressEvent): Promise<boolean> => {
    pending.push(event);
    publish(reduceFoodieProgress(snapshot.state, event), snapshot.storageError);
    return flush();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    initialize: flush,
    retrySave: flush,
    completeSpin(id: string, now = new Date()) {
      if (!id || id.length > 256) return Promise.resolve(false);
      return dispatch({ type: "spinCompleted", id, date: getTodayDateString(now) });
    },
    openRestaurant(url: string, now = new Date()) {
      if (!isRewardableShopeeFoodLink(url)) return Promise.resolve(false);
      return dispatch({ type: "restaurantOpened", url, date: getTodayDateString(now) });
    },
    setChecked(id: string, checked: boolean) {
      if (!id || id.length > 256) return Promise.resolve(false);
      return dispatch({ type: "setChecked", id, checked });
    },
    rename(name: string) {
      const validation = validatePetName(name);
      return validation.valid ? dispatch({ type: "rename", name: validation.name }) : Promise.resolve(false);
    },
    refresh() {
      if (!storage) return;
      try { publish(replay(readSnapshot(storage).state), snapshot.storageError); }
      catch { publish(snapshot.state, "unavailable"); }
    },
  };
}
