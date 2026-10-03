import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "foodtour-happy-hour-"));
let createHappyHourPlan, HAPPY_HOUR_LIMITS, HAPPY_HOUR_CATEGORIES, drinkFoods, snackFoods;
try {
  for (const name of ["happy-hour", "foods-drinks", "foods-snacks"]) {
    buildSync({ entryPoints: [`src/lib/${name}.ts`], outfile: join(directory, `${name}.cjs`), bundle: true, platform: "node", format: "cjs" });
  }
  const require = createRequire(import.meta.url);
  ({ createHappyHourPlan, HAPPY_HOUR_LIMITS, HAPPY_HOUR_CATEGORIES } = require(join(directory, "happy-hour.cjs")));
  ({ drinkFoods } = require(join(directory, "foods-drinks.cjs")));
  ({ snackFoods } = require(join(directory, "foods-snacks.cjs")));
} finally {
  rmSync(directory, { recursive: true, force: true });
}

test("500k for five people produces complete real-catalog menus and exact totals", () => {
  const plan = createHappyHourPlan(500, 5);
  assert.equal(plan.status, "ready");
  assert.equal(plan.menus.length, HAPPY_HOUR_LIMITS.maxVariants);
  for (const menu of plan.menus) {
    assert.equal(menu.lines.length, 2);
    assert.deepEqual(menu.lines.map((line) => line.kind), ["drink", "snack"]);
    for (const line of menu.lines) {
      const catalog = line.kind === "drink" ? drinkFoods : snackFoods;
      assert.deepEqual(line.food, catalog.find((food) => food.image === line.food.image));
      assert.equal(line.quantity, 5);
      assert.equal(line.subtotal, line.food.price * 5);
    }
    assert.equal(menu.total, menu.lines.reduce((sum, line) => sum + line.subtotal, 0));
    assert.equal(menu.perPerson, menu.total / 5);
    assert.equal(menu.remaining, 500 - menu.total);
    assert.ok(menu.total <= 500);
  }
  assert.ok(plan.menus.some((menu) => menu.lines[1].food.name === "Trái cây dầm" || (menu.lines[1].food.image >= 360 && menu.lines[1].food.image <= 383)), "Fruit portions should be represented for the default group budget");
});

test("insufficient budget is honest and an affordable boundary recovers", () => {
  const plan = createHappyHourPlan(100, 20);
  assert.equal(plan.status, "insufficient");
  assert.deepEqual(plan.menus, []);
  assert.ok(plan.minimumBudget > 100);
  const affordableBudget = Math.ceil(plan.minimumBudget / HAPPY_HOUR_LIMITS.budgetStep) * HAPPY_HOUR_LIMITS.budgetStep;
  const recovered = createHappyHourPlan(affordableBudget, 20);
  assert.equal(recovered.status, "ready");
  assert.ok(recovered.menus.length > 0);
  assert.ok(recovered.menus.every((menu) => menu.total <= affordableBudget));
  const previousStep = createHappyHourPlan(affordableBudget - HAPPY_HOUR_LIMITS.budgetStep, 20);
  assert.equal(previousStep.status, "insufficient");
});

test("all supported group sizes and budget steps stay within the budget", () => {
  for (let people = 2; people <= 20; people++) {
    for (let budget = 100; budget <= 2000; budget += 25) {
      const plan = createHappyHourPlan(budget, people);
      assert.notEqual(plan.status, "invalid");
      assert.equal(plan.status === "insufficient", budget < plan.minimumBudget);
      assert.ok(plan.menus.length <= HAPPY_HOUR_LIMITS.maxVariants);
      assert.equal(new Set(plan.menus.map((menu) => menu.id)).size, plan.menus.length);
      for (const menu of plan.menus) {
        assert.ok(menu.total <= budget, `${budget}k / ${people} people overspends`);
        assert.ok(menu.remaining >= 0);
        assert.equal(menu.remaining + menu.total, budget);
        assert.equal(menu.total, menu.perPerson * people);
        assert.ok(menu.lines.every((line) => line.quantity === people));
      }
    }
  }
});

