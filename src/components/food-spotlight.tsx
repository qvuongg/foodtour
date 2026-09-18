import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Leaf,
  Utensils,
  Check,
  Pause,
  Play,
} from "lucide-react";
import type { Food } from "@/lib/foods";
import { foodName, foodSubtitle, priceLabel, type Language } from "@/lib/i18n";
import { spotlightProgress } from "@/lib/spotlight-motion";
import { FoodImage } from "./food-image";

export type SpotlightSpin = {
  winner: Food;
  fillers: Food[];
  profile: { durationMs: number; tiles: number; friction: number };
  reducedMotion: boolean;
};
export function FoodSpotlight({
  foods,
  language,
  spin,
  spinning,
  won,
  onFinish,
  onTick,
  onBrowse,
}: {
  foods: Food[];
  language: Language;
  spin: SpotlightSpin | null;
  spinning: boolean;
  won: boolean;
  onFinish: (food: Food) => void;
  onTick: () => void;
  onBrowse: () => void;
}) {
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const positionRef = useRef(0);
  const sequence = useRef(new Map<number, Food>());
  const callbacks = useRef({ onFinish, onTick, onBrowse });
  callbacks.current = { onFinish, onTick, onBrowse };
  const vi = language === "vi";
  const at = (slot: number) =>
    sequence.current.get(slot) ??
    foods[((slot % foods.length) + foods.length) % foods.length];
  // A changed pool invalidates presentation cards, never the saved result.
  useEffect(() => {
    sequence.current.clear();
    callbacks.current.onBrowse();
    positionRef.current = 0;
    setPosition(0);
  }, [foods]);
  useEffect(() => {
    if (!spin) return;
    const start = positionRef.current,
      anchor = Math.round(start),
      end = anchor + spin.profile.tiles;
    const next = new Map<number, Food>();
    for (let slot = anchor - 4; slot <= anchor + 4; slot++)
      next.set(slot, at(slot));
    for (let slot = anchor + 5; slot <= end + 4; slot++)
      next.set(slot, spin.fillers[slot - anchor] ?? spin.winner);
    next.set(end, spin.winner);
    sequence.current = next;
    let frame = 0,
      started: number | undefined,
      lastCell = start;
    const animate = (now: number) => {
      started ??= now;
      const progress = Math.min(1, (now - started) / spin.profile.durationMs);
      // Reduced motion keeps the same anticipation time without sweeping cards.
      const value = spin.reducedMotion
        ? progress < 1
          ? start
          : end
        : start + (end - start) * spotlightProgress(progress);
      positionRef.current = value;
      setPosition(value);
      const cell = Math.round(value);
      if (cell !== lastCell && !spin.reducedMotion) {
        callbacks.current.onTick();
        lastCell = cell;
      }
      if (progress < 1) frame = requestAnimationFrame(animate);
      else callbacks.current.onFinish(spin.winner);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // The immutable spin request owns this animation; callback identity must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin]);
  // Decorative drift never selects a winner, plays audio or writes cookies.
  useEffect(() => {
    if (spinning || won || paused || hovered || focused || foods.length < 2)
      return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last: number | undefined;
    const animate = (now: number) => {
      if (!document.hidden && !media.matches) {
        if (last !== undefined) {
          positionRef.current += Math.min(now - last, 50) / 6500;
          setPosition(positionRef.current);
        }
        last = now;
      } else last = undefined;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [spinning, won, paused, hovered, focused, foods]);
  if (!foods.length)
    return (
      <div className="spotlight-empty">
        <Utensils size={36} />
        <h2>{vi ? "Chưa có món phù hợp" : "No dishes to show"}</h2>
        <p>
          {vi
            ? "Tắt bộ lọc chay hoặc thêm món trong “Món của tôi”."
            : "Turn off the vegetarian filter or add a dish in “My dishes”."}
        </p>
      </div>
    );
  const center = Math.round(position),
    selected = at(center);
  const move = (direction: number) => {
    if (spinning) return;
    onBrowse();
    const next = Math.round(positionRef.current) + direction;
    positionRef.current = next;
    setPosition(next);
  };
  return (
    <div
      className={`food-spotlight ${spinning ? "spotlight-spinning" : !won ? "spotlight-idle" : ""} ${won ? "spotlight-won" : ""} ${spin?.reducedMotion && spinning ? "spotlight-reduced" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(false);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={vi ? "Khám phá món ăn" : "Explore dishes"}
      aria-busy={spinning}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className="spotlight-cards">
        {Array.from({ length: 7 }, (_, i) => Math.floor(position) + i - 3).map(
          (slot) => {
            const food = at(slot),
              offset = slot - position,
              distance = Math.abs(offset),
              featured = slot === center;
            return (
              <article
                key={slot}
                data-food-name={food.name}
                className={`spotlight-card ${featured ? "featured" : ""}`}
                style={
                  {
                    "--offset": offset,
                    "--distance": Math.min(distance, 3),
                    zIndex: 10 - Math.round(distance * 2),
                  } as React.CSSProperties
                }
                aria-hidden={spinning || !featured}
              >
                <div className="spotlight-photo">
                  <FoodImage food={food} language={language} />
                  {featured && won && !spinning && (
                    <span className="spotlight-sticker">
                      {won ? (
                        <>
                          <Check size={12} />
                          {vi ? "CHỐT MÓN NÀY" : "THE WINNER"}
                        </>
                      ) : (
                        <>
                          {vi ? "ĐÁNG THỬ" : "TRY THIS"}
                          <span>↗</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="spotlight-copy">
                  <span className="dish-category">
                    {food.veg && <Leaf size={12} />}{" "}
                    {foodSubtitle(food, language)}
                  </span>
                  <h2>{foodName(food, language)}</h2>
                  <span className="spotlight-price">
                    {priceLabel(food.price, language, true)}{" "}
                    <small>/ {vi ? "người" : "person"}</small>
                  </span>
                </div>
              </article>
            );
          },
        )}
      </div>
      <div className="browse-controls">
        <button
          onClick={() => move(-1)}
          disabled={spinning || foods.length < 2}
          aria-label={vi ? "Xem món trước" : "Previous dish"}
        >
          <ArrowLeft size={18} />
        </button>
        <span
          className="browse-caption"
          aria-live={spinning ? "polite" : "off"}
        >
          {spinning ? (
            <span className="spinning-caption">
              <span className="status-dot" />
              {vi ? "Đang tìm món hợp gu…" : "Finding your next favorite…"}
            </span>
          ) : won ? (
            <strong>
              {vi ? "Chốt rồi. Ăn ngon nhé!" : "Picked. Enjoy your lunch!"}
            </strong>
          ) : (
            <>
              <strong>
                {String(
                  foods.findIndex(
                    (f) =>
                      (f.customId ?? f.image) ===
                      (selected.customId ?? selected.image),
                  ) + 1,
                ).padStart(2, "0")}
              </strong>
              <span>/ {foods.length}</span>
              <span className="browse-hint">
                {vi ? "Lướt xem món" : "Browse dishes"}
              </span>
            </>
          )}
        </span>
        <button
          onClick={() => move(1)}
          disabled={spinning || foods.length < 2}
          aria-label={vi ? "Xem món tiếp" : "Next dish"}
        >
          <ArrowRight size={18} />
        </button>
        {!spinning && !won && (
          <button
            className="drift-toggle"
            onClick={() => setPaused(!paused)}
            aria-label={
              paused
                ? vi
                  ? "Tiếp tục trôi chậm"
                  : "Resume slow movement"
                : vi
                  ? "Tạm dừng trôi chậm"
                  : "Pause slow movement"
            }
            aria-pressed={paused}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        )}
      </div>
      <span
        className="sr-only"
        aria-live={focused ? "polite" : "off"}
        aria-atomic="true"
      >
        {!spinning
          ? `${foodName(selected, language)}, ${priceLabel(selected.price, language, true)}`
          : ""}
      </span>
    </div>
  );
}
