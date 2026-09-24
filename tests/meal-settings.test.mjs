import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "tnag-meal-settings-"));
try {
  for (const module of ["meal-settings", "cookies"]) {
    buildSync({
      entryPoints: [`src/lib/${module}.ts`],
      outfile: join(out, `${module}.cjs`),
      bundle: true,
      platform: "node",
      format: "cjs",
      define: { "import.meta.env.BASE_URL": '"/"' },
    });
  }
  const require = createRequire(import.meta.url);
  const {
    MEAL_SETTINGS_COOKIE,
    defaultMealSettings,
    restoreMealSettings,
    updateMealBudget,
    validMealBudget,
    vegetarianFilterEnabled,
    budgetValidationMessage,
    servingUnit,
    foodServingUnit,
  } = require(join(out, "meal-settings.cjs"));
  const { readCookie, writeCookie } = require(join(out, "cookies.cjs"));

  test("legacy preferences migrate only to their selected category", () => {
    const restored = restoreMealSettings(
      null,
      {
        budget: "custom",
        custom: "42",
        veg: true,
        sound: false,
      },
      "drink",
    );
    assert.equal(restored.mealKind, "drink");
    assert.deepEqual(restored.budgets.drink, {
      budget: "custom",
      custom: "42",
    });
    assert.deepEqual(restored.budgets.lunch, { budget: "50", custom: "50" });
    assert.equal(restored.sound, false);
    assert.equal(restored.veg, true);
    assert.equal(vegetarianFilterEnabled(restored), false);
    assert.equal(
      vegetarianFilterEnabled({ ...restored, mealKind: "lunch" }),
      true,
    );
  });

  test("each category keeps its own valid preset or custom amount", () => {
    let settings = updateMealBudget(defaultMealSettings(), "custom", "88");
    settings = updateMealBudget({ ...settings, mealKind: "drink" }, "20");
    settings = updateMealBudget(
      { ...settings, mealKind: "snack" },
      "custom",
      "16",
    );
    settings = updateMealBudget({ ...settings, mealKind: "nhau" }, "150");
    const restored = restoreMealSettings(JSON.parse(JSON.stringify(settings)));
    assert.deepEqual(restored.budgets, {
      lunch: { budget: "custom", custom: "88" },
      drink: { budget: "20", custom: "30" },
      snack: { budget: "custom", custom: "16" },
      nhau: { budget: "150", custom: "90" },
    });
    assert.equal(restored.mealKind, "nhau");
  });

  test("legacy integral number formats retain their value without relaxing new form input", () => {
    for (const custom of ["85.0", "8.5e1", " 085 "]) {
      const restored = restoreMealSettings(
        null,
        { budget: "custom", custom },
        "lunch",
      );
      assert.deepEqual(
        restored.budgets.lunch,
        { budget: "custom", custom: "85" },
        custom,
      );
    }
    for (const custom of ["85.5", "8.55e1", "", "  ", "Infinity", "1.81e2"]) {
      const restored = restoreMealSettings(
        null,
        { budget: "custom", custom },
        "lunch",
      );
      assert.deepEqual(
        restored.budgets.lunch,
        { budget: "50", custom: "50" },
        custom,
      );
    }
    for (const custom of ["85.0", "8.5e1"]) {
      assert.equal(
        updateMealBudget(defaultMealSettings(), "custom", custom),
        null,
      );
    }
  });

  test("invalid input leaves the saved budget intact and uses each category's bounds", () => {
    const settings = defaultMealSettings();
    const previous = structuredClone(settings);
    for (const value of [
      "",
      "10",
      "181",
      "30.5",
      "NaN",
      "Infinity",
      "3e1",
      "0x32",
    ]) {
      assert.equal(updateMealBudget(settings, "custom", value), null, value);
    }
    assert.equal(updateMealBudget(settings, "60"), null, "unknown preset");
    assert.deepEqual(settings, previous);
    assert.equal(validMealBudget("lunch", "30"), true);
    assert.equal(validMealBudget("lunch", "180"), true);
    assert.equal(validMealBudget("drink", "10"), true);
    assert.equal(validMealBudget("drink", "60"), true);
    assert.equal(validMealBudget("drink", "61"), false);
    assert.equal(validMealBudget("snack", "95"), true);
    assert.equal(validMealBudget("nhau", "20"), true);
  });

  test("malformed fields fall back independently without erasing healthy preferences", () => {
    const saved = {
      ...defaultMealSettings(),
      mealKind: "drink",
      veg: true,
      sound: false,
      budgets: {
        lunch: { budget: "custom", custom: "Infinity" },
        drink: { budget: "custom", custom: " 42 " },
        snack: { budget: "90", custom: "15" },
        nhau: null,
      },
    };
    const restored = restoreMealSettings(
      saved,
      { budget: "35", veg: false, sound: true },
      "lunch",
    );
    assert.equal(restored.mealKind, "drink");
    assert.equal(restored.veg, true);
    assert.equal(restored.sound, false);
    assert.deepEqual(restored.budgets.lunch, { budget: "50", custom: "50" });
    assert.deepEqual(restored.budgets.drink, {
      budget: "custom",
      custom: "42",
    });
    assert.deepEqual(restored.budgets.snack, { budget: "30", custom: "15" });
    assert.deepEqual(restored.budgets.nhau, { budget: "90", custom: "90" });
    assert.deepEqual(
      restoreMealSettings([], null, "invalid"),
      defaultMealSettings(),
    );
  });

  test("versioned preferences round-trip through cookies without replacing old data", () => {
    const jar = new Map();
    const writes = [];
    globalThis.location = { protocol: "https:" };
    globalThis.document = {
      get cookie() {
        return [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
      },
      set cookie(value) {
        writes.push(value);
        const pair = value.split(";")[0];
        const separator = pair.indexOf("=");
        jar.set(pair.slice(0, separator), pair.slice(separator + 1));
      },
    };
    const legacy = { budget: "custom", custom: "75", veg: true, sound: false };
    writeCookie("settings", legacy);
    writeCookie("meal-kind", "lunch");
    writeCookie("pool", { custom: [{ name: "Món riêng" }] });
    const beforeRestore = writes.length;
    const migrated = restoreMealSettings(
      readCookie(MEAL_SETTINGS_COOKIE),
      readCookie("settings"),
      readCookie("meal-kind"),
    );
    assert.equal(
      writes.length,
      beforeRestore,
      "restore itself never writes defaults",
    );
    const updated = updateMealBudget({ ...migrated, mealKind: "drink" }, "40");
    writeCookie(MEAL_SETTINGS_COOKIE, updated);
    assert.deepEqual(
      restoreMealSettings(readCookie(MEAL_SETTINGS_COOKIE)),
      updated,
    );
    assert.deepEqual(readCookie("settings"), legacy);
    assert.equal(readCookie("meal-kind"), "lunch");
    assert.deepEqual(readCookie("pool"), { custom: [{ name: "Món riêng" }] });
    assert.ok(writes.at(-1).length < 3500);
    delete globalThis.document;
    delete globalThis.location;
  });

  test("budget messages and serving units follow the selected category and explicit metadata", () => {
    assert.match(budgetValidationMessage("drink", "vi"), /10.*60/);
    assert.match(budgetValidationMessage("snack", "en"), /10.*95/);
    assert.equal(servingUnit("lunch", "vi"), "suất");
    assert.equal(servingUnit("nhau", "en"), "plate");
    assert.equal(
      foodServingUnit({ sub: "Cà phê phin • Một ly" }, "drink", "vi"),
      "ly",
    );
    assert.equal(
      foodServingUnit({ sub: "Cà phê phin • Một ly" }, "drink", "en"),
      "drink",
    );
    assert.equal(
      foodServingUnit({ sub: "Nem rán • Phần 5 chiếc" }, "nhau", "vi"),
      "phần 5 chiếc",
    );
    assert.equal(
      foodServingUnit({ sub: "Món tự thêm" }, "lunch", "en"),
      "serving",
    );
  });
} finally {
  rmSync(out, { recursive: true, force: true });
}
