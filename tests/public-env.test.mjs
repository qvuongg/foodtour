import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { cpSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const out = mkdtempSync(join(tmpdir(), "foodtour-public-env-"));
test.after(() => rmSync(out, { recursive: true, force: true }));
buildSync({
  entryPoints: [join(root, "src/lib/public-env.ts")],
  outfile: join(out, "public-env.mjs"),
  bundle: true,
  format: "esm",
});
const { assertSafePublicEnvironment, readPublicSupabaseConfig, publicSupabaseHeaders } =
  await import(pathToFileURL(join(out, "public-env.mjs")));

// Deliberately synthetic and unusable: these JWTs have no valid cryptographic signature.
const jwt = (role) => [
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
  Buffer.from(JSON.stringify({ role, iss: "unit-test-only" })).toString("base64url"),
  Buffer.from("not-a-valid-signature").toString("base64url"),
].join(".");
const anon = jwt("anon");
const service = jwt("service_role");
const url = "https://unit-test-only.supabase.co";
const config = (key) => ({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key });

test("public environment accepts only anon JWT / publishable Supabase keys", () => {
  for (const key of [anon, "sb_publishable_unit_test_only"]) {
    assert.doesNotThrow(() => assertSafePublicEnvironment(config(key)));
    assert.equal(readPublicSupabaseConfig(config(key)).key, key);
  }
  for (const key of [service, jwt("authenticated"), jwt("admin"), "sb_secret_unit_test_only", "malformed.jwt", "arbitrary"]) {
    assert.throws(() => assertSafePublicEnvironment(config(key)));
    assert.equal(readPublicSupabaseConfig(config(key)), null);
  }
});

test("guard scans arbitrary VITE_ names and embedded server credentials without logging them", () => {
  for (const value of [service, `Bearer ${service}`, JSON.stringify({ key: service }), "sb_secret_unit_test_only"]) {
    const env = { VITE_UNEXPECTED_NAME: value };
    assert.throws(() => assertSafePublicEnvironment(env), (error) => {
      assert.match(error.message, /Unsafe public environment/);
      assert.ok(!error.message.includes(value));
      assert.ok(!error.message.includes(service));
      assert.ok(!error.message.includes("sb_secret_"));
      return true;
    });
    assert.equal(readPublicSupabaseConfig({ ...config(anon), ...env }), null);
  }
});

test("public values cannot copy opaque private keys; private-only keys are not exposed", () => {
  const privateValue = "opaque-unit-test-server-credential";
  const env = { SUPABASE_SERVICE_ROLE_KEY: privateValue, ...config(anon) };
  assert.doesNotThrow(() => assertSafePublicEnvironment(env));
  for (const value of [privateValue, JSON.stringify({ key: privateValue })]) {
    assert.throws(() => assertSafePublicEnvironment({ ...env, VITE_MISC: value }), /Unsafe public environment/);
  }
  assert.doesNotThrow(() => assertSafePublicEnvironment({ ...config(anon), UNUSED_PASSWORD: "a" }));
});

test("absent, partial or invalid Supabase configuration fails closed with no project URL fallback", () => {
  assert.doesNotThrow(() => assertSafePublicEnvironment({}));
  assert.equal(readPublicSupabaseConfig({}), null);
  for (const env of [
    { VITE_SUPABASE_URL: url }, { VITE_SUPABASE_ANON_KEY: anon },
    config(""), { ...config(anon), VITE_SUPABASE_URL: "not a URL" },
    { ...config(anon), VITE_SUPABASE_URL: "http://public-host.example" },
    { ...config(anon), VITE_SUPABASE_URL: `${url}/rest/v1` },
    { ...config(anon), VITE_SUPABASE_URL: `${url}?secret=unit-test` },
    { ...config(anon), VITE_SUPABASE_URL: "https://user:pass@example.com" },
  ]) {
    assert.throws(() => assertSafePublicEnvironment(env));
    assert.equal(readPublicSupabaseConfig(env), null);
  }
  const local = readPublicSupabaseConfig({ ...config(anon), VITE_SUPABASE_URL: "http://127.0.0.1:54321/" });
  assert.equal(local.url, "http://127.0.0.1:54321");
});

test("REST auth uses JWT Bearer only for legacy anon; publishable uses apikey only", () => {
  assert.deepEqual(publicSupabaseHeaders(readPublicSupabaseConfig(config(anon))), {
    apikey: anon, Authorization: `Bearer ${anon}`,
  });
  assert.deepEqual(publicSupabaseHeaders(readPublicSupabaseConfig(config("sb_publishable_unit_test_only"))), {
    apikey: "sb_publishable_unit_test_only",
  });
});

async function clientWithEnvironment(env, suffix) {
  const file = join(out, `client-${suffix}.mjs`);
  buildSync({
    entryPoints: [join(root, "src/lib/supabase-client.ts")],
    outfile: file,
    bundle: true,
    format: "esm",
    define: { "import.meta.env": JSON.stringify(env) },
  });
  return import(pathToFileURL(file));
}

test("runtime backup makes no DB request if public config is invalid or absent", async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error("No request expected"); };
  try {
    let index = 0;
    for (const env of [{}, config(service), config("sb_secret_unit_test_only"), { VITE_SUPABASE_ANON_KEY: anon }]) {
      const client = await clientWithEnvironment(env, index++);
      assert.equal(client.isSupabaseConfigured(), false);
      assert.deepEqual(await client.fetchNearbyRestaurantsFromDb("Phở", 16, 108), []);
      assert.deepEqual(await client.fetchTopRestaurantsFromDb("Phở"), []);
      assert.deepEqual(await client.fetchDistrictDrinkSpotsFromDb("Hải Châu"), []);
    }
    assert.equal(requests, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("all DB calls preserve public-key auth headers without reaching a real database", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (target, options) => {
    requests.push({ target, ...options });
    return { ok: true, json: async () => [] };
  };
  try {
    for (const [index, key] of [anon, "sb_publishable_unit_test_only"].entries()) {
      requests.length = 0;
      const client = await clientWithEnvironment(config(key), `valid-${index}`);
      assert.equal(client.isSupabaseConfigured(), true);
      await client.fetchNearbyRestaurantsFromDb("Phở", 16, 108);
      await client.fetchTopRestaurantsFromDb("Phở");
      await client.fetchDistrictDrinkSpotsFromDb("Hải Châu");
      assert.equal(requests.length, 3);
      for (const request of requests) {
        assert.ok(request.target.startsWith(`${url}/rest/v1/`));
        assert.equal(request.headers.apikey, key);
        assert.equal(request.headers.Authorization, key === anon ? `Bearer ${anon}` : undefined);
      }
    }
  } finally { globalThis.fetch = originalFetch; }
});

// Resolve the actual app's Vite config in a separate fixture/process: no .env.local or shell secrets are loaded.
function resolveVite(command, envContents, injected = {}, overrideEnvContents) {
  const fixture = mkdtempSync(join(out, "vite-fixture-"));
  mkdirSync(join(fixture, "src/lib"), { recursive: true });
  cpSync(join(root, "vite.config.ts"), join(fixture, "vite.config.ts"));
  cpSync(join(root, "src/lib/public-env.ts"), join(fixture, "src/lib/public-env.ts"));
  symlinkSync(join(root, "node_modules"), join(fixture, "node_modules"), "dir");
  writeFileSync(join(fixture, "package.json"), '{"type":"module"}');
  writeFileSync(join(fixture, ".env"), envContents);
  let envDir;
  if (overrideEnvContents !== undefined) {
    envDir = join(fixture, "override-env");
    mkdirSync(envDir);
    writeFileSync(join(envDir, ".env"), overrideEnvContents);
  }
  const source = `
    import { resolveConfig } from ${JSON.stringify(pathToFileURL(join(root, "node_modules/vite/dist/node/index.js")).href)};
    try {
      await resolveConfig({ root: ${JSON.stringify(fixture)}, configFile: ${JSON.stringify(join(fixture, "vite.config.ts"))}, envDir: ${JSON.stringify(envDir)}, logLevel: "silent" }, ${JSON.stringify(command)});
      process.exit(0);
    } catch (error) { process.stderr.write(error.message); process.exit(1); }
  `;
  return spawnSync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: fixture, encoding: "utf8", timeout: 30000,
    env: { PATH: process.env.PATH, ...injected },
  });
}

