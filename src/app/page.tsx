import { AppHeader } from "@/components/app-header";
import { MealKindTabs } from "@/components/meal-kind-tabs";
import { SpinControls } from "@/components/spin-controls";
import { FoodImage } from "@/components/food-image";
import { FoodResultDialog } from "@/components/food-result-dialog";
import { FoodSpotlight, type SpotlightSpin } from "@/components/food-spotlight";
import { readCookie, writeCookie } from "@/lib/cookies";
import { createSpinProfile } from "@/lib/case-mechanics";
import type { Food } from "@/lib/foods";
import { copy, foodName, priceLabel, type Language } from "@/lib/i18n";
import { useLocalSpinCount } from "@/hooks/use-local-spin-count";
import { PreferencesPanel } from "@/components/preferences-panel";
import { usePreferences } from "@/hooks/use-preferences";
import { useMealSettings } from "@/hooks/use-meal-settings";
import { servingUnit } from "@/lib/meal-settings";
import { personalSelector } from "@/lib/personal-pool";
import { CaseAudio } from "@/lib/case-audio";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { type MealKind, getMealFoods } from "@/lib/food-categories";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const Card = memo(function Card({
  food,
  language,
  disabled,
  onSelect,
}: {
  food: Food;
  language: Language;
  disabled: boolean;
  onSelect: (food: Food, trigger: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      className="food-card small"
      data-food-id={food.image}
      disabled={disabled}
      aria-haspopup="dialog"
      aria-label={`${language === "vi" ? "Xem món" : "View dish"}: ${foodName(food, language)}`}
      onClick={(event) => onSelect(food, event.currentTarget)}
    >
      <FoodImage food={food} language={language} />
      <span className="card-copy">
        <strong>{foodName(food, language)}</strong>
        <span>{priceLabel(food.price, language, true)}</span>
      </span>
    </button>
  );
});

export default function Home() {
  const {
    count: localSpins,
    enabled: counterEnabled,
    recordSpin,
  } = useLocalSpinCount();
  const [language, setLanguage] = useState<Language>("vi");
  const preferences = usePreferences();
  const settings = useMealSettings(language);
  const { mealKind, mealConfig, budget, custom, vegetarianEnabled, sound } =
    settings;
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Food | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [spin, setSpin] = useState<SpotlightSpin | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [previewFood, setPreviewFood] = useState<Food | null>(null);
  const busy = useRef(false);
  const dialogTrigger = useRef<HTMLButtonElement | null>(null);
  const popupFood = previewFood ?? result;
  const selectFood = useCallback((food: Food, trigger: HTMLButtonElement) => {
    if (busy.current) return;
    dialogTrigger.current = trigger;
    setPreviewFood(food);
  }, []);
  function closeFoodDialog() {
    setPreviewFood(null);
    setRevealed(false);
  }
  useEffect(() => {
    let selected: Language = "vi";
    try {
      const saved = readCookie<string>("language");
      selected = saved === "en" || saved === "vi" ? saved : "vi";
    } catch {}
    setLanguage(selected);
    document.documentElement.lang = selected;
    document.title =
      selected === "en" ? "What should I eat for lunch?" : "Trưa nay ăn gì?";
  }, []);
  const changeLanguage = (next: Language) => {
    setLanguage(next);
    document.documentElement.lang = next;
    document.title =
      next === "en" ? "What should I eat for lunch?" : "Trưa nay ăn gì?";
    try {
      writeCookie("language", next);
    } catch {}
  };

  const handleSelectMealKind = (kind: MealKind) => {
    if (busy.current || kind === mealKind) return;
    setSpin(null);
    setRevealed(false);
    settings.selectMealKind(kind);
  };
  const target = budget === "custom" ? Number(custom) : Number(budget);
  const validTarget =
    Number.isInteger(target) &&
    target >= mealConfig.minPrice &&
    target <= mealConfig.maxPrice;
  const population = useMemo(
    () => getMealFoods(mealKind, preferences.profile),
    [mealKind, preferences.profile],
  );
  useEffect(() => {
    const last = readCookie<{ name?: unknown; price?: unknown; veg?: unknown }>(
      "last-choice",
    );
    const match =
      last && typeof last === "object"
        ? population.find(
            (f) =>
              f.name === last.name &&
              f.price === last.price &&
              !!f.veg === last.veg,
          )
        : null;
    setResult(match ?? null);
  }, [population]);
  const eligible = useMemo(
    () => population.filter((f) => !vegetarianEnabled || f.veg),
    [population, vegetarianEnabled],
  );
  const lunchSelector = useMemo(
    () =>
      personalSelector(
        eligible,
        validTarget ? target : Number(mealConfig.defaultBudget),
      ),
    [eligible, target, validTarget, mealConfig.defaultBudget],
  );
  const filteredMean = lunchSelector?.expectedPrice ?? 0;
  const audio = useRef<CaseAudio | null>(null);
  useEffect(() => {
    const engine = new CaseAudio(basePath);
    audio.current = engine;
    engine.preload();
    const hide = () => {
      if (document.hidden) engine.pause();
      else engine.recover();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      engine.dispose();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    audio.current?.setMuted(!sound);
  }, [sound]);
  const t = copy[language],
    vi = language === "vi";
  const inventoryCards = useMemo(
    () =>
      [...eligible]
        .sort(
          (a, b) =>
            a.rarity - b.rarity ||
            a.price - b.price ||
            foodName(a, language).localeCompare(
              foodName(b, language),
              language,
            ),
        )
        .map((food) => (
          <Card
            food={food}
            language={language}
            disabled={spinning}
            onSelect={selectFood}
            key={food.customId ?? food.image}
          />
        )),
    [eligible, language, spinning, selectFood],
  );
  function open() {
    if (busy.current || !validTarget || !eligible.length || !lunchSelector)
      return;
    busy.current = true;
    dialogTrigger.current =
      document.activeElement instanceof HTMLButtonElement
        ? document.activeElement
        : null;
    setPreviewFood(null);
    audio.current?.unlock();
    const winner = lunchSelector.choose(eligible);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const profile = createSpinProfile(Math.random, reducedMotion);
    const fillers = Array.from({ length: profile.tiles + 5 }, () =>
      lunchSelector.choose(eligible),
    );
    setSpinning(true);
    setRevealed(false);
    setResult(null);
    setSpin({ winner, fillers, profile, reducedMotion });
    audio.current?.play("csgo_ui_crate_open");
    if (sound && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  }
  function finishSpin(winner: Food) {
    recordSpin(winner);
    busy.current = false;
    setSpinning(false);
    setResult(winner);
    setRevealed(true);
    audio.current?.play(
      (
        [
          "item_reveal3_rare",
          "item_reveal4_mythical",
          "item_reveal5_legendary",
          "item_reveal6_ancient",
          "item_reveal6_ancient",
        ] as const
      )[winner.rarity],
    );
    if (sound && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([30, 40, 50]);
      } catch {}
    }
  }

  return (
    <div className="site-shell">
      {settings.error && (
        <div className="settings-notice" role="status">
          <p>{settings.error}</p>
          <button onClick={() => settings.applyBudget(budget, custom)}>
            {vi ? "Thử lại" : "Retry"}
          </button>
        </div>
      )}
      <AppHeader
        preferences={preferences}
        language={language}
        sound={sound}
        disabled={spinning}
        onLanguage={changeLanguage}
        onSound={settings.setSound}
        onOpenChange={setPanelOpen}
      />
      <main>
        <section
          className="pick-screen"
          aria-label={vi ? "Chọn món hôm nay" : "Pick something today"}
        >
          <div className="intro">
            <h1>
              {vi ? (
                <>
                  Đói rồi. <span>Chốt món thôi.</span>
                </>
              ) : (
                <>
                  Hungry? <span>Let’s pick something.</span>
                </>
              )}
            </h1>
            <p>
              {vi
                ? "Chọn nhóm, chỉnh gu. Để hôm nay có món hay."
                : "Choose a category and your budget. We’ll pick the dish."}
            </p>
          </div>
          <div className="desktop-tabs-wrapper">
            <MealKindTabs
              value={mealKind}
              language={language}
              disabled={spinning || !settings.ready}
              onChange={handleSelectMealKind}
              idPrefix="desktop"
            />
          </div>
          <section
            className="case-panel"
            id="meal-panel"
            role="tabpanel"
            aria-labelledby={`desktop-meal-tab-${mealKind}`}
          >
            <FoodSpotlight
              foods={eligible}
              language={language}
              mealKind={mealKind}
              spin={spin}
              spinning={spinning}
              won={revealed}
              suspended={panelOpen || previewFood !== null}
              onFinish={finishSpin}
              onTick={() => audio.current?.play("csgo_ui_crate_item_scroll")}
              onBrowse={() => setRevealed(false)}
              onClearFilter={() => settings.setVeg(false)}
            />
          </section>
          <SpinControls
            settings={settings}
            language={language}
            spinning={spinning}
            hasResult={!!result}
            empty={!eligible.length}
            onSpin={open}
            onOpenChange={setPanelOpen}
            categoryTabs={
              <MealKindTabs
                value={mealKind}
                language={language}
                disabled={spinning || !settings.ready}
                onChange={handleSelectMealKind}
                idPrefix="dock"
              />
            }
          />
          <a className="explore-link" href="#menu">
            {vi ? "Hoặc tự chọn món bên dưới" : "Or choose from the menu"}
            <ArrowDown size={14} />
          </a>
        </section>
        <FoodResultDialog
          food={popupFood}
          language={language}
          mealKind={mealKind}
          open={revealed || previewFood !== null}
          isPreview={previewFood !== null}
          triggerRef={dialogTrigger}
          onClose={closeFoodDialog}
        />

        <section className="inventory" id="menu" aria-labelledby="menu-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {vi ? "HỢP GU, TỰ CHỌN" : "YOUR TASTE, YOUR PICK"}
              </span>
              <h2 id="menu-title">
                {vi ? mealConfig.labelVi : mealConfig.labelEn}
                <span>{eligible.length}</span>
              </h2>
            </div>
            {mealKind === "lunch" && (
              <PreferencesPanel
                preferences={preferences}
                language={language}
                disabled={spinning}
                variant="inventory"
                onOpenChange={setPanelOpen}
              />
            )}
          </div>
          <p className="inventory-browse-note">
            {vi
              ? "Chạm món bạn thích để xem chi tiết và tìm quán. Giá tham khảo."
              : "Tap a dish for details and places to order. Prices are approximate."}
          </p>
          <div className="session-details">
            {counterEnabled && (
              <span>
                {vi ? "Đã quay" : "Spins"}: <strong>{localSpins ?? "—"}</strong>
                {vi ? " lần trên trình duyệt này" : " in this browser"}
              </span>
            )}
            {result && !spinning && (
              <span>
                {vi ? "Gần nhất: " : "Last pick: "}
                <strong>{foodName(result, language)}</strong>
              </span>
            )}
            {validTarget &&
              eligible.length > 0 &&
              (vegetarianEnabled || Math.abs(filteredMean - target) > 0.5) && (
                <span>
                  {vi
                    ? "Giá trung bình trong nhóm: "
                    : "Average in this pool: "}
                  {priceLabel(Math.round(filteredMean), language, true)} /{" "}
                  {servingUnit(mealKind, language)}
                </span>
              )}
          </div>
          {eligible.length ? (
            <div className="inventory-grid">{inventoryCards}</div>
          ) : (
            <div className="inventory-empty">
              <p>
                {vi
                  ? "Chưa có món phù hợp với bộ lọc."
                  : "No dishes match this filter."}
              </p>
              <button onClick={() => settings.setVeg(false)}>
                {vi ? "Xem tất cả món ăn trưa" : "Show all lunch dishes"}
              </button>
            </div>
          )}
        </section>
        <span className="sr-only" role="status">
          {spinning
            ? t.opening
            : result
              ? `${t.newItem}: ${foodName(result, language)}`
              : ""}
        </span>
        <footer>
          <span>
            Trưa Nay Ăn Gì ·{" "}
            <a href={`${basePath}/privacy.html`}>
              {language === "vi" ? "Quyền riêng tư" : "Privacy"}
            </a>{" "}
            ·{" "}
            <a href={`${basePath}/terms.html`}>
              {language === "vi" ? "Điều khoản" : "Terms"}
            </a>
          </span>
          <span className="footer-community">
            <a
              href="https://www.facebook.com/share/g/19S49GH46A/"
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/truanayangi-com/truanayangi"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </span>
          <span>
            {t.footer}{" "}
            <a
              href="https://github.com/sourcesounds/csgo"
              target="_blank"
              rel="noreferrer"
            >
              SourceSounds
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}
