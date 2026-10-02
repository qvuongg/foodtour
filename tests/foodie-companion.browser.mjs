/**
 * Foodie companion v2 integration checks against an already running local app.
 *   FOODTOUR_QA_ENGINES=chromium,webkit node tests/foodie-companion.browser.mjs
 * FOODTOUR_QA_FILTER='hero arrows|focus trap pointer' runs only that subset.
 * Every case uses an isolated context. Screenshots use seeded test progress.
 * All external requests are blocked; no order, geolocation or share actions run.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit, firefox } from 'playwright';

const baseURL = process.env.FOODTOUR_QA_URL || 'http://127.0.0.1:5173';
const origin = new URL(baseURL).origin;
const engines = (process.env.FOODTOUR_QA_ENGINES || 'chromium').split(',').map(x => x.trim());
const output = resolve('artifacts/foodie-pet-v2/arrow-qa');
const scenarioFilter = process.env.FOODTOUR_QA_FILTER ? new RegExp(process.env.FOODTOUR_QA_FILTER, 'i') : null;
const storageKey = 'foodtour_foodie_progress_v2';
const floating = '.foodie-pet-widget[data-placement="floating"]';
const header = '.foodie-pet-widget[data-placement="header"]';
const pet = '.pet-home';
const journal = '.local-checklist';
const reports = [];
await mkdir(output, { recursive: true });

function overlaps(a, b) {
  return Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1 &&
    Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
}
async function fixture(browser, options = {}) {
  const { width=390,height=844,xp=18,language='vi',motion='reduce' } = options;
  const context = await browser.newContext({ viewport:{width,height}, deviceScaleFactor:1,
    isMobile:width<768, hasTouch:width<768, reducedMotion:motion,
    locale:language==='vi'?'vi-VN':'en-US', timezoneId:'Asia/Ho_Chi_Minh' });
  await context.route('**/*', route => {
    const url=new URL(route.request().url());
    return url.origin===origin || ['data:','blob:'].includes(url.protocol) ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addCookies([{name:'tnag-community-v1-language',value:encodeURIComponent(JSON.stringify(language)),url:origin}]);
  await context.addInitScript(({xp,storageKey}) => {
    if(sessionStorage.getItem('foodie-v2-qa-seeded'))return;
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const part=k=>parts.find(p=>p.type===k).value;
    localStorage.setItem(storageKey,JSON.stringify({schemaVersion:2,xp,dailyStreak:7,lastActiveDate:`${part('year')}-${part('month')}-${part('day')}`,
      totalSpins:12,totalChecklistTested:0,petName:'Bé Há Mồm',checkedSpotIds:[],completedSpinIds:[],rewardedRestaurantDates:[],lastRestaurantRewardDate:''}));
    sessionStorage.setItem('foodie-v2-qa-seeded','1');
  },{xp,storageKey});
  const page=await context.newPage();
  page.setDefaultTimeout(7000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await page.waitForFunction(language=>document.documentElement.lang===language,language);
  await page.waitForFunction(()=>{
    const cta=document.querySelector('.open-button');
    return cta&&!cta.disabled&&document.querySelector('.spotlight-card.featured');
  });
  return {page,context,errors};
}
async function uniqueIds(page) {
  const duplicates=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('svg [id]')].map(n=>n.id);
    return ids.filter((id,i)=>ids.indexOf(id)!==i);
  });
  assert.deepEqual(duplicates,[],'Every displayed mascot needs unique SVG gradient IDs');
}
async function withinViewport(page,selector,label=selector) {
  const b=await page.locator(selector).boundingBox(), v=page.viewportSize();
  assert(b&&b.width>=44&&b.height>=44,`${label}: minimum 44px touch target`);
  assert(b.x>=-1&&b.y>=-1&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,
    `${label} must be fully visible without scrolling: ${JSON.stringify({box:b,viewport:v})}`);
  return b;
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Page has no horizontal overflow');
  const overflow=await page.locator(`${pet}:visible,${journal}:visible`).evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.className));
  assert.deepEqual(overflow,[],'Dialogs have no horizontal overflow');
}
async function readState(page) { return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey); }
async function assertXP(page,xp) {
  await page.waitForFunction(({key,xp})=>JSON.parse(localStorage.getItem(key))?.xp===xp,{key:storageKey,xp});
  assert.match(await page.locator(floating).getAttribute('aria-label'),new RegExp(`, ${xp} XP`));
}
async function waitHome(page) {
  await page.locator(pet).waitFor({state:'hidden'});
  await page.locator(journal).waitFor({state:'hidden'});
  await page.locator('.compact-main-menu').waitFor({state:'hidden'});
  await page.waitForFunction(()=>!history.state?.foodieCompanion);
}
async function openPet(page,trigger=floating) {
  await page.locator(trigger).focus();
  await page.locator(trigger).press('Enter');
  await page.locator(pet).waitFor({state:'visible'});
  await page.waitForFunction(()=>document.activeElement?.classList.contains('pet-home-close'));
  await uniqueIds(page);
}
async function closePet(page,trigger=floating) {
  await page.keyboard.press('Escape');
  await waitHome(page);
  await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),trigger);
}
async function openJournal(page) {
  if (await page.locator(pet).isVisible()) await closePet(page);
  await page.locator('.main-menu-trigger').click();
  await page.locator('[data-destination="checklist"]').click();
  await page.locator(journal).waitFor({state:'visible'});
}
async function closeJournal(page) {
  await page.locator('.compact-main-menu .menu-close').click();
  await waitHome(page);
  await page.waitForFunction(()=>document.activeElement===document.querySelector('.main-menu-trigger'));
}
async function layout(page) {
  const viewport=page.viewportSize();
  const mobile=viewport.width<768&&viewport.height>500;
  const trigger=mobile?floating:header;
  await withinViewport(page,'.open-button','Home spin CTA');
  await withinViewport(page,trigger,'Visible companion button');
  assert.equal(await page.locator(mobile?header:floating).isVisible(),false,'Only one responsive companion trigger');
  await noOverflow(page);
  if(mobile) {
    const rects=await page.evaluate(()=>{
      const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
      const stage=rect(document.querySelector('.spotlight-cards'));
      const visible=n=>{const r=n.getBoundingClientRect();return r.width&&r.height&&r.right>0&&r.left<innerWidth&&r.bottom>stage.y&&r.top<stage.y+stage.height};
      return {stage,widget:rect(document.querySelector('.foodie-pet-widget[data-placement="floating"]')),
        obstacles:[rect(document.querySelector('.intro')),...[...document.querySelectorAll('.spotlight-photo,.spotlight-copy h2')].filter(visible).map(rect)],
        featured:rect(document.querySelector('.spotlight-card.featured .spotlight-photo'))};
    });
    for(const obstacle of rects.obstacles)assert.equal(overlaps(rects.widget,obstacle),false,`Companion overlaps food or headline: ${JSON.stringify({widget:rects.widget,obstacle})}`);
    assert(rects.featured.y>=rects.stage.y-1&&rects.featured.y+rects.featured.height<=rects.stage.y+rects.stage.height+1,'Central food picture is not vertically clipped');
  }
  await page.screenshot({path:resolve(output,`${currentEngine}-${viewport.width}x${viewport.height}-home.png`)});
  await openPet(page,trigger);
  await withinViewport(page,'.pet-home-close','Pet close');
  if(viewport.height>500)await withinViewport(page,'.pet-home-spin','Pet spin CTA');
  else {
    await page.locator('.pet-home-spin').scrollIntoViewIfNeeded();
    await withinViewport(page,'.pet-home-spin','Pet spin CTA after short landscape scroll');
  }
  await noOverflow(page);
  assert.equal(await page.locator(`${pet} .checklist-item-toggle`).count(),0,'Pet view must not include journal rows');
  await page.screenshot({path:resolve(output,`${currentEngine}-${viewport.width}x${viewport.height}-pet.png`)});
  await closePet(page,trigger);
}
let currentEngine='';
async function testCase(browser,engine,name,options,run) {
  if(scenarioFilter && !scenarioFilter.test(name))return;
  let data;
  const started=Date.now();
  try {
    data=await fixture(browser,options);
    await run(data.page);
    assert.deepEqual(data.errors,[],'No browser runtime errors');
    reports.push({engine,name,passed:true,durationMs:Date.now()-started});
    console.log(`PASS [${engine}] ${name}`);
  } catch(error) {
    const screenshot=`${engine}-${name.replaceAll(/[^a-z0-9]+/gi,'-')}-failure.png`;
    await data?.page.screenshot({path:resolve(output,screenshot)}).catch(()=>{});
    reports.push({engine,name,passed:false,error:error.message,stack:error.stack,screenshot,durationMs:Date.now()-started});
    console.error(`FAIL [${engine}] ${name}: ${error.message}`);
  } finally { await data?.context.close(); }
}

