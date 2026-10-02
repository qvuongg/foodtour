import { useEffect, useRef, useState } from "react";
import { ChevronRight, Flame } from "lucide-react";
import { getPetLevel, type FoodieStreakState } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";
import { FoodiePet } from "./foodie-pet";
import "./foodie-pet-widget.css";

export function FoodiePetWidget({
  streak, onClick, language = "vi", placement = "floating", disabled = false,
  paused = false, expanded = false,
}: {
  streak: FoodieStreakState;
  onClick: () => void;
  language?: Language;
  placement?: "floating" | "header";
  disabled?: boolean;
  paused?: boolean;
  expanded?: boolean;
}) {
  const level = getPetLevel(streak.xp);
  const button = useRef<HTMLButtonElement>(null);
  const previousScore = useRef(streak.xp);
  const [gain, setGain] = useState(0);
  const [visible, setVisible] = useState(true);
  const vi = language === "vi";

  useEffect(() => {
    const delta = streak.xp - previousScore.current;
    previousScore.current = streak.xp;
    if (delta <= 0 || paused || disabled || !visible) { setGain(0); return; }
    setGain(delta);
    const timer = window.setTimeout(() => setGain(0), 1100);
    return () => window.clearTimeout(timer);
  }, [streak.xp, paused, disabled, visible]);

  useEffect(() => {
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    if (button.current) observer.observe(button.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return (
    <button
      ref={button}
      type="button"
      className={`foodie-pet-widget level-${level.level}`}
      data-placement={placement}
      disabled={disabled}
      onClick={(event) => {
        // Safari does not focus tapped buttons; remember this entry point before
        // the dialog takes focus so closing it can restore the same control.
        event.currentTarget.focus({ preventScroll: true });
        onClick();
      }}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-label={vi ? `${streak.petName}: cấp ${level.level}, ${streak.xp} XP. Mở linh thú của bạn` : `${streak.petName}: level ${level.level}, ${streak.xp} XP. Open your foodie pet`}
    >
      <FoodiePet level={level} xp={streak.xp} size={placement === "header" ? "sm" : "md"} language={language} paused={paused || disabled || !visible} isEating={gain > 0} decorative />
      <span className="foodie-pet-score" aria-hidden="true">
        <Flame size={15} strokeWidth={2.1} />
        <strong>{new Intl.NumberFormat(vi ? "vi" : "en", { notation: streak.xp >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(streak.xp)}</strong>
        <span className="foodie-pet-score-unit">XP</span>
        <ChevronRight className="foodie-pet-chevron" size={12} />
      </span>
      {gain > 0 && <span key={streak.xp} className="foodie-pet-gain" aria-hidden="true">+{gain} XP</span>}
    </button>
  );
}
