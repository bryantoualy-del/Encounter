const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('Default 55/45 and local slider remain available',()=>{
 const js=read('combat-width.js'),html=read('index.html'),css=read('combat-view.css');
 assert.match(js,/let initial = 55/);assert.match(js,/setWeight\(55\)/);
 assert.match(js,/localStorage\.getItem\(key\)/);
 assert.match(html,/Initiative 55 %, cible 45 %/);
 assert.match(css,/var\(--initiative-column-fr, 55fr\)/);
 assert.match(css,/var\(--target-column-fr, 45fr\)/);
});
test('RPG Connect does not cover target details and keeps advanced commands',()=>{
 const js=read('rpg-connect-mj.js');
 assert.match(js,/button\.onclick=openRpgDialog/);
 const p=js.slice(js.indexOf('function positionRpgDialog(){'),js.indexOf('function openRpgDialog()'));
 assert.match(p,/participant-panel/);assert.doesNotMatch(p,/detail-panel/);
 assert.match(js,/rpg-table-advanced/);assert.match(js,/rpg-mj-disclosure/);
 assert.match(js,/rpg-profile-badges/);
 assert.match(js,/data-table-turn-apply/);
 assert.match(js,/data-disclose-enemy/);
});
test('PWA header remains unblurred and assets share version',()=>{
 const html=read('index.html'),sw=read('service-worker.js'),css=read('styles.css');
 assert.match(html,/apple-mobile-web-app-status-bar-style" content="black"/);
 for(const asset of ['rpg-connect-mj.js','rpg-connect-mj.css','combat-width.js','combat-view.css']){
   const ref=asset+'?v='+(asset==='combat-view.css'?'header-opaque-final-20261108':'encounter-ux-20261108');
   assert.ok(html.includes(ref),ref+' missing in HTML');
   assert.ok(sw.includes(ref),ref+' missing in cache');
 }
 assert.match(sw,/encounter-(?:header-opaque-final-20261108|v13-lot2-layout-20261109|v13-lot3-20261109|v13-lot4-20261110|v132-semantic-20261111|p0-quota-20261111|v15-indexeddb-recovery-20261111|v23-icons-20261114)/);
 for(const asset of ['encounter-v13-results.js','encounter-v13-results.css']){
   const ref=asset+'?v='+('v23-damage-20261114');
   assert.ok(html.includes(ref),ref+' missing in HTML');
   assert.ok(sw.includes(ref),ref+' missing in cache');
 }
 assert.ok(!/\.topbar\{[^}]*backdrop-filter\s*:\s*blur\(/.test(css));
});

test('final iPad header has a fully opaque background and no blur, with PWA cache refresh',()=>{
 const base=read('styles.css'),last=read('combat-view.css'),html=read('index.html'),sw=read('service-worker.js');
 assert.match(base,/\.topbar\{[^}]*background:#0d1723/);
 assert.match(last,/\.topbar,body\.combat-mode \.topbar\{/);
 assert.match(last,/background:#0d1723 !important/);
 assert.match(last,/-webkit-backdrop-filter:none !important/);
 assert.match(last,/height:env\(safe-area-inset-top,0px\)/);
 assert.match(html,/styles\.css\?v=header-opaque-final-20261108/);
 assert.match(html,/service-worker\.js\?v=header-opaque-final-20261108/);
 assert.match(sw,/styles\.css\?v=header-opaque-final-20261108/);
});

test('local table mode excludes companion waiting notifications without dropping MJ decisions',()=>{
 const js=read('mj-collective.js'),html=read('index.html'),sw=read('service-worker.js');
 assert.match(js,/const local=state\.encounter\.rpgSessionMode==='table-free'/);
 assert.match(js,/if\(!local\)for\(const q of window\.RPGConnectMJ\?\.pendingSummary/);
 assert.match(js,/for\(const q of EncounterDecisions\.pending\(\)\)/);
 for(const asset of ['mj-collective.js?v=v131-20261109']){
   assert.ok(html.includes(asset));assert.ok(sw.includes(asset));
 }
});

test('Mode Libre enemy action module is versioned and available offline',()=>{
 const html=read('index.html'),sw=read('service-worker.js');
 const asset='encounter-v13-free-actions.js?v=v13-lot2-20261109';
 assert.ok(html.includes(asset));
 assert.ok(sw.includes(asset));
});

test('Lot 2 result popup centers above legacy MJ presentation transform',()=>{
 const css=read('encounter-v13-results.css');
 assert.match(css,/#actionPopup\.action-popup\.v13-result-visible\.show/);
 assert.match(css,/transform:translateX\(-50%\)!important/);
});

test('Lot 3 enemy commands, state-grid and checks available offline',()=>{
 const html=read('index.html'),sw=read('service-worker.js'),js=read('encounter-v13-lot3-controls.js'),css=read('encounter-v13-lot3-controls.css');
 for(const name of ['table.js','table.css','mj-panels.js','encounter-v13-lot3-controls.js','encounter-v13-lot3-controls.css']){
   const ref=name+'?v='+(name==='table.js'?'v15-indexeddb-20261111':'v13-lot3-20261109');
   assert.ok(html.includes(ref),ref+' absent du document');
   assert.ok(sw.includes(ref),ref+' absent du cache');
 }
 const table=read('table.js'),panels=read('mj-panels.js'),app=read('app.js');
 assert.match(table,/Dégâts &amp; Soins/);
 assert.match(table,/data-lot3-tests/);
 assert.match(table,/data-table-target-panel="states"/);
 assert.match(panels,/CONDITIONS\.map\(x=>.*lot3-state-choice/);
 assert.match(panels,/conditionIcon\(x\)/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(js,/characterChecks\(p,m\)/);
 assert.match(app,/data-skill-check/);
 assert.match(app,/data-save-check/);
 assert.match(app,/data-concentration-save/);
});

test('Lot 4 isolated house-rule assets, PWA cache and no undo changes',()=>{
 const html=read('index.html'),sw=read('service-worker.js'),js=read('encounter-v13-lot4.js'),css=read('encounter-v13-lot4.css');
 for(const name of ['encounter-v13-lot4.js','encounter-v13-lot4.css']){
  const asset=name+'?v=v13-lot4-20261110';
  assert.ok(html.includes(asset),asset+' not loaded');
  assert.ok(sw.includes(asset),asset+' not precached');
 }
 assert.match(js,/freeEnemy/);
 assert.match(js,/Math\.ceil\(/);
 assert.match(js,/legendaryMaxOverride/);
 assert.match(js,/previousDamage/);
 assert.match(js,/previousRenderDetail/);
 assert.match(css,/v13-legendary-controls/);
 assert.doesNotMatch(js,/undoStack\s*=|mjJournal\s*=|function undo\(/);
});
