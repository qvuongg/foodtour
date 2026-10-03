import { test, after } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "foodie-progress-test-"));
buildSync({ entryPoints: ["src/lib/foodie-streak.ts"], outfile: join(out, "streak.cjs"),
  bundle: true, platform: "node", format: "cjs" });
const {
  PET_LEVELS, FOODIE_STORAGE_KEY, LEGACY_STREAK_STORAGE_KEY, LEGACY_CHECKLIST_STORAGE_KEY,
  FOODIE_RECOVERY_KEY, getPetLevel, getPetProgress, getStreakSummary, getTodayDateString,
  getDefaultStreakState, migrateFoodieProgress, parseFoodieProgress, reduceFoodieProgress,
  validatePetName, createFoodieProgressStore, hasRestaurantRewardToday,
} = createRequire(import.meta.url)(join(out, "streak.cjs"));
after(() => rmSync(out, { recursive: true, force: true }));

function memoryStorage(entries = {}) {
  const data = new Map(Object.entries(entries));
  return { data, failRead: false, failWrite: false, writes: [],
    getItem(key) { if (this.failRead) throw new Error("blocked"); return data.get(key) ?? null; },
    setItem(key, value) { if (this.failWrite) throw new Error("quota"); this.writes.push([key, value]); data.set(key, value); },
  };
}
const legacy = (score = 90) => ({ score, petName: "Mèo Phố Cổ", dailyStreak: 7,
  lastActiveDate: "2026-10-01", totalSpins: 41, totalChecklistTested: 9 });
const spin = (id, date = "2026-10-02") => ({ type: "spinCompleted", id, date });
const tick = (id, checked = true) => ({ type: "setChecked", id, checked });

test("six levels use the agreed boundaries and within-level progress", () => {
  assert.deepEqual(PET_LEVELS.map((level) => level.minXp), [0, 10, 25, 50, 100, 200]);
  for (const [xp, level] of [[0,1],[9,1],[10,2],[24,2],[25,3],[49,3],[50,4],[99,4],
    [100,5],[199,5],[200,6],[600,6]]) assert.equal(getPetLevel(xp).level, level);
  const middle = getPetProgress(18);
  assert.equal(middle.remainingXp, 7);
  assert.ok(Math.abs(middle.percent - 53.3333333333) < 0.0001);
  assert.equal(middle.level.level, 2);
  assert.equal(middle.nextLevel.level, 3);
  assert.deepEqual([getPetProgress(250).percent, getPetProgress(250).remainingXp,
    getPetProgress(250).nextLevel], [100, 0, null]);
});

test("brand-new users retain 3 starting XP but earn their first day by completing a spin", () => {
  const state = getDefaultStreakState();
  assert.equal(state.xp, 3);
  assert.equal(state.dailyStreak, 0);
  assert.equal(state.lastActiveDate, "");
  const next = reduceFoodieProgress(state, spin("first"));
  assert.deepEqual([next.xp, next.dailyStreak, next.totalSpins], [4, 1, 1]);
});

test("migration preserves XP, names, streaks, counters and all legacy IDs without recalculating rewards", () => {
  const ids = ["hn-1", "dn-24", "hcm-24", "old-retired-id"];
  for (const score of [3, 90, 100, 200]) {
    const old = legacy(score);
    const migrated = migrateFoodieProgress(old, ids);
    assert.deepEqual(migrated, { schemaVersion: 2, xp: score, petName: old.petName,
      dailyStreak: 7, lastActiveDate: "2026-10-01", totalSpins: 41,
      totalChecklistTested: 9, checkedSpotIds: ids, completedSpinIds: [],
      rewardedRestaurantDates: [], lastRestaurantRewardDate: "" });
    assert.equal("score" in migrated, false);
  }
});

test("migration sanitizes malformed values without granting points from checkmarks", () => {
  const state = migrateFoodieProgress({ score: -80, dailyStreak: Infinity, totalSpins: NaN,
    totalChecklistTested: -1, lastActiveDate: "2026-02-30", petName: "" }, ["hn-1", "hn-1", null, 3]);
  assert.deepEqual([state.xp, state.dailyStreak, state.totalSpins, state.totalChecklistTested], [0,0,0,0]);
  assert.equal(state.lastActiveDate, "");
  assert.deepEqual(state.checkedSpotIds, ["hn-1"]);
  assert.equal(migrateFoodieProgress(null, ["hn-2"]).xp, 3);
  assert.equal(parseFoodieProgress("bad json"), null);
  assert.equal(parseFoodieProgress('{"schemaVersion":1}'), null);
  assert.equal(parseFoodieProgress('{"schemaVersion":2,"xp":null}').xp, 3);
});

