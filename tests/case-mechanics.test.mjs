import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "tnag-case-"));
try {
  buildSync({
    entryPoints: ["src/lib/case-mechanics.ts"],
    outfile: join(out, "case.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  buildSync({
    entryPoints: ["src/lib/spotlight-motion.ts"],
    outfile: join(out, "spotlight.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  const { spotlightProgress } = createRequire(import.meta.url)(
    join(out, "spotlight.cjs"),
  );
  test("spotlight motion moves forward, joins smoothly and settles exactly on its winner", () => {
    assert.equal(spotlightProgress(0), 0);
    assert.equal(spotlightProgress(1), 1);
    let previous = 0;
    for (let i = 1; i <= 1000; i++) {
      const value = spotlightProgress(i / 1000);
      assert.ok(value >= previous && value <= 1);
      previous = value;
    }
    for (const boundary of [0.12, 0.36]) {
      const h = 1e-6;
      const left =
        (spotlightProgress(boundary) - spotlightProgress(boundary - h)) / h;
      const right =
        (spotlightProgress(boundary + h) - spotlightProgress(boundary)) / h;
      assert.ok(Math.abs(left - right) < 0.001);
    }
    assert.ok(spotlightProgress(0.001) / 0.001 < 0.01);
    assert.ok((1 - spotlightProgress(0.999)) / 0.001 < 0.01);
  });
  const { createSpinProfile, generateReelFillers } = createRequire(import.meta.url)(
    join(out, "case.cjs"),
  );
  test("normal motion keeps the deliberate case-opening pace", () => {
    const profile = createSpinProfile(() => 0.5, false);
    assert.deepEqual(profile, { durationMs: 8500, tiles: 35, friction: 3 });
  });
  test("reduced motion remains readable instead of becoming an instant Windows spin", () => {
    const profile = createSpinProfile(() => 0.5, true);
    assert.deepEqual(profile, { durationMs: 4500, tiles: 12, friction: 3 });
  });
  test("generateReelFillers prevents adjacent duplicate cards and winner clones around the landing tile", () => {
    const pool = [
      { name: "Cappuccino", image: 502, price: 55 },
      { name: "Latte", image: 503, price: 55 },
      { name: "Cà phê đen", image: 500, price: 25 },
      { name: "Cà phê sữa đá", image: 501, price: 30 },
      { name: "Trà đào", image: 510, price: 35 },
    ];
    const winner = pool[0]; // Cappuccino
    const winnerSlot = 30;
    const totalLength = 45;

    // Simulate heavily skewed picker that always wants to return Cappuccino 80% of the time
    const heavilySkewedPicker = () => {
      return Math.random() < 0.8 ? pool[0] : pool[Math.floor(Math.random() * pool.length)];
    };

    for (let run = 0; run < 50; run++) {
      const fillers = generateReelFillers(
        pool,
        winner,
        totalLength,
        winnerSlot,
        heavilySkewedPicker,
      );

      assert.equal(fillers.length, totalLength);

      // Invariant 1: No adjacent elements are ever the same
      for (let i = 1; i < fillers.length; i++) {
        assert.notEqual(
          fillers[i].image,
          fillers[i - 1].image,
          `Adjacent duplicate detected at indices ${i - 1} and ${i}: ${fillers[i].name}`,
        );
      }

      // Invariant 2: Tiles directly adjacent to winner (winnerSlot ± 2) must NEVER be the winner
      for (let offset = -2; offset <= 2; offset++) {
        const slot = winnerSlot + offset;
        if (slot >= 0 && slot < fillers.length && slot !== winnerSlot) {
          assert.notEqual(
            fillers[slot].image,
            winner.image,
            `Winner clone found in near-miss zone at index ${slot}: ${fillers[slot].name}`,
          );
        }
      }
    }
  });
} finally {
  rmSync(out, { recursive: true, force: true });
}
