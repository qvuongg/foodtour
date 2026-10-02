import { AppHeader } from "@/components/app-header";
import { MealKindTabs } from "@/components/meal-kind-tabs";
import { SpinControls } from "@/components/spin-controls";
import { FoodImage } from "@/components/food-image";
import { FoodResultDialog } from "@/components/food-result-dialog";
import { RestaurantResultDialog } from "@/components/restaurant-result-dialog";
import { SpinModeSwitcher, type SpinMode } from "@/components/spin-mode-switcher";
import { BrandCarousel } from "@/components/brand-carousel";
import { FoodSpotlight, type SpotlightSpin, type RestaurantSpotlightSpin } from "@/components/food-spotlight";
import { SettingsDialog } from "@/components/settings-dialog";
import { MainMenuDrawer } from "@/components/main-menu-drawer";
import { FoodiePetWidget } from "@/components/foodie-pet-widget";
import { FoodiePetModal } from "@/components/foodie-pet-modal";
import { useFoodieProgress } from "@/hooks/use-foodie-progress";
import { useCompanionNavigation } from "@/hooks/use-companion-navigation";
import { useUserLocation } from "@/hooks/use-user-location";
import { getEligibleRestaurants, type RestaurantRouletteItem } from "@/lib/restaurant-roulette";
import { haversineDistanceKm } from "@/lib/geo-distance";
import { hasRestaurantRewardToday } from "@/lib/foodie-streak";
import { SHOPEE_RESTAURANT_OPEN_EVENT } from "@/lib/shopee-reward";
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
import { Compass } from "lucide-react";
import { type MealKind, getMealFoods } from "@/lib/food-categories";
import {
  detectCurrentMealSession,
  getFoodsForSessionAndTaste,
  filterFoodsByTastes,
  MEAL_SESSIONS,
  type MealSession,
} from "@/lib/dish-taxonomy";

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

  // Audio volume state (default 35% gentle volume, draggable 0 - 100)
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = readCookie<number>("foodtour_volume");
      if (typeof saved === "number" && saved >= 0 && saved <= 100) {
        return saved;
      }
    } catch {}
    return 35;
  });

  // Tự động nhận diện buổi ăn theo khung giờ thực tế:
  // Ăn sáng (06:01 - 10:00) | Ăn trưa (10:01 - 14:00) | Ăn xế (14:01 - 17:00) | Ăn tối (17:01 - 23:00) | Ăn đêm (23:01 - 06:00)
  const [session, setSession] = useState<MealSession>(() =>
    detectCurrentMealSession(),
  );

  // Tự động cập nhật phiên ăn theo thời gian thực mỗi 30 giây
  useEffect(() => {
    const timer = setInterval(() => {
      const nextSession = detectCurrentMealSession();
      setSession((curr) => (curr !== nextSession ? nextSession : curr));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Bộ lọc Gu món đa chọn (multi-select) hỗ trợ tất cả 4 nhóm món
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);

  const foodie = useFoodieProgress();
  const streak = foodie.state;
  const companion = useCompanionNavigation();
  const petOpen = companion.view === "pet";

  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const preferencesReturnFocus = useRef<HTMLElement | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Food | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [spin, setSpin] = useState<SpotlightSpin | null>(null);
  const [spinMode, setSpinMode] = useState<SpinMode>("dish");
  const { coords: userCoords, city: activeCity, requestLocation } = useUserLocation();
  const [restaurantResult, setRestaurantResult] = useState<RestaurantRouletteItem | null>(null);
  const [restaurantRevealed, setRestaurantRevealed] = useState(false);
  const [restaurantSpin, setRestaurantSpin] = useState<RestaurantSpotlightSpin | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [previewFood, setPreviewFood] = useState<Food | null>(null);
  const [lastPickedFood, setLastPickedFood] = useState<Food | null>(null);
  const busy = useRef(false);
  const activeSpinId = useRef<string | null>(null);
  const dialogTrigger = useRef<HTMLButtonElement | null>(null);
  const popupFood = previewFood ?? result;

  useEffect(() => {
    const openedRestaurant = (event: Event) => {
      const url = (event as CustomEvent<{ url?: unknown }>).detail?.url;
      if (typeof url === "string") void foodie.openRestaurant(url);
    };
    window.addEventListener(SHOPEE_RESTAURANT_OPEN_EVENT, openedRestaurant);
    return () => window.removeEventListener(SHOPEE_RESTAURANT_OPEN_EVENT, openedRestaurant);
  }, [foodie.openRestaurant]);

  function openCompanion(view: "pet") {
    if (busy.current) return;
    setMainMenuOpen(false);
    setSettingsOpen(false);
    setPreferencesOpen(false);
    companion.open(view);
  }

  function spinFromPet() {
    companion.trigger.current = document.querySelector<HTMLButtonElement>(".open-button");
    companion.close();
    requestAnimationFrame(() => {
      const button = document.querySelector<HTMLButtonElement>(".open-button");
      button?.focus({ preventScroll: true });
      button?.click();
    });
  }

  function openOrderingFromPet() {
    const food = lastPickedFood ?? result;
    if (!food) return;
    const trigger = document.querySelector<HTMLButtonElement>(".open-button");
    companion.trigger.current = trigger;
    dialogTrigger.current = trigger;
    companion.close();
    requestAnimationFrame(() => setPreviewFood(food));
  }

  const selectFood = useCallback((food: Food, trigger: HTMLButtonElement) => {
    if (busy.current) return;
    setLastPickedFood(food);
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
      selected === "en" ? "Quay Com.online — What to eat today?" : "Quay Cơm.online";
  }, []);

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    document.documentElement.lang = next;
    document.title =
      next === "en" ? "Quay Com.online — What to eat today?" : "Quay Cơm.online";
    try {
      writeCookie("language", next);
    } catch {}
  };

  const handleSelectMealKind = (kind: MealKind) => {
    if (busy.current || kind === mealKind) return;
    setSpin(null);
    setRestaurantSpin(null);
    setRevealed(false);
    setRestaurantRevealed(false);
    setSelectedTastes([]);
    settings.selectMealKind(kind);
  };

  const handleSpinModeChange = (nextMode: SpinMode) => {
    if (busy.current || nextMode === spinMode) return;
    setSpin(null);
    setRestaurantSpin(null);
    setRevealed(false);
    setRestaurantRevealed(false);
    setSpinMode(nextMode);
    if (nextMode === "restaurant") {
      requestLocation();
    }
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

  // Lọc món ăn: nếu là nhóm bữa chính (lunch) thì áp dụng Buổi ăn thực tế và Gu món đa chọn
  const eligible = useMemo(() => {
    if (mealKind === "lunch") {
      return getFoodsForSessionAndTaste(session, selectedTastes, population);
    }
    return filterFoodsByTastes(population, selectedTastes, mealKind);
  }, [mealKind, session, selectedTastes, population]);

  // Quán ăn đủ điều kiện theo thành phố, danh mục, và bán kính GPS 3km (chất lượng >= 100 đánh giá)
  const eligibleRestaurants = useMemo(
    () =>
      getEligibleRestaurants({
        city: activeCity,
        category: mealKind,
        userCoords,
        maxRadiusKm: 3.0,
      }),
    [activeCity, mealKind, userCoords],
  );

  const restaurantDistanceKm = useMemo(() => {
    if (!restaurantResult || !userCoords) return null;
    return haversineDistanceKm(
      userCoords.lat,
      userCoords.lng,
      restaurantResult.lat,
      restaurantResult.lng,
    );
  }, [restaurantResult, userCoords]);

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
    engine.setVolume(volume);

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

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    audio.current?.setVolume(nextVol);
    settings.setSound(nextVol > 0);
    try {
      writeCookie("foodtour_volume", nextVol);
    } catch {}
  };

  useEffect(() => {
    if (!sound) {
      audio.current?.setMuted(true);
    } else {
      audio.current?.setVolume(volume);
    }
  }, [sound, volume]);

  const t = copy[language],
    vi = language === "vi";

  const currentSessionConfig =
    MEAL_SESSIONS.find((s) => s.id === session) || MEAL_SESSIONS[1];

  const currentSessionHeading = useMemo(() => {
    if (mealKind === "lunch") {
      return vi ? currentSessionConfig.labelVi : currentSessionConfig.labelEn;
    }
    return vi ? mealConfig.labelVi : mealConfig.labelEn;
  }, [mealKind, vi, currentSessionConfig, mealConfig]);

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
    if (busy.current) return;

    if (spinMode === "restaurant") {
      if (!eligibleRestaurants.length) return;
      busy.current = true;
      activeSpinId.current = crypto.randomUUID();
      dialogTrigger.current =
        document.activeElement instanceof HTMLButtonElement
          ? document.activeElement
          : null;
      audio.current?.unlock();
      const winner =
        eligibleRestaurants[
          Math.floor(Math.random() * eligibleRestaurants.length)
        ];
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const profile = createSpinProfile(Math.random, reducedMotion);
      const fillers = Array.from({ length: profile.tiles + 5 }, () =>
        eligibleRestaurants[
          Math.floor(Math.random() * eligibleRestaurants.length)
        ],
      );
      setSpinning(true);
      setRestaurantRevealed(false);
      setRestaurantResult(null);
      setRestaurantSpin({ winner, fillers, profile, reducedMotion });
      audio.current?.play("csgo_ui_crate_open");
      if (sound && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(15);
        } catch {}
      }
      return;
    }

    if (!validTarget || !eligible.length || !lunchSelector)
      return;
    busy.current = true;
    activeSpinId.current = crypto.randomUUID();
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
    const spinId = activeSpinId.current;
    if (!spinId) return;
    activeSpinId.current = null;
    setLastPickedFood(winner);
    recordSpin(winner);
    void foodie.completeSpin(spinId);
    busy.current = false;
    setSpin(null);
    setSpinning(false);
    setResult(winner);
    setRevealed(true);
    writeCookie("last-choice", {
      name: winner.name,
      price: winner.price,
      veg: winner.veg,
    });
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

  function finishRestaurantSpin(winner: RestaurantRouletteItem) {
    const spinId = activeSpinId.current;
    if (!spinId) return;
    activeSpinId.current = null;
    void foodie.completeSpin(spinId);
    busy.current = false;
    setRestaurantSpin(null);
    setSpinning(false);
    setRestaurantResult(winner);
    setRestaurantRevealed(true);
    audio.current?.play("item_reveal5_legendary");
    if (sound && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([30, 40, 50]);
      } catch {}
    }
  }

  return (
    <div className={`site-frame${mainMenuOpen ? " menu-is-open" : ""}`}>
    <div className="site-shell">
      {settings.error && (
        <div className="settings-notice" role="status">
          <p>{settings.error}</p>
          <button onClick={() => settings.applyBudget(budget, custom)}>
            {vi ? "Thử lại" : "Retry"}
          </button>
        </div>
      )}

      {foodie.storageError && !companion.view && (
        <div className="settings-notice" role="status">
          <p>{vi ? "Tiến độ linh thú chưa được lưu trên thiết bị này." : "Your pet progress has not been saved on this device."}</p>
          <button onClick={() => { void foodie.retrySave(); }}>{vi ? "Thử lưu lại" : "Retry saving"}</button>
        </div>
      )}

      {/* Keep utility controls separate from the meal selection flow. */}
      <AppHeader
        language={language}
        disabled={spinning}
        onOpenMenu={() => setMainMenuOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        menuOpen={mainMenuOpen}
        settingsOpen={settingsOpen}
        menuTrigger={menuTrigger}
        settingsTrigger={settingsTrigger}
        streak={streak}
        onOpenPet={() => openCompanion("pet")}
        petOpen={petOpen}
        petPaused={
          mainMenuOpen ||
          settingsOpen ||
          preferencesOpen ||
          panelOpen ||
          revealed ||
          previewFood !== null ||
          restaurantRevealed
        }
      />

      <MainMenuDrawer
        open={mainMenuOpen}
        onClose={() => setMainMenuOpen(false)}
        language={language}
        state={streak}
        onSetChecked={foodie.setChecked}
        storageError={foodie.storageError}
        onRetrySave={foodie.retrySave}
        finalFocus={menuTrigger}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        language={language}
        onLanguageChange={changeLanguage}
        finalFocus={settingsTrigger}
        onOpenPreferences={() => {
          preferencesReturnFocus.current = settingsTrigger.current;
          requestAnimationFrame(() => setPreferencesOpen(true));
        }}
        onOpenPet={() => {
          requestAnimationFrame(() => {
            openCompanion("pet");
            companion.trigger.current = settingsTrigger.current;
          });
        }}
      />

      <FoodiePetModal
        open={petOpen}
        onClose={companion.close}
        language={language}
        state={streak}
        onRename={foodie.rename}
        onSpin={spinFromPet}
        onOpenOrdering={openOrderingFromPet}
        orderingAvailable={Boolean(lastPickedFood ?? result)}
        storageError={foodie.storageError}
        onRetrySave={foodie.retrySave}
        finalFocus={companion.trigger}
        spinDisabled={
          spinning ||
          (spinMode === "restaurant"
            ? !eligibleRestaurants.length
            : !validTarget || !eligible.length) ||
          !settings.ready
        }
      />


      <main>
        <section
          className="pick-screen"
          aria-label={vi ? "Chọn món hôm nay" : "Pick something today"}
        >
          <div className="intro">
            <h1>
              {vi ? (
                spinMode === "restaurant" ? (
                  <>
                    Đói rồi. <span>Chọn quán thôi.</span>
                  </>
                ) : (
                  <>
                    Đói rồi. <span>Chốt món thôi.</span>
                  </>
                )
              ) : spinMode === "restaurant" ? (
                <>
                  Hungry? <span>Pick a spot.</span>
                </>
              ) : (
                <>
                  Hungry? <span>Let’s pick something.</span>
                </>
              )}
            </h1>
            <p>
              {vi
                ? "Khám phá hơn 340+ món ngon chuẩn vị & hàng trăm quán đỉnh tuyển chọn khắp Việt Nam."
                : "Curated catalog of 340+ iconic dishes & hundreds of top-rated spots across Vietnam."}
            </p>
          </div>

          <div className="pick-screen-nav">
            <SpinModeSwitcher
              mode={spinMode}
              onChange={handleSpinModeChange}
              language={language}
              disabled={spinning}
            />
            <div className="desktop-tabs-wrapper">
              <MealKindTabs
                value={mealKind}
                language={language}
                disabled={spinning || !settings.ready}
                onChange={handleSelectMealKind}
                idPrefix="desktop"
                sessionLabel={vi ? currentSessionConfig.labelVi : currentSessionConfig.labelEn}
                sessionTimeRange={currentSessionConfig.timeRangeVi}
              />
            </div>
          </div>

          <section
            className="case-panel has-foodie-companion"
            id="meal-panel"
            role="tabpanel"
            aria-label={
              vi
                ? spinMode === "restaurant"
                  ? "Vòng quay quán ăn"
                  : "Vòng quay món ăn"
                : spinMode === "restaurant"
                  ? "Restaurant roulette"
                  : "Food roulette"
            }
          >
            <div className="foodie-companion-slot">
              <FoodiePetWidget
                streak={streak}
                language={language}
                disabled={spinning}
                paused={
                  petOpen ||
                  mainMenuOpen ||
                  settingsOpen ||
                  preferencesOpen ||
                  panelOpen ||
                  revealed ||
                  previewFood !== null ||
                  restaurantRevealed
                }
                expanded={petOpen}
                onClick={() => openCompanion("pet")}
              />
            </div>
            <FoodSpotlight
              foods={eligible}
              restaurants={eligibleRestaurants}
              mode={spinMode}
              language={language}
              mealKind={mealKind}
              spin={spin}
              restaurantSpin={restaurantSpin}
              spinning={spinning}
              won={spinMode === "restaurant" ? restaurantRevealed : revealed}
              suspended={
                panelOpen ||
                previewFood !== null ||
                petOpen ||
                mainMenuOpen ||
                settingsOpen ||
                preferencesOpen ||
                restaurantRevealed
              }
              onFinish={finishSpin}
              onFinishRestaurant={finishRestaurantSpin}
              onTick={() => audio.current?.play("csgo_ui_crate_item_scroll")}
              onBrowse={() =>
                spinMode === "restaurant"
                  ? setRestaurantRevealed(false)
                  : setRevealed(false)
              }
              onClearFilter={() => setSelectedTastes([])}
            />
          </section>

          {/* Spin controls với Bộ lọc Gu Món đa chọn và Nút Quay */}
          <SpinControls
            mode={spinMode}
            settings={settings}
            language={language}
            selectedTastes={selectedTastes}
            onSelectTastes={setSelectedTastes}
            session={session}
            spinning={spinning}
            hasResult={spinMode === "restaurant" ? !!restaurantResult : !!result}
            empty={
              spinMode === "restaurant"
                ? !eligibleRestaurants.length
                : !eligible.length
            }
            onSpin={open}
            onOpenChange={setPanelOpen}
            categoryTabs={
              <MealKindTabs
                value={mealKind}
                language={language}
                disabled={spinning || !settings.ready}
                onChange={handleSelectMealKind}
                idPrefix="dock"
                sessionLabel={vi ? currentSessionConfig.labelVi : currentSessionConfig.labelEn}
                sessionTimeRange={currentSessionConfig.timeRangeVi}
              />
            }
          />

          <a className="explore-link" href="#menu">
            <Compass size={14} aria-hidden="true" />
            <span>{vi ? "Hoặc tự chọn món bên dưới" : "Or choose from the menu"}</span>
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
          restaurantRewardedToday={hasRestaurantRewardToday(streak)}
          progressStorageError={foodie.storageError}
        />

        <RestaurantResultDialog
          open={restaurantRevealed && !spinning && !!restaurantResult}
          onClose={() => setRestaurantRevealed(false)}
          restaurant={restaurantResult}
          language={language}
          distanceKm={restaurantDistanceKm}
          onSpinAgain={() => {
            setRestaurantRevealed(false);
            open();
          }}
        />

        {mealKind === "drink" && <BrandCarousel language={language} />}

        <section className="inventory" id="menu" aria-labelledby="menu-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {vi ? "HỢP GU, TỰ CHỌN" : "YOUR TASTE, YOUR PICK"}
              </span>
              <h2 id="menu-title">
                {currentSessionHeading}
                <span>{eligible.length}</span>
              </h2>
            </div>
            <PreferencesPanel
              preferences={preferences}
              language={language}
              disabled={spinning}
              variant="inventory"
              hideTrigger={mealKind !== "lunch"}
              finalFocus={preferencesReturnFocus}
              open={preferencesOpen}
              onControlledOpenChange={(next) => {
                if (next) preferencesReturnFocus.current = document.activeElement as HTMLElement;
                setPreferencesOpen(next);
              }}
              onOpenChange={setPanelOpen}
            />
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
              <button onClick={() => setSelectedTastes([])}>
                {vi ? "Xem tất cả món" : "Show all dishes"}
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
            Quay Cơm.online ·{" "}
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
    </div>
  );
}