test("migration is repeatable, leaves both v1 backups untouched, and persists no independent score", async () => {
  const oldRaw = JSON.stringify(legacy(100));
  const checksRaw = '["hn-1","dn-2"]';
  const storage = memoryStorage({ [LEGACY_STREAK_STORAGE_KEY]: oldRaw, [LEGACY_CHECKLIST_STORAGE_KEY]: checksRaw });
  const store = createFoodieProgressStore(storage);
  assert.equal(storage.writes.length, 0, "constructor is read-only for React render");
  assert.equal(await store.initialize(), true);
  await store.initialize();
  const second = createFoodieProgressStore(storage);
  await second.initialize();
  assert.equal(second.getSnapshot().state.xp, 100);
  assert.equal(storage.data.get(LEGACY_STREAK_STORAGE_KEY), oldRaw);
  assert.equal(storage.data.get(LEGACY_CHECKLIST_STORAGE_KEY), checksRaw);
  assert.equal("score" in JSON.parse(storage.data.get(FOODIE_STORAGE_KEY)), false);
  assert.ok(storage.writes.every(([key]) => key === FOODIE_STORAGE_KEY));
});

test("corrupt v2 is backed up before recovery from valid v1", async () => {
  const storage = memoryStorage({ [FOODIE_STORAGE_KEY]: "{broken", [LEGACY_STREAK_STORAGE_KEY]: JSON.stringify(legacy(90)) });
  const store = createFoodieProgressStore(storage);
  await store.initialize();
  assert.equal(store.getSnapshot().state.xp, 90);
  assert.equal(storage.data.get(FOODIE_RECOVERY_KEY), "{broken");
  storage.data.set(FOODIE_STORAGE_KEY, "another broken snapshot");
  await store.retrySave();
  assert.equal(storage.data.get(FOODIE_RECOVERY_KEY), "{broken", "first recovery backup is retained");
});

test("one completed spin ID earns exactly +1 even after reload", async () => {
  const storage = memoryStorage();
  const first = createFoodieProgressStore(storage);
  await Promise.all([first.completeSpin("spin-123"), first.completeSpin("spin-123")]);
  const second = createFoodieProgressStore(storage);
  await second.completeSpin("spin-123");
  assert.deepEqual([second.getSnapshot().state.xp, second.getSnapshot().state.totalSpins], [4, 1]);
});

test("checkmarks are desired-state idempotent, reversible, and atomic with XP", async () => {
  const storage = memoryStorage();
  const store = createFoodieProgressStore(storage);
  await Promise.all([store.setChecked("hn-1", true), store.setChecked("hn-1", true)]);
  assert.deepEqual([store.getSnapshot().state.xp, store.getSnapshot().state.totalChecklistTested], [8, 1]);
  await store.setChecked("hn-1", false);
  await store.setChecked("hn-1", false);
  assert.deepEqual([store.getSnapshot().state.xp, store.getSnapshot().state.totalChecklistTested], [3, 0]);
  for (const [key, raw] of storage.writes) {
    assert.equal(key, FOODIE_STORAGE_KEY);
    const saved = JSON.parse(raw);
    assert.equal(saved.xp, saved.checkedSpotIds.includes("hn-1") ? 8 : 3);
  }
});

test("unticking has a zero floor and level follows XP in both directions", () => {
  const low = { ...getDefaultStreakState(), xp: 2, checkedSpotIds: ["legacy"] };
  assert.equal(reduceFoodieProgress(low, tick("legacy", false)).xp, 0);
  const upgraded = reduceFoodieProgress({ ...getDefaultStreakState(), xp: 9 }, tick("hn-1"));
  assert.equal(getPetLevel(upgraded.xp).level, 2);
  assert.equal(getPetLevel(reduceFoodieProgress(upgraded, tick("hn-1", false)).xp).level, 1);
});

test("the reducer is pure and duplicate events preserve state without a second reward", () => {
  const initial = getDefaultStreakState();
  Object.freeze(initial.checkedSpotIds);
  Object.freeze(initial.completedSpinIds);
  Object.freeze(initial);
  const next = reduceFoodieProgress(initial, spin("one"));
  assert.equal(initial.xp, 3);
  assert.equal(reduceFoodieProgress(next, spin("one")), next);
  assert.equal(reduceFoodieProgress(initial, { type: "rename", name: initial.petName }), initial);
  assert.equal(reduceFoodieProgress(initial, spin("", "nonsense")), initial);
});

