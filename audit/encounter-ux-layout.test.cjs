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
   const ref=asset+'?v=encounter-ux-20261108';
   assert.ok(html.includes(ref),ref+' missing in HTML');
   assert.ok(sw.includes(ref),ref+' missing in cache');
 }
 assert.match(sw,/encounter-ux-20261108/);
 assert.ok(!/\.topbar\{[^}]*backdrop-filter\s*:\s*blur\(/.test(css));
});
