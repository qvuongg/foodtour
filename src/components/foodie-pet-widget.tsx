import { useEffect, useRef, useState } from "react";
import { ChevronRight, Flame } from "lucide-react";
import { getFlameTier, type FoodieStreakState } from "@/lib/foodie-streak";
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
  const tier = getFlameTier(streak.score);
  const button = useRef<HTMLButtonElement>(null);
  const previousScore = useRef(streak.score);
  const [gain, setGain] = useState(0);
  const [visible, setVisible] = useState(true);
  const vi = language === "vi";

  useEffect(() => {
    const delta = streak.score - previousScore.current;
    previousScore.current = streak.score;
    if (delta <= 0) { setGain(0); return; }
    setGain(delta);
    const timer = window.setTimeout(() => setGain(0), 1100);
    return () => window.clearTimeout(timer);
  }, [streak.score]);

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
      className={`foodie-pet-widget tier-${tier.id}`}
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
      aria-label={vi ? `${streak.petName}: ${streak.score} điểm lửa. Mở linh thú và checklist ẩm thực` : `${streak.petName}: ${streak.score} fire points. Open foodie pet and checklist`}
    >
      <FoodiePet tier={tier} score={streak.score} size={placement === "header" ? "sm" : "md"} language={language} paused={paused || disabled || !visible} isEating={gain > 0} decorative />
      <span className="foodie-pet-score" aria-hidden="true">
        <Flame size={15} strokeWidth={2.1} />
        <strong>{new Intl.NumberFormat(vi ? "vi" : "en", { notation:streak.score >= 10000 ? "compact" : "standard", maximumFractionDigits:1 }).format(streak.score)}</strong>
        <span className="foodie-pet-score-unit">{vi ? "điểm" : "pts"}</span>
        <ChevronRight className="foodie-pet-chevron" size={12} />
      </span>
      {gain > 0 && <span key={streak.score} className="foodie-pet-gain" aria-hidden="true">+{gain}</span>}
    </button>
  );
}