test("calendar day is Vietnam midnight independently of device timezone", () => {
  assert.equal(getTodayDateString(new Date("2026-10-01T16:59:59Z")), "2026-10-01");
  assert.equal(getTodayDateString(new Date("2026-10-01T17:00:00Z")), "2026-10-02");
  assert.equal(getTodayDateString(new Date("2026-12-31T17:00:00Z")), "2027-01-01");
});

test("consecutive days extend streak, same-day spins do not, gaps restart without removing XP", () => {
  let state = migrateFoodieProgress(legacy(), []);
  state = reduceFoodieProgress(state, spin("one", "2026-10-02"));
  assert.deepEqual([state.dailyStreak, state.xp], [8, 91]);
  state = reduceFoodieProgress(state, spin("two", "2026-10-02"));
  assert.deepEqual([state.dailyStreak, state.xp], [8, 92]);
  state = reduceFoodieProgress(state, spin("gap", "2026-10-04"));
  assert.deepEqual([state.dailyStreak, state.xp], [1, 93]);
  state = reduceFoodieProgress(state, spin("late-retry", "2026-10-02"));
  assert.deepEqual([state.dailyStreak, state.xp, state.lastActiveDate], [1, 94, "2026-10-04"]);
});

test("stale streak summaries distinguish yesterday, today and a broken chain truthfully", () => {
  const state = migrateFoodieProgress(legacy(), []);
  assert.deepEqual(getStreakSummary(state, new Date("2026-10-01T05:00:00Z")),
    { currentDays: 7, previousDays: 0, activeToday: true, needsRestart: false });
  assert.deepEqual(getStreakSummary(state, new Date("2026-10-02T05:00:00Z")),
    { currentDays: 7, previousDays: 0, activeToday: false, needsRestart: false });
  assert.deepEqual(getStreakSummary(state, new Date("2026-10-03T05:00:00Z")),
    { currentDays: 0, previousDays: 7, activeToday: false, needsRestart: true });
  assert.equal(getStreakSummary(getDefaultStreakState()).needsRestart, false);
});

test("rename counts displayed graphemes and normalizes Vietnamese spacing", () => {
  assert.deepEqual(validatePetName("  Bé    Mèo  "), { valid: true, name: "Bé Mèo", error: null });
  assert.equal(validatePetName("a").valid, false);
  assert.equal(validatePetName("a".repeat(21)).valid, false);
  assert.equal(validatePetName("a".repeat(20)).valid, true);
  assert.equal(validatePetName("👨‍👩‍👧‍👦🐱").valid, true);
  assert.equal(validatePetName("Be\u0301").name, "Bé");
  assert.equal(validatePetName("ab\u202E").error, "characters");
});

test("rename never earns XP and invalid names never write storage", async () => {
  const storage = memoryStorage();
  const store = createFoodieProgressStore(storage);
  assert.equal(await store.rename("x"), false);
  assert.equal(storage.writes.length, 0);
  assert.equal(await store.rename("  Bé   Phở "), true);
  assert.deepEqual([store.getSnapshot().state.xp, store.getSnapshot().state.petName], [3, "Bé Phở"]);
});

test("failed writes preserve pending XP and checkmarks, then retry saves each event once", async () => {
  const storage = memoryStorage();
  const store = createFoodieProgressStore(storage);
  await store.initialize();
  storage.failWrite = true;
  assert.equal(await store.completeSpin("offline"), false);
  assert.equal(await store.setChecked("hn-1", true), false);
  assert.deepEqual([store.getSnapshot().state.xp, store.getSnapshot().storageError], [9, "write-failed"]);
  assert.equal(JSON.parse(storage.data.get(FOODIE_STORAGE_KEY)).xp, 3);
  store.refresh();
  assert.equal(store.getSnapshot().state.xp, 9, "refresh must retain unsaved events");
  storage.failWrite = false;
  assert.equal(await store.retrySave(), true);
  assert.equal(store.getSnapshot().storageError, null);
  const restored = createFoodieProgressStore(storage).getSnapshot().state;
  assert.deepEqual([restored.xp, restored.checkedSpotIds, restored.totalSpins], [9, ["hn-1"], 1]);
  await store.retrySave();
  assert.equal(store.getSnapshot().state.xp, 9);
});

