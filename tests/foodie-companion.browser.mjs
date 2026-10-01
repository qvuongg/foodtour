/**
 * Isolated mobile companion regression checks. Start `pnpm dev` first, then:
 *   node tests/foodie-companion.browser.mjs
 *   FOODTOUR_QA_ENGINES=chromium,webkit node tests/foodie-companion.browser.mjs
 * Screenshots contain seeded QA fixtures, never real user progress.
 * All requests outside FOODTOUR_QA_URL's origin are blocked. No order/share clicks.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit, firefox } from 'playwright';

const baseURL = process.env.FOODTOUR_QA_URL || 'http://127.0.0.1:5173';
const origin = new URL(baseURL).origin;
const engines = (process.env.FOODTOUR_QA_ENGINES || 'chromium').split(',').map(x => x.trim());
const output = resolve('artifacts/foodie-companion/browser-qa');
const storageKey = 'foodtour_foodie_streak_v1';
const checklistKey = 'foodtour_must_try_checklist_v1';
const floating = '.foodie-pet-widget[data-placement="floating"]';
const header = '.foodie-pet-widget[data-placement="header"]';
const sheet = '.checklist-modal-container';
const reports = [];
await mkdir(output, { recursive: true });

function overlap(a, b) {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
}

async function fixture(browser, options = {}) {
  const { width = 390, height = 844, score = 90, language = 'vi', motion = 'reduce' } = options;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1,
    isMobile: width < 768, hasTouch: width < 768, reducedMotion: motion, locale: language === 'vi' ? 'vi-VN' : 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh' });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === origin || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addCookies([{ name: 'tnag-community-v1-language', value: encodeURIComponent(JSON.stringify(language)), url: origin }]);
  await context.addInitScript(({ score, storageKey, checklistKey }) => {
    // Session marker ensures reload checks do not overwrite the state under test.
    if (!sessionStorage.getItem('foodie-companion-qa-seeded')) {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      localStorage.setItem(storageKey, JSON.stringify({ score, dailyStreak: 7, lastActiveDate: today,
        totalSpins: 12, totalChecklistTested: 0, petName: 'Bé Há Mồm' }));
      localStorage.setItem(checklistKey, '[]');
      sessionStorage.setItem('foodie-companion-qa-seeded', '1');
    }
  }, { score, storageKey, checklistKey });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.lang === document.cookie.split('; ').find(v => v.startsWith('tnag-community-v1-language='))?.split('=').slice(1).join('=').replaceAll('%22',''));
  await page.waitForFunction(() => {
    const cta = document.querySelector('.open-button');
    return cta && !cta.disabled && document.querySelector('.spotlight-card.featured');
  });
  return { page, context, errors };
}

async function assertNoDuplicateIDs(page) {
  const duplicates = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('svg [id]')].map(node => node.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  assert.deepEqual(duplicates, [], 'Mascots rendered together must have unique SVG definition IDs');
}

async function assertInViewport(page, selector, label = selector) {
  const b = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  assert(b && b.width >= 44 && b.height >= 44, `${label}: touch target must be at least 44px`);
  assert(b.x >= -1 && b.y >= -1 && b.x + b.width <= viewport.width + 1 && b.y + b.height <= viewport.height + 1,
    `${label}: expected fully visible without scrolling; ${JSON.stringify(b)} in ${JSON.stringify(viewport)}`);
  return b;
}

async function openSheet(page, trigger = floating) {
  // Safari does not focus buttons on pointer click. Start this keyboard/focus
  // regression from a focused trigger so return-focus assertions are meaningful.
  await page.locator(trigger).focus();
  await page.locator(trigger).press('Enter');
  await page.locator(sheet).waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.activeElement?.classList.contains('checklist-close-btn'));
  await assertNoDuplicateIDs(page);
}

async function closeSheet(page, trigger = floating) {
  await page.keyboard.press('Escape');
  await page.locator(sheet).waitFor({ state: 'hidden' });
  await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), trigger);
}

async function assertScore(page, score) {
  await page.waitForFunction(({ key, score }) => JSON.parse(localStorage.getItem(key))?.score === score,
    { key: storageKey, score });
  assert.equal(await page.locator(`${floating} .foodie-pet-score strong`).textContent(), String(score));
}

async function checkLayout(page) {
  await assertInViewport(page, '.open-button', 'Primary spin CTA');
  const widget = await assertInViewport(page, floating, 'Floating companion');
  const svg = await page.locator(`${floating} .pet-mascot-svg`).boundingBox();
  assert.equal(await page.locator(header).isVisible(), false, 'Mobile uses the floating companion only');
  const boxes = await page.evaluate(() => {
    const toRect = node => { const r = node.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height }; };
    const stage = toRect(document.querySelector('.spotlight-cards'));
    const visible = node => {
      const r = node.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && r.bottom > stage.y && r.top < stage.y + stage.height;
    };
    return { stage, intro: toRect(document.querySelector('.intro')),
      photos: [...document.querySelectorAll('.spotlight-photo')].filter(visible).map(toRect),
      labels: [...document.querySelectorAll('.spotlight-copy h2')].filter(visible).map(toRect),
      featured: toRect(document.querySelector('.spotlight-card.featured .spotlight-photo')),
      overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  });
  assert.equal(boxes.overflow, false, 'Page must not overflow horizontally');
  const obstacles = [boxes.intro, ...boxes.photos, ...boxes.labels, await page.locator('.open-button').boundingBox()];
  for (const rect of obstacles) {
    assert.equal(overlap(svg, rect), false, `Actual mascot overlaps content: ${JSON.stringify({svg,rect})}`);
    assert.equal(overlap(widget, rect), false, `Companion hit target overlaps content: ${JSON.stringify({widget,rect})}`);
  }
  const f = boxes.featured, s = boxes.stage;
  assert(f.y >= s.y - 1 && f.y + f.height <= s.y + s.height + 1,
    `Full central food photo must fit vertically inside stage: ${JSON.stringify({photo:f,stage:s})}`);
  assert(f.x >= -1 && f.x + f.width <= page.viewportSize().width + 1, 'Central food photo must fit horizontally on screen');
  await assertNoDuplicateIDs(page);
}

async function testCase(browser, engine, name, options, run) {
  let data;
  const started = Date.now();
  try {
    data = await fixture(browser, options);
    await run(data.page);
    assert.deepEqual(data.errors, [], 'No browser runtime errors');
    reports.push({ engine, name, passed:true, durationMs:Date.now()-started });
    console.log(`PASS [${engine}] ${name}`);
  } catch (error) {
    const screenshot = `${engine}-${name.replaceAll(/[^a-z0-9]+/gi,'-')}-fixture-failure.png`;
    await data?.page.screenshot({ path:resolve(output,screenshot), fullPage:false }).catch(()=>{});
    reports.push({ engine, name, passed:false, error:error.message, stack:error.stack, screenshot, durationMs:Date.now()-started });
    console.error(`FAIL [${engine}] ${name}: ${error.message}`);
  } finally { await data?.context.close(); }
}

for (const engine of engines) {
  const browserType = { chromium, webkit, firefox }[engine];
  assert(browserType, `Unknown FOODTOUR_QA_ENGINES value: ${engine}`);
  let browser;
  try { browser = await browserType.launch(); }
  catch(error) { reports.push({engine,name:'Browser launch',passed:false,error:error.message}); console.error(`FAIL [${engine}] launch: ${error.message}`); continue; }
  try {
    for (const [width,height] of [[320,568],[360,640],[375,667],[390,844],[430,932],[390,740]]) {
      await testCase(browser,engine,`mobile layout ${width}x${height}`,{width,height},async page => {
        await checkLayout(page);
        await page.screenshot({path:resolve(output,`${engine}-${width}x${height}-home-fixture.png`),fullPage:false});
      });
    }

    await testCase(browser,engine,'sheet keyboard persistence and rewards',{},async page => {
      await openSheet(page);
      const stats=await page.locator('.checklist-pet-stats').innerText();
      assert.match(stats,/Điểm lửa\s+90\s*điểm/);
      assert.match(stats,/Chuỗi ngày\s+7\s*ngày/);
      await assertInViewport(page,'.checklist-close-btn','Sheet close');
      for(let i=0;i<80;i++) {
        await page.keyboard.press(i<40?'Tab':'Shift+Tab');
        // Base UI may briefly focus a sentinel before forwarding to sheet content.
        await page.waitForFunction(()=>!!document.activeElement?.closest('.checklist-modal-container'),null,{timeout:1500});
      }
      await page.locator('.checklist-item-toggle').first().click();
      await assertScore(page,95);
      assert.equal(await page.locator('.checklist-item-toggle').first().getAttribute('aria-checked'),'true');
      await closeSheet(page);
      await page.reload({waitUntil:'networkidle'});
      await assertScore(page,95);
      await openSheet(page);
      assert.equal(await page.locator('.checklist-item-toggle').first().getAttribute('aria-checked'),'true');
      await page.locator('.checklist-item-toggle').first().click();
      await assertScore(page,90);
      assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).dailyStreak,storageKey),7);
      await closeSheet(page);
      await assertInViewport(page,'.open-button','Restored spin CTA');
    });

    await testCase(browser,engine,'pointer-open restores companion focus',{},async page => {
      await page.locator(floating).click();
      await page.locator(sheet).waitFor({state:'visible'});
      await page.waitForFunction(()=>document.activeElement?.classList.contains('checklist-close-btn'));
      await closeSheet(page);
      assert.equal(await page.locator(floating).getAttribute('aria-expanded'),'false');
    });

    await testCase(browser,engine,'English sheet and reduced motion',{language:'en',width:360,height:640},async page => {
      await checkLayout(page);
      assert.match(await page.locator(floating).getAttribute('aria-label'),/90 fire points/);
      await openSheet(page);
      assert.equal(await page.locator('.checklist-modal-title').textContent(),'Your foodie pet');
      assert.match(await page.locator('.checklist-pet-stats').innerText(),/Daily streak\s+7\s*days/);
      const animated=await page.evaluate(()=>[...document.querySelectorAll('.foodie-pet-wrapper *,.foodie-pet-gain')]
        .filter(n=>getComputedStyle(n).animationName!=='none').map(n=>n.getAttribute('class')));
      assert.deepEqual(animated,[],'Reduced motion must disable all mascot animations');
      await page.screenshot({path:resolve(output,`${engine}-english-sheet-fixture.png`),fullPage:false});
      await closeSheet(page);
    });

    await testCase(browser,engine,'normal motion pauses behind sheet',{motion:'no-preference'},async page => {
      await page.mouse.move(1,1);
      await page.waitForFunction(selector=>getComputedStyle(document.querySelector(`${selector} .pet-float-body`)).animationPlayState==='running',floating);
      await openSheet(page);
      assert.equal(await page.locator(`${floating} .pet-float-body`).evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
      const first=await page.locator('.spotlight-card.featured').getAttribute('style');
      await page.waitForTimeout(220);
      assert.equal(await page.locator('.spotlight-card.featured').getAttribute('style'),first,'Carousel must pause behind sheet');
      await closeSheet(page);
    });

    for(const score of [99,199]) {
      await testCase(browser,engine,`completed spin ${score} to ${score+1}`,{score},async page => {
        const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
        const start=Date.now();
        await page.locator('.open-button').click();
        await page.waitForFunction(selector=>document.querySelector(selector).disabled,floating);
        assert(await page.locator(`${floating} .pet-float-body`).evaluate(n=> {
          const css=getComputedStyle(n); return css.animationName==='none'||css.animationPlayState==='paused';
        }),'Mascot must pause or disable animation while spinning');
        assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).score,storageKey),score,'Spin start must not award points');
        await page.locator('.food-result-dialog').waitFor({state:'visible',timeout:15000});
        assert(Date.now()-start>=3800,'Reduced-motion spin must retain existing deliberate duration');
        await assertScore(page,score+1);
        const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
        assert.equal(after.totalSpins,before.totalSpins+1);
        assert.equal(after.dailyStreak,before.dailyStreak);
        assert.match(await page.locator(floating).getAttribute('class'),score===99?/tier-blue/:/tier-purple/);
        await page.keyboard.press('Escape');
        await page.locator('.food-result-dialog').waitFor({state:'hidden'});
        await assertInViewport(page,'.open-button','Spin CTA after result');
      });
    }

    for(const [width,height] of [[1280,900],[740,390]]) {
      await testCase(browser,engine,`header fallback ${width}x${height}`,{width,height},async page => {
        assert.equal(await page.locator(floating).isVisible(),false);
        await assertInViewport(page,header,'Header pet');
        await assertInViewport(page,'.open-button','Spin CTA');
        await openSheet(page,header);
        await closeSheet(page,header);
      });
    }
  } finally { await browser.close(); }
}

await writeFile(resolve(output,'report.json'),JSON.stringify({baseURL,fixtureNotice:'All progress in screenshots is seeded QA data. External network blocked; no affiliate/share actions tested.',results:reports},null,2));
const failed=reports.filter(r=>!r.passed);
console.log(`\n${reports.length-failed.length}/${reports.length} browser cases passed. Fixture artifacts: ${output}`);
if(failed.length)process.exitCode=1;
