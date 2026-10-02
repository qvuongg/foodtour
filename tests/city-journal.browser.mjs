/**
 * Mobile city journal regression checks. Start the local Vite server, then run:
 *   node tests/city-journal.browser.mjs
 *   FOODTOUR_QA_ENGINES=chromium,webkit node tests/city-journal.browser.mjs
 * Every context uses isolated test progress. External traffic is blocked and no
 * affiliate/order link, sharing action or user profile is exercised.
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import { chromium, webkit } from "playwright";

const bundle = join(mkdtempSync(join(tmpdir(), "journal-browser-")), "catalog.cjs");
buildSync({ entryPoints: ["src/lib/city-checklist.ts"], outfile: bundle, bundle: true, platform: "node", format: "cjs" });
const { CITY_CHECKLISTS, CHECKLIST_STORAGE_KEY } = createRequire(import.meta.url)(bundle);
const baseURL = process.env.FOODTOUR_QA_URL || "http://127.0.0.1:5173";
const origin = new URL(baseURL).origin;
const engines = (process.env.FOODTOUR_QA_ENGINES || "chromium").split(",").map((s) => s.trim());
const output = resolve("artifacts/foodie-pet-v2/journal-qa");
const petKey = "foodtour_foodie_streak_v1";
const progressKey = "foodtour_foodie_progress_v2";
const seededChecked = ["hn-3", "dn-5", "hcm-4"];
const trigger = '.main-menu-trigger';
const sheet = ".local-checklist";
const rows = ".checklist-item-card";
const toggles = ".checklist-item-toggle";
const details = ".checklist-item-details";
const reports = [];
const scenarioFilter = process.env.FOODTOUR_QA_FILTER ? new RegExp(process.env.FOODTOUR_QA_FILTER, "i") : null;
await mkdir(output, { recursive: true });

async function fixture(browser, { width = 390, height = 844, language = "vi" } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, reducedMotion: "reduce", locale: language === "vi" ? "vi-VN" : "en-US",
    timezoneId: "Asia/Ho_Chi_Minh" });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin === origin || ["data:", "blob:"].includes(url.protocol)
      ? route.continue() : route.abort("blockedbyclient");
  });
  await context.addCookies([{ name: "tnag-community-v1-language", value: encodeURIComponent(JSON.stringify(language)), url: origin }]);
  await context.addInitScript(({ petKey, checklistKey, checked }) => {
    if (sessionStorage.getItem("city-journal-qa-seeded")) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    localStorage.setItem(petKey, JSON.stringify({ score: 90, dailyStreak: 7, lastActiveDate: today,
      totalSpins: 12, totalChecklistTested: checked.length, petName: "Bé Há Mồm" }));
    localStorage.setItem(checklistKey, JSON.stringify(checked));
    sessionStorage.setItem("city-journal-qa-seeded", "1");
  }, { petKey, checklistKey: CHECKLIST_STORAGE_KEY, checked: seededChecked });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction((language) => document.documentElement.lang === language, language);
  await page.waitForFunction(() => document.querySelector(".open-button") && !document.querySelector(".open-button").disabled);
  return { page, context, errors };
}

async function score(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).xp, progressKey);
}

async function assertScore(page, expected) {
  await page.waitForFunction(({ key, expected }) => JSON.parse(localStorage.getItem(key))?.xp === expected,
    { key: progressKey, expected });
  assert.equal(await score(page), expected);
}

async function openJournal(page) {
  await page.locator(trigger).click();
  await page.locator('[data-destination="checklist"]').click();
  await page.locator(sheet).waitFor({ state: "visible" });
  await page.waitForFunction(() => document.activeElement?.classList.contains("menu-detail-back"));
}

async function closeJournal(page) {
  await page.keyboard.press("Escape");
  await page.locator(sheet).waitFor({ state: "hidden" });
  await page.waitForFunction((selector) => document.activeElement === document.querySelector(selector), trigger);
}

async function assertTouchTarget(locator, label) {
  const box = await locator.boundingBox();
  assert(box && box.width >= 43.5 && box.height >= 43.5, `${label} needs at least a 44px touch target: ${JSON.stringify(box)}`);
}

async function assertNoHorizontalOverflow(page) {
  const measure = await page.evaluate(() => {
    const popup = document.querySelector(".local-checklist");
    const body = document.querySelector(".menu-hub-body");
    const rect = popup.getBoundingClientRect();
    return { viewport: innerWidth, root: document.documentElement.scrollWidth, bodyClient: body.clientWidth,
      bodyScroll: body.scrollWidth, popupClient: popup.clientWidth, popupScroll: popup.scrollWidth, left: rect.left, right: rect.right };
  });
  assert(measure.root <= measure.viewport + 1 && measure.bodyScroll <= measure.bodyClient + 1 &&
    measure.popupScroll <= measure.popupClient + 1 && measure.left >= -1 && measure.right <= measure.viewport + 1,
  `Journal must not overflow horizontally: ${JSON.stringify(measure)}`);
}

async function chooseKind(page, kind) {
  const tab = page.locator(`.checklist-kind-tabs [data-kind="${kind}"]`);
  await tab.click();
  assert.equal(await tab.getAttribute("aria-pressed"), "true");
}

async function expectNames(page, expected) {
  const actual = await page.locator(".checklist-item-name").allTextContents();
  assert.deepEqual(actual, expected.map((item) => item.name));
}

async function testCase(browser, engine, name, options, run) {
  if (scenarioFilter && !scenarioFilter.test(name)) return;
  const start = Date.now();
  let data;
  try {
    data = await fixture(browser, options);
    await run(data.page);
    assert.deepEqual(data.errors, [], "No browser runtime errors");
    reports.push({ engine, name, passed: true, durationMs: Date.now() - start });
    console.log(`PASS [${engine}] ${name}`);
  } catch (error) {
    const screenshot = `${engine}-${name.replaceAll(/[^a-z0-9]+/gi, "-")}-failure-fixture.png`;
    await data?.page.screenshot({ path: resolve(output, screenshot), fullPage: false }).catch(() => {});
    reports.push({ engine, name, passed: false, error: error.message, stack: error.stack, screenshot, durationMs: Date.now() - start });
    console.error(`FAIL [${engine}] ${name}: ${error.message}`);
  } finally {
    await data?.context.close();
  }
}

for (const engine of engines) {
  const browserType = { chromium, webkit }[engine];
  assert(browserType, `Unsupported FOODTOUR_QA_ENGINES value: ${engine}`);
  let browser;
  try {
    browser = await browserType.launch();
    for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932]]) {
      await testCase(browser, engine, `compact journal ${width}x${height}`, { width, height }, async (page) => {
        const cta = await page.locator(".open-button").boundingBox();
        assert(cta && cta.y + cta.height <= height + 1, "Spin CTA stays in the initial mobile viewport");
        await openJournal(page);
        await assertNoHorizontalOverflow(page);
        await assertTouchTarget(page.locator(".compact-main-menu .menu-close"), "Close button");
        const header = await page.locator(".menu-hub-header").boundingBox();
        assert(header.y >= 0 && header.y + header.height <= height, "Sheet close/header stays fully visible");
        const first = await page.locator(rows).first().boundingBox();
        if (height >= 844) assert(first.y + first.height <= height - 12, "At least the first full journal row is visible on opening at 390x844+");
        assert.equal(await page.locator(".checklist-pet-hero").count(), 0, "Journal dedicates space to the dish list");
        assert.equal(await page.locator(".pet-home:visible").count(), 0, "Only one companion dialog is shown");
        for (const control of [".checklist-city-tab", ".checklist-kind-tabs button", ".checklist-status-select", toggles, `${details} summary`]) {
          for (const target of await page.locator(control).all()) await assertTouchTarget(target, control);
        }
        const heights = await page.locator(rows).evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().height));
        assert(Math.max(...heights) <= 60, `Collapsed rows remain compact, even for long names: ${JSON.stringify(heights)}`);
        assert(await page.locator(".checklist-status-select").evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 16),
          "The native status control prevents iOS focus zoom");
        assert.equal(await page.locator(`${details}[open]`).count(), 0, "Rows initially hide optional information");
        for (const link of await page.locator(`${details} a`).all()) assert.equal(await link.isVisible(), false, "Order links stay hidden in collapsed details");
        await page.screenshot({ path: resolve(output, `${engine}-${width}x${height}-journal-fixture.png`), fullPage: false });
        await closeJournal(page);
      });
    }

    await testCase(browser, engine, "food drink and status filters across all cities", {}, async (page) => {
      await openJournal(page);
      for (const [index, city] of CITY_CHECKLISTS.entries()) {
        await page.locator(".checklist-city-tab").nth(index).click();
        assert.equal(await page.locator(".checklist-city-tab").nth(index).getAttribute("aria-pressed"), "true");
        const progress = page.locator(".checklist-city-track");
        assert.equal(await progress.getAttribute("aria-valuemax"), String(city.items.length));
        assert.equal(await progress.getAttribute("aria-valuenow"), "1", "City progress includes the saved drink even when food is selected");
        for (const kind of ["food", "drink"]) {
          await chooseKind(page, kind);
          for (const status of ["all", "untested", "tested"]) {
            await page.locator(".checklist-status-select").selectOption(status);
            const expected = city.items.filter((item) => item.kind === kind &&
              (status === "all" || seededChecked.includes(item.id) === (status === "tested")));
            await expectNames(page, expected);
            assert.equal(await page.locator(".checklist-empty-state").count(), expected.length === 0 ? 1 : 0);
            await assertNoHorizontalOverflow(page);
          }
        }
      }
      await assertScore(page, 90);
      await closeJournal(page);
    });

    await testCase(browser, engine, "legacy saved drink rewards and reload persistence", {}, async (page) => {
      await openJournal(page);
      await chooseKind(page, "drink");
      await page.locator(".checklist-status-select").selectOption("tested");
      assert.equal(await page.locator(toggles).count(), 1);
      assert.equal(await page.locator(toggles).getAttribute("aria-checked"), "true");
      assert.match(await page.locator(toggles).innerText(), /Cà Phê Trứng/i);
      await page.locator(toggles).click();
      await assertScore(page, 85);
      assert.equal(await page.locator(toggles).count(), 0, "Unchecked drink leaves the Tried view immediately");
      assert.equal(await page.locator(".checklist-empty-state").count(), 1);
      await page.reload({ waitUntil: "networkidle" });
      await assertScore(page, 85);
      assert.deepEqual(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).checkedSpotIds, progressKey), ["dn-5", "hcm-4"]);
      await openJournal(page);
      await chooseKind(page, "drink");
      const coffee = CITY_CHECKLISTS[0].items.find((item) => item.id === "hn-3");
      const checkbox = page.getByRole("checkbox", { name: `Đã thử: ${coffee.name}`, exact: true });
      assert.equal(await checkbox.getAttribute("aria-checked"), "false");
      await checkbox.focus();
      await checkbox.press("Space");
      await assertScore(page, 90);
      assert.equal(await checkbox.getAttribute("aria-checked"), "true");
      await closeJournal(page);
      await page.reload({ waitUntil: "networkidle" });
      await assertScore(page, 90);
      assert.deepEqual((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).checkedSpotIds, progressKey)).sort(), [...seededChecked].sort());
      const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), progressKey);
      assert.deepEqual(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), CHECKLIST_STORAGE_KEY), seededChecked, "Legacy backup remains unchanged");
      assert.equal(state.dailyStreak, 7, "Marking a tried drink does not invent a daily streak");
      assert.equal(state.totalChecklistTested, 3, "Undo/recheck does not double count rewards");
    });

    await testCase(browser, engine, "details disclose information without rewards or navigation", {}, async (page) => {
      await openJournal(page);
      const first = page.locator(rows).first();
      const disclosure = first.locator(details);
      const checkbox = first.locator(toggles);
      const before = await first.boundingBox();
      const addressBefore = page.url();
      assert.equal(await checkbox.getAttribute("aria-checked"), "false");
      await disclosure.locator("summary").click();
      assert.equal(await disclosure.getAttribute("open"), "");
      assert.equal(await checkbox.getAttribute("aria-checked"), "false");
      await assertScore(page, 90);
      const link = disclosure.locator("a");
      assert.equal(await link.isVisible(), true);
      assert.equal(await link.getAttribute("target"), "_blank");
      assert.match(await link.getAttribute("rel"), /noopener/);
      assert.match(await link.getAttribute("href"), /^https?:\/\//);
      await assertTouchTarget(link, "Expanded find-dish link");
      assert((await first.boundingBox()).height > before.height, "Expanded detail has its own space");
      assert.equal(page.url(), addressBefore);
      assert.equal(page.context().pages().length, 1, "Expanding details never opens an ordering tab");
      await assertNoHorizontalOverflow(page);
      assert.doesNotMatch(await first.innerText(), /undefined|NaN|~\s*$/);
      await page.screenshot({ path: resolve(output, `${engine}-journal-details-fixture.png`), fullPage: false });
      await disclosure.locator("summary").click();
      assert.equal(await disclosure.getAttribute("open"), null);
      await assertScore(page, 90);
      await chooseKind(page, "drink");
      await page.locator(".menu-hub-body").evaluate((node) => { node.scrollTop = Math.max(0, node.scrollTop - 80); });
      await page.screenshot({ path: resolve(output, `${engine}-journal-drinks-fixture.png`), fullPage: false });
      await closeJournal(page);
    });

    await testCase(browser, engine, "English keyboard focus and reduced motion", { language: "en", width: 360, height: 640 }, async (page) => {
      await openJournal(page);
      assert.equal(await page.locator(".menu-hub-header h2").innerText(), "Local food");
      await assertNoHorizontalOverflow(page);
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press(i < 25 ? "Tab" : "Shift+Tab");
        await page.waitForFunction(() => !!document.activeElement?.closest(".compact-main-menu"), null, { timeout: 1500 });
      }
      await chooseKind(page, "drink");
      assert.match(await page.locator('.checklist-kind-tabs [data-kind="drink"]').innerText(), /Drinks/i);
      await page.locator(".checklist-status-select").selectOption("untested");
      await page.locator(details).first().locator("summary").click();
      const first = page.locator(rows).first();
      assert.match(await first.locator("a").getAttribute("aria-label"), /ShopeeFood/);
      const animated = await page.evaluate(() => [...document.querySelectorAll(".foodie-pet-wrapper *")]
        .filter((node) => getComputedStyle(node).animationName !== "none").length);
      assert.equal(animated, 0, "Reduced-motion setting disables mascot animations");
      await page.screenshot({ path: resolve(output, `${engine}-english-journal-fixture.png`), fullPage: false });
      await closeJournal(page);
    });
  } finally {
    await browser?.close();
  }
}

await writeFile(resolve(output, scenarioFilter ? "report-filtered.json" : "report.json"), JSON.stringify({ baseURL,
  fixtureNotice: "90 points / 7 days and three legacy coffees are isolated QA fixtures. All external traffic is blocked. No affiliate or sharing action is performed.",
  results: reports }, null, 2));
const failures = reports.filter((result) => !result.passed);
console.log(`\n${reports.length - failures.length}/${reports.length} mobile journal cases passed. Artifacts: ${output}`);
if (failures.length) process.exitCode = 1;
