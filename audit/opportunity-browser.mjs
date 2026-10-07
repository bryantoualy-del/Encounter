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
 for(const name of ['Rufus','Brackmard']){
  const p=await page(name),id=name.toLowerCase();await gm.locator(`[data-copy="${id}"]`).evaluate(el=>el.closest('details').open=true);await gm.locator(`[data-copy="${id}"]`).click();const invite=await gm.evaluate(()=>navigator.clipboard.readText());await p.locator('.rpg-connect-launch').click();await p.locator('[name=invite]').fill(invite);await p.locator('[data-connect]').click();await p.waitForFunction(()=>RPGConnect.getStatus().connected);console.log('CONNECTED',name);await gm.waitForFunction(id=>RPGConnectMJ.getStatus().players.some(p=>p.characterId===id&&p.online),id);await p.locator('[data-close]').click();
 }
 await gm.locator('[data-rpg-close]').click();
 const r=pages.Rufus,b=pages.Brackmard;
 // Native library preparation.
 await gm.locator('#btnPrepOpenLibrary').click();await gm.locator('#monsterSearch').fill('Loup sanguinaire');const model=await gm.evaluate(()=>state.monsters.find(m=>m.name.toLowerCase()==='loup sanguinaire'));
 await gm.locator(`[data-add-monster="${model.id}"]`).click();await gm.locator('#addMonsterForm [name=initiative]').fill('10');await gm.locator('#addMonsterForm button[type=submit]').click();if(await gm.locator('#drawerScrim').isVisible())await gm.locator('#drawerScrim').click();
 const target=await gm.evaluate(()=>{const p=state.encounter.participants.find(p=>p.kind==='enemy');p.hp=500;p.maxHp=500;saveState();render();return p.id});
 await gm.evaluate(()=>RPGConnectMJ.prepareFight());
 for(const name of ['Rufus','Brackmard']){await pages[name].locator('[data-init-roll]').click();await dismissDice(pages[name]);}
 for(const [id,total]of [['rufus',30],['brackmard',20]]){await gm.waitForFunction(id=>RPGConnectMJ.getStatus().fight.rolls[id],id);await gm.evaluate(({id,total})=>RPGConnectMJ.validateInitiative(id,total),{id,total})}
 check('native fight started',await gm.evaluate(()=>RPGConnectMJ.startFight()));
 await r.waitForFunction(()=>RPGConnect.getTargets().length);await b.waitForFunction(()=>RPGConnect.getTargets().length);
 await r.evaluate(target=>RPGConnect.selectTarget(target),target);await r.locator('[data-cond=allyAdjacent]').click();await r.locator('#manualRoll').fill('15');await r.locator('[data-attack=hexen]').click();await gm.locator('[data-popup-hit]').click();await r.waitForFunction(()=>__CompanionBridge.read().sneakOwn);
 check('native own turn Sneak applied through MJ hit',true);
 await gm.evaluate(()=>{actualAdvanceTurn();actualAdvanceTurn()});await r.waitForFunction(()=>RPGHealth.getContext().activeParticipantId!==RPGHealth.getContext().healthActorId);
 if(!await r.evaluate(()=>__CompanionBridge.read().conditions.allyAdjacent))await r.locator('[data-cond=allyAdjacent]').click();await r.locator('#manualRoll').fill('15');await r.locator('[data-reaction-attack=hexen]').click();console.log('OPPORTUNITY intent');await gm.locator('[data-popup-hit]').click();console.log('OPPORTUNITY after hit',await r.evaluate(()=>({state:__CompanionBridge.read(),context:RPGHealth.getContext(),pending:RPGReactions.pending()})));console.log('GM reaction',await gm.evaluate(()=>state.encounter.rpgReactions));await r.waitForFunction(()=>__CompanionBridge.read().sneakReaction&&CompanionAPI.getState().turn.reaction===false);
 await gm.waitForFunction(()=>Object.values(state.encounter.rpgReactions||{}).some(x=>x.context.kind==='opportunity-attack'&&x.status==='closed'));
 check('manual opportunity without movement, Sneak on opposing turn, reaction consumed',true);
 await b.evaluate(target=>RPGConnect.selectTarget(target),target);await b.locator('#manualRoll').fill('15');await b.locator('[data-combat-subtab=control]').click();await b.locator('[onclick="reactionAttack(\'opportunity\')"]').click();await gm.locator('[data-popup-hit]').waitFor({state:'visible'});await b.evaluate(()=>{RPGConnect.disconnect();RPGConnect.connect()});await b.waitForFunction(()=>RPGConnect.getStatus().connected);await gm.locator('[data-popup-hit]').click();await gm.waitForFunction(id=>state.encounter.participants.find(p=>p.id===id).conditions.some(c=>c.name==='Vitesse 0'),target);check('Brack reconnect during native opportunity retains one spent reaction',await b.evaluate(()=>!RPGReactions.available()));
 check('Sentinel speed zero until current turn ends',await gm.evaluate(id=>{const p=state.encounter.participants.find(p=>p.id===id),c=p.conditions.find(c=>c.name==='Vitesse 0');return effectiveSpeed(p)==='0'&&c.durationType==='sourceTurnEnd'&&c.sourceParticipantId===activeParticipant().id},target));
 await gm.evaluate(()=>actualAdvanceTurn());check('Sentinel expires at correct turn end',await gm.evaluate(id=>!state.encounter.participants.find(p=>p.id===id).conditions.some(c=>c.name==='Vitesse 0'),target));
 await r.screenshot({path:out+'/opportunity-rufus-ipad.png'});await b.screenshot({path:out+'/opportunity-brack-ipad.png'});console.log('CHECKS',checks);if(errors.length)throw Error('page errors');
}catch(error){failure={message:error.message,stack:error.stack};console.error(error)}finally{clearTimeout(watchdog);await writeFile(out+'/opportunity-frames.json',JSON.stringify(frames,null,2));await writeFile(out+'/opportunity-summary.json',JSON.stringify({checks,errors,failure},null,2));await browser.close();wss.close();server.close();http.close()}if(failure||checks.some(x=>!x.pass))process.exitCode=1;
