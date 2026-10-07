import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=resolve(process.env.E2E_ROOT||new URL('../../',import.meta.url).pathname);
const out=resolve(process.env.E2E_OUT||new URL('./results',import.meta.url).pathname);await mkdir(out,{recursive:true});
process.env.RPG_CONNECT_GM_KEY='isolated-e2e-key-abcdefghijklmnopqrstuvwxyz';process.env.PORT='0';process.env.RPG_CONNECT_ORIGINS='';
const {server,wss}=await import('../rpg-connect-server.js');await new Promise(r=>server.listening?r():server.once('listening',r));
const endpoint=`ws://127.0.0.1:${server.address().port}`;
const http=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://local').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('path');const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[extname(file)]||'application/octet-stream');res.end(data)}catch{res.writeHead(404);res.end()}});await new Promise(r=>http.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${http.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?'/tmp/chromium':undefined),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:true});
const pages={},errors=[],frames=[],checks=[];let failure;let stage='start';const watchdog=setTimeout(()=>{console.error('WATCHDOG',stage);process.exit(2)},300000);
async function page(name){const ctx=await browser.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});await ctx.tracing.start({screenshots:true,snapshots:true});await ctx.addInitScript(root=>{window.RPG_CONNECT_ICON_ROOT=root},base+'/RPG-Connect/');await ctx.route('https://cdn.jsdelivr.net/npm/three@0.186.1/build/*',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();await route.fulfill({contentType:'text/javascript',body:await readFile(resolve(root,'browser-deps',name))})});const p=await ctx.newPage();p.on('pageerror',e=>errors.push({page:name,message:e.message,stack:e.stack}));p.on('websocket',ws=>{ws.on('framesent',f=>{try{frames.push({page:name,direction:'sent',data:JSON.parse(f.payload)})}catch{}});ws.on('framereceived',f=>{try{frames.push({page:name,direction:'received',data:JSON.parse(f.payload)})}catch{}})});await p.goto(`${base}/${name}/`);pages[name]=p;return p}
async function modal(p,selector){return p.locator(selector).evaluate(el=>{let r=el.getBoundingClientRect(),s=getComputedStyle(el),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{hidden:el.hidden,display:s.display,visibility:s.visibility,opacity:s.opacity,zIndex:s.zIndex,rect:{x:r.x,y:r.y,width:r.width,height:r.height},topmost:el.contains(top),top:top?.outerHTML.slice(0,220)}})}
// The native dice result intentionally waits for a player tap, including in WebGL CI.
// Do not force gameplay clicks through it or disable the production dice renderer.
async function dismissDice(p){
 const overlay=p.locator('#ccDiceOverlay.open');
 if(!await overlay.count())return;
 await p.waitForFunction(()=>{const el=document.querySelector('#ccDiceOverlay');return !el?.classList.contains('open')||el.dataset.dismissable==='1'},{},{timeout:15000});
 if(await overlay.count())await overlay.click({position:{x:20,y:20}});
 await p.locator('#ccDiceOverlay').waitFor({state:'hidden',timeout:5000});
}
async function playerDiceHandler(p){await dismissDice(p);await p.addLocatorHandler(p.locator('#ccDiceOverlay.open'),()=>dismissDice(p));}
const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));console.log('PASS',name)};
try{
 const gm=await page('Encounter');
 await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjEndpoint').fill(endpoint);await gm.locator('#rpgMjKey').fill(process.env.RPG_CONNECT_GM_KEY);await gm.locator('#rpgMjConnect').click();await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);
 for(const name of ['Kentaro','Brackmard','Zephyr','Rufus','Samoth','Nans']){
  const p=await page(name),id=name.toLowerCase();await gm.locator(`[data-copy="${id}"]`).evaluate(el=>el.closest('details').open=true);await gm.locator(`[data-copy="${id}"]`).click();const invite=await gm.evaluate(()=>navigator.clipboard.readText());await p.locator('.rpg-connect-launch').click();await p.locator('[name=invite]').fill(invite);await p.locator('[data-connect]').click();await p.waitForFunction(()=>RPGConnect.getStatus().connected);console.log('CONNECTED',name);await gm.waitForFunction(id=>RPGConnectMJ.getStatus().players.some(p=>p.characterId===id&&p.online),id);await p.locator('[data-close]').click();
 }
 await gm.locator('[data-rpg-close]').click();
 const k=pages.Kentaro;
 console.log('STAGE concentration set');await k.evaluate(()=>CompanionAPI.setConcentration('Voile spirituel'));console.log('STAGE concentration state',await k.evaluate(()=>CompanionAPI.getState().concentration));
 await gm.waitForFunction(()=>state.encounter.participants.find(p=>p.id==='cc-kentaro').conditions.some(c=>c.origin==='rpg-concentration'));
 // Real library enemy: isolated test only, no production room.
 await gm.evaluate(()=>{const m=state.monsters.find(m=>m.name.toLowerCase().includes('loup sanguinaire'));state.encounter.participants.push(makeParticipant(m,1,5));saveState();render()});
 console.log('STAGE prepare');await gm.evaluate(()=>RPGConnectMJ.prepareFight());
 for(const name of ['Kentaro','Brackmard','Zephyr','Rufus','Samoth','Nans']){const p=pages[name];stage='initiative '+name;console.log(stage);await p.locator('[data-init-roll]').click();await dismissDice(p);}
 for(const id of ['kentaro','brackmard','zephyr','rufus','samoth','nans']){await gm.waitForFunction(id=>RPGConnectMJ.getStatus().fight.rolls[id],id);await gm.evaluate(id=>RPGConnectMJ.validateInitiative(id,RPGConnectMJ.getStatus().fight.rolls[id].total),id)}
stage='start fight';console.log(stage);check('Fight started after six validated initiatives',await gm.evaluate(()=>RPGConnectMJ.startFight()));
 console.log('STAGE concentration set');await k.evaluate(()=>CompanionAPI.setConcentration('Voile spirituel'));console.log('STAGE concentration state',await k.evaluate(()=>CompanionAPI.getState().concentration));
 await gm.waitForFunction(()=>state.encounter.participants.find(p=>p.id==='cc-kentaro').conditions.some(c=>c.origin==='rpg-concentration'));
 await gm.evaluate(()=>applyDamageMany(['cc-kentaro'],18,'force'));
 await k.locator('#rpgConcentrationPopup').waitFor({state:'visible'});
 checks.push({name:'mandatory concentration popup after authoritative damage',pass:true});
stage='concentration animation';console.log(stage,await k.evaluate(()=>!!window.CompanionDiceEngine));await k.locator('[data-concentration-roll]').click();
 await k.waitForFunction(()=>document.querySelector('#ccDiceOverlay.open'));
 await k.waitForFunction(()=>document.querySelector('#ccDiceOverlay').dataset.dismissable==='1');
 await k.locator('#ccDiceOverlay').click({position:{x:20,y:20}});
 await gm.waitForFunction(()=>Object.values(state.encounter.rpgConcentration||{}).some(x=>x.result));
 checks.push({name:'real native dice animation and result returned to Encounter',pass:true});
 for(const name of ['Samoth','Zephyr','Rufus']){const p=pages[name],id='cc-'+name.toLowerCase();await p.evaluate(()=>CompanionAPI.setConcentration('Concentration de test'));await gm.waitForFunction(id=>state.encounter.participants.find(p=>p.id===id).conditions.some(c=>c.origin==='rpg-concentration'),id);await gm.evaluate(id=>applyDamageMany([id],1,'force'),id);await p.locator('#rpgConcentrationPopup').waitFor({state:'visible'});await p.locator('[data-concentration-roll]').click();await p.waitForFunction(()=>document.querySelector('#ccDiceOverlay.open'));await dismissDice(p);await gm.waitForFunction(id=>Object.values(state.encounter.rpgConcentration).some(x=>x.characterId===id&&x.result),name.toLowerCase());check(name+' companion owned roll and native animation',true)}
 await gm.setViewportSize({width:1180,height:820});await k.screenshot({path:out+'/concentration-ipad.png'});await gm.screenshot({path:out+'/concentration-encounter.png'});
 console.log('CHECKS',checks);if(checks.some(x=>!x.pass)||errors.length)throw Error('Concentration browser failure');
}catch(error){failure={message:error.message,stack:error.stack};console.error(error)}finally{clearTimeout(watchdog);await writeFile(out+'/concentration-summary.json',JSON.stringify({checks,errors,failure},null,2));await browser.close();wss.close();server.close();http.close()}if(failure||checks.some(x=>!x.pass))process.exitCode=1;
