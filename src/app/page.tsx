import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FoodImage } from "@/components/food-image";
import { FoodSpotlight, type SpotlightSpin } from "@/components/food-spotlight";
import { readCookie, writeCookie } from "@/lib/cookies";
import { createSpinProfile } from "@/lib/case-mechanics";
import { foods, type Food } from "@/lib/foods";
import { copy, foodName, priceLabel, type Language } from "@/lib/i18n";
import { useLocalSpinCount } from "@/hooks/use-local-spin-count";
import { PreferencesPanel } from "@/components/preferences-panel";
import { usePreferences } from "@/hooks/use-preferences";
import { personalFoods, personalSelector } from "@/lib/personal-pool";
import { CaseAudio } from "@/lib/case-audio";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  AudioLines,
  Volume2,
  VolumeX,
  Sparkles,
  Utensils,
  Sprout,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const colors = ["#4b69ff", "#8847ff", "#d32ce6", "#eb4b4b", "#e4ae39"];
const Card = memo(function Card({
  food,
  language,
}: {
  food: Food;
  language: Language;
  small?: boolean;
}) {
  return (
    <div className="food-card small" data-food-id={food.image}>
      <FoodImage food={food} language={language} />
      <div className="card-copy">
        <strong>{foodName(food, language)}</strong>
        <span>{priceLabel(food.price, language, true)}</span>
      </div>
    </div>
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
  const [budget, setBudget] = useState("50"),
    [custom, setCustom] = useState("50"),
    [veg, setVeg] = useState(false),
    [sound, setSound] = useState(true),
    [spinning, setSpinning] = useState(false),
    [result, setResult] = useState<Food | null>(null),
    [revealed, setRevealed] = useState(false);
  const [spin, setSpin] = useState<SpotlightSpin | null>(null);
  const busy = useRef(false);
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

  const [preferencesReady, setPreferencesReady] = useState(false);
  const [cookieError, setCookieError] = useState("");
  useEffect(() => {
    const saved = readCookie<Record<string, unknown>>("settings");
    if (saved && typeof saved === "object") {
      if (
        typeof saved.budget === "string" &&
        ["35", "50", "75", "100", "150", "custom"].includes(saved.budget)
      )
        setBudget(saved.budget);
      if (
        typeof saved.custom === "string" &&
        Number(saved.custom) >= 30 &&
        Number(saved.custom) <= 180
      )
        setCustom(saved.custom);
      if (typeof saved.veg === "boolean") setVeg(saved.veg);
      if (typeof saved.sound === "boolean") setSound(saved.sound);
    }
    setPreferencesReady(true);
  }, []);
  useEffect(() => {
    if (preferencesReady) {
      try {
        writeCookie("settings", { budget, custom, veg, sound });
        setCookieError("");
      } catch {
        setCookieError(
          language === "vi"
            ? "Không thể lưu cookie. Lựa chọn chỉ giữ trong lần mở trang này."
            : "Cookies unavailable. Preferences last only for this visit.",
        );
      }
    }
  }, [preferencesReady, budget, custom, veg, sound, language]);
  const target = budget === "custom" ? Number(custom) : Number(budget);
  const validTarget = Number.isInteger(target) && target >= 30 && target <= 180;
  const population = useMemo(
    () => personalFoods(preferences.profile),
    [preferences.profile],
  );
  useEffect(() => {
    const last = readCookie<{ name?: unknown; price?: unknown; veg?: unknown }>(
      "last-choice",
    );
    if (last && typeof last === "object") {
      const match = population.find(
        (f) =>
          f.name === last.name &&
          f.price === last.price &&
          !!f.veg === last.veg,
      );
      if (match) setResult(match);
    }
  }, [population]);
  const eligible = useMemo(
    () => population.filter((f) => !veg || f.veg),
    [population, veg],
  );
  const lunchSelector = useMemo(
    () => personalSelector(eligible, validTarget ? target : 50),
    [eligible, target, validTarget],
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
  const t = copy[language];
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
        .map((f) => (
          <Card
            food={f}
            language={language}
            small
            key={f.customId ?? f.image}
          />
        )),
    [eligible, language],
  );

  function open() {
    if (busy.current || !validTarget || !eligible.length || !lunchSelector)
      return;
    busy.current = true;
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
  }

  return (
    <div className="site-shell">
      <header>
        <a href={`${basePath}/`} className="brand">
          <span className="brand-symbol">
            <Utensils size={23} />
          </span>
          <span className="brand-wordmark">
            trưa nay
            <span>
              ăn gì<span className="brand-dot">?</span>
            </span>
          </span>
        </a>
        <div className="header-actions">
          <PreferencesPanel
            preferences={preferences}
            language={language}
            disabled={spinning}
          />
          <button
            className="language-button"
            onClick={() => changeLanguage(language === "vi" ? "en" : "vi")}
            aria-label={t.language}
          >
            {language === "vi" ? "EN" : "VI"}
          </button>
          <button
            className="sound-button"
            onClick={() => {
              audio.current?.setMuted(sound);
              setSound(!sound);
            }}
            aria-label={sound ? t.turnSoundOff : t.turnSoundOn}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{sound ? t.soundOn : t.soundOff}</span>
          </button>
          <a
            className="social-button facebook-button"
            href="https://www.facebook.com/share/g/19S49GH46A/"
            target="_blank"
            rel="noreferrer"
            aria-label={
              language === "vi"
                ? "Tham gia nhóm Facebook Trưa Nay Ăn Gì"
                : "Join the Trưa Nay Ăn Gì Facebook group"
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M14.2 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H8V13h2.8v8h3.4Z"
              />
            </svg>
            <span>Facebook</span>
          </a>
          <a
            className="github-button"
            href="https://github.com/truanayangi-com/truanayangi"
            target="_blank"
            rel="noreferrer"
            aria-label={t.github}
          >
            <svg className="github-mark" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49v-1.91c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .08 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.96a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.89v2.8c0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
              />
            </svg>
            <span className="github-label">GitHub</span>
          </a>
        </div>
      </header>
      <main>
        <>
          {cookieError && (
            <p role="status" className="preferences-message">
              {cookieError}
            </p>
          )}
          <div className="intro">
            <span className="eyebrow">
              <span className="status-dot" />
              {language === "vi"
                ? "BỮA TRƯA NHỎ. NIỀM VUI TO."
                : "A LITTLE LUNCH. A LOT OF JOY."}
            </span>
            <h1>
              {language === "vi" ? (
                <>
                  Đói rồi.
                  <br className="mobile-break" /> <span>Chốt món thôi.</span>
                </>
              ) : (
                <>
                  Hungry?
                  <br className="mobile-break" /> <span>Let’s pick lunch.</span>
                </>
              )}
            </h1>
            <p>
              {language === "vi"
                ? "Bớt một câu “ăn gì cũng được”. Thêm một món hợp gu."
                : "Less “anything is fine”. More food you actually love."}
            </p>
            <a className="explore-link" href="#menu">
              {language === "vi" ? "Xem thực đơn" : "Explore the menu"}{" "}
              <ArrowDown size={15} />
            </a>
          </div>
          {!eligible.length && (
            <p className="preferences-message">
              {language === "vi"
                ? "Chưa có món phù hợp. Tắt bộ lọc chay hoặc thêm món."
                : "No matching dishes. Turn off the vegetarian filter or add dishes."}
            </p>
          )}
          <section className="case-panel" aria-label={t.caseLabel}>
            <div className="stage-caption">
              <span>
                01 / {language === "vi" ? "GÓC CHỌN MÓN" : "THE LUNCH EDIT"}
              </span>
              <span>
                <Sparkles size={13} />
                {language === "vi"
                  ? "Một chút bất ngờ, một bữa thật ngon"
                  : "A little surprise. A lovely lunch."}
              </span>
            </div>
            <div className="spotlight-wrap">
              <FoodSpotlight
                foods={eligible}
                language={language}
                spin={spin}
                spinning={spinning}
                won={revealed}
                onFinish={finishSpin}
                onTick={() => audio.current?.play("csgo_ui_crate_item_scroll")}
                onBrowse={() => setRevealed(false)}
              />
            </div>
            <Dialog open={revealed} onOpenChange={setRevealed}>
              <DialogContent className="winner-dialog">
                {result && (
                  <>
                    <span className="winner-label">{t.newItem}</span>
                    <DialogTitle className="winner-title">
                      {foodName(result, language)}
                    </DialogTitle>
                    <DialogDescription className="winner-description">
                      {t.referencePrice}{" "}
                      {priceLabel(result.price, language, true)} {t.perPerson}
                    </DialogDescription>
                    <div className="winner-art">
                      <FoodImage food={result} language={language} />
                    </div>
                    <div className="winner-actions">
                      <a
                        className="find-button"
                        href={`https://www.google.com/maps/search/${encodeURIComponent(result.name + " " + t.nearby)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.find}
                        <ArrowUpRight size={16} />
                      </a>
                      <a
                        className="grabfood-button"
                        href={`https://food.grab.com/vn/vi/restaurants?${new URLSearchParams({ search: result.name, "support-deeplink": "true", searchParameter: result.name })}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {language === "vi"
                          ? "Đặt qua GrabFood"
                          : "Order on GrabFood"}
                        <ArrowUpRight size={16} />
                      </a>
                      <button onClick={() => setRevealed(false)}>
                        {t.continue}
                      </button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </section>
          <div className="control-bar">
            <div className="filters">
              <div className="budget">
                <label id="budget-label">{t.spend}</label>
                <Select
                  value={budget}
                  onValueChange={(v) => setBudget(v ?? "50")}
                  disabled={spinning}
                >
                  <SelectTrigger aria-labelledby="budget-label">
                    <SelectValue>
                      {budget === "custom"
                        ? t.custom
                        : priceLabel(budget, language)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {["35", "50", "75", "100", "150"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {priceLabel(v, language)}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">{t.custom}</SelectItem>
                  </SelectContent>
                </Select>
                {budget === "custom" && (
                  <div className="custom-spend">
                    <input
                      aria-label={t.customSpend}
                      aria-invalid={!validTarget}
                      type="number"
                      inputMode="numeric"
                      min="30"
                      max="180"
                      step="1"
                      value={custom}
                      disabled={spinning}
                      onChange={(e) => setCustom(e.target.value)}
                    />
                    <span>{t.thousandPerMeal}</span>
                  </div>
                )}
                {!validTarget && (
                  <small className="spend-note" role="alert">
                    {t.spendError}
                  </small>
                )}
              </div>
              <button
                type="button"
                className="veg"
                role="switch"
                aria-checked={veg}
                aria-label={t.vegetarianOnly}
                disabled={spinning}
                onClick={() => setVeg((current) => !current)}
              >
                <span className="veg-emblem" aria-hidden="true">
                  <Sprout size={21} />
                </span>
                <span className="veg-label">{t.vegetarian}</span>
                <span className="veg-toggle" aria-hidden="true">
                  <span />
                </span>
              </button>
            </div>
            <div className="open-wrap">
              <button
                className="open-button"
                disabled={spinning || !validTarget || !eligible.length}
                onClick={open}
              >
                {spinning ? <AudioLines size={22} /> : <Sparkles size={21} />}{" "}
                {spinning ? t.opening : result ? t.openAgain : t.open}{" "}
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
          <div className="session-details">
            {" "}
            {counterEnabled && (
              <p
                className="local-counter"
                title={
                  language === "vi"
                    ? "Lượt quay trên trình duyệt này, lưu bằng cookie"
                    : "Spins on this browser, stored in cookies"
                }
              >
                {language === "vi" ? "Bạn đã quay" : "You have spun"}{" "}
                <strong>
                  {localSpins === null
                    ? "—"
                    : new Intl.NumberFormat(
                        language === "vi" ? "vi-VN" : "en-US",
                      ).format(localSpins)}
                </strong>{" "}
                {language === "vi"
                  ? "lần trên trình duyệt này"
                  : "times in this browser"}
              </p>
            )}
            {result && !spinning && (
              <p className="local-counter">
                {language === "vi" ? "Lựa chọn gần nhất: " : "Last choice: "}
                <strong>{foodName(result, language)}</strong>
              </p>
            )}
          </div>
          <span className="sr-only" role="status">
            {result && !spinning
              ? `${t.newItem}: ${foodName(result, language)}`
              : ""}
          </span>
          <section className="inventory" id="menu">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{t.whatsInside}</span>
                <div className="inventory-title-row">
                  <h2>
                    {t.items}{" "}
                    <span>{eligible.length.toString().padStart(2, "0")}</span>
                  </h2>
                  <PreferencesPanel
                    preferences={preferences}
                    language={language}
                    disabled={spinning}
                    variant="inventory"
                  />
                </div>
              </div>
              <div className="rarity-legend">
                {t.tiers.map((tier, i) => (
                  <span key={tier}>
                    <i style={{ background: colors[i] }} />
                    {tier}
                  </span>
                ))}
              </div>
            </div>
            <p className="menu-note">
              {language === "vi"
                ? "Món quen hay món mới? Cứ để chiếc bụng dẫn đường. Giá chỉ mang tính tham khảo."
                : "Old favorites or something new? Follow your appetite. Prices are approximate."}
            </p>
            {validTarget &&
              eligible.length > 0 &&
              (veg || Math.abs(filteredMean - target) > 0.5) && (
                <small className="spend-note">
                  {t.vegetarianPool}{" "}
                  {priceLabel(Math.round(filteredMean), language, true)} /{" "}
                  {language === "vi" ? "bữa" : "meal"}
                </small>
              )}
            <div className="inventory-grid">{inventoryCards}</div>
          </section>
        </>
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