test("read failures never replace persisted state with defaults and pending actions survive recovery", async () => {
  const storage = memoryStorage({ [LEGACY_STREAK_STORAGE_KEY]: JSON.stringify(legacy(100)) });
  const store = createFoodieProgressStore(storage);
  storage.failRead = true;
  assert.equal(await store.completeSpin("queued"), false);
  assert.equal(storage.writes.length, 0);
  assert.equal(store.getSnapshot().state.xp, 101);
  storage.failRead = false;
  await store.retrySave();
  assert.equal(store.getSnapshot().state.xp, 101);
});

test("two tabs merge unique events under a shared lock and storage refresh updates the other view", async () => {
  const storage = memoryStorage();
  let lockQueue = Promise.resolve();
  const exclusive = (operation) => {
    const work = lockQueue.then(operation);
    lockQueue = work.catch(() => {});
    return work;
  };
  const a = createFoodieProgressStore(storage, exclusive);
  const b = createFoodieProgressStore(storage, exclusive);
  await Promise.all([a.completeSpin("tab-a"), b.completeSpin("tab-b"),
    a.setChecked("hn-1", true), b.setChecked("hn-1", true)]);
  a.refresh(); b.refresh();
  assert.equal(a.getSnapshot().state.xp, 10);
  assert.equal(a.getSnapshot().state.totalSpins, 2);
  assert.deepEqual(a.getSnapshot().state, b.getSnapshot().state);
});

test("pending failed changes replay over another tab's newer saved data", async () => {
  const storage = memoryStorage();
  const a = createFoodieProgressStore(storage);
  await a.initialize();
  storage.failWrite = true;
  await a.completeSpin("pending-a");
  storage.failWrite = false;
  const b = createFoodieProgressStore(storage);
  await b.completeSpin("saved-b");
  await a.retrySave();
  assert.equal(a.getSnapshot().state.xp, 5);
  assert.equal(a.getSnapshot().state.totalSpins, 2);
});

test("same completed spin reported by two tabs earns a single reward", async () => {
  const storage = memoryStorage();
  let queue = Promise.resolve();
  const exclusive = (operation) => { const result = queue.then(operation); queue = result.catch(() => {}); return result; };
  const a = createFoodieProgressStore(storage, exclusive);
  const b = createFoodieProgressStore(storage, exclusive);
  await Promise.all([a.completeSpin("shared-spin"), b.completeSpin("shared-spin")]);
  a.refresh(); b.refresh();
  assert.deepEqual([a.getSnapshot().state.xp, b.getSnapshot().state.totalSpins], [4, 1]);
});

test("a pending failed checklist write merges with another tab's saved checkmark exactly once", async () => {
  const storage = memoryStorage();
  const a = createFoodieProgressStore(storage);
  await a.initialize();
  storage.failWrite = true;
  assert.equal(await a.setChecked("hn-1", true), false);
  assert.deepEqual(a.getSnapshot().state.checkedSpotIds, ["hn-1"]);
  assert.equal(a.getSnapshot().state.xp, 8);
  storage.failWrite = false;
  const b = createFoodieProgressStore(storage);
  assert.equal(await b.setChecked("dn-2", true), true);
  assert.equal(b.getSnapshot().state.xp, 8);
  a.refresh();
  assert.equal(a.getSnapshot().state.xp, 13, "refresh replays the unsaved event over the other tab's checkmark");
  assert.equal(await a.retrySave(), true);
  assert.equal(await a.retrySave(), true, "another retry cannot grant a second checklist reward");
  b.refresh();
  const saved = JSON.parse(storage.data.get(FOODIE_STORAGE_KEY));
  assert.deepEqual(saved.checkedSpotIds.toSorted(), ["dn-2", "hn-1"]);
  assert.deepEqual([saved.xp, saved.totalChecklistTested], [13, 2]);
  assert.deepEqual(a.getSnapshot().state, saved);
  assert.deepEqual(b.getSnapshot().state, saved);
});

const restaurantURL = 'https://shopeefood.vn/da-nang/pho-ha-thanh-bo-ga';
const affiliateURL = 'https://shopeefood.vn/now-food/affiliate/landing-page?brandId=15544&mmp_pid=an_17316810077&restaurantId=947982';
const restaurantEvent = (date, url = restaurantURL) => ({ type: 'restaurantOpened', date, url });

