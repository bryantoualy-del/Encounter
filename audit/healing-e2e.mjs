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
async function page(name){const ctx=await browser.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});await ctx.tracing.start({screenshots:true,snapshots:true});await ctx.addInitScript(root=>{window.RPG_CONNECT_ICON_ROOT=root},base+'/RPG-Connect/');const p=await ctx.newPage();p.on('pageerror',e=>errors.push({page:name,message:e.message,stack:e.stack}));p.on('websocket',ws=>{ws.on('framesent',f=>{try{frames.push({page:name,direction:'sent',data:JSON.parse(f.payload)})}catch{}});ws.on('framereceived',f=>{try{frames.push({page:name,direction:'received',data:JSON.parse(f.payload)})}catch{}})});await p.goto(`${base}/${name}/`);pages[name]=p;return p}
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
 // Create allied fixtures using the native editor and add them through the actual library.
 for(const name of ['Garde de Sharn','Capitaine allié','Invocation alliée']){
  if(!await gm.locator('#libraryDrawer').evaluate(el=>el.classList.contains('open')))await gm.locator('#btnPrepOpenLibrary').click();await gm.locator('#btnCreateMonster').click();const form=gm.locator('#monsterForm');await form.locator('[name=name]').fill(name);await form.locator('[name=category]').selectOption('npc');await form.locator('[name=type]').fill(name.includes('Invocation')?'élémentaire':'humanoïde');await form.locator('[name=hp]').fill('45');await form.locator('[name=ac]').fill('12');await form.locator('button[type=submit]').click();
 }
 const allyModels=await gm.evaluate(()=>state.monsters.filter(m=>['Garde de Sharn','Capitaine allié','Invocation alliée'].includes(m.name)).map(m=>({id:m.id,name:m.name})));
 async function fromLibrary(model){if(!await gm.locator('#libraryDrawer').evaluate(el=>el.classList.contains('open')))await gm.locator('#btnPrepOpenLibrary').click();await gm.locator('#monsterSearch').fill(model.name);await gm.locator(`[data-add-monster="${model.id}"]`).click();await gm.locator('#addMonsterForm [name=initiative]').fill('5');await gm.locator('#addMonsterForm button[type=submit]').click();if(await gm.locator('#drawerScrim').isVisible())await gm.locator('#drawerScrim').click();}
 async function sync(){await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjSyncTargets').click();await gm.locator('[data-rpg-close]').click();}
 async function injure(id,hp){await gm.evaluate(({id,hp})=>{const p=state.encounter.participants.find(p=>p.id===id);p.hp=hp;RPGHealthAuthority.bump(p);saveState()}, {id,hp});await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjDisconnect').click();await gm.locator('#rpgMjConnect').click();await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);await gm.locator('[data-rpg-close]').click();await gm.evaluate(()=>RPGConnectMJ.syncState?.());await sync();}
 // Synchronization without production test hooks: reconnect the recipient for STATE_SYNC.
 async function syncRecipient(name){const p=pages[name];await p.evaluate(()=>RPGConnect.disconnect());await p.evaluate(()=>RPGConnect.connect());await p.waitForFunction(()=>RPGConnect.getStatus().connected);await p.waitForTimeout(120);}
 async function setHp(id,hp,name){await gm.evaluate(({id,hp})=>{const p=state.encounter.participants.find(p=>p.id===id);p.hp=hp;RPGHealthAuthority.bump(p);saveState();render()}, {id,hp});if(name)await syncRecipient(name);}
 async function choose(p,ids){await p.locator('#rpgMultiTargetPicker').waitFor({state:'visible'});for(const id of ids)await p.locator(`[data-multi-target="${id}"]`).click();await p.locator('[data-multi-done]').click();await p.waitForFunction(()=>!RPGHealth.getPending());}
 async function lay(target,amount){const z=pages.Zephyr;await z.evaluate(()=>CompanionAPI.nextTurn());z.once('dialog',d=>d.accept(String(amount)));await z.locator('#healBtn').evaluate(el=>el.click());await choose(z,[target]);}
 async function cure(ids,free=true){const p=pages.Samoth;await p.evaluate(()=>CompanionAPI.nextTurn());await p.locator('#combatSpell').selectOption('cure');if(await p.locator('[data-cast-field=free]').count())await p.locator('[data-cast-field=free]').selectOption(free?'free':'1');else await p.locator('#castLevel').selectOption('1');if(ids.length===2)await p.locator('[data-meta=twin]').click();await p.locator('#combatCast').click();await choose(p,ids);}
 for(let scenario=1;scenario<=3;scenario++){
  if(scenario>1){await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjEndFight').click();await gm.locator('[data-rpg-close]').click();await gm.evaluate(()=>{state.encounter.participants=state.encounter.participants.filter(p=>p.id.startsWith('cc-'));state.ui.locked=false;setMode('prep');saveState();render()});}
  await pages.Zephyr.evaluate(()=>CompanionAPI.setResource('lay',50));
  const enemy=await gm.evaluate(i=>{const terms=i===1?['Loup sanguinaire','Gobelin']:i===2?['Duergar','Ogre']:['Orc','Squelette'];return terms.map(term=>state.monsters.find(m=>m.category==='enemy'&&m.name.toLowerCase().includes(term.toLowerCase()))).filter(Boolean).map(m=>({id:m.id,name:m.name}))},scenario);
  check('combat '+scenario+' distinct library enemies',enemy.length>=1,enemy);
  for(const m of [...enemy,...allyModels])await fromLibrary(m);
  const allies=await gm.evaluate(()=>state.encounter.participants.filter(p=>['Garde de Sharn','Capitaine allié','Invocation alliée'].includes(p.baseName)).map(p=>({id:p.id,name:p.baseName})));
  const guard=allies.find(p=>p.name==='Garde de Sharn').id,cap=allies.find(p=>p.name==='Capitaine allié').id;
  await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjPrepareFight').click();
  for(const [name,p]of Object.entries(pages).filter(([n])=>n!=='Encounter')){await p.locator('[data-init-manual]').fill('12');await p.locator('[data-init-roll]').click();await gm.waitForFunction(id=>!!RPGConnectMJ.getStatus().fight.rolls[id],name.toLowerCase());await playerDiceHandler(p);await gm.locator(`[data-validate-init="${name.toLowerCase()}"]`).click();}
  await gm.locator('#rpgMjStartFight').click();await pages.Brackmard.waitForFunction(()=>RPGHealth.getContext().combatId);
  check('combat '+scenario+' all six initiatives and fight',await gm.evaluate(()=>RPGConnectMJ.getStatus().fight.phase==='fight'));
  if(scenario===1){
   const b=pages.Brackmard;await setHp('cc-brackmard',96,'Brackmard');await b.evaluate(()=>CompanionAPI.nextTurn());await b.locator('#second').evaluate(el=>{el.click();el.click()});await b.waitForFunction(()=>!RPGHealth.getPending()&&CompanionAPI.getState().hp.current===104);check('Second souffle overflow and double click',await b.evaluate(()=>__CompanionBridge.read().second===0));
   await setHp('cc-brackmard',60,'Brackmard');
   const secondEvent=frames.find(f=>f.page==='Brackmard'&&f.direction==='sent'&&f.data.event?.type==='heal:request')?.data.event;
   await b.evaluate(q=>CompanionAPI.emitLocal('heal:request',q,'replay-second-wind-new-envelope'),secondEvent.payload);await b.waitForTimeout(100);check('Heal logical duplicate after damage applies once',await gm.evaluate(()=>state.encounter.participants.find(p=>p.id==='cc-brackmard').hp===60));
   await gm.evaluate(()=>applyDamageMany(['cc-brackmard'],6,'force'));await gm.waitForFunction(()=>state.encounter.participants.find(p=>p.id==='cc-brackmard').hp===54);check('Damage after heal keeps existing command pipeline',await b.evaluate(()=>CompanionAPI.getState().hp.current===54));
   await setHp('cc-brackmard',60,'Brackmard');const before=await b.evaluate(()=>__CompanionBridge.read().hitDice);await b.evaluate(()=>CompanionAPI.nextTurn());await b.locator('[onclick="dwarvenFortitude()"]').first().evaluate(el=>el.click());await b.waitForFunction(()=>!RPGHealth.getPending()&&CompanionAPI.getState().hp.current>60);check('Vigueur naine one die spent',await b.evaluate(n=>__CompanionBridge.read().hitDice===n-1,before));
   await setHp('cc-zephyr',60,'Zephyr');await lay('cc-zephyr',8);await setHp('cc-brackmard',50,'Brackmard');await lay('cc-brackmard',9);await setHp(guard,23);await lay(guard,12);check('Lay on NPC no Companion',await gm.evaluate(id=>state.encounter.participants.find(p=>p.id===id).hp===35,guard));
   await cure(['cc-samoth']);check('Cure free use consumed',await pages.Samoth.evaluate(()=>__CompanionBridge.read().cureFree===0));
   await lay(guard,20);check('NPC overflow capped',await gm.evaluate(id=>state.encounter.participants.find(p=>p.id===id).hp===45,guard));
  }
  if(scenario===2){
   await setHp(guard,20);await setHp('cc-brackmard',70,'Brackmard');await cure(['cc-brackmard',guard],false);check('Twinned Companion plus NPC heal',await gm.evaluate(id=>state.encounter.participants.find(p=>p.id===id).hp>20,guard));
   await setHp(cap,20);await pages.Brackmard.evaluate(()=>RPGConnect.disconnect());await lay('cc-brackmard',3);await syncRecipient('Brackmard');const hp=await gm.evaluate(()=>state.encounter.participants.find(p=>p.id==='cc-brackmard').hp);check('Disconnected target STATE_SYNC',await pages.Brackmard.evaluate(hp=>CompanionAPI.getState().hp.current===hp,hp));
   await cure([guard,cap],false);check('Two NPCs twinned',await gm.evaluate(id=>state.encounter.participants.find(p=>p.id===id).hp>20,cap));
  }
  if(scenario===3){
   await setHp(guard,0);await lay(guard,4);check('Living zero HP NPC heals',await gm.evaluate(id=>state.encounter.participants.find(p=>p.id===id).hp===4,guard));
   // Disconnect immediately after the durable intention is sent; ACK/result can be lost.
   const z=pages.Zephyr;await z.evaluate(()=>CompanionAPI.nextTurn());z.once('dialog',d=>d.accept('5'));await z.locator('#healBtn').evaluate(el=>el.click());await z.locator('#rpgMultiTargetPicker').waitFor({state:'visible'});await z.locator(`[data-multi-target="${guard}"]`).click();await z.evaluate(()=>{const off=CompanionAPI.subscribe(e=>{if(e.type==='heal:request'){off();RPGConnect.disconnect()}});document.querySelector('[data-multi-done]').click()});await z.waitForTimeout(150);await z.evaluate(()=>RPGConnect.connect());await z.waitForFunction(()=>RPGConnect.getStatus().connected);await z.waitForFunction(()=>!RPGHealth.getPending());check('Healer disconnect before result exactly once',await gm.evaluate(id=>state.encounter.participants.find(p=>p.id===id).hp===9,guard));
   const hp=await gm.evaluate(id=>state.encounter.participants.find(p=>p.id===id).hp,guard);await gm.reload();await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);check('Encounter reload keeps healed NPC',await gm.evaluate(({id,hp})=>state.encounter.participants.find(p=>p.id===id)?.hp===hp,{id:guard,hp}));
  }
  // Advance through three complete rounds using the native Encounter turn engine.
  const roundStart=await gm.evaluate(()=>state.encounter.round);for(let i=0;i<3;i++){const count=await gm.evaluate(()=>sortedParticipants().length);for(let j=0;j<count;j++)await gm.evaluate(()=>actualAdvanceTurn())}
  check('combat '+scenario+' three rounds remain live',await gm.evaluate(r=>state.encounter.round>=r+3,roundStart));await gm.screenshot({path:out+'/healing-combat-'+scenario+'.png'});
 }
 check('No browser exceptions',errors.length===0,errors);
}catch(error){failure={message:error.message,stack:error.stack};console.error(error)}finally{
 await writeFile(out+'/healing-summary.json',JSON.stringify({checks,errors,failure},null,2));await writeFile(out+'/healing-frames.json',JSON.stringify(frames,null,2));for(const [name,p]of Object.entries(pages))await p.context().tracing.stop({path:out+'/'+name+'-healing-trace.zip'}).catch(()=>{});await browser.close();wss.close();server.close();http.close();
}if(failure||checks.some(x=>!x.pass))process.exitCode=1;
