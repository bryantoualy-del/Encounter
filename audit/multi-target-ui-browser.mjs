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
const pages={},errors=[],frames=[],checks=[];let failure;
async function page(name){const ctx=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true,serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});await ctx.tracing.start({screenshots:true,snapshots:true});await ctx.addInitScript(root=>{window.RPG_CONNECT_ICON_ROOT=root},base+'/RPG-Connect/');const p=await ctx.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push({page:name,message:e.message,stack:e.stack}));p.on('websocket',ws=>{ws.on('framesent',f=>{try{frames.push({page:name,direction:'sent',data:JSON.parse(f.payload)})}catch{}});ws.on('framereceived',f=>{try{frames.push({page:name,direction:'received',data:JSON.parse(f.payload)})}catch{}})});await p.goto(`${base}/${name}/`,{waitUntil:'domcontentloaded'});pages[name]=p;return p}
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
const observations=[],invitations={};
function check(name,pass,detail){checks.push({name,pass,detail});console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name)}
async function emit(p,type,payload,id){await p.evaluate(({type,payload,id})=>{if(window.__probeSocket){__probeSocket.send(JSON.stringify({v:1,type:'event',event:{id,type,characterId:'kentaro',payload}}))}else CompanionAPI.emitLocal(type,payload,id)},{type,payload,id})}
async function snapshot(gm){return gm.evaluate(()=>Object.fromEntries(state.encounter.participants.filter(p=>p.kind==='enemy').map(p=>[p.id,{hp:p.hp,tempHp:p.tempHp||0,conditions:JSON.stringify(p.conditions||[])}])))}
async function resolveSave(gm,die){await gm.locator('#rpgSavePopup').waitFor({state:'visible'});check('JDS popup topmost',(await modal(gm,'#rpgSavePopup')).topmost);const start=frames.length;if(die!=='auto')await gm.locator('[data-save-die]').fill(String(die));if(await gm.locator('[data-save-die-second]').count())await gm.locator('[data-save-die-second]').fill(String(die===1?20:1));await gm.locator(die==='auto'?'[data-save-auto]':'[data-save-manual]').click();await gm.waitForFunction(()=>true);for(let i=0;i<160;i++){const result=frames.slice(start).find(f=>f.page==='Kentaro'&&f.direction==='received'&&f.data.event?.type==='save:result');if(result)return result.data.event.payload;await gm.waitForTimeout(50)}throw Error('No save result')}
async function genericAttack(gm,p,{attackId,actionId,targetId,amount,hit=true}){const start=frames.length;const payload={attackId,actionId,targetId,roll:12,total:20,name:'Generic multi-attack probe'};await emit(p,'attack:rolled',payload,attackId+'-roll');await emit(p,'attack:pending-hit',payload,attackId+'-pending');await gm.locator(`[data-popup-hit="${attackId}"]:not(:disabled)`).waitFor();check('Popup uses '+targetId,(await gm.locator('#rpgHitPopup').innerText()).includes(targetId==='probe-a'?'Loup sanguinaire':'Gobelin'));await gm.locator(hit?`[data-popup-hit="${attackId}"]`:`[data-popup-miss="${attackId}"]`).click();await gm.waitForFunction(()=>document.querySelector('#rpgHitPopup').hidden);if(hit){await emit(p,'attack:damage',{...payload,amount,components:[{amount,type:'force'}]},attackId+'-damage');await gm.waitForFunction(id=>!!state.encounter.rpgAppliedAttacks?.[id],attackId)}return frames.slice(start)}
try{
const gm=await page('Encounter'),sam=await page('Samoth'),k=await page('Kentaro');await k.locator('[data-tab=spells]').click();await k.locator('#synTargets').fill('4');await k.locator('#synFails').fill('2');
await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjEndpoint').fill(endpoint);await gm.locator('#rpgMjKey').fill(process.env.RPG_CONNECT_GM_KEY);await gm.locator('#rpgMjConnect').click();await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);
for(const [name,p]of [['Samoth',sam],['Kentaro',k]]){const id=name.toLowerCase();await gm.locator(`[data-copy="${id}"]`).evaluate(el=>el.closest('details').open=true);await gm.locator(`[data-copy="${id}"]`).click();const invite=await gm.evaluate(()=>navigator.clipboard.readText());invitations[name]=invite;await p.locator('.rpg-connect-launch').click();await p.locator('[name=invite]').fill(invite);await p.locator('[data-connect]').click();await gm.waitForFunction(id=>RPGConnectMJ.getStatus().players.some(p=>p.characterId===id&&p.online),id);await p.locator('[data-close]').click()}
check('room and both companions online',true);
await gm.locator('#rpgMjPrepareFight').click();for(const [name,p,die]of [['Samoth',sam,19],['Kentaro',k,12]]){await p.locator('[data-init-manual]').fill(String(die));await p.locator('[data-init-roll]').click();await gm.waitForFunction(id=>!!RPGConnectMJ.getStatus().fight.rolls[id],name.toLowerCase());await playerDiceHandler(p);await gm.locator(`[data-validate-init="${name.toLowerCase()}"]`).click()}await gm.locator('#rpgMjStartFight').click();await gm.locator('[data-rpg-close]').click();check('initiative validated and fight started',true);
// Synthetic adversary fixtures: no changes to Companion rules or damage formulas.
await gm.evaluate(()=>{for(const d of [{id:'probe-a',name:'Ogre des ruines',hp:1,tempHp:2,saveMods:{INT:2,DEX:2,CON:3},damageResistances:['froid']},{id:'probe-b',name:'Ogre des ruines',hp:1000,tempHp:5,saveMods:{INT:4,DEX:4,CON:0}},{id:'probe-c',name:'Élémentaire de glace',hp:1000,tempHp:0,saveMods:{INT:1,DEX:1,CON:4},damageImmunities:['froid'],conditionImmunities:['Entravé']}]){const m=normalizeMonster({...d,id:d.id+'-model',category:'enemy',type:'humanoïde',ac:14});state.monsters.push(m);const p=makeParticipant(m,1,0,null);Object.assign(p,{id:d.id,name:d.name,hp:d.hp,maxHp:d.hp,tempHp:d.tempHp,kind:'enemy'});state.encounter.participants.push(p)}saveState();render()});
await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjSyncTargets').click();await gm.locator('[data-rpg-close]').click();await sam.waitForFunction(()=>RPGConnect.getTargets().length===3);
await k.locator('[data-tab=spells]').click();
await k.locator('[data-spell="Perturbations synaptiques"]').click();
await k.locator('#rpgMultiTargetPicker').waitFor({state:'visible'});
check('Picker opens directly from spell tab',await k.locator('#rpgMultiTargetPicker').isVisible());
for(const id of ['probe-a','probe-b','probe-c'])await k.locator(`#rpgMultiTargetPicker [data-multi-target="${id}"]`).click();
await k.locator('[data-multi-done]').click();
await k.waitForFunction(()=>document.querySelector('#synTargets').value==='3');
check('Online counters automatic and readonly',await k.locator('#synTargets').inputValue()==='3'&&await k.locator('#synFails').evaluate(el=>el.readOnly));
check('Kentaro selector accepts three distinct targets',await k.evaluate(()=>RPGConnect.getStatus().targets.length===3));
await k.locator('[data-tab=spells]').click();
const before=await k.evaluate(()=>CompanionAPI.getState());
await k.locator('[data-spell="Perturbations synaptiques"]').click();
await gm.locator('#rpgSavePopup').waitFor({state:'visible'});
const req=frames.find(f=>f.page==='Encounter'&&f.direction==='received'&&f.data.event?.type==='save:request')?.data.event.payload;
check('Synaptic request has three targets, INT DD16, shared damage and actionId',req?.targets?.length===3&&req.ability==='INT'&&req.dc===16&&req.damageRollMode==='shared'&&!!req.actionId,req);
const first=await resolveSave(gm,1);check('First duplicate ogre fails and dies independently',first.targetName==='Ogre des ruines #1'&&first.dead&&!first.success,first);
await k.waitForFunction(()=>document.querySelector('#synFails').value==='1');
check('First failure updates live counter',await k.locator('#synFails').inputValue()==='1');
await k.evaluate(()=>RPGConnect.disconnect());await k.waitForFunction(()=>document.querySelector('[data-multi-progress]').textContent.includes('Reconnexion'));
check('Pending offline action keeps authoritative counters locked',await k.locator('#synFails').evaluate(el=>el.readOnly));
const sentBefore=frames.filter(f=>f.page==='Kentaro'&&f.direction==='sent'&&f.data.event?.type==='save:request').length;
await k.locator('[data-spell="Perturbations synaptiques"]').click();
check('Disconnected pending cast cannot consume another slot',await k.evaluate(()=>CompanionAPI.getState().resources.slots)===before.resources.slots-1);
await k.reload();await k.locator('.rpg-connect-launch').click();await k.locator('[data-connect]').click();await k.waitForFunction(()=>RPGConnect.getStatus().connected&&['TURN','FIGHT'].includes(RPGConnect.getStatus().machine.state));await gm.waitForFunction(()=>RPGConnectMJ.getStatus().players.some(p=>p.characterId==='kentaro'&&p.online));await k.locator('[data-close]').click();await k.locator('[data-tab=spells]').click();
await k.waitForFunction(()=>document.querySelector('[data-multi-progress]').textContent.includes('1 échec'));
check('Reload and STATE_SYNC preserve partial resolution',await k.locator('[data-multi-progress]').innerText().then(t=>t.includes('2 en attente')));
const second=await resolveSave(gm,20);check('Second duplicate ogre succeeds independently',second.targetName==='Ogre des ruines #2'&&second.success,second);
const third=await resolveSave(gm,1);check('Third target resolves after first death',third.targetId==='probe-c'&&!third.success,third);
await k.waitForFunction(()=>document.querySelector('#synFails').value==='2');
check('Final UI shows two failures and one success',await k.locator('[data-multi-progress]').innerText().then(t=>t.includes('2 échec')&&t.includes('1 réussite')));
check('No second request after reconnect',frames.filter(f=>f.page==='Kentaro'&&f.direction==='sent'&&f.data.event?.type==='save:request').length===sentBefore);
check('No save popup remains',await gm.locator('#rpgSavePopup').isHidden());
const after=await k.evaluate(()=>CompanionAPI.getState());observations.push({pass:true,before,after});
check('Slot consumed once',before.resources.slots-after.resources.slots===1,{before:before.resources.slots,after:after.resources.slots});
check('Main action consumed once',after.turn.action===false,after.turn);
await k.screenshot({path:out+'/Kentaro-online.png'});
await k.evaluate(()=>RPGConnect.disconnect());await k.waitForFunction(()=>!document.querySelector('#synFails').readOnly);check('Completed offline mode restores manual counters',!await k.locator('#synTargets').evaluate(el=>el.readOnly)&&await k.locator('#synTargets').inputValue()==='4'&&await k.locator('#synFails').inputValue()==='2');

}catch(e){failure={message:e.message,stack:e.stack};console.log('FAIL',e.stack)}finally{await writeFile(out+'/report.json',JSON.stringify({checks,observations,errors,failure,frames},null,2));for(const[n,p]of Object.entries(pages)){await p.screenshot({path:out+'/'+n+'-final.png',timeout:10000,animations:'disabled'}).catch(()=>{});await p.context().tracing.stop({path:out+'/'+n+'-trace.zip'}).catch(()=>{})}await browser.close();for(const ws of wss.clients)ws.terminate();wss.close();server.close();http.close()}if(failure||errors.length||observations.some(x=>!x.pass))process.exitCode=1;