test('restaurant discovery gives +2 XP per eligible URL without daily cap', async () => {
  const storage = memoryStorage();
  const store = createFoodieProgressStore(storage);
  const now = new Date('2026-10-02T05:00:00Z');
  assert.equal(await store.openRestaurant(restaurantURL, now), true);
  assert.equal(await store.openRestaurant(affiliateURL, now), true);
  assert.equal(await store.openRestaurant(restaurantURL, now), true);
  const state = store.getSnapshot().state;
  assert.deepEqual([state.xp, state.rewardedRestaurantDates, state.lastRestaurantRewardDate],
    [9, ['2026-10-02'], '2026-10-02']);
  assert.deepEqual([state.totalSpins, state.dailyStreak, state.lastActiveDate], [0, 0, '']);
  assert.equal(hasRestaurantRewardToday(state, now), true);
  assert.equal(hasRestaurantRewardToday(state, new Date('2026-10-03T05:00:00Z')), false);
  assert.equal(storage.data.get(FOODIE_STORAGE_KEY).includes('shopeefood.vn'), false, 'no clicked URL history is persisted');
});

test('home, search, wrong host and invalid links never earn restaurant XP or write storage', async () => {
  const storage = memoryStorage();
  const store = createFoodieProgressStore(storage);
  const invalid = ['', 'not a URL', 'javascript:alert(1)', 'https://shopeefood.vn/',
    'https://shopeefood.vn/da-nang', 'https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=pho',
    'https://shopeefood.vn/now-food/affiliate/landing-page?brandId=15544',
    'https://shopeefood.vn.evil.example/da-nang/pho', 'https://grab.com/vn/food/pho'];
  for (const url of invalid) {
    assert.equal(await store.openRestaurant(url), false, url);
    const state = getDefaultStreakState();
    assert.equal(reduceFoodieProgress(state, restaurantEvent('2026-10-02', url)), state);
  }
  assert.equal(store.getSnapshot().state.xp, 3);
  assert.equal(storage.writes.length, 0);
});

test('older v2 snapshots gain empty restaurant reward fields without changing prior progress', async () => {
  const old = { ...getDefaultStreakState(), xp: 90, petName: 'Mèo cũ', dailyStreak: 7,
    lastActiveDate: '2026-10-01', totalSpins: 41, checkedSpotIds: ['hn-1'], completedSpinIds: ['old-spin'] };
  delete old.rewardedRestaurantDates;
  delete old.lastRestaurantRewardDate;
  const storage = memoryStorage({ [FOODIE_STORAGE_KEY]: JSON.stringify(old) });
  const store = createFoodieProgressStore(storage);
  await store.initialize();
  assert.deepEqual(store.getSnapshot().state, { ...old, rewardedRestaurantDates: [], lastRestaurantRewardDate: '' });
});

test('restaurant rewards work across dates and multiple opens on the same day', async () => {
  const store = createFoodieProgressStore(memoryStorage());
  await store.openRestaurant(restaurantURL, new Date('2026-10-01T16:59:59Z'));
  assert.equal(store.getSnapshot().state.xp, 5);
  await store.openRestaurant(affiliateURL, new Date('2026-10-01T17:00:00Z'));
  assert.deepEqual([store.getSnapshot().state.xp, store.getSnapshot().state.rewardedRestaurantDates],
    [7, ['2026-10-01', '2026-10-02']]);
  await store.openRestaurant(restaurantURL, new Date('2026-10-01T17:00:30Z'));
  assert.equal(store.getSnapshot().state.xp, 9, 'subsequent restaurant open earns +2 XP without limit');
  await store.completeSpin('spin-same-day', new Date('2026-10-01T17:01:00Z'));
  assert.equal(store.getSnapshot().state.xp, 10, 'completed spin still awards exactly +1');
});

test('failed restaurant rewards remain pending, and save on retry', async () => {
  const storage = memoryStorage();
  const store = createFoodieProgressStore(storage);
  await store.initialize();
  const now = new Date('2026-10-02T05:00:00Z');
  storage.failWrite = true;
  assert.equal(await store.openRestaurant(restaurantURL, now), false);
  assert.equal(await store.openRestaurant(affiliateURL, now), false);
  assert.equal(store.getSnapshot().state.xp, 7);
  assert.equal(store.getSnapshot().storageError, 'write-failed');
  assert.equal(JSON.parse(storage.data.get(FOODIE_STORAGE_KEY)).xp, 3);
  store.refresh();
  assert.equal(store.getSnapshot().state.xp, 7);
  storage.failWrite = false;
  await store.retrySave();
  const reloaded = createFoodieProgressStore(storage);
  await reloaded.openRestaurant(restaurantURL, now);
  assert.deepEqual([reloaded.getSnapshot().state.xp, reloaded.getSnapshot().state.rewardedRestaurantDates], [9, ['2026-10-02']]);
});

