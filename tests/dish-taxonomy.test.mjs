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
  TASTE_CATEGORIES,
  MEAL_SESSIONS,
} = createRequire(import.meta.url)(join(out, "taxonomy.cjs"));

const { CITY_CHECKLISTS } = createRequire(import.meta.url)(join(out, "checklist.cjs"));

test("detectCurrentMealSession recognizes proper session based on hours", () => {
  const d7 = new Date("2026-10-01T07:30:00");
  assert.equal(detectCurrentMealSession(d7), "breakfast");

  const d12 = new Date("2026-10-01T12:00:00");
  assert.equal(detectCurrentMealSession(d12), "lunch");

  const d15 = new Date("2026-10-01T15:30:00");
  assert.equal(detectCurrentMealSession(d15), "afternoon");

  const d19 = new Date("2026-10-01T19:00:00");
  assert.equal(detectCurrentMealSession(d19), "dinner");

  const d23 = new Date("2026-10-01T23:30:00");
  assert.equal(detectCurrentMealSession(d23), "late");
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
