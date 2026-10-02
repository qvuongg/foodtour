import { useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PET_LEVELS, type PetLevel } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";
import { FoodiePet } from "./foodie-pet";

/** Browse earned appearances in the hero without changing the pet's saved level. */
export function FoodiePetLevels({ level, xp, petName, language, open, paused, reaction, onGreet }: {
  level: PetLevel;
  xp: number;
  petName: string;
  language: Language;
  open: boolean;
  paused: boolean;
  reaction: "hello" | "xp" | "level" | null;
  onGreet: () => void;
}) {
  const vi = language === "vi";
  const statusId = useId();
  const [viewedNumber, setViewedNumber] = useState(level.level);
  const number = Math.min(level.level, Math.max(1, viewedNumber));
  const viewed = PET_LEVELS[number - 1];
  const current = number === level.level;

  useEffect(() => { setViewedNumber(level.level); }, [open, level.level]);

  const move = (direction: -1 | 1) => {
    setViewedNumber((previous) => Math.min(level.level, Math.max(1, previous + direction)));
  };

  return <>
    <div className="pet-home-stage" data-level={number} role="group" aria-label={vi ? "Xem linh thú theo cấp" : "Browse pet levels"} onKeyDown={(event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    }}>
      <button type="button" className="pet-home-level-arrow pet-home-level-prev" aria-label={vi ? "Xem cấp thấp hơn" : "View previous level"} aria-disabled={number === 1} aria-describedby={statusId} onClick={() => move(-1)}>
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button type="button" className="pet-home-pet-touch" onClick={onGreet} aria-label={vi ? `Chào ${petName}` : `Say hello to ${petName}`}>
        <FoodiePet key={number} level={viewed} xp={current ? xp : viewed.minXp} isEating={reaction === "hello" || (current && reaction === "xp")} celebrating={current && reaction === "level"} size="lg" language={language} paused={paused} decorative />
      </button>
      <button type="button" className="pet-home-level-arrow pet-home-level-next" aria-label={vi ? "Xem cấp cao hơn đã mở" : "View next unlocked level"} aria-disabled={current} aria-describedby={statusId} onClick={() => move(1)}>
        <ChevronRight size={22} aria-hidden="true" />
      </button>
      {reaction === "hello" && <span className="pet-home-hello" aria-hidden="true">{vi ? "Măm măm!" : "Yum yum!"}</span>}
      <span className="pet-home-touch-hint">{vi ? "Chạm để chào bé" : "Tap to say hello"}</span>
    </div>
    <div className="pet-home-viewed-level" aria-live="polite" aria-atomic="true">
      <h2>{vi ? "Cấp" : "Level"} {number}<i aria-hidden="true">·</i>{vi ? viewed.nameVi : viewed.nameEn}</h2>
      <span className="pet-home-level-status" id={statusId}>{current
        ? vi ? "Cấp hiện tại" : "Current level"
        : vi ? `Xem lại · ${number}/${level.level}` : `Preview · ${number}/${level.level}`}</span>
    </div>
  </>;
}