for (const command of ["serve", "build"]) {
  test(`real Vite ${command} guard rejects exposed credentials from dotenv and shell`, () => {
    for (const [contents, injected] of [
      [`VITE_ANY_NAME=${service}\n`, {}],
      ["", { VITE_ANY_NAME: "sb_secret_unit_test_only" }],
      ["SERVER_SECRET=opaque-unit-test-private-key\nVITE_OTHER=$SERVER_SECRET\n", {}],
    ]) {
      const result = resolveVite(command, contents, injected);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unsafe public environment/);
      assert.ok(!result.stderr.includes(service));
      assert.ok(!result.stderr.includes("sb_secret_unit_test_only"));
      assert.ok(!result.stderr.includes("opaque-unit-test-private-key"));
    }
  });
  test(`real Vite ${command} accepts anon and publishable public config`, () => {
    for (const key of [anon, "sb_publishable_unit_test_only"]) {
      const result = resolveVite(command, `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${key}\n`);
      assert.equal(result.status, 0, result.stderr);
    }
  });
  test(`real Vite ${command} also guards overridden envDir`, () => {
    const result = resolveVite(command, "", {}, "SERVER_SECRET=opaque-unit-test-private-key\nVITE_OTHER=$SERVER_SECRET\n");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unsafe public environment/);
    assert.ok(!result.stderr.includes("opaque-unit-test-private-key"));
  });
}
