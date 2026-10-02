import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "tax-test-"));

buildSync({
  entryPoints: ["src/lib/dish-taxonomy.ts"],
  outfile: join(out, "taxonomy.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
});

buildSync({
  entryPoints: ["src/lib/city-checklist.ts"],
  outfile: join(out, "checklist.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
});

const {
  detectCurrentMealSession,
  classifyDishTaste,
  matchesTasteCategory,
  getFoodsForSessionAndTaste,
  filterFoodsByTastes,
  matchSingleTaste,
  getTasteCategoriesForMealKind,
  TASTE_CATEGORIES,
  MEAL_SESSIONS,
} = createRequire(import.meta.url)(join(out, "taxonomy.cjs"));

const { CITY_CHECKLISTS } = createRequire(import.meta.url)(join(out, "checklist.cjs"));

test("detectCurrentMealSession recognizes proper session based on hours and minutes", () => {
  // Breakfast: 06:01 - 10:00
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T06:00:00")), "late");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T06:01:00")), "breakfast");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T07:30:00")), "breakfast");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T10:00:00")), "breakfast");

  // Lunch: 10:01 - 14:00
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T10:01:00")), "lunch");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T12:00:00")), "lunch");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T14:00:00")), "lunch");

  // Afternoon: 14:01 - 17:00
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T14:01:00")), "afternoon");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T15:30:00")), "afternoon");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T17:00:00")), "afternoon");

  // Dinner: 17:01 - 23:00
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T17:01:00")), "dinner");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T19:00:00")), "dinner");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T23:00:00")), "dinner");

  // Late: 23:01 - 06:00
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T23:01:00")), "late");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T23:30:00")), "late");
  assert.equal(detectCurrentMealSession(new Date("2026-10-01T02:00:00")), "late");
});

test("matchesTasteCategory correctly differentiates broth, dry, and veg dishes", () => {
  const bunCha = { name: "Bún chả", price: 50, rarity: 1, image: 3 };
  const comTam = { name: "Cơm tấm", price: 45, rarity: 1, image: 0 };
  const phoBo = { name: "Phở bò", price: 55, rarity: 1, image: 1 };
  const comChay = { name: "Cơm chay", price: 35, rarity: 1, image: 7, veg: true };

  assert.equal(matchesTasteCategory(bunCha, "broth"), true);
  assert.equal(matchesTasteCategory(phoBo, "broth"), true);
  assert.equal(matchesTasteCategory(comTam, "broth"), false);

  assert.equal(matchesTasteCategory(comTam, "dry"), true);
  assert.equal(matchesTasteCategory(phoBo, "dry"), false);

  assert.equal(matchesTasteCategory(comChay, "veg"), true);
  assert.equal(matchesTasteCategory(bunCha, "veg"), false);

  // 'all' category always matches
  assert.equal(matchesTasteCategory(bunCha, "all"), true);
  assert.equal(matchesTasteCategory(comTam, "all"), true);
});

test("city journals contain useful food and drink collections without fabricated required metadata", () => {
  assert.equal(CITY_CHECKLISTS.length, 3);
  const cities = CITY_CHECKLISTS.map((c) => c.cityId);
  assert.deepEqual(cities, ["ha-noi", "da-nang", "ho-chi-minh"]);

  const allIds = CITY_CHECKLISTS.flatMap((city) => city.items.map((item) => item.id));
  assert.equal(new Set(allIds).size, allIds.length, "IDs must be globally unique for the shared saved checklist");

  for (const city of CITY_CHECKLISTS) {
    assert.ok(city.items.filter((item) => item.kind === "food").length >= 18, `${city.cityName} needs at least 18 foods`);
    assert.ok(city.items.filter((item) => item.kind === "drink").length >= 6, `${city.cityName} needs at least 6 drinks`);
    const names = city.items.map((item) => item.name.toLocaleLowerCase("vi").normalize("NFC").trim());
    assert.equal(new Set(names).size, names.length, `${city.cityName} must not inflate its count with duplicate entries`);
    for (const item of city.items) {
      assert.match(item.id, /^[a-z0-9-]+$/);
      assert.ok(item.name.trim());
      assert.ok(["food", "drink"].includes(item.kind), `${item.id} has a supported kind`);
      for (const field of ["signatureSpot", "district", "badge", "priceEstimate", "description", "descriptionEn"]) {
        if (item[field] !== undefined) {
          assert.equal(typeof item[field], "string", `${item.id}.${field} must be text when supplied`);
          assert.ok(item[field].trim(), `${item.id}.${field} must not be an empty placeholder`);
          assert.doesNotMatch(item[field], /^(undefined|null|n\/a|tbd)$/i, `${item.id}.${field} must be useful`);
        }
      }
      if (!/^(hn|dn|hcm)-(?:[1-9]|10)$/.test(item.id)) {
        assert.ok(item.description?.trim(), `${item.id} needs a useful Vietnamese introduction`);
        assert.ok(item.descriptionEn?.trim(), `${item.id} needs its English introduction`);
      }
    }
  }
});

