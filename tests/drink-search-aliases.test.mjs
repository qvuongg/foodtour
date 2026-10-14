import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "tnag-drink-aliases-"));
buildSync({
  entryPoints: ["src/lib/drink-search-aliases.ts"],
  outfile: join(out, "drink-search-aliases.mjs"),
  bundle: true,
  format: "esm",
});

const {
  DRINK_SEARCH_ALIASES,
  getDrinkSearchAliases,
  isDrinkMatchingQuery,
} = await import(pathToFileURL(join(out, "drink-search-aliases.mjs")).href);

test("DRINK_SEARCH_ALIASES has extensive coverage across categories", () => {
  const keys = Object.keys(DRINK_SEARCH_ALIASES);
  assert.ok(keys.length >= 35, `Expected >= 35 drinks with aliases, got ${keys.length}`);

  for (const [drink, aliases] of Object.entries(DRINK_SEARCH_ALIASES)) {
    assert.ok(drink.length > 0, "Drink name must not be empty");
    assert.ok(Array.isArray(aliases), "Aliases must be an array");
    assert.ok(aliases.length >= 1, `Drink "${drink}" must have at least 1 alias`);
    assert.ok(aliases[0] === drink, `First alias for "${drink}" should match the drink name`);
  }
});

test("Cold Brew aliases contain expected specialty variants", () => {
  const aliases = getDrinkSearchAliases("Cold Brew");
  assert.ok(aliases.includes("Cold Brew"));
  assert.ok(aliases.includes("Coldbrew"));
  assert.ok(aliases.includes("Specialty Coffee"));
  assert.ok(aliases.includes("Cà phê ủ lạnh"));
  assert.ok(aliases.includes("Nitro Cold Brew"));
});

test("Cookie đá xay aliases contain Oreo and Freeze variants", () => {
  const aliases = getDrinkSearchAliases("Cookie đá xay");
  assert.ok(aliases.includes("Cookie đá xay"));
  assert.ok(aliases.includes("Oreo đá xay"));
  assert.ok(aliases.includes("Freeze bánh quy"));
  assert.ok(aliases.includes("Bánh quy kem đá xay"));
  assert.ok(aliases.includes("Cookies and cream"));
});

test("getDrinkSearchAliases handles unconfigured drinks gracefully", () => {
  const aliases = getDrinkSearchAliases("Món Nước Lạ 123");
  assert.deepEqual(aliases, ["Món Nước Lạ 123"]);
});

test("getDrinkSearchAliases handles lowercase and unaccented names", () => {
  const aliasesLower = getDrinkSearchAliases("cold brew");
  assert.ok(aliasesLower.includes("Cold Brew"));

  const aliasesNoAccent = getDrinkSearchAliases("ca phe muoi");
  assert.ok(aliasesNoAccent.includes("Cà phê muối"));
});

test("isDrinkMatchingQuery accurately identifies aliases", () => {
  assert.ok(isDrinkMatchingQuery("Cold Brew", "Specialty Coffee"));
  assert.ok(isDrinkMatchingQuery("Cold Brew", "cà phê ủ lạnh"));
  assert.ok(isDrinkMatchingQuery("Cookie đá xay", "Oreo đá xay"));
  assert.ok(isDrinkMatchingQuery("Cookie đá xay", "freeze bánh quy"));
  assert.ok(isDrinkMatchingQuery("Cà phê muối", "cafe kem muối"));
  assert.ok(isDrinkMatchingQuery("Trà đào cam sả", "trà đào"));
  assert.ok(isDrinkMatchingQuery("Nước ép dứa", "nước ép thơm"));

  // Non-matching
  assert.ok(!isDrinkMatchingQuery("Cold Brew", "Bún bò Huế"));
  assert.ok(!isDrinkMatchingQuery("Nước ép cam", "Trà sữa khoai môn"));
});