test('two tabs earn rewards when clicking different restaurants simultaneously', async () => {
  const storage = memoryStorage();
  let queue = Promise.resolve();
  const exclusive = (operation) => { const result = queue.then(operation); queue = result.catch(() => {}); return result; };
  const a = createFoodieProgressStore(storage, exclusive);
  const b = createFoodieProgressStore(storage, exclusive);
  const now = new Date('2026-10-02T05:00:00Z');
  await Promise.all([a.openRestaurant(restaurantURL, now), b.openRestaurant(affiliateURL, now)]);
  a.refresh(); b.refresh();
  assert.equal(a.getSnapshot().state.xp, 7);
  assert.deepEqual(a.getSnapshot().state, b.getSnapshot().state);
  assert.deepEqual(a.getSnapshot().state.rewardedRestaurantDates, ['2026-10-02']);
});

test('retry of a pending earlier day merges after a newer day without moving last reward date backwards', async () => {
  const storage = memoryStorage();
  const a = createFoodieProgressStore(storage);
  await a.initialize();
  storage.failWrite = true;
  const yesterday = new Date('2026-10-01T05:00:00Z');
  await a.openRestaurant(restaurantURL, yesterday);
  storage.failWrite = false;
  const b = createFoodieProgressStore(storage);
  await b.openRestaurant(affiliateURL, new Date('2026-10-02T05:00:00Z'));
  await a.retrySave();
  await a.openRestaurant(affiliateURL, yesterday);
  assert.deepEqual([a.getSnapshot().state.xp, a.getSnapshot().state.rewardedRestaurantDates,
    a.getSnapshot().state.lastRestaurantRewardDate], [9, ['2026-10-01', '2026-10-02'], '2026-10-02']);
  b.refresh();
  assert.deepEqual(a.getSnapshot().state, b.getSnapshot().state);
});

test('concurrent restaurant rewards across tabs combine correctly without losing points', async () => {
  const storage = memoryStorage();
  const a = createFoodieProgressStore(storage);
  await a.initialize();
  storage.failWrite = true;
  const now = new Date('2026-10-02T05:00:00Z');
  await a.openRestaurant(restaurantURL, now);
  storage.failWrite = false;
  const b = createFoodieProgressStore(storage);
  await b.openRestaurant(affiliateURL, now);
  await a.retrySave();
  b.refresh();
  assert.equal(a.getSnapshot().state.xp, 7);
  assert.deepEqual(a.getSnapshot().state.rewardedRestaurantDates, ['2026-10-02']);
});

test('reward date sanitization removes invalid and duplicate dates and derives the latest date', () => {
  const state = parseFoodieProgress(JSON.stringify({ ...getDefaultStreakState(), xp: 9,
    rewardedRestaurantDates: ['2026-10-02', '2026-02-30', '', '2026-10-01', '2026-10-02'],
    lastRestaurantRewardDate: '2026-09-30' }));
  assert.deepEqual(state.rewardedRestaurantDates, ['2026-09-30', '2026-10-01', '2026-10-02']);
  assert.equal(state.lastRestaurantRewardDate, '2026-10-02');
  assert.equal(state.xp, 9, 'normalizing metadata never recalculates XP');
  const current = getDefaultStreakState();
  assert.equal(reduceFoodieProgress(current, restaurantEvent('2026-02-30')), current);
});

test('completed spins have no daily cap even after receiving the ShopeeFood reward', async () => {
  const storage = memoryStorage();
  const store = createFoodieProgressStore(storage);
  const now = new Date('2026-10-02T05:00:00Z');
  await store.initialize();
  await store.openRestaurant(restaurantURL, now);
  for (let index = 0; index < 50; index++) {
    await store.completeSpin(`unlimited-${index}`, now);
    assert.equal(store.getSnapshot().state.xp, 6 + index, 'Each distinct completed spin earns one XP on the same date');
  }
  assert.equal(store.getSnapshot().state.totalSpins, 50);
  await store.completeSpin('unlimited-49', now);
  assert.equal(store.getSnapshot().state.xp, 55, 'A repeated callback remains idempotent');
  const reloaded = createFoodieProgressStore(storage);
  await reloaded.completeSpin('unlimited-after-reload', now);
  assert.equal(reloaded.getSnapshot().state.xp, 56);
  assert.equal(reloaded.getSnapshot().state.totalSpins, 51);
});
