import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getMaintenanceUrl } from "../scripts/lib/maintenance-url.mjs";
import { loadMaintenanceEnvFile } from "../scripts/lib/maintenance-env-file.mjs";

test("maintenance URL requires an explicit HTTPS origin and never falls back to a project", () => {
  assert.equal(getMaintenanceUrl({ SUPABASE_URL: "https://fixture.supabase.co/" }), "https://fixture.supabase.co");
  assert.equal(getMaintenanceUrl({ VITE_SUPABASE_URL: "https://fixture.supabase.co" }), "https://fixture.supabase.co");
  for (const value of ["", "http://fixture.supabase.co", "file:///tmp/fixture", "malformed", "https://fixture.supabase.co/rest/v1", "https://user:unit-test-secret@fixture.supabase.co", "https://fixture.supabase.co?key=unit-test-secret", "https://fixture.supabase.co#unit-test-secret"]) {
    assert.throws(() => getMaintenanceUrl({ SUPABASE_URL: value }), (error) => {
      assert.ok(!error.message.includes("unit-test-secret"));
      assert.ok(!value || !error.message.includes(value));
      return true;
    });
  }
  assert.throws(() => getMaintenanceUrl({}), /requires/);
});

test("maintenance dotenv preserves shell configuration across credential and URL aliases", () => {
  const directory = mkdtempSync(join(tmpdir(), "foodtour-maintenance-env-"));
  const file = join(directory, ".env.local");
  try {
    writeFileSync(file, [
      "SUPABASE_SECRET_KEY=sb_secret_stale_fixture",
      "SUPABASE_SERVICE_ROLE_KEY=old-fixture-value",
      "SUPABASE_URL=https://old-fixture.supabase.co",
      "VITE_SUPABASE_URL=https://old-fixture.supabase.co",
      "OTHER_VAR=from-file",
      'QUOTED_VAR="quoted value"',
      "# ignored comment",
      "INVALID NAME=ignore",
    ].join("\n"));
    const env = {
      SUPABASE_SERVICE_ROLE_KEY: "new-fixture-value",
      VITE_SUPABASE_URL: "https://new-fixture.supabase.co",
      OTHER_VAR: "",
    };
    loadMaintenanceEnvFile(file, env);
    assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, "new-fixture-value");
    assert.equal(env.SUPABASE_SECRET_KEY, undefined);
    assert.equal(env.SUPABASE_URL, undefined);
    assert.equal(getMaintenanceUrl(env), "https://new-fixture.supabase.co");
    assert.equal(env.OTHER_VAR, "");
    assert.equal(env.QUOTED_VAR, "quoted value");
    assert.equal(env["INVALID NAME"], undefined);

    const blankShell = { SUPABASE_SECRET_KEY: "", SUPABASE_URL: "" };
    loadMaintenanceEnvFile(file, blankShell);
    assert.equal(blankShell.SUPABASE_SERVICE_ROLE_KEY, undefined);
    assert.equal(blankShell.VITE_SUPABASE_URL, undefined);
    assert.throws(() => getMaintenanceUrl(blankShell), /requires/);

    const fileOnly = {};
    loadMaintenanceEnvFile(file, fileOnly);
    assert.equal(fileOnly.SUPABASE_SECRET_KEY, "sb_secret_stale_fixture");
    assert.equal(getMaintenanceUrl(fileOnly), "https://old-fixture.supabase.co");
    assert.doesNotThrow(() => loadMaintenanceEnvFile(join(directory, "missing"), {}));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

// Inspect these executable scripts without importing them: imports would invoke live maintenance.
for (const name of ["clean-all-dishes.mjs", "link-drink-restaurants.mjs", "push-new-dishes-supabase.mjs", "export-top-affiliate-batch.mjs", "sync-restaurant-dishes-matrix.mjs"]) {
  test(`${name} has no public-key/project fallback and every request uses validated private headers`, () => {
    const source = readFileSync(new URL(`../scripts/${name}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /VITE_SUPABASE_ANON_KEY|https:\/\/[a-z]+\.supabase\.co|Authorization\s*:/);
    assert.match(source, /loadMaintenanceEnvFile\(\)/);
    assert.match(source, /getMaintenanceUrl\(\)/);
    assert.match(source, /getMaintenanceKey\(process\.env,\s*\{\s*required:\s*true\s*\}\)/);
    assert.equal((source.match(/getMaintenanceHeaders\(KEY\)/g) ?? []).length, (source.match(/\bfetch\(/g) ?? []).length);
  });
}
