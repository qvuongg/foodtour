/**
 * Mobile menu / settings / Happy Hour integration checks against the local app.
 * FOODTOUR_QA_ENGINES=chromium,webkit node tests/menu-hub.browser.mjs
 * Optional FOODTOUR_QA_FILTER selects case names. Each case uses isolated storage;
 * external traffic is blocked and affiliate links are inspected, never followed.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit } from 'playwright';

const baseURL=process.env.FOODTOUR_QA_URL||'http://127.0.0.1:5173';
const origin=new URL(baseURL).origin;
const engines=(process.env.FOODTOUR_QA_ENGINES||'chromium,webkit').split(',');
const filter=process.env.FOODTOUR_QA_FILTER?new RegExp(process.env.FOODTOUR_QA_FILTER,'i'):null;
const output=resolve('artifacts/menu-hub-refinement');
const progressKey='foodtour_foodie_progress_v2';
const menu='.compact-main-menu';
const reports=[];
await mkdir(output,{recursive:true});

async function fixture(browser,{width=390,height=844,motion='reduce',mealKind='lunch'}={}) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
    isMobile:width<768,hasTouch:width<768,reducedMotion:motion,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===origin||['data:','blob:'].includes(url.protocol)?route.continue():route.abort('blockedbyclient');
  });
  await context.addCookies([
    {name:'tnag-community-v1-language',value:encodeURIComponent(JSON.stringify('vi')),url:origin},
    {name:'tnag-community-v1-meal-kind',value:encodeURIComponent(JSON.stringify(mealKind)),url:origin},
  ]);
  await context.addInitScript(key=>{
    if(sessionStorage.getItem('menu-qa-seeded'))return;
    localStorage.setItem(key,JSON.stringify({schemaVersion:2,xp:25,dailyStreak:0,lastActiveDate:'',totalSpins:0,
      totalChecklistTested:0,petName:'Bé Há Mồm',checkedSpotIds:[],completedSpinIds:[],rewardedRestaurantDates:[],lastRestaurantRewardDate:''}));
    sessionStorage.setItem('menu-qa-seeded','1');
  },progressKey);
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('.open-button')&&!document.querySelector('.open-button').disabled);
  return {context,page,errors};
}
async function noOverflow(page,selector=menu) {
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No document horizontal overflow');
  for(const value of await page.locator(`${selector}:visible`).evaluateAll(nodes=>nodes.map(n=>({width:n.clientWidth,scroll:n.scrollWidth})))) {
    assert(value.scroll<=value.width+1,`No panel horizontal overflow: ${JSON.stringify(value)}`);
  }
}
async function touchTarget(page,selector) {
  const box=await page.locator(selector).boundingBox();
  assert(box&&box.width>=43.9&&box.height>=43.9,`${selector}: 44px touch target`);
  return box;
}
async function visibleCTA(page) {
  const box=await page.locator('.open-button').boundingBox(),v=page.viewportSize();
  assert(box&&box.y>=0&&box.y+box.height<=v.height+1&&box.x>=0&&box.x+box.width<=v.width+1,
    `Main spin CTA visible: ${JSON.stringify({box,v})}`);
}
async function openMenu(page) {
  await page.locator('.main-menu-trigger').click();
  await page.locator(menu).waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('.site-frame')?.classList.contains('menu-is-open'));
}
async function closedMenu(page,focus=true) {
  await page.locator(menu).waitFor({state:'hidden'});
  await page.waitForFunction(()=>!document.querySelector('.site-frame')?.classList.contains('menu-is-open'));
  await page.waitForFunction(()=>Math.abs(document.querySelector('.site-shell').getBoundingClientRect().left)<1);
  if(focus)await page.waitForFunction(()=>document.activeElement===document.querySelector('.main-menu-trigger'));
}
async function destination(page,id) {
  await page.locator(`.menu-nav-button[data-destination="${id}"]`).click();
  await page.waitForFunction(()=>document.activeElement?.matches('.menu-detail-back'));
}
async function progress(page) {return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),progressKey);}
async function screenshot(page,name) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({path:resolve(output,`${name}.png`),fullPage:false});
}
async function run(browser,engine,name,options,fn) {
  if(filter&&!filter.test(name))return;
  const session=await fixture(browser,options);
  try {
    await fn(session.page,session.context);
    assert.deepEqual(session.errors,[],'No runtime page errors');
    reports.push({engine,name,passed:true});
    console.log(`PASS ${engine}: ${name}`);
  } catch(error) {
    reports.push({engine,name,passed:false,error:error.stack});
    console.error(`FAIL ${engine}: ${name}\n${error.stack}`);
    await screenshot(session.page,`${engine}-${name.replace(/[^a-z0-9]+/gi,'-')}-failure`);
  } finally {await session.context.close();}
}

for(const engine of engines) {
  const browser=await ({chromium,webkit}[engine]).launch({headless:true});
  try {
    for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[1280,800]]) {
      await run(browser,engine,`push menu layout ${width}x${height}`,{width,height},async page=>{
        await visibleCTA(page);
        await touchTarget(page,'.main-menu-trigger');
        await touchTarget(page,'.settings-trigger');
        assert.equal(await page.locator('.country-badge').count(),0,'Header has no language/country badge');
        assert.equal(await page.locator('.main-menu-trigger').innerText(),'','Menu is icon-only');
        const headerAppearance=await page.locator('.main-menu-trigger,.settings-trigger').evaluateAll(nodes=>nodes.map(n=>({
          border:getComputedStyle(n).borderTopWidth,background:getComputedStyle(n).backgroundColor,
          icon:n.querySelector('svg').getBoundingClientRect().width,logo:document.querySelector('.brand-symbol').getBoundingClientRect().width,
        })));
        for(const appearance of headerAppearance) {
          assert.equal(parseFloat(appearance.border),0,'Header icons have no border');
          assert.equal(appearance.background,'rgba(0, 0, 0, 0)','Header icons have transparent backgrounds');
          assert(appearance.icon<=20&&appearance.icon<appearance.logo,'Header icon art is smaller than the brand logo');
        }
        await screenshot(page,`${engine}-${width}x${height}-home`);
        await openMenu(page);
        const shell=await page.locator('.site-shell').boundingBox();
        const drawer=await page.locator(menu).boundingBox();
        const contentWidth=await page.evaluate(()=>document.documentElement.getBoundingClientRect().right);
        assert(shell.x<0,'Page is visibly pushed left');
        assert(drawer.x>0&&Math.abs(drawer.x+drawer.width-contentWidth)<2,'Menu opens from right and leaves a left page strip');
        const dock=await page.locator('.spin-controls').boundingBox();
        if(width<768)assert(Math.abs(dock.x-shell.x)<2,'Fixed dock moves with the page');
        await noOverflow(page);
        await touchTarget(page,'.menu-close');
        for(const id of ['voucher','checklist','happy-hour'])await touchTarget(page,`.menu-nav-button[data-destination="${id}"]`);
        assert.equal(await page.locator(`${menu} input[type="range"]`).count(),0,'Settings controls are separate from menu');
        await screenshot(page,`${engine}-${width}x${height}-menu`);
        await page.locator('.menu-close').click();
        await closedMenu(page);
        await visibleCTA(page);
        await noOverflow(page);
      });
    }

    await run(browser,engine,'keyboard trap escape and reduced motion',{},async page=>{
      await openMenu(page);
      for(let i=0;i<18;i++) {
        await page.keyboard.press(i<9?'Tab':'Shift+Tab');
        await page.waitForFunction(()=>!!document.activeElement?.closest('.compact-main-menu'));
      }
      const durations=await page.locator('.site-shell,.spin-controls,.compact-main-menu').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).transitionDuration));
      assert(durations.every(d=>d.split(',').every(v=>parseFloat(v)<=0.01)),'Reduced motion disables push transition');
      await page.keyboard.press('Escape');
      await closedMenu(page);
      await visibleCTA(page);
    });

    await run(browser,engine,'visible page strip dismisses menu',{motion:'no-preference'},async page=>{
      await openMenu(page);
      await page.waitForFunction(()=>document.querySelector('.site-shell').getBoundingClientRect().left< -100);
      await page.mouse.click(10,Math.round(page.viewportSize().height/2));
      await closedMenu(page);
      await visibleCTA(page);
      await noOverflow(page);
    });

    await run(browser,engine,'scrolled page retains position and fixed dock',{},async page=>{
      await page.evaluate(()=>window.scrollTo(0,Math.min(600,document.documentElement.scrollHeight-innerHeight)));
      const before=await page.evaluate(()=>scrollY);
      assert(before>0,'Fixture page can scroll');
      // Programmatic activation isolates scroll-lock geometry from Playwright's
      // automatic scroll-to-visible on the intentionally off-screen header.
      await page.locator('.main-menu-trigger').evaluate(button=>button.click());
      await page.locator(menu).waitFor({state:'visible'});
      const box=await page.locator('.spin-controls').boundingBox();
      assert(box.y+box.height<=page.viewportSize().height+1,'Dock stays at viewport bottom when a scrolled page is pushed');
      await noOverflow(page);
      await page.keyboard.press('Escape');
      await closedMenu(page);
      assert(Math.abs((await page.evaluate(()=>scrollY))-before)<2,'Closing restores prior page scroll position');
    });

    for(const [width,height] of [[390,844],[320,568]])await run(browser,engine,`voucher collections ${width}x${height}`,{width,height},async page=>{
      const before=await progress(page);
      await openMenu(page);
      const headerTop=(await page.locator('.menu-hub-header').boundingBox()).y;
      await destination(page,'voucher');
      const links=page.locator('.voucher-collection-link');
      await links.first().waitFor({state:'visible'});
      assert.equal(await links.count(),12,'Twelve sourced collections are listed');
      const hrefs=await links.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
      assert.equal(new Set(hrefs).size,12,'Every collection has a distinct destination');
      for(let i=0;i<hrefs.length;i++) {
        const url=new URL(hrefs[i]);
        assert.equal(url.origin,'https://shopeefood.vn');
        assert.match(url.pathname,/\/bo-suu-tap\//);
        assert.equal(await links.nth(i).getAttribute('target'),'_blank');
        assert.match(await links.nth(i).getAttribute('rel'),/noopener|noreferrer/);
        const box=await links.nth(i).boundingBox();
        assert(box.width>=44&&box.height>=44,'Collection link has a 44px touch target');
      }
      const source=page.locator('.voucher-source-link');
      assert.equal(await source.getAttribute('href'),'https://shopeefood.vn/food/collection-list');
      await touchTarget(page,'.voucher-source-link');
      assert.match(await page.locator(menu).innerText(),/TP\.?\s?HCM|Hồ Chí Minh|Ho Chi Minh/i,'Collection location is explicit');
      assert.equal(await page.locator(`${menu} a[href*="spf.shopee"],${menu} a[href="#"]`).count(),0,'No old hub shortcut or placeholder destination');
      await noOverflow(page);
      await screenshot(page,`${engine}-${width}x${height}-voucher`);
      assert(Math.abs((await page.locator('.menu-hub-header').boundingBox()).y-headerTop)<1,'Detail navigation keeps header in place');
      await links.last().scrollIntoViewIfNeeded();
      await screenshot(page,`${engine}-${width}x${height}-voucher-bottom`);
      const closeBox=await page.locator('.menu-close').boundingBox();
      assert(closeBox.y>=0&&closeBox.y+closeBox.height<=height,'Close remains accessible when collection list scrolls');
      assert.deepEqual(await progress(page),before,'Browsing collections does not award restaurant XP');
      assert.equal(page.context().pages().length,1,'Viewing collections does not auto-open external pages');
      await page.locator('.menu-detail-back').click();
      await page.locator('.menu-nav-button[data-destination="voucher"]').waitFor({state:'visible'});
      await page.waitForFunction(()=>document.activeElement?.matches('.menu-nav-button[data-destination="voucher"]'));
      await page.keyboard.press('Escape');
      await closedMenu(page);
    });

    for(const [width,height] of [[390,844],[320,568]])await run(browser,engine,`inline checklist filters details persistence ${width}x${height}`,{width,height},async page=>{
      await openMenu(page);
      await destination(page,'checklist');
      await page.locator(`${menu} .local-checklist`).waitFor({state:'visible'});
      assert.equal(await page.locator('.checklist-modal-container:visible').count(),0,'Checklist does not launch another modal');
      assert.equal(await page.locator('[role="dialog"]:visible').count(),1,'Only the same menu dialog remains open');
      assert.equal(await page.locator('.site-frame.menu-is-open').count(),1,'Checklist keeps the page pushed');
      await noOverflow(page,'.local-checklist');
      const first=page.locator('.checklist-item-toggle').first();
      await first.click();
      await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.xp===30,progressKey);
      assert.equal((await progress(page)).checkedSpotIds.length,1);
      await page.locator('.checklist-status-select').selectOption('tested');
      assert.equal(await page.locator('.checklist-item-toggle').count(),1);
      await page.locator('.checklist-item-toggle').click();
      await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.xp===25,progressKey);
      await page.locator('.checklist-empty-state').waitFor({state:'visible'});
      await page.locator('.checklist-status-select').selectOption('all');
      await first.click();
      await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.xp===30,progressKey);
      const beforeDetails=await progress(page);
      await page.locator('.checklist-item-details').first().locator('summary').click();
      await page.locator('.checklist-item-details[open] .checklist-item-detail-content').waitFor({state:'visible'});
      assert.deepEqual(await progress(page),beforeDetails,'Expanding information does not reward XP');
      const foodNames=await page.locator('.checklist-item-name').allTextContents();
      await page.locator('.checklist-city-tab').filter({hasText:'Đà Nẵng'}).click();
      assert.notDeepEqual(await page.locator('.checklist-item-name').allTextContents(),foodNames,'City changes available local dishes');
      await page.locator('.checklist-kind-tabs [data-kind="drink"]').click();
      assert(await page.locator('.checklist-item-toggle').count()>0,'Local drinks remain accessible');
      await page.locator('.checklist-status-select').selectOption('tested');
      await page.locator('.checklist-empty-state').waitFor({state:'visible'});
      await page.locator('.checklist-status-select').selectOption('all');
      await noOverflow(page,'.local-checklist');
      await screenshot(page,`${engine}-${width}x${height}-local-checklist-drinks`);
      await page.locator('.menu-detail-back').click();
      await page.waitForFunction(()=>document.activeElement?.matches('.menu-nav-button[data-destination="checklist"]'));
      await page.keyboard.press('Escape');
      await closedMenu(page);
      await visibleCTA(page);
      await page.reload({waitUntil:'networkidle'});
      assert.equal((await progress(page)).xp,30);
      await openMenu(page);
      await destination(page,'checklist');
      await page.locator('.local-checklist').waitFor({state:'visible'});
      assert.equal(await page.locator('.checklist-item-toggle').first().getAttribute('aria-checked'),'true');
      await screenshot(page,`${engine}-${width}x${height}-local-checklist`);
      await page.keyboard.press('Escape');
      await closedMenu(page);
      await visibleCTA(page);
    });

    await run(browser,engine,'inline checklist storage failure and retry',{},async page=>{
      await openMenu(page);
      await destination(page,'checklist');
      await page.locator('.local-checklist').waitFor({state:'visible'});
      await page.evaluate(key=>{
        window.__menuQASetItem=Storage.prototype.setItem;
        Storage.prototype.setItem=function(storageKey,value) {
          if(this===localStorage&&storageKey===key)throw new DOMException('QA quota failure','QuotaExceededError');
          return window.__menuQASetItem.call(this,storageKey,value);
        };
      },progressKey);
      await page.locator('.checklist-item-toggle').first().click();
      await page.locator('.local-checklist .checklist-save-error').waitFor({state:'visible'});
      assert.equal((await progress(page)).xp,25,'Failed write does not claim persisted progress');
      assert.equal(await page.locator('.checklist-item-toggle').first().getAttribute('aria-checked'),'true','Unsaved user change remains visible');
      await screenshot(page,`${engine}-local-checklist-save-error`);
      await page.evaluate(()=>{Storage.prototype.setItem=window.__menuQASetItem;});
      await page.locator('.local-checklist .checklist-save-error button').click();
      await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.xp===30,progressKey);
      await page.locator('.local-checklist .checklist-save-error').waitFor({state:'hidden'});
      assert.equal((await progress(page)).checkedSpotIds.length,1,'Retry saves once without duplicate XP');
      await page.keyboard.press('Escape');
      await closedMenu(page);
    });

    await run(browser,engine,'pet home no longer exposes checklist navigation',{},async page=>{
      const trigger='.foodie-pet-widget[data-placement="floating"]';
      await page.locator(trigger).click();
      await page.locator('.pet-home').waitFor({state:'visible'});
      assert.equal(await page.locator('.pet-home-journal').count(),0);
      assert.doesNotMatch(await page.locator('.pet-home').innerText(),/Sổ tay|checklist|journal/i);
      await screenshot(page,`${engine}-pet-home`);
      await page.keyboard.press('Escape');
      await page.locator('.pet-home').waitFor({state:'hidden'});
      await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),trigger);
      await visibleCTA(page);
    });

    await run(browser,engine,'separate settings language volume persistence and focus',{},async page=>{
      await page.locator('.settings-trigger').click();
      await page.locator('.settings-dialog').waitFor({state:'visible'});
      assert.equal(await page.locator(`${menu}:visible`).count(),0,'Gear does not open menu');
      await noOverflow(page,'.settings-dialog');
      await touchTarget(page,'.settings-close');
      await touchTarget(page,'.settings-mute');
      const slider=page.locator('.settings-volume-range');
      await slider.focus();
      await slider.press('Home');
      for(let i=0;i<4;i++)await slider.press('ArrowRight');
      assert.equal(await slider.inputValue(),'4');
      await page.locator('.settings-mute').click();
      assert.equal(await slider.inputValue(),'0');
      await page.locator('.settings-mute').click();
      assert.equal(await slider.inputValue(),'4','Unmute restores selected level');
      await page.locator('.settings-language-options button[lang="en"]').click();
      await page.waitForFunction(()=>document.documentElement.lang==='en');
      assert.equal(await page.locator('.settings-title').innerText(),'Settings');
      for(let i=0;i<20;i++) {
        await page.keyboard.press(i<10?'Tab':'Shift+Tab');
        await page.waitForFunction(()=>!!document.activeElement?.closest('.settings-dialog'));
      }
      await screenshot(page,`${engine}-settings-english`);
      await page.keyboard.press('Escape');
      await page.locator('.settings-dialog').waitFor({state:'hidden'});
      await page.waitForFunction(()=>document.activeElement===document.querySelector('.settings-trigger'));
      await page.reload({waitUntil:'networkidle'});
      await page.waitForFunction(()=>document.documentElement.lang==='en');
      await page.locator('.settings-trigger').click();
      assert.equal(await slider.inputValue(),'4');
      assert.equal(await page.locator('.settings-language-options button[lang="en"]').getAttribute('aria-pressed'),'true');
      await page.locator('.settings-language-options button[lang="vi"]').click();
      await page.locator('.settings-close').click();
      await visibleCTA(page);
    });

    await run(browser,engine,'settings my dishes accessible from drinks',{mealKind:'drink'},async page=>{
      await page.locator('.settings-trigger').click();
      await page.getByRole('button',{name:/Món của tôi/}).click();
      await page.locator('.preferences-dialog').waitFor({state:'visible'});
      await page.locator('.settings-dialog').waitFor({state:'hidden'});
      await noOverflow(page,'.preferences-dialog');
      await page.keyboard.press('Escape');
      await page.locator('.preferences-dialog').waitFor({state:'hidden'});
      await page.waitForFunction(()=>document.activeElement===document.querySelector('.settings-trigger'));
      await visibleCTA(page);
    });

    await run(browser,engine,'Happy Hour budget serving math alternatives and insufficient state',{},async page=>{
      const before=await progress(page);
      const amount=text=>Number(text.replace(/[^0-9]/g,''));
      const verify=async(budget,people)=>{
        await page.locator('.happy-hour-menu').waitFor({state:'visible'});
        const lines=await page.locator('.happy-hour-calculation').evaluateAll(nodes=>nodes.map(node=>({formula:node.querySelector('span').textContent,subtotal:node.querySelector('strong').textContent})));
        assert.equal(lines.length,2,'Each menu has one drink and one snack');
        const subtotals=lines.map(line=>{
          const [quantity,price]=line.formula.split('×');
          assert.equal(amount(quantity),people,'Each member gets one serving');
          assert.equal(amount(line.subtotal),people*amount(price),'Subtotal equals quantity times catalog price');
          return amount(line.subtotal);
        });
        const totals=(await page.locator('.happy-hour-total dd').allTextContents()).map(amount);
        const total=subtotals.reduce((a,b)=>a+b,0);
        assert.equal(totals[0],total);
        assert.equal(totals[1],total/people);
        assert.equal(totals[2],budget-total);
        assert(total<=budget,'Suggested menu never exceeds budget');
        await noOverflow(page);
      };
      await openMenu(page);
      const headerTop=(await page.locator('.menu-hub-header').boundingBox()).y;
      await destination(page,'happy-hour');
      await page.locator('.happy-hour').waitFor({state:'visible'});
      await verify(500000,5);
      await touchTarget(page,'.happy-hour-stepper button:first-child');
      await touchTarget(page,'.happy-hour-stepper button:last-child');
      await touchTarget(page,'.happy-hour-alternative');
      await screenshot(page,`${engine}-happy-hour-default`);
      assert(Math.abs((await page.locator('.menu-hub-header').boundingBox()).y-headerTop)<1,'Happy Hour header keeps safe-area position');
      const names=await page.locator('.happy-hour-food-detail h4').allTextContents();
      await page.locator('.happy-hour-alternative').click();
      assert.notDeepEqual(await page.locator('.happy-hour-food-detail h4').allTextContents(),names,'Alternative suggests different real dishes');
      await verify(500000,5);
      const more=page.getByRole('button',{name:'Thêm một người',exact:true});
      const fewer=page.getByRole('button',{name:'Bớt một người',exact:true});
      await more.click();
      await verify(500000,6);
      const range=page.locator('.happy-hour-range');
      await range.focus();
      await range.press('Home');
      assert.equal(await range.inputValue(),'100');
      for(let i=6;i<20;i++)await more.click();
      assert.equal(await more.isDisabled(),true);
      await page.locator('.happy-hour-empty').waitFor({state:'visible'});
      assert.equal(await page.locator('.happy-hour-menu').count(),0,'Insufficient budget does not invent a menu');
      await screenshot(page,`${engine}-happy-hour-insufficient`);
      await range.focus();
      await range.press('End');
      assert.equal(await range.inputValue(),'2000');
      await verify(2000000,20);
      for(let i=20;i>2;i--)await fewer.click();
      assert.equal(await fewer.isDisabled(),true);
      await verify(2000000,2);
      assert.deepEqual(await progress(page),before,'Happy Hour suggestions do not alter progress');
      await page.locator('.menu-detail-back').click();
      await page.waitForFunction(()=>document.activeElement?.matches('.menu-nav-button[data-destination="happy-hour"]'));
      await page.keyboard.press('Escape');
      await closedMenu(page);
      await visibleCTA(page);
    });
  } finally {await browser.close();}
}
await writeFile(resolve(output,filter?'report-focused.json':'report.json'),JSON.stringify({baseURL,notice:'Isolated test fixtures, all external traffic blocked; no affiliate link followed.',results:reports},null,2));
const failed=reports.filter(r=>!r.passed);
console.log(`\n${reports.length-failed.length}/${reports.length} menu hub browser cases passed. ${output}`);
if(failed.length)process.exitCode=1;
