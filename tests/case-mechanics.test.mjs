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
  const { createSpinProfile } = createRequire(import.meta.url)(
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
} finally {
  rmSync(out, { recursive: true, force: true });
}