for(const engine of engines) {
  currentEngine=engine;
  const type={chromium,webkit,firefox}[engine];
  assert(type,`Unknown browser engine: ${engine}`);
  let browser;
  try { browser=await type.launch(); }
  catch(error) {reports.push({engine,name:'Browser launch',passed:false,error:error.message});continue;}
  try {
    for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[390,740],[740,390],[1280,900]]) {
      await testCase(browser,engine,`layout ${width}x${height}`,{width,height},layout);
    }
    await testCase(browser,engine,'rename validation cancellation and persistence',{},async page=>{
      await openPet(page);
      await page.locator('.pet-home-name').click();
      const input=page.locator('.pet-home-rename input');
      for(const invalid of ['a','Tên quá dài vượt hai mươi ký tự']) {
        await input.fill(invalid);await input.press('Enter');
        await page.locator('.pet-home-error').waitFor({state:'visible'});
        assert.equal(await input.getAttribute('aria-invalid'),'true');
        assert.equal((await readState(page)).petName,'Bé Há Mồm');
      }
      await input.fill('  Bé   Măm  ');await input.press('Enter');
      await page.locator('.pet-home-rename').waitFor({state:'hidden'});
      assert.equal((await readState(page)).petName,'Bé Măm');
      await page.locator('.pet-home-name').click();await input.fill('Tên chưa lưu');await input.press('Escape');
      assert.equal(await page.locator(pet).isVisible(),true,'Escape cancels rename before closing pet');
      assert.equal((await readState(page)).petName,'Bé Măm');
      await closePet(page);await page.reload({waitUntil:'networkidle'});await openPet(page);
      assert.equal(await page.locator('.pet-home-name span').textContent(),'Bé Măm');
      await closePet(page);
    });
    await testCase(browser,engine,'journal rewards menu navigation and persistence',{},async page=>{
      await openPet(page);
      assert.equal(await page.locator('.pet-home-journal').count(),0,'Journal lives only in the main menu');
      await openJournal(page);
      await page.locator(pet).waitFor({state:'hidden'});
      const checkbox=page.locator('.checklist-item-toggle').first();
      await checkbox.click();await assertXP(page,23);
      assert.equal((await readState(page)).checkedSpotIds.length,1);
      await page.locator('.menu-detail-back').click();
      await page.locator(journal).waitFor({state:'hidden'});
      await page.waitForFunction(()=>document.activeElement?.getAttribute('data-destination')==='checklist');
      await page.locator('[data-destination="checklist"]').click();
      await page.locator(journal).waitFor({state:'visible'});
      assert.equal(await checkbox.getAttribute('aria-checked'),'true');
      await closeJournal(page);await openPet(page);
      assert.match(await page.locator('.pet-home-level-heading').innerText(),/23\s*XP/);
      await page.evaluate(()=>history.back());await waitHome(page);
      await page.reload({waitUntil:'networkidle'});await assertXP(page,23);await openJournal(page);
      assert.equal(await checkbox.getAttribute('aria-checked'),'true');
      await checkbox.click();await assertXP(page,18);
      const restored=await readState(page);assert.deepEqual(restored.checkedSpotIds,[]);assert.equal(restored.dailyStreak,7);
      await closeJournal(page);
      await withinViewport(page,'.open-button','Home CTA after journal close');
      await openPet(page);await closePet(page);
    });
    await testCase(browser,engine,'focus trap pointer return and level progress',{},async page=>{
      await page.locator(floating).click();await page.locator(pet).waitFor({state:'visible'});
      await page.waitForFunction(()=>document.activeElement?.classList.contains('pet-home-close'));
      assert.equal(await page.locator('.pet-home-xp-track').getAttribute('aria-valuenow'),'53');
      assert.match(await page.locator('.pet-home-xp-caption').innerText(),/7 XP/);
      for(let i=0;i<24;i++){
        await page.keyboard.press(i<12?'Tab':'Shift+Tab');
        await page.waitForFunction(()=>Boolean(document.activeElement?.closest('.pet-home')),null,{timeout:1500});
      }
      await page.locator('.pet-home-level-prev').click();
      assert.equal(await page.locator('.pet-home-stage').getAttribute('data-level'),'1');
      await page.locator('.pet-home-level-next').click();
      assert.equal(await page.locator('.pet-home-stage').getAttribute('data-level'),'2');
      await uniqueIds(page);
      const before=await readState(page);await page.locator('.pet-home-pet-touch').click();assert.deepEqual(await readState(page),before,'Greeting does not reward XP');
      await closePet(page);
    });
    await testCase(browser,engine,'English maximum level and reduced motion',{language:'en',xp:200,width:360,height:640},async page=>{
      await openPet(page);
      assert.equal(await page.locator('.pet-home-eyebrow').textContent(),'Your foodie companion');
      assert.equal(await page.locator('.pet-home-xp-track').getAttribute('aria-valuenow'),'100');
      assert.match(await page.locator('.pet-home-xp-caption').innerText(),/All 6 levels unlocked/);
      assert.equal(await page.locator('.pet-home-streak').count(),0,'Daily streak has been removed from pet UI');
      const animated=await page.evaluate(()=>[...document.querySelectorAll('.foodie-pet-wrapper *,.foodie-pet-gain,.pet-home *')].filter(n=>getComputedStyle(n).animationName!=='none').map(n=>n.getAttribute('class')));
      assert.deepEqual(animated,[],'Reduced motion disables pet and sheet animations');
      await noOverflow(page);await page.screenshot({path:resolve(output,`${engine}-english-level6.png`)});await closePet(page);
    });
    await testCase(browser,engine,'normal motion pauses behind pet and journal',{motion:'no-preference'},async page=>{
      await page.mouse.move(1,1);
      await page.waitForFunction(selector=>getComputedStyle(document.querySelector(`${selector} .pet-float-body`)).animationPlayState==='running',floating);
      await openPet(page);
      assert.equal(await page.locator(`${floating} .pet-float-body`).evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
      const first=await page.locator('.spotlight-card.featured').getAttribute('style');
      await page.waitForTimeout(220);assert.equal(await page.locator('.spotlight-card.featured').getAttribute('style'),first);
      await openJournal(page);
      assert.equal(await page.locator(`${floating} .pet-float-body`).evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
      await closeJournal(page);
    });
    for(const [xp,maxLevel,width,height] of [[3,1,320,568],[125,5,360,640],[125,5,390,844],[125,5,430,932],[240,6,390,844],[3,1,1280,900],[125,5,1280,900],[240,6,1280,900]]){
      await testCase(browser,engine,`hero arrows level${maxLevel} ${width}x${height}`,{xp,width,height},async page=>{
        const trigger=width<768?floating:header;
        await withinViewport(page,'.open-button','Home CTA remains visible');
        await openPet(page,trigger);
        const before=await readState(page), heading=await page.locator('.pet-home-level-heading').innerText();
        const stage=page.locator('.pet-home-stage');
        const prev=page.locator('.pet-home-level-prev'),next=page.locator('.pet-home-level-next');
        assert.equal(await stage.getAttribute('data-level'),String(maxLevel),'Open at actual current appearance');
        assert.equal(await next.getAttribute('aria-disabled'),'true','Cannot reveal any future appearance');
        assert.equal(await prev.getAttribute('aria-disabled'),String(maxLevel===1));
        assert.equal(await page.locator('.pet-home .pet-mascot-svg').count(),1,'One main mascot; no duplicate preview or gallery');
        assert.equal(await page.locator('.pet-home-level-grid,.pet-home-level-detail,.pet-home-level-preview').count(),0,'Old gallery and secondary preview are removed');
        await withinViewport(page,'.pet-home-level-prev','Previous appearance touch target');
        await withinViewport(page,'.pet-home-level-next','Next appearance touch target');
        await withinViewport(page,'.pet-home-spin','Pet spin CTA is visible');
        for(let level=maxLevel+1;level<=6;level++)assert.equal(await page.locator(`.pet-home .foodie-pet-wrapper.level-${level}`).count(),0,'No unreached mascot in the dialog DOM');
        await noOverflow(page);await uniqueIds(page);
        await page.screenshot({path:resolve(output,`${engine}-${width}x${height}-level${maxLevel}-current.png`)});
        // Native click() deliberately batches input faster than React can repaint;
        // the component must clamp state even before aria-disabled is rerendered.
        await prev.evaluate(button=>{for(let i=0;i<20;i++)button.click();});
        await page.waitForFunction(()=>document.querySelector('.pet-home-stage')?.getAttribute('data-level')==='1');
        assert.equal(await prev.getAttribute('aria-disabled'),'true');
        assert.equal(await next.getAttribute('aria-disabled'),String(maxLevel===1));
        assert.equal(await page.locator('.pet-home .pet-mascot-svg').count(),1);
        assert.match(await page.locator('.pet-home-viewed-level').innerText(),/1/);
        assert.equal(await page.locator('.pet-home-level-heading').innerText(),heading,'XP and actual level are not preview metadata');
        assert.deepEqual(await readState(page),before,'Appearance browsing never writes progress');
        if(maxLevel>1)await page.screenshot({path:resolve(output,`${engine}-${width}x${height}-from-level${maxLevel}-view1.png`)});
        await next.evaluate(button=>{for(let i=0;i<20;i++)button.click();});
        await page.waitForFunction(max=>document.querySelector('.pet-home-stage')?.getAttribute('data-level')===String(max),maxLevel);
        assert.equal(await next.getAttribute('aria-disabled'),'true');
        await next.evaluate(button=>button.click());assert.equal(await stage.getAttribute('data-level'),String(maxLevel),'Clicking disabled right boundary remains a no-op');
        if(maxLevel>1){
          await prev.click();assert.equal(await stage.getAttribute('data-level'),String(maxLevel-1));
          await page.screenshot({path:resolve(output,`${engine}-${width}x${height}-from-level${maxLevel}-view${maxLevel-1}.png`)});
        }
        assert.deepEqual(await readState(page),before);
        await closePet(page,trigger);await openPet(page,trigger);
        assert.equal(await stage.getAttribute('data-level'),String(maxLevel),'Reopening resets to actual current appearance');
        await closePet(page,trigger);await page.reload({waitUntil:'networkidle'});
        assert.deepEqual(await readState(page),before,'Browsing and reopening survive reload without mutating persistence');
      });
    }
    await testCase(browser,engine,'hero arrows keyboard scope and reduced motion',{xp:125,language:'en',width:360,height:640},async page=>{
      await openPet(page);const before=await readState(page);
      const stage=page.locator('.pet-home-stage'),prev=page.locator('.pet-home-level-prev'),next=page.locator('.pet-home-level-next');
      await page.locator('.pet-home-close').focus();await page.keyboard.press('ArrowLeft');
      assert.equal(await stage.getAttribute('data-level'),'5','No global arrow interception outside the hero');
      await prev.focus();await page.keyboard.press('Enter');
      assert.equal(await stage.getAttribute('data-level'),'4');
      await page.keyboard.press(' ');assert.equal(await stage.getAttribute('data-level'),'3');
      await page.keyboard.press('ArrowLeft');assert.equal(await stage.getAttribute('data-level'),'2');
      await page.keyboard.press('ArrowLeft');assert.equal(await stage.getAttribute('data-level'),'1');
      await page.keyboard.press('ArrowLeft');assert.equal(await stage.getAttribute('data-level'),'1');
      assert.equal(await prev.evaluate(node=>document.activeElement===node),true,'Retain focus at disabled boundary to allow reversing direction');
      await page.keyboard.press('ArrowRight');assert.equal(await stage.getAttribute('data-level'),'2');
      await page.locator('.pet-home-pet-touch').focus();await page.keyboard.press('ArrowRight');
      assert.equal(await stage.getAttribute('data-level'),'3','Pet itself supports local arrow navigation');
      await next.focus();await page.keyboard.press('Enter');assert.equal(await stage.getAttribute('data-level'),'4');
      await page.keyboard.press(' ');assert.equal(await stage.getAttribute('data-level'),'5');
      assert.equal(await next.getAttribute('aria-disabled'),'true');
      await page.keyboard.press('ArrowRight');assert.equal(await stage.getAttribute('data-level'),'5');
      await page.locator('.pet-home-name').click();
      await page.locator('.pet-home-rename input').press('ArrowLeft');
      assert.equal(await stage.getAttribute('data-level'),'5','Editing a name keeps native text cursor arrows');
      await page.locator('.pet-home-rename input').press('Escape');
      const animated=await stage.evaluate(node=>[...node.querySelectorAll('*')].filter(n=>getComputedStyle(n).animationName!=='none').map(n=>n.className));
      assert.deepEqual(animated,[],'Reduced-motion appearance browsing remains static');
      assert.deepEqual(await readState(page),before);await closePet(page);
    });
    await testCase(browser,engine,'hero arrows reset after actual earned level changes',{xp:99},async page=>{
      await openPet(page);await page.locator('.pet-home-level-prev').click();
      assert.equal(await page.locator('.pet-home-stage').getAttribute('data-level'),'3');
      const other=await page.context().newPage();await other.goto(baseURL,{waitUntil:'networkidle'});
      await openJournal(other);
      await other.locator('.checklist-item-toggle').first().click();
      await assertXP(page,104);
      await page.waitForFunction(()=>document.querySelector('.pet-home-stage')?.getAttribute('data-level')==='5');
      assert.equal(await page.locator('.pet-home-level-next').getAttribute('aria-disabled'),'true');
      assert.match(await page.locator('.pet-home-level-heading').innerText(),/104\s*XP/);
      assert.equal(await page.locator('.pet-home .pet-mascot-svg').count(),1);
      await other.close();await closePet(page);
    });
    await testCase(browser,engine,'unlimited same-day spins three completed rewards',{xp:125},async page=>{
      const before=await readState(page);
      for(let n=1;n<=3;n++){
        const start=Date.now();
        await page.locator('.open-button').click();
        await page.waitForFunction(selector=>document.querySelector(selector).disabled,floating);
        assert.equal((await readState(page)).xp,before.xp+n-1,'Only completed spins are rewarded');
        await page.locator('.food-result-dialog').waitFor({state:'visible',timeout:16000});
        assert(Date.now()-start>=3800,'Repeat spins preserve the existing result timing');
        await assertXP(page,before.xp+n);
        const current=await readState(page);
        assert.equal(current.totalSpins,before.totalSpins+n);
        assert.equal(current.completedSpinIds.length,before.completedSpinIds.length+n);
        assert.equal(new Set(current.completedSpinIds).size,current.completedSpinIds.length);
        assert.equal(current.lastActiveDate,before.lastActiveDate,'All three spins happen on the same saved calendar day');
        await page.keyboard.press('Escape');await page.locator('.food-result-dialog').waitFor({state:'hidden'});
        await withinViewport(page,'.open-button','Spin stays available after every result');
      }
      await page.reload({waitUntil:'networkidle'});await assertXP(page,before.xp+3);
      assert.equal((await readState(page)).totalSpins,before.totalSpins+3);
      await openPet(page);assert.match(await page.locator('.pet-home-spin').innerText(),/\+1 XP/);await closePet(page);
    });
    for(const [xp,motion] of [[99,'reduce'],[199,'no-preference']]) {
      await testCase(browser,engine,`pet spin ${xp} to ${xp+1} ${motion}`,{xp,motion},async page=>{
        await openPet(page);const before=await readState(page),start=Date.now();
        await page.locator('.pet-home-spin').click();await page.locator(pet).waitFor({state:'hidden'});
        await page.waitForFunction(selector=>document.querySelector(selector).disabled,floating);
        assert.equal((await readState(page)).xp,xp,'Starting spin must not award XP');
        assert(await page.locator(`${floating} .pet-float-body`).evaluate(n=>{const s=getComputedStyle(n);return s.animationName==='none'||s.animationPlayState==='paused';}));
        await page.locator('.food-result-dialog').waitFor({state:'visible',timeout:16000});
        assert(Date.now()-start>=3800,'Keep deliberate existing spin duration even with reduced motion');
        await assertXP(page,xp+1);const after=await readState(page);
        assert.equal(after.totalSpins,before.totalSpins+1);assert.equal(after.completedSpinIds.length,before.completedSpinIds.length+1);
        assert.equal(after.dailyStreak,before.dailyStreak);
        assert.match(await page.locator(floating).getAttribute('class'),xp===99?/level-5/:/level-6/);
        await page.keyboard.press('Escape');await page.locator('.food-result-dialog').waitFor({state:'hidden'});
        await withinViewport(page,'.open-button','Spin CTA after result');
        await openPet(page);await closePet(page);await assertXP(page,xp+1);
        assert.equal((await readState(page)).totalSpins,before.totalSpins+1,'Reopening pet does not duplicate spin reward');
      });
    }
  } finally { await browser.close(); }
}
await writeFile(resolve(output,scenarioFilter?'report-filtered.json':'report.json'),JSON.stringify({baseURL,filter:scenarioFilter?.source??null,fixtureNotice:'Isolated seeded QA progress; external network blocked; no affiliate or share clicks.',results:reports},null,2));
const failures=reports.filter(r=>!r.passed);
console.log(`\n${reports.length-failures.length}/${reports.length} browser cases passed. ${output}`);
if(failures.length)process.exitCode=1;
