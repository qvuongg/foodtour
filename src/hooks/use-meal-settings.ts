import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { readCookie, writeCookie } from "@/lib/cookies";
import { getMealConfig, type MealKind } from "@/lib/food-categories";
import type { Language } from "@/lib/i18n";
import {
  defaultMealSettings,
  isMealKind,
  MEAL_SETTINGS_COOKIE,
  restoreMealSettings,
  updateMealBudget,
  vegetarianFilterEnabled,
  type MealSettings,
} from "@/lib/meal-settings";

export function useMealSettings(language: Language = "vi") {
  const [settings, setSettings] = useState(defaultMealSettings);
  const current = useRef(settings);
  const restored = useRef(false);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const saved = restoreMealSettings(
      readCookie(MEAL_SETTINGS_COOKIE),
      readCookie("settings"),
      readCookie("meal-kind"),
    );
    current.current = saved;
    restored.current = true;
    setSettings(saved);
    setReady(true);
  }, []);

  // Persist only explicit interactions after restoration. No initial render or
  // locale change may overwrite a user's saved preferences with defaults.
  const commit = useCallback((next: MealSettings) => {
    if (!restored.current) return false;
    current.current = next;
    setSettings(next);
    try {
      writeCookie(MEAL_SETTINGS_COOKIE, next);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
    // Valid choices remain usable during this visit if cookies are blocked.
    return true;
  }, []);

  const selectMealKind = useCallback(
    (kind: MealKind) => {
      if (!isMealKind(kind)) return;
      commit({ ...current.current, mealKind: kind });
    },
    [commit],
  );

  const applyBudget = useCallback(
    (value: string, custom?: string) => {
      const next = updateMealBudget(current.current, value, custom);
      return next ? commit(next) : false;
    },
    [commit],
  );

  const setVeg = useCallback(
    (value: SetStateAction<boolean>) => {
      const next =
        typeof value === "function" ? value(current.current.veg) : value;
      commit({ ...current.current, veg: next });
    },
    [commit],
  );

  const setSound = useCallback(
    (value: SetStateAction<boolean>) => {
      const next =
        typeof value === "function" ? value(current.current.sound) : value;
      commit({ ...current.current, sound: next });
    },
    [commit],
  );

  return {
    mealKind: settings.mealKind,
    mealConfig: getMealConfig(settings.mealKind),
    ...settings.budgets[settings.mealKind],
    veg: settings.veg,
    vegetarianEnabled: vegetarianFilterEnabled(settings),
    sound: settings.sound,
    ready,
    error: saveFailed
      ? language === "vi"
        ? "Chưa lưu được tùy chọn. Lựa chọn vẫn dùng được trong lần mở trang này."
        : "Preferences could not be saved. Your choices still work for this visit."
      : "",
    selectMealKind,
    applyBudget,
    setVeg,
    setSound,
  };
}
