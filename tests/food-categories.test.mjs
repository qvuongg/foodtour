import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "tnag-cat-"));

try {
  buildSync({
    entryPoints: ["src/lib/food-categories.ts"],
    outfile: join(out, "categories.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  buildSync({
    entryPoints: ["src/lib/food-ordering.ts"],
    outfile: join(out, "ordering.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  buildSync({
    entryPoints: ["src/lib/food-atlas.ts"],
    outfile: join(out, "atlas.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
  });

  const {
    MEAL_KINDS,
    getMealConfig,
    getMealFoods,
    personalSelector,
    emptyProfile,
  } = createRequire(import.meta.url)(join(out, "categories.cjs"));

  const {
    resolveSmartHubAffiliate,
  } = createRequire(import.meta.url)(join(out, "ordering.cjs"));

  const {
    getFoodAtlas,
  } = createRequire(import.meta.url)(join(out, "atlas.cjs"));

  test("All 4 meal categories are properly configured with labels, budgets and boundaries", () => {
    assert.equal(MEAL_KINDS.length, 4);
    const ids = MEAL_KINDS.map((m) => m.id);
    assert.deepEqual(ids, ["lunch", "drink", "snack", "nhau"]);

    for (const kind of ids) {
      const cfg = getMealConfig(kind);
      assert.ok(cfg.labelVi.length > 0);
      assert.ok(cfg.labelEn.length > 0);
      assert.ok(cfg.budgets.length >= 4);
      assert.ok(cfg.budgets.includes(cfg.defaultBudget));
      assert.ok(cfg.minPrice < cfg.maxPrice);
      assert.ok(cfg.count > 0);
    }
  });

  test("Category dataset item counts, uniqueness and valid price ranges", () => {
    const lunchFoods = getMealFoods("lunch", emptyProfile());
    const drinkFoods = getMealFoods("drink");
    const snackFoods = getMealFoods("snack");
    const pubFoods = getMealFoods("nhau");

    assert.equal(lunchFoods.length, 128);
    assert.equal(drinkFoods.length, 72);
    assert.equal(snackFoods.length, 96);
    assert.equal(pubFoods.length, 48);

    const allFoods = [...lunchFoods, ...drinkFoods, ...snackFoods, ...pubFoods];
    assert.equal(allFoods.length, 344);

    // Verify all image IDs are unique across entire database
    const allImages = allFoods.map((f) => f.image);
    assert.equal(new Set(allImages).size, 344, "All food image IDs must be unique");

    for (const f of drinkFoods) {
      assert.ok(f.name.length > 0);
      assert.ok(f.price >= 10 && f.price <= 60);
      assert.ok(f.rarity >= 0 && f.rarity <= 4);
    }

    for (const f of snackFoods) {
      assert.ok(f.name.length > 0);
      assert.ok(f.price >= 10 && f.price <= 95);
      assert.ok(f.rarity >= 0 && f.rarity <= 4);
    }

    for (const f of pubFoods) {
      assert.ok(f.name.length > 0);
      assert.ok(f.price >= 20 && f.price <= 180);
      assert.ok(f.rarity >= 0 && f.rarity <= 4);
    }
  });

  test("100% of all dishes in all 4 categories resolve to existing WebP atlas image files", () => {
    const kinds = ["lunch", "drink", "snack", "nhau"];
    for (const kind of kinds) {
      const foods = getMealFoods(kind, emptyProfile());
      for (const food of foods) {
        const style = getFoodAtlas(food.image);
        assert.ok(style !== null, `Dish "${food.name}" (image ${food.image}) must have an atlas style`);
        assert.ok(style.atlas.length > 0);
        assert.ok(style.backgroundSize.length > 0);
        assert.ok(style.backgroundPosition.length > 0);

        const localPath = join(process.cwd(), "public", `${style.atlas}.webp`);
        assert.ok(
          existsSync(localPath),
          `Atlas file "${style.atlas}.webp" for dish "${food.name}" must exist in public/`,
        );
      }
    }
  });

  test("personalSelector works reliably across all categories", () => {
    const kinds = ["lunch", "drink", "snack", "nhau"];
    for (const kind of kinds) {
      const cfg = getMealConfig(kind);
      const foods = getMealFoods(kind, emptyProfile());
      const selector = personalSelector(foods, Number(cfg.defaultBudget));
      assert.ok(selector !== null, `Selector should be created for ${kind}`);

      const chosen = selector.choose(foods);
      assert.ok(foods.some((f) => f.name === chosen.name));
      assert.ok(selector.expectedPrice >= cfg.minPrice && selector.expectedPrice <= cfg.maxPrice);
    }
  });

  test("ShopeeFood affiliate tracking supports items from every category", () => {
    const sampleItems = [
      { name: "Phở bò", category: "lunch" },
      { name: "Trà đào cam sả", category: "drink" },
      { name: "Bánh tráng nướng", category: "snack" },
      { name: "Chân gà sả tắc", category: "nhau" },
    ];

    for (const item of sampleItems) {
      const res = resolveSmartHubAffiliate(item.name, "hcm", "vi");
      assert.ok(res.affiliate, `Must have affiliate tracking for ${item.name}`);
      assert.ok(res.appHref.includes("spf.shopee.vn") || res.appHref.includes("shopeefood.vn"));
      assert.ok(res.webHref.includes("shopeefood.vn"));
      assert.ok(res.webHref.includes("an_17316810077"));
      assert.ok(res.webHref.includes("sub_id="));
    }
  });
} finally {
  rmSync(out, { recursive: true, force: true });
}