test("invalid or off-step inputs never produce partial/unsafe menus", () => {
  for (const budget of [NaN, Infinity, -1, 0, 99, 105, 500.5, 2025, "500", null, undefined]) {
    assert.deepEqual(createHappyHourPlan(budget, 5), { status: "invalid", menus: [], minimumBudget: null });
  }
  for (const people of [NaN, Infinity, -1, 0, 1, 2.5, 21, "5", null, undefined]) {
    assert.deepEqual(createHappyHourPlan(500, people), { status: "invalid", menus: [], minimumBudget: null });
  }
});

test("alternative menus are finite, deterministic and vary both dishes where possible", () => {
  const initial = createHappyHourPlan(500, 5);
  assert.deepEqual(createHappyHourPlan(500, 5), initial);
  assert.equal(new Set(initial.menus.map((menu) => menu.lines[0].food.image)).size, initial.menus.length);
  assert.equal(new Set(initial.menus.map((menu) => menu.lines[1].food.image)).size, initial.menus.length);
  createHappyHourPlan(100, 20);
  createHappyHourPlan(2000, 2);
  assert.deepEqual(createHappyHourPlan(500, 5), initial, "Other requests must not mutate or reorder the next group's result");
});

test("a large budget never fabricates quantities, prices, or extra spend", () => {
  const plan = createHappyHourPlan(2000, 2);
  assert.equal(plan.status, "ready");
  for (const menu of plan.menus) {
    assert.equal(menu.lines.length, 2);
    assert.ok(menu.lines.every((line) => line.quantity === 2));
    assert.ok(menu.remaining > 0);
    assert.ok(menu.total < 2000);
  }
});

test("HAPPY_HOUR_CATEGORIES contains the 4 requested categories", () => {
  const ids = HAPPY_HOUR_CATEGORIES.map((c) => c.id);
  assert.deepEqual(ids, ["main", "drink", "snack-savory", "snack-sweet"]);
  for (const cat of HAPPY_HOUR_CATEGORIES) {
    assert.ok(cat.labelVi && typeof cat.labelVi === "string");
    assert.ok(cat.icon && typeof cat.icon === "string");
  }
});

test("Happy Hour categories produce valid single-category menus within budget (without drink)", () => {
  const categories = ["main", "drink", "snack-savory", "snack-sweet"];
  for (const cat of categories) {
    const plan = createHappyHourPlan(500, 5, cat, false);
    assert.equal(plan.status, "ready", `Category ${cat} should be ready at 500k for 5 people`);
    assert.ok(plan.menus.length > 0 && plan.menus.length <= HAPPY_HOUR_LIMITS.maxVariants);
    for (const menu of plan.menus) {
      assert.equal(menu.lines.length, 1);
      assert.equal(menu.lines[0].quantity, 5);
      assert.equal(menu.lines[0].subtotal, menu.lines[0].food.price * 5);
      assert.equal(menu.total, menu.lines[0].subtotal);
      assert.ok(menu.total <= 500);
      assert.equal(menu.remaining, 500 - menu.total);
    }
  }
});

test("Happy Hour categories produce valid combos with drink when includeDrink is true", () => {
  const foodCategories = ["main", "snack-savory", "snack-sweet"];
  for (const cat of foodCategories) {
    const plan = createHappyHourPlan(500, 5, cat, true);
    assert.equal(plan.status, "ready", `Category ${cat} with drink should be ready at 500k for 5 people`);
    assert.ok(plan.menus.length > 0 && plan.menus.length <= HAPPY_HOUR_LIMITS.maxVariants);
    for (const menu of plan.menus) {
      assert.equal(menu.lines.length, 2, "Menu should contain 1 food + 1 drink");
      assert.equal(menu.lines[0].quantity, 5);
      assert.equal(menu.lines[1].quantity, 5);
      assert.equal(menu.lines[1].kind, "drink");
      assert.equal(menu.total, menu.lines[0].subtotal + menu.lines[1].subtotal);
      assert.ok(menu.total <= 500);
      assert.equal(menu.remaining, 500 - menu.total);
    }
  }
});

test("Single category insufficient budget handling", () => {
  const plan = createHappyHourPlan(100, 20, "main", false);
  assert.equal(plan.status, "insufficient");
  assert.ok(plan.minimumBudget !== null && plan.minimumBudget > 100);
});

