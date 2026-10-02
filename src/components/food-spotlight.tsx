import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Leaf,
  Store,
  Utensils,
  Check,
  Pause,
  Play,
} from "lucide-react";
import type { Food } from "@/lib/foods";
import type { RestaurantRouletteItem } from "@/lib/restaurant-roulette";
import { foodName, priceLabel, type Language } from "@/lib/i18n";
import { spotlightProgress } from "@/lib/spotlight-motion";
import { FoodImage } from "./food-image";
import { getMealConfig, type MealKind } from "@/lib/food-categories";
import { foodServingUnit } from "@/lib/meal-settings";

export type SpotlightSpin = {
  winner: Food;
  fillers: Food[];
  profile: { durationMs: number; tiles: number; friction: number };
  reducedMotion: boolean;
};

export type RestaurantSpotlightSpin = {
  winner: RestaurantRouletteItem;
  fillers: RestaurantRouletteItem[];
  profile: { durationMs: number; tiles: number; friction: number };
  reducedMotion: boolean;
};

export function FoodSpotlight({
  foods,
  restaurants = [],
  mode = "dish",
  language,
  mealKind,
  spin,
  restaurantSpin,
  spinning,
  won,
  suspended,
  onClearFilter,
  onFinish,
  onFinishRestaurant,
  onTick,
  onBrowse,
}: {
  foods: Food[];
  restaurants?: RestaurantRouletteItem[];
  mode?: "dish" | "restaurant";
  language: Language;
  mealKind: MealKind;
  spin: SpotlightSpin | null;
  restaurantSpin?: RestaurantSpotlightSpin | null;
  spinning: boolean;
  won: boolean;
  suspended: boolean;
  onClearFilter: () => void;
  onFinish: (food: Food) => void;
  onFinishRestaurant?: (restaurant: RestaurantRouletteItem) => void;
  onTick: () => void;
  onBrowse: () => void;
}) {
  const isRestaurant = mode === "restaurant";
  const items: (Food | RestaurantRouletteItem)[] = isRestaurant ? restaurants : foods;
  const currentSpin = isRestaurant ? restaurantSpin : spin;

  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const positionRef = useRef(0);
  const drag = useRef<{ id: number; x: number; at: number } | null>(null);
  const velocity = useRef(0);
  const [dragging, setDragging] = useState(false);
  const sequence = useRef(new Map<number, Food | RestaurantRouletteItem>());
  const callbacks = useRef({ onFinish, onFinishRestaurant, onTick, onBrowse });
  callbacks.current = { onFinish, onFinishRestaurant, onTick, onBrowse };
  const vi = language === "vi";
  const at = (slot: number): Food | RestaurantRouletteItem =>
    sequence.current.get(slot) ??
    items[((slot % items.length) + items.length) % items.length];
  // A changed pool invalidates presentation cards, never the saved result.
  useEffect(() => {
    velocity.current = 0;
    sequence.current.clear();
    callbacks.current.onBrowse();
    positionRef.current = 0;
    setPosition(0);
  }, [items]);
  useEffect(() => {
    if (!currentSpin) return;
    velocity.current = 0;
    const start = positionRef.current,
      anchor = Math.round(start),
      end = anchor + currentSpin.profile.tiles;
    const next = new Map<number, Food | RestaurantRouletteItem>();
    for (let slot = anchor - 4; slot <= anchor + 4; slot++)
      next.set(slot, at(slot));
    for (let slot = anchor + 5; slot <= end + 4; slot++)
      next.set(slot, (currentSpin.fillers as (Food | RestaurantRouletteItem)[])[slot - anchor] ?? currentSpin.winner);
    next.set(end, currentSpin.winner);
    sequence.current = next;
    let frame = 0,
      started: number | undefined,
      lastCell = start;
    const animate = (now: number) => {
      started ??= now;
      const progress = Math.min(1, (now - started) / currentSpin.profile.durationMs);
      // Reduced motion keeps the same anticipation time without sweeping cards.
      const value = currentSpin.reducedMotion
        ? progress < 1
          ? start
          : end
        : start + (end - start) * spotlightProgress(progress);
      positionRef.current = value;
      setPosition(value);
      const cell = Math.round(value);
      if (cell !== lastCell && !currentSpin.reducedMotion) {
        callbacks.current.onTick();
        lastCell = cell;
      }
      if (progress < 1) frame = requestAnimationFrame(animate);
      else {
        if (isRestaurant && callbacks.current.onFinishRestaurant) {
          callbacks.current.onFinishRestaurant(currentSpin.winner as RestaurantRouletteItem);
        } else {
          callbacks.current.onFinish(currentSpin.winner as Food);
        }
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // The immutable spin request owns this animation; callback identity must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpin]);
  // Decorative drift never selects a winner, plays audio or writes cookies.
  useEffect(() => {
    if (
      spinning ||
      won ||
      suspended ||
      paused ||
      dragging ||
      focused ||
      items.length < 2
    )
      return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last: number | undefined;
    const animate = (now: number) => {
      if (!document.hidden && !media.matches) {
        if (last !== undefined) {
          const dt = Math.min(now - last, 50);
          const momentum = velocity.current;
          positionRef.current += momentum * dt + (hovered ? 0 : dt / 8500);
          velocity.current *= Math.exp(-dt / 240);
          if (Math.abs(velocity.current) < 0.00001) velocity.current = 0;
          if (momentum || !hovered) setPosition(positionRef.current);
        }
        last = now;
      } else last = undefined;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [spinning, won, suspended, paused, hovered, focused, dragging, items]);
  if (!items.length)
    return (
      <div className="spotlight-empty">
        {isRestaurant ? <Store size={36} /> : <Utensils size={36} />}
        <h2>
          {isRestaurant
            ? vi
              ? "Chưa tìm thấy quán phù hợp"
              : "No spots found"
            : vi
              ? "Chưa có món phù hợp"
              : "No dishes to show"}
        </h2>
        <p>
          {isRestaurant
            ? vi
              ? "Thử đổi thành phố hoặc chọn nhóm món khác nhé."
              : "Try switching city or another category."
            : vi
              ? "Tắt bộ lọc chay hoặc thêm món trong “Món của tôi”."
              : "Turn off the vegetarian filter or add a dish in “My dishes”."}
        </p>
        {!isRestaurant && (
          <button onClick={onClearFilter}>
            {vi ? "Xem tất cả món ăn trưa" : "Show all lunch dishes"}
          </button>
        )}
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
      className={`food-spotlight mirror-hall ${paused || won ? "mirror-paused" : ""} ${dragging ? "is-dragging" : ""} ${spinning ? "spotlight-spinning" : !won ? "spotlight-idle" : ""} ${won ? "spotlight-won" : ""} ${spin?.reducedMotion && spinning ? "spotlight-reduced" : ""}`}
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
      <div
        className="spotlight-cards"
        onPointerDown={(event) => {
          if (spinning || won || foods.length < 2 || event.button !== 0) return;
          velocity.current = 0;
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            at: event.timeStamp,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const previous = drag.current;
          if (!previous || previous.id !== event.pointerId) return;
          const card = event.currentTarget.querySelector(".spotlight-card");
          if (!card) return;
          const pitch =
            parseFloat(getComputedStyle(card).width) +
            parseFloat(
              getComputedStyle(event.currentTarget).getPropertyValue(
                "--hall-gap",
              ),
            );
          if (!Number.isFinite(pitch) || pitch <= 0) return;
          const delta = (previous.x - event.clientX) / pitch;
          const dt = Math.max(1, event.timeStamp - previous.at);
          velocity.current = Math.max(-0.008, Math.min(0.008, delta / dt));
          positionRef.current += delta;
          setPosition(positionRef.current);
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            at: event.timeStamp,
          };
        }}
        onPointerUp={(event) => {
          if (drag.current?.id !== event.pointerId) return;
          if (event.timeStamp - drag.current.at > 100) velocity.current = 0;
          drag.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          velocity.current = 0;
          setDragging(false);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div className="mirror-floor" aria-hidden="true" />
        {Array.from({ length: 7 }, (_, i) => Math.floor(position) + i - 3).map(
          (slot) => {
            const item = at(slot),
              offset = slot - position,
              distance = Math.abs(offset),
              featured = slot === center;
            const restaurant = isRestaurant ? (item as RestaurantRouletteItem) : null;
            const food = !isRestaurant ? (item as Food) : null;
            return (
              <article
                key={slot}
                data-food-name={food?.name}
                data-restaurant-name={restaurant?.name}
                className={`spotlight-card ${featured ? "featured" : ""}`}
                style={
                  {
                    "--offset": offset,
                    "--distance": Math.min(distance, 3),
                    "--hall-x": Math.sin(offset * 0.32) / 0.32,
                    "--hall-depth": (1 - Math.cos(offset * 0.32)) / 0.32,
                    "--hall-angle": `${(-offset * 0.32 * 180) / Math.PI}deg`,
                    zIndex: 10 + Math.round(distance * 2),
                  } as React.CSSProperties
                }
                aria-hidden={spinning || !featured}
              >
                {restaurant ? (
                  <>
                    <div className="spotlight-restaurant-card">
                      <div className="spotlight-restaurant-icon-badge">
                        <Store size={22} aria-hidden="true" />
                      </div>
                      <h2 className="spotlight-restaurant-name">
                        {restaurant.name}
                      </h2>
                      <div className="spotlight-restaurant-chips">
                        {(restaurant.specialties || []).slice(0, 2).map((s, idx) => (
                          <span key={idx} className="spotlight-specialty-chip">
                            {s}
                          </span>
                        ))}
                      </div>
                      {featured && won && !spinning && (
                        <span className="spotlight-sticker">
                          <Check size={12} />
                          {vi ? "CHỐT QUÁN NÀY" : "THE WINNER"}
                        </span>
                      )}
                    </div>
                    <div className="mirror-reflection is-restaurant" aria-hidden="true" />
                  </>
                ) : food ? (
                  <>
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
                        {vi
                          ? getMealConfig(mealKind).labelVi
                          : getMealConfig(mealKind).labelEn}
                      </span>
                      <h2>{foodName(food, language)}</h2>
                      <span className="spotlight-price">
                        {priceLabel(food.price, language, true)}{" "}
                        <small>/ {foodServingUnit(food, mealKind, language)}</small>
                      </span>
                    </div>
                    <div className="mirror-reflection" aria-hidden="true">
                      <FoodImage food={food} language={language} />
                    </div>
                  </>
                ) : null}
              </article>
            );
          },
        )}
      </div>
      <div className="browse-controls">
        <button
          onClick={() => move(-1)}
          disabled={spinning || items.length < 2}
          aria-label={vi ? (isRestaurant ? "Xem quán trước" : "Xem món trước") : (isRestaurant ? "Previous spot" : "Previous dish")}
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
              {vi
                ? isRestaurant
                  ? "Đang tìm quán ngon…"
                  : "Đang tìm món hợp gu…"
                : isRestaurant
                  ? "Finding top spots…"
                  : "Finding your next favorite…"}
            </span>
          ) : won ? (
            <strong>
              {vi
                ? isRestaurant
                  ? "Chốt quán rồi. Ăn ngon nhé!"
                  : "Chốt rồi. Ăn ngon nhé!"
                : "Picked. Enjoy your meal!"}
            </strong>
          ) : (
            <>
              <strong>
                {String(
                  (isRestaurant
                    ? (restaurants ?? []).findIndex(
                        (r) => r.id === (selected as RestaurantRouletteItem)?.id,
                      )
                    : foods.findIndex(
                        (f) =>
                          (f.customId ?? f.image) ===
                          ((selected as Food)?.customId ?? (selected as Food)?.image),
                      )) + 1,
                ).padStart(2, "0")}
              </strong>
              <span>/ {items.length}</span>
              <span className="browse-hint">
                {vi
                  ? isRestaurant
                    ? "Lướt xem quán"
                    : "Lướt xem món"
                  : isRestaurant
                    ? "Browse spots"
                    : "Browse dishes"}
              </span>
            </>
          )}
        </span>
        <button
          onClick={() => move(1)}
          disabled={spinning || items.length < 2}
          aria-label={vi ? (isRestaurant ? "Xem quán tiếp" : "Xem món tiếp") : (isRestaurant ? "Next spot" : "Next dish")}
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
          ? isRestaurant
            ? (selected as RestaurantRouletteItem)?.name
            : `${foodName(selected as Food, language)}, ${priceLabel((selected as Food)?.price, language, true)}`
          : ""}
      </span>
    </div>
  );
}
