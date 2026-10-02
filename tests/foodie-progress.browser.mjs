/**
 * Real browser integration for progress persistence. Start pnpm dev, then:
 * FOODTOUR_QA_ENGINES=chromium,webkit node tests/foodie-progress.browser.mjs
 * Isolated browser contexts only. All external requests are blocked.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit } from 'playwright';

const baseURL = process.env.FOODTOUR_QA_URL || 'http://127.0.0.1:5173';
const origin = new URL(baseURL).origin;
const engineNames = (process.env.FOODTOUR_QA_ENGINES || 'chromium,webkit').split(',').map(x => x.trim());
const output = resolve('artifacts/foodie-pet-v2/progress-qa');
const key = 'foodtour_foodie_progress_v2';
const oldKey = 'foodtour_foodie_streak_v1';
const checksKey = 'foodtour_must_try_checklist_v1';
const floating = '.foodie-pet-widget[data-placement="floating"]';
const checkbox = id => `[data-item-id="${id}"] .checklist-item-toggle`;
const results = [];
const scenarioFilter = process.env.FOODTOUR_QA_FILTER ? new RegExp(process.env.FOODTOUR_QA_FILTER,'i') : null;
await mkdir(output, { recursive: true });

async function fixture(browser, legacy = false, ordering = null) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh',
    ...(ordering ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' } : {}) });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (ordering && url.origin === origin && url.pathname === '/src/lib/shopee-deeplink.ts') {
      // Test only replaces the external navigation boundary. Eligibility, event,
      // real UI click and persistence are application code, served by Vite.
      const response = await route.fetch();
      let body = await response.text();
      assert(body.includes('window.location.href = appDeeplink;'), 'Expected current deep-link navigation boundary');
      body = body.replace('window.location.href = appDeeplink;',
        'window.__foodieQANavigation.push({url:appDeeplink,synchronous:window.__foodieQAInHandler,at:performance.now()});');
      body = body.replace('if (typeof window === "undefined" || !url || url === "#") return;',
        'if (typeof window === "undefined" || !url || url === "#") return; window.__foodieQAInHandler = true; queueMicrotask(() => { window.__foodieQAInHandler = false; });');
      return route.fulfill({ response, body });
    }
    if (ordering && url.origin === origin && url.pathname === '/src/lib/supabase-client.ts') {
      // A local fake database is available independently of developer credentials.
      const response = await route.fetch();
      const body = (await response.text()).replace('return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);', 'return true;');
      return route.fulfill({ response, body });
    }
    if (ordering && url.hostname.endsWith('.supabase.co') && url.pathname.endsWith('/get_nearby_restaurants')) {
      return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(ordering.nearby ? [
        {id:'qa-pho-one',name:'Phở bò — Quán kiểm thử Một',address:'Địa chỉ kiểm thử',district:'QA',city:'da-nang',rating:4.9,rating_count:200,distance_meters:165,
          original_url:'https://shopeefood.vn/da-nang/pho-qa-mot',affiliate_url:'https://shopeefood.vn/now-food/affiliate/landing-page?restaurantId=947982&brandId=15544&mmp_pid=qa-fixture'},
        {id:'qa-pho-two',name:'Phở bò — Quán kiểm thử Hai',address:'Địa chỉ kiểm thử',district:'QA',city:'da-nang',rating:4.8,rating_count:150,distance_meters:334,
          original_url:'https://shopeefood.vn/da-nang/pho-qa-hai',affiliate_url:'https://s.shopee.vn/QATEST123'}
      ] : []) });
    }
    return url.origin === origin || ['data:', 'blob:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addCookies([{ name: 'tnag-community-v1-language', value: '%22vi%22', url: origin }]);
  await context.addInitScript(({ key, oldKey, checksKey, legacy, origin, ordering }) => {
    if (location.origin !== origin) return;
    if (legacy && !localStorage.getItem('foodie-progress-qa-seeded')) {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      localStorage.setItem(oldKey, JSON.stringify({ score: 90, petName: 'Mèo Phố Cổ', dailyStreak: 7,
        lastActiveDate: today, totalSpins: 41, totalChecklistTested: 9 }));
      localStorage.setItem(checksKey, '["hn-1","dn-2","retired-legacy-id"]');
      localStorage.setItem('foodie-progress-qa-seeded', 'true');
    }
    window.__foodieQAWriteBlocked = false;
    window.__foodieQANavigation = [];
    window.__foodieQARewardEvents = [];
    window.addEventListener('foodtour:shopee-restaurant-open', event => window.__foodieQARewardEvents.push(event.detail));
    if (ordering) {
      Object.defineProperty(navigator.geolocation,'getCurrentPosition',{configurable:true,value:(success,error)=>{
        if(ordering.nearby)success({coords:{latitude:16.0678,longitude:108.2208,accuracy:10},timestamp:Date.now()});
        else error({code:1,message:'QA permission denied'});
      }});
    }
    window.__foodieQAWrites = [];
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(storageKey, value) {
      if (this === localStorage && storageKey === key) {
        if (window.__foodieQAWriteBlocked) throw new DOMException('QA quota failure', 'QuotaExceededError');
        window.__foodieQAWrites.push(JSON.parse(value));
      }
      return setItem.call(this, storageKey, value);
    };
  }, { key, oldKey, checksKey, legacy, origin, ordering });
  const errors = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  const page = await context.newPage();
  await ready(page);
  return { page, context, errors };
}
async function ready(page) {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForFunction(key => Boolean(localStorage.getItem(key)), key);
  await page.locator(floating).waitFor({ state: 'visible' });
}
async function saved(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
async function waitSaved(page, expected) {
  await page.waitForFunction(({ key, expected }) => {
    const state = JSON.parse(localStorage.getItem(key));
    return Object.entries(expected).every(([field, value]) => JSON.stringify(state[field]) === JSON.stringify(value));
  }, { key, expected });
}
async function waitAttribute(page, selector, attribute, value) {
  await page.waitForFunction(({ selector, attribute, value }) => document.querySelector(selector)?.getAttribute(attribute) === value,
    { selector, attribute, value });
}
async function openPet(page) {
  await page.locator(floating).click();
  await page.locator('.pet-home').waitFor({ state: 'visible' });
}
async function openJournal(page) {
  if (await page.locator('.pet-home').isVisible()) {
    await page.locator('.pet-home-close').click();
    await page.locator('.pet-home').waitFor({ state: 'hidden' });
  }
  await page.locator('.main-menu-trigger').click();
  await page.locator('[data-destination="checklist"]').click();
  await page.locator('.local-checklist').waitFor({ state: 'visible' });
}
async function backToPet(page) {
  await page.locator('.compact-main-menu .menu-close').click();
  await page.locator('.compact-main-menu').waitFor({ state: 'hidden' });
  await openPet(page);
}
async function assertDisplayedXp(page, expected) {
  await page.waitForFunction(({ floating, expected }) => document.querySelector(floating)?.getAttribute('aria-label')?.includes(`, ${expected} XP.`),
    { floating, expected });
}

async function openPhoResult(page, expectsNearby = true) {
  await page.getByRole('button',{name:'Xem món: Phở bò',exact:true}).click();
  await page.locator('.food-result-dialog').waitFor({state:'visible'});
  await page.locator('.nearby-locating-box').waitFor({state:'hidden'});
  if(expectsNearby)await page.locator('.nearby-restaurant-name').waitFor({state:'visible'});
  await page.locator('.shopeefood-button').waitFor({state:'visible'});
}
async function closeResult(page) {
  await page.keyboard.press('Escape');
  await page.locator('.food-result-dialog').waitFor({state:'hidden'});
  await page.evaluate(()=>window.scrollTo(0,0));
}
async function noReward(page, before) {
  await page.waitForTimeout(100);
  assert.deepEqual(await saved(page),before,'Excluded action must not change progression');
}

const scenarios = [
  ['legacy-migration-and-backup', async ({ page }, engine) => {
    const before = await page.evaluate(({ oldKey, checksKey }) => [localStorage.getItem(oldKey), localStorage.getItem(checksKey)], { oldKey, checksKey });
    let state = await saved(page);
    assert.equal(state.schemaVersion, 2);
    assert.equal('score' in state, false);
    assert.deepEqual([state.xp, state.petName, state.dailyStreak, state.totalSpins, state.totalChecklistTested],
      [90, 'Mèo Phố Cổ', 7, 41, 9]);
    assert.deepEqual(state.checkedSpotIds, ['hn-1', 'dn-2', 'retired-legacy-id']);
    await openJournal(page);
    assert.equal(await page.locator(checkbox('hn-1')).getAttribute('aria-checked'), 'true');
    await page.screenshot({ path: `${output}/${engine}-migration.png` });
    await ready(page);
    state = await saved(page);
    assert.equal(state.xp, 90);
    const after = await page.evaluate(({ oldKey, checksKey }) => [localStorage.getItem(oldKey), localStorage.getItem(checksKey)], { oldKey, checksKey });
    assert.deepEqual(after, before, 'migration and reload must not rewrite legacy backups');
  }, true],
  ['fresh-user-and-no-passive-xp', async ({ page }) => {
    const before = await saved(page);
    assert.deepEqual([before.xp, before.dailyStreak, before.lastActiveDate, before.totalSpins], [3, 0, '', 0]);
    await openPet(page);
    assert.equal(await page.locator('.pet-home-streak').count(),0,'Daily streak is not displayed');
    await page.locator('.pet-home-pet-touch').click();
    await page.locator('.pet-home-level-prev').evaluate(button=>button.click());
    await page.locator('.pet-home-level-next').evaluate(button=>button.click());
    assert.equal(await page.locator('.pet-home-stage').getAttribute('data-level'),'1');
    assert.equal(await page.locator('.pet-home-journal').count(), 0, 'Journal lives in the main menu');
    await openJournal(page);
    await page.locator('[data-item-id="hn-1"] summary').click();
    await page.locator('[data-item-id="hn-1"] summary').click();
    await backToPet(page);
    await page.locator('.pet-home-close').click();
    await openPet(page);
    assert.deepEqual(await saved(page), before, 'opening, disclosures, greeting and overlay transitions cannot earn XP');
    assert.equal(await page.locator('.pet-home-hello').count(), 0, 'old greeting does not replay when reopening');
  }],
  ['failed-write-checkmark-and-rename-retry', async ({ page }, engine) => {
    const before = await saved(page);
    await page.evaluate(() => { window.__foodieQAWriteBlocked = true; });
    await openJournal(page);
    await page.locator(checkbox('hn-1')).click();
    await waitAttribute(page, checkbox('hn-1'), 'aria-checked', 'true');
    await page.locator('.checklist-save-error').waitFor({ state: 'visible' });
    await assertDisplayedXp(page, 8);
    assert.deepEqual(await saved(page), before, 'failed write cannot claim persisted progress');
    await backToPet(page);
    await page.locator('.pet-home-storage-error').waitFor({ state: 'visible' });
    await page.locator('.pet-home-name').click();
    await page.locator('.pet-home-rename input').fill('Bé Phở');
    await page.locator('.pet-home-rename button[type="submit"]').click();
    await page.locator('.pet-home-error').waitFor({ state: 'visible' });
    assert.match(await page.locator('.pet-home-name').innerText(), /Bé Phở/);
    assert.deepEqual(await saved(page), before);
    await page.screenshot({ path: `${output}/${engine}-unsaved.png` });
    await page.evaluate(() => { window.__foodieQAWriteBlocked = false; });
    await page.locator('.pet-home-storage-error button').click();
    await waitSaved(page, { xp: 8, checkedSpotIds: ['hn-1'], petName: 'Bé Phở', totalChecklistTested: 1 });
    await page.locator('.pet-home-storage-error').waitFor({ state: 'hidden' });
    await page.locator('.pet-home-error').waitFor({ state: 'hidden', timeout: 5000 });
    await page.screenshot({ path: `${output}/${engine}-retry-saved.png` });
    await ready(page);
    const persisted = await saved(page);
    assert.deepEqual([persisted.xp, persisted.checkedSpotIds, persisted.petName, persisted.totalChecklistTested],
      [8, ['hn-1'], 'Bé Phở', 1]);
    await openJournal(page);
    assert.equal(await page.locator(checkbox('hn-1')).getAttribute('aria-checked'), 'true');
    await page.locator(checkbox('hn-1')).click();
    await waitSaved(page, { xp: 3, checkedSpotIds: [], totalChecklistTested: 0 });
  }],
  ['two-tabs-concurrent-checkmarks', async ({ page, context }, engine) => {
    assert.equal(await page.evaluate(() => Boolean(navigator.locks)), true, 'test requires browser Web Locks');
    await openJournal(page);
    const other = await context.newPage();
    await ready(other);
    await openJournal(other);
    await Promise.all([page.locator(checkbox('hn-1')).click(), other.locator(checkbox('hn-2')).click()]);
    for (const tab of [page, other]) {
      await tab.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key));
        return state.xp === 13 && state.checkedSpotIds.includes('hn-1') && state.checkedSpotIds.includes('hn-2');
      }, key);
      await waitAttribute(tab, checkbox('hn-1'), 'aria-checked', 'true');
      await waitAttribute(tab, checkbox('hn-2'), 'aria-checked', 'true');
      await assertDisplayedXp(tab, 13);
      assert.equal((await saved(tab)).totalChecklistTested, 2);
    }
    assert.deepEqual(await saved(page), await saved(other));
    await page.screenshot({ path: `${output}/${engine}-two-tabs-synced.png` });
  }],
  ['restaurant-click-daily-cap-and-mobile-handoff',async({page},engine)=>{
    const before=await saved(page);
    await openPet(page);
    assert.equal(await page.locator('.pet-home-ordering.is-unavailable').evaluate(n=>n.tagName),'DIV','No selected dish: explanatory row, not a dead button');
    await page.locator('.pet-home-close').click();
    await openPhoResult(page);
    assert.deepEqual(await saved(page),before,'Viewing a result or QR/restaurant information does not award XP');
    await closeResult(page);await openPet(page);
    await page.locator('button.pet-home-ordering').click();
    await page.locator('.food-result-dialog').waitFor({state:'visible'});
    await page.locator('.nearby-restaurant-name').waitFor({state:'visible'});
    await page.locator('.pet-home').waitFor({state:'hidden'});
    assert.deepEqual(await saved(page),before,'Pet ordering shortcut reopens result without awarding XP');
    const exactHref=await page.locator('.shopeefood-button').getAttribute('href');
    await page.locator('.shopeefood-button').click();
    const navigation=await page.evaluate(()=>window.__foodieQANavigation.at(-1));
    assert.equal(navigation.synchronous,true,'Mobile handoff stays in the original click task');
    assert.equal(new URL(navigation.url).searchParams.get('apprl'),exactHref,'Affiliate destination and tracking must be untouched');
    await waitSaved(page,{xp:before.xp+2});
    const first=await saved(page);
    assert.equal(first.rewardedRestaurantDates.length,1);
    assert.equal(first.lastRestaurantRewardDate,first.rewardedRestaurantDates[0]);
    assert.deepEqual([first.dailyStreak,first.lastActiveDate,first.totalSpins],[before.dailyStreak,before.lastActiveDate,before.totalSpins]);
    await page.locator('.shopeefood-button').dblclick();
    await noReward(page,first);
    await page.locator('.nearby-accordion-header').click();
    await page.locator('.nearby-alt-row').first().click();
    assert.equal(await page.evaluate(()=>window.__foodieQARewardEvents.at(-1).url),'https://shopeefood.vn/da-nang/pho-qa-hai','Opaque DB affiliate link uses its verified original restaurant for reward eligibility');
    await noReward(page,first);
    await closeResult(page);await openPet(page);
    assert.equal(await page.locator('.pet-home-streak').count(),0);
    assert.match(await page.locator('.pet-home-ordering .pet-home-reward').innerText(),/Đã nhận/);
    await page.screenshot({path:`${output}/${engine}-restaurant-reward-earned.png`});
    await ready(page);await openPhoResult(page);await page.locator('.shopeefood-button').click();await noReward(page,first);
    // Advancing the browser Date uses the real Vietnam-day eligibility boundary.
    await page.clock.setFixedTime(new Date(Date.now()+86400000));
    await page.locator('.shopeefood-button').click();await waitSaved(page,{xp:before.xp+4});
    const next=await saved(page);assert.equal(next.rewardedRestaurantDates.length,2);
    assert.equal(next.lastRestaurantRewardDate,next.rewardedRestaurantDates[1]);
  },false,{nearby:true}],
  ['homepage-search-grab-and-passive-actions-no-reward',async({page,context})=>{
    const before=await saved(page);
    await openPhoResult(page,false);
    await page.locator('.shopeefood-button').click();
    await noReward(page,before);
    assert.equal(await page.evaluate(()=>window.__foodieQARewardEvents.length),0,'Generic app hub is not a restaurant');
    const popupPromise=context.waitForEvent('page');
    await page.locator('.grabfood-button').click();const grab=await popupPromise;await grab.close();
    await noReward(page,before);
    // Explicit URLs exercise production eligibility and handler code, with only
    // external navigation captured. QR rendering is passive, not a handler call.
    await page.evaluate(async()=>{
      const {handleShopeeFoodClick}=await import('/src/lib/shopee-deeplink.ts');
      for(const url of ['https://shopeefood.vn/','https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=pho','https://food.grab.com/vn/vi/']){
        handleShopeeFoodClick(url,{preventDefault(){}});
      }
      handleShopeeFoodClick('https://shopeefood.vn/da-nang/pho-qa-mot');
    });
    await noReward(page,before);
    assert.equal(await page.evaluate(()=>window.__foodieQARewardEvents.length),0,'Homepage/search/Grab and calls without a click are ineligible');
    await closeResult(page);await openJournal(page);
    await page.locator('[data-item-id="hn-1"] summary').click();
    const searchPromise=context.waitForEvent('page');
    await page.locator('[data-item-id="hn-1"] .checklist-order-link').click();const search=await searchPromise;await search.close();
    await noReward(page,before);
  },false,{nearby:false}],
  ['two-tabs-share-one-restaurant-reward',async({page,context})=>{
    const other=await context.newPage();await ready(other);
    await openPhoResult(page);await openPhoResult(other);
    await Promise.all([page.locator('.shopeefood-button').click(),other.locator('.shopeefood-button').click()]);
    for(const tab of [page,other]){
      await waitSaved(tab,{xp:5});await assertDisplayedXp(tab,5);
      assert.equal((await saved(tab)).rewardedRestaurantDates.length,1);
    }
    assert.deepEqual(await saved(page),await saved(other));
  },false,{nearby:true}],

  ['restaurant-reward-unsaved-then-retry',async({page},engine)=>{
    const before=await saved(page);
    await page.evaluate(()=>{window.__foodieQAWriteBlocked=true;});
    await openPhoResult(page);await page.locator('.shopeefood-button').click();
    await assertDisplayedXp(page,5);
    assert.deepEqual(await saved(page),before,'Unpersisted restaurant XP is not represented as a successful write');
    await page.locator('.shopeefood-button').click();await assertDisplayedXp(page,5);
    assert.equal(await page.evaluate(()=>window.__foodieQANavigation.length),2,'Saving failure never blocks outbound opening');
    await closeResult(page);await openPet(page);
    await page.locator('.pet-home-storage-error').waitFor({state:'visible'});
    assert.equal(await page.locator('.pet-home-ordering .is-received').count(),0,'Do not claim reward was saved while storage is blocked');
    await page.evaluate(()=>{window.__foodieQAWriteBlocked=false;});
    await page.locator('.pet-home-storage-error button').click();await waitSaved(page,{xp:5});
    await page.locator('.pet-home-storage-error').waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.querySelector('.pet-home-ordering .is-received'));
    assert.equal((await saved(page)).rewardedRestaurantDates.length,1);
    await page.screenshot({path:`${output}/${engine}-restaurant-reward-retry.png`});
    await ready(page);assert.equal((await saved(page)).xp,5);
    await openPhoResult(page);await page.locator('.shopeefood-button').click();await waitSaved(page,{xp:5});
  },false,{nearby:true}],

];

for (const engineName of engineNames) {
  const launcher = { chromium, webkit }[engineName];
  if (!launcher) throw new Error(`Unsupported engine: ${engineName}`);
  const browser = await launcher.launch();
  try {
    for (const [name, scenario, legacy, ordering] of scenarios) {
      if(scenarioFilter && !scenarioFilter.test(name))continue;
      const f = await fixture(browser, legacy, ordering);
      const startedAt = Date.now();
      try {
        await scenario(f, engineName);
        assert.deepEqual(f.errors, [], 'No application runtime errors');
        results.push({ engine: engineName, scenario: name, pass: true, durationMs: Date.now() - startedAt });
        console.log(`PASS ${engineName}: ${name}`);
      } catch (error) {
        await f.page.screenshot({ path: `${output}/${engineName}-${name}-FAILED.png` }).catch(() => {});
        results.push({ engine: engineName, scenario: name, pass: false, error: String(error), runtimeErrors: f.errors });
        console.error(`FAIL ${engineName}: ${name}\n${error}`);
      } finally { await f.context.close(); }
    }
  } finally { await browser.close(); }
}
const report = { url: baseURL, generatedAt: new Date().toISOString(),
  passed: results.filter(result => result.pass).length, total: results.length, results };
await writeFile(`${output}/${scenarioFilter?'report-filtered':'report'}.json`, JSON.stringify({...report,filter:scenarioFilter?.source??null}, null, 2));
console.log(`${report.passed}/${report.total} browser progress scenarios passed`);
if (report.passed !== report.total) process.exitCode = 1;
