import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "streak-test-"));

buildSync({
  entryPoints: ["src/lib/foodie-streak.ts"],
  outfile: join(out, "streak.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
});

const {
  FLAME_TIERS,
  getFlameTier,
  getNextTierProgress,
  addSpinStreak,
  addChecklistStreak,
} = createRequire(import.meta.url)(join(out, "streak.cjs"));

test("FLAME_TIERS contains correct tier progression", () => {
  assert.equal(FLAME_TIERS.length, 4);
  assert.equal(FLAME_TIERS[0].id, "starter");
  assert.equal(FLAME_TIERS[1].id, "red");
  assert.equal(FLAME_TIERS[2].id, "blue");
  assert.equal(FLAME_TIERS[3].id, "purple");

  // User spec: 3 - 99 is red, 100 - 199 is blue, 200+ is purple
  assert.equal(FLAME_TIERS[1].minScore, 3);
  assert.equal(FLAME_TIERS[1].maxScore, 99);
  assert.equal(FLAME_TIERS[2].minScore, 100);
  assert.equal(FLAME_TIERS[2].maxScore, 199);
  assert.equal(FLAME_TIERS[3].minScore, 200);
});

test("getFlameTier maps scores accurately according to product rules", () => {
  assert.equal(getFlameTier(0).id, "starter");
  assert.equal(getFlameTier(2).id, "starter");

  // Red tier: 3 to 99
  assert.equal(getFlameTier(3).id, "red");
  assert.equal(getFlameTier(50).id, "red");
  assert.equal(getFlameTier(99).id, "red");

  // Blue tier: 100 to 199
  assert.equal(getFlameTier(100).id, "blue");
  assert.equal(getFlameTier(150).id, "blue");
  assert.equal(getFlameTier(199).id, "blue");

  // Purple tier: 200+
  assert.equal(getFlameTier(200).id, "purple");
  assert.equal(getFlameTier(999).id, "purple");
});

test("getNextTierProgress calculates progress percentages and points needed", () => {
  // At score 3 (Red tier start), needs 97 to reach blue (100)
  const p3 = getNextTierProgress(3);
  assert.equal(p3.currentTier.id, "red");
  assert.equal(p3.nextTier.id, "blue");
  assert.equal(p3.progressPercent, 0);
  assert.equal(p3.pointsNeeded, 97);

  // At score 100 (Blue tier start), needs 100 to reach purple (200)
  const p100 = getNextTierProgress(100);
  assert.equal(p100.currentTier.id, "blue");
  assert.equal(p100.nextTier.id, "purple");
  assert.equal(p100.progressPercent, 0);
  assert.equal(p100.pointsNeeded, 100);

  // At score 250 (Purple tier), already max tier
  const p250 = getNextTierProgress(250);
  assert.equal(p250.currentTier.id, "purple");
  assert.equal(p250.nextTier, null);
  assert.equal(p250.progressPercent, 100);
});