test("the expanded journal retains every legacy saved item identity and drink classification", () => {
  const legacy = {
    hn: ["Phở", "Bún Chả", "Cà Phê Trứng", "Chả Cá", "Bún Đậu", "Phở Cuốn", "Bánh Cuốn", "Bún Ốc", "Nộm", "Xôi"],
    dn: ["Mì Quảng", "Bánh Tráng Cuốn", "Bún Chả Cá", "Bánh Xèo", "Cà Phê Muối", "Cơm Gà", "Gỏi Cá", "Bún Mắm", "Bánh Tráng Kẹp", "Chè"],
    hcm: ["Cơm Tấm", "Bánh Mì", "Hủ Tiếu", "Cà Phê Sữa", "Phá Lấu", "Bột Chiên", "Ốc", "Bánh Tráng Trộn", "Bánh Canh", "Chè"],
  };
  const byId = new Map(CITY_CHECKLISTS.flatMap((city) => city.items.map((item) => [item.id, item])));
  for (const [prefix, names] of Object.entries(legacy)) {
    names.forEach((name, index) => {
      const id = `${prefix}-${index + 1}`;
      const item = byId.get(id);
      assert.ok(item, `Saved legacy item ${id} must not disappear`);
      assert.ok(item.name.toLocaleLowerCase("vi").includes(name.toLocaleLowerCase("vi")), `${id} must still represent ${name}`);
    });
  }
  for (const id of ["hn-3", "dn-5", "hcm-4"]) {
    assert.equal(byId.get(id).kind, "drink", `Saved coffee ${id} belongs in the drinks filter`);
  }
});

test("getTasteCategoriesForMealKind returns configured taste categories for each mealKind", () => {
  const lunchCats = getTasteCategoriesForMealKind("lunch");
  assert.equal(lunchCats.length, 3);
  assert.deepEqual(lunchCats.map((c) => c.id), ["dry", "broth", "veg"]);

  const drinkCats = getTasteCategoriesForMealKind("drink");
  assert.equal(drinkCats.length, 4);
  assert.deepEqual(drinkCats.map((c) => c.id), ["coffee", "milktea", "fruittea", "juice"]);

  const snackCats = getTasteCategoriesForMealKind("snack");
  assert.equal(snackCats.length, 4);
  assert.deepEqual(snackCats.map((c) => c.id), ["fried", "mixed", "sweet", "savory"]);

  const nhauCats = getTasteCategoriesForMealKind("nhau");
  assert.equal(nhauCats.length, 4);
  assert.deepEqual(nhauCats.map((c) => c.id), ["grill", "stirfry", "hotpot", "nibble"]);
});

test("filterFoodsByTastes supports multi-select across different tastes and meal kinds", () => {
  const drinks = [
    { name: "Cà phê sữa đá", price: 25, rarity: 1, image: 1 },
    { name: "Trà sữa trân châu đường đen", price: 40, rarity: 1, image: 2 },
    { name: "Trà đào cam sả", price: 35, rarity: 1, image: 3 },
    { name: "Sinh tố bơ", price: 35, rarity: 1, image: 4 },
  ];

  // Empty or "all" returns all
  assert.equal(filterFoodsByTastes(drinks, [], "drink").length, 4);
  assert.equal(filterFoodsByTastes(drinks, ["all"], "drink").length, 4);

  // Single select
  const coffeeOnly = filterFoodsByTastes(drinks, ["coffee"], "drink");
  assert.equal(coffeeOnly.length, 1);
  assert.equal(coffeeOnly[0].name, "Cà phê sữa đá");

  // Multi-select: coffee + milktea
  const combo = filterFoodsByTastes(drinks, ["coffee", "milktea"], "drink");
  assert.equal(combo.length, 2);
  assert.ok(combo.some((d) => d.name === "Cà phê sữa đá"));
  assert.ok(combo.some((d) => d.name === "Trà sữa trân châu đường đen"));

  // Nhậu multi-select: grill + hotpot
  const pubDishes = [
    { name: "Bò nướng tảng", price: 120, rarity: 1, image: 1 },
    { name: "Lẩu thái chua cay", price: 180, rarity: 1, image: 2 },
    { name: "Rau muống xào tỏi", price: 45, rarity: 1, image: 3 },
    { name: "Đậu phộng rang tỏi ớt", price: 25, rarity: 1, image: 4 },
  ];
  const pubCombo = filterFoodsByTastes(pubDishes, ["grill", "hotpot"], "nhau");
  assert.equal(pubCombo.length, 2);
  assert.ok(pubCombo.some((d) => d.name === "Bò nướng tảng"));
  assert.ok(pubCombo.some((d) => d.name === "Lẩu thái chua cay"));
});
