import { useId, useMemo, useState, type CSSProperties } from "react";
import { Minus, Plus, RefreshCw, UsersRound, Wallet } from "lucide-react";
import { FoodImage } from "./food-image";
import { foodName, priceLabel, type Language } from "@/lib/i18n";
import {
  createHappyHourPlan,
  HAPPY_HOUR_CATEGORIES,
  HAPPY_HOUR_LIMITS,
  type HappyHourCategory,
} from "@/lib/happy-hour";
import "./happy-hour.css";

export function HappyHour({ language }: { language: Language }) {
  const vi = language === "vi";
  const limits = HAPPY_HOUR_LIMITS;
  const id = useId();
  const [category, setCategory] = useState<HappyHourCategory>("main");
  const [includeDrink, setIncludeDrink] = useState<boolean>(true);
  const [budget, setBudget] = useState<number>(limits.defaultBudget);
  const [people, setPeople] = useState<number>(limits.defaultPeople);
  const [variant, setVariant] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const plan = useMemo(
    () => createHappyHourPlan(budget, people, category, includeDrink),
    [budget, people, category, includeDrink],
  );
  const menu = plan.menus[variant] ?? plan.menus[0];
  const money = (amount: number) => priceLabel(amount, language);
  const budgetPercent = ((budget - limits.minBudget) / (limits.maxBudget - limits.minBudget)) * 100;

  const changeCategory = (nextCat: HappyHourCategory) => {
    setCategory(nextCat);
    setVariant(0);
    setAnnouncement("");
  };

  const changePeople = (direction: -1 | 1) => {
    setPeople((value) => Math.min(limits.maxPeople, Math.max(limits.minPeople, value + direction)));
    setVariant(0);
    setAnnouncement("");
  };
  const showAnother = () => {
    const next = (variant + 1) % plan.menus.length;
    setVariant(next);
    const nextMenu = plan.menus[next];
    setAnnouncement(vi
      ? `Gợi ý ${next + 1} trên ${plan.menus.length}: ${nextMenu.lines.map((line) => foodName(line.food, language)).join(" và ")}. Tổng dự kiến ${money(nextMenu.total)}.`
      : `Menu ${next + 1} of ${plan.menus.length}: ${nextMenu.lines.map((line) => foodName(line.food, language)).join(" and ")}. Estimated total ${money(nextMenu.total)}.`);
  };

  const getServingDescription = () => {
    const withDrink = category !== "drink" && includeDrink;
    switch (category) {
      case "main":
        return withDrink
          ? (vi ? "Mỗi người: 1 suất món chính + 1 đồ uống." : "Each person: 1 main dish + 1 drink.")
          : (vi ? "Mỗi người: 1 suất món chính no bụng." : "Each person: 1 hearty main meal.");
      case "drink":
        return vi ? "Mỗi người: 1 ly đồ uống giải khát." : "Each person: 1 refreshing drink.";
      case "snack-savory":
        return withDrink
          ? (vi ? "Mỗi người: 1 phần ăn vặt mặn + 1 đồ uống." : "Each person: 1 savory snack + 1 drink.")
          : (vi ? "Mỗi người: 1 phần ăn vặt mặn thơm ngon." : "Each person: 1 savory snack.");
      case "snack-sweet":
        return withDrink
          ? (vi ? "Mỗi người: 1 phần tráng miệng + 1 đồ uống." : "Each person: 1 sweet dessert + 1 drink.")
          : (vi ? "Mỗi người: 1 phần ăn vặt ngọt, tráng miệng." : "Each person: 1 sweet dessert.");
      default:
        return vi ? "Mỗi người: 1 đồ uống + 1 phần ăn vặt." : "Each person: 1 drink + 1 snack serving.";
    }
  };

  return (
    <section className="happy-hour" aria-label="Happy Hour">
      <p className="happy-hour-intro">
        {vi ? "Chốt kèo cả nhóm, vừa túi tiền." : "A little break, within your group’s budget."}
      </p>

      {/* Category selector nhỏ gọn, không làm rối giao diện */}
      <div
        className="happy-hour-categories"
        role="tablist"
        aria-label={vi ? "Chọn loại món" : "Select category"}
      >
        {HAPPY_HOUR_CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              title={vi ? cat.labelVi : cat.labelEn}
              className={`happy-hour-cat-btn ${active ? "active" : ""}`}
              onClick={() => changeCategory(cat.id)}
            >
              <span className="cat-icon" aria-hidden="true">{cat.icon}</span>
              <span>{vi ? cat.shortVi : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Tùy chọn kèm đồ uống linh hoạt khi chọn món ăn hoặc ăn vặt */}
      {category !== "drink" && (
        <div className="happy-hour-combo-toggle-row">
          <span className="combo-toggle-hint">
            {includeDrink
              ? (vi ? "⚡ Combo 2 món: Món ăn + Đồ uống" : "⚡ 2-item combo: Food + Drink")
              : (vi ? "Chỉ món ăn (không kèm nước)" : "Food only (no drinks)")}
          </span>
          <button
            type="button"
            role="checkbox"
            aria-checked={includeDrink}
            className={`happy-hour-combo-pill ${includeDrink ? "is-active" : ""}`}
            onClick={() => {
              setIncludeDrink(!includeDrink);
              setVariant(0);
              setAnnouncement("");
            }}
          >
            <span className="combo-pill-check" aria-hidden="true">{includeDrink ? "✓" : "+"}</span>
            <span>{vi ? "Kèm đồ uống" : "With drink"}</span>
            <span className="combo-pill-icon" aria-hidden="true">🥤</span>
          </button>
        </div>
      )}

      <div className="happy-hour-controls">
        <div className="happy-hour-budget-heading">
          <label htmlFor={`${id}-budget`}><Wallet size={16} aria-hidden="true" />{vi ? "Ngân sách cả nhóm" : "Group budget"}</label>
          <output htmlFor={`${id}-budget`}>{money(budget)}</output>
        </div>
        <input
          className="happy-hour-range"
          id={`${id}-budget`}
          type="range"
          min={limits.minBudget}
          max={limits.maxBudget}
          step={limits.budgetStep}
          value={budget}
          aria-valuetext={money(budget)}
          aria-describedby={`${id}-budget-help`}
          style={{ "--happy-budget-fill": `${budgetPercent}%` } as CSSProperties}
          onChange={(event) => {
            setBudget(Number(event.target.value));
            setVariant(0);
            setAnnouncement("");
          }}
        />
        <div className="happy-hour-range-ends" aria-hidden="true"><span>100k</span><span>2.000k</span></div>
        <div className="happy-hour-people">
          <span id={`${id}-people`}><UsersRound size={16} aria-hidden="true" />{vi ? "Số người" : "People"}</span>
          <div className="happy-hour-stepper" role="group" aria-labelledby={`${id}-people`}>
            <button type="button" aria-label={vi ? "Bớt một người" : "One fewer person"} disabled={people === limits.minPeople} onClick={() => changePeople(-1)}><Minus size={16} aria-hidden="true" /></button>
            <output aria-live="polite" aria-atomic="true" aria-label={vi ? "Số người" : "People"}>{people}</output>
            <button type="button" aria-label={vi ? "Thêm một người" : "One more person"} disabled={people === limits.maxPeople} onClick={() => changePeople(1)}><Plus size={16} aria-hidden="true" /></button>
          </div>
        </div>
        <p id={`${id}-budget-help`} className="happy-hour-budget-help">{vi ? "Tối đa" : "Up to"} <strong>{money(Math.floor(budget * 1000 / people) / 1000)}</strong> / {vi ? "người" : "person"}</p>
      </div>

      {menu ? (
        <div className="happy-hour-menu">
          <div className="happy-hour-menu-heading"><h3>{vi ? "Menu cho nhóm mình" : "Your group menu"}</h3><span>{variant + 1}/{plan.menus.length}</span></div>
          <p className="happy-hour-serving">{getServingDescription()}</p>
          <ul className="happy-hour-lines">
            {menu.lines.map((line) => (
              <li key={`${line.kind}-${line.food.image}`}>
                <div className="happy-hour-food-art"><FoodImage food={line.food} language={language} /></div>
                <div className="happy-hour-food-detail">
                  <h4>{foodName(line.food, language)}</h4>
                  {vi && <p className="happy-hour-portion">{line.food.sub.split("•").at(-1)?.trim()}</p>}
                  <p className="happy-hour-calculation"><span>{line.quantity} × {money(line.food.price)}</span><strong>{money(line.subtotal)}</strong></p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="happy-hour-total">
            <div><dt>{vi ? "Tổng dự kiến" : "Estimated total"}</dt><dd>{money(menu.total)}</dd></div>
            <div><dt>{vi ? "Mỗi người" : "Per person"}</dt><dd>{money(menu.perPerson)}</dd></div>
            <div><dt>{vi ? "Còn trong ngân sách" : "Budget remaining"}</dt><dd>{money(menu.remaining)}</dd></div>
          </dl>
          {plan.menus.length > 1 && <button type="button" className="happy-hour-alternative" onClick={showAnother}><RefreshCw size={16} aria-hidden="true" />{vi ? "Thử menu khác" : "Try another menu"}</button>}
        </div>
      ) : (
        <div className="happy-hour-empty" role="status">
          <strong>{vi ? "Chưa đủ cho cả nhóm" : "A little short for the group"}</strong>
          <p>{plan.minimumBudget !== null
            ? (vi
              ? `Cần ít nhất ${money(plan.minimumBudget)} cho ${people} người theo giá tham khảo${includeDrink && category !== "drink" ? " (gồm cả món ăn và đồ uống)" : ""}. Tăng ngân sách${includeDrink && category !== "drink" ? " hoặc tắt kèm đồ uống" : ""} nhé.`
              : `At least ${money(plan.minimumBudget)} is needed for ${people} people at catalog prices${includeDrink && category !== "drink" ? " (including food & drinks)" : ""}. Increase the budget${includeDrink && category !== "drink" ? " or turn off drinks" : ""}.`)
            : (vi ? "Hãy chọn lại ngân sách và số người." : "Please adjust the budget and group size.")}</p>
        </div>
      )}
      <p className="happy-hour-note">{vi ? "Giá tham khảo từ danh mục món, chưa gồm phí giao hàng. Giá và khẩu phần thực tế tùy quán." : "Estimated catalog prices, excluding delivery. Actual prices and serving sizes vary by restaurant."}</p>
      <span className="happy-hour-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
