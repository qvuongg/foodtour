import { useEffect, useState, useSyncExternalStore } from "react";
import {
  createFoodieProgressStore,
  FOODIE_STORAGE_KEY,
  LEGACY_CHECKLIST_STORAGE_KEY,
  LEGACY_STREAK_STORAGE_KEY,
  type FoodieExclusive,
  type FoodieStorage,
} from "@/lib/foodie-streak";

function browserStorage(): FoodieStorage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; }
  catch { return null; }
}
const browserExclusive: FoodieExclusive = async (operation) => {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("foodtour-foodie-progress-v2", operation);
  }
  // Same-tab serialization still applies in older browsers without Web Locks.
  return operation();
};
export function useFoodieProgress() {
  // Reading during initialization is safe; migration writes happen in the effect below.
  const [store] = useState(() => createFoodieProgressStore(browserStorage(), browserExclusive));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    void store.initialize();
    const refresh = () => store.refresh();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || [FOODIE_STORAGE_KEY, LEGACY_STREAK_STORAGE_KEY, LEGACY_CHECKLIST_STORAGE_KEY].includes(event.key)) refresh();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [store]);
  return { ...snapshot, completeSpin: store.completeSpin, openRestaurant: store.openRestaurant, setChecked: store.setChecked,
    rename: store.rename, retrySave: store.retrySave };
}
