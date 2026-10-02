import { useCallback, useEffect, useRef, useState } from "react";

type CompanionView = "pet" | "journal";
type Entry = { owner: string; view: CompanionView; depth: number; fromPet: boolean };

/** One visible companion screen, with real browser Back support. */
export function useCompanionNavigation() {
  const owner = useRef(`foodie-${crypto.randomUUID()}`);
  const entry = useRef<Entry | null>(null);
  const [view, setView] = useState<CompanionView | null>(null);
  const [fromPet, setFromPet] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleBack = (event: PopStateEvent) => {
      const next = event.state?.foodieCompanion as Entry | undefined;
      entry.current = next?.owner === owner.current ? next : null;
      setView(entry.current?.view ?? null);
      setFromPet(entry.current?.fromPet ?? false);
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  const open = useCallback((nextView: CompanionView) => {
    if (entry.current?.view === nextView) return;
    if (!entry.current) {
      const active = document.activeElement;
      trigger.current = active instanceof HTMLElement && active !== document.body && !active.closest(".compact-main-menu")
        ? active : document.querySelector<HTMLElement>(".main-menu-trigger");
    }
    const next: Entry = {
      owner: owner.current, view: nextView,
      depth: (entry.current?.depth ?? 0) + 1,
      fromPet: entry.current?.view === "pet" && nextView === "journal",
    };
    history.pushState({ ...history.state, foodieCompanion: next }, "");
    entry.current = next;
    setView(nextView);
    setFromPet(next.fromPet);
  }, []);

  const close = useCallback(() => {
    const depth = entry.current?.depth ?? 0;
    entry.current = null;
    setView(null);
    setFromPet(false);
    if (depth) history.go(-depth);
  }, []);

  const back = useCallback(() => {
    if (entry.current?.fromPet) history.back();
    else close();
  }, [close]);

  return { view, fromPet, trigger, open, close, back };
}
