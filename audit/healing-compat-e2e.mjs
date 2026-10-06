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
try{
 const gm=await page('Encounter');await gm.locator('#rpgMjOpen').click();await gm.locator('#rpgMjEndpoint').fill(endpoint);await gm.locator('#rpgMjKey').fill(process.env.RPG_CONNECT_GM_KEY);await gm.locator('#rpgMjConnect').click();await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);
 for(const name of ['Rufus','Nans']){const p=await page(name),id=name.toLowerCase();await gm.locator(`[data-copy=${id}]`).evaluate(el=>el.closest('details').open=true);await gm.locator(`[data-copy=${id}]`).click();const invite=await gm.evaluate(()=>navigator.clipboard.readText());await p.locator('.rpg-connect-launch').click();await p.locator('[name=invite]').fill(invite);await p.locator('[data-connect]').click();await p.waitForFunction(()=>RPGHealth.online());await p.locator('[data-close]').click();await gm.waitForFunction(id=>state.encounter.participants.some(p=>p.id===id),'cc-'+id);}
 await gm.locator('[data-rpg-close]').click();
 for(const name of ['Rufus','Nans']){await gm.evaluate(id=>{const p=state.encounter.participants.find(p=>p.id===id);applyHealDirect(p,1)},'cc-'+name.toLowerCase());await pages[name].waitForFunction(()=>__CompanionBridge.read().rpgHealthRevision>0);}
 const n=pages.Nans;await n.locator('[onclick="useBark()"]').evaluate(el=>el.click());await gm.waitForFunction(()=>state.encounter.participants.find(p=>p.id==='cc-nans').tempHp===20);checks.push({name:'Existing Écorce source preserved after authoritative heal',pass:await gm.evaluate(()=>state.encounter.participants.find(p=>p.id==='cc-nans').tempSource==='Écorce')});
 await gm.evaluate(()=>applyDamageMany(['cc-nans'],25,'force'));await gm.waitForFunction(()=>{const p=state.encounter.participants.find(p=>p.id==='cc-nans');return p.hp===120&&p.tempHp===0});await n.waitForFunction(()=>__CompanionBridge.read().hp===120&&__CompanionBridge.read().temp===0);checks.push({name:'Existing Écorce depletion remains native and non cumulative',pass:await n.evaluate(()=>!__CompanionBridge.read().barkActive)});
 const r=pages.Rufus;await r.evaluate(()=>{__CompanionBridge.read().linceul.state='awakened';CompanionAPI.sync()});await gm.evaluate(()=>applyDamageMany(['cc-rufus'],100,'force'));await gm.waitForFunction(()=>state.encounter.participants.find(p=>p.id==='cc-rufus').hp===0);await r.waitForFunction(()=>CompanionAPI.getState().hp.current===0);await r.evaluate(()=>CompanionAPI.nextTurn());checks.push({name:'Judgment cannot fire on local turn reset before real Encounter turn',pass:await r.evaluate(()=>__CompanionBridge.read().hp===0&&__CompanionBridge.read().linceul.judgment)});
 await r.evaluate(()=>CompanionAPI.heal(3));await gm.waitForFunction(()=>state.encounter.participants.find(p=>p.id==='cc-rufus').hp===3);checks.push({name:'Legacy personal HP controls remain compatible',pass:true});console.log('CHECKS',checks);if(checks.some(x=>!x.pass)||errors.length)throw Error('Compatibility failure');
}catch(error){failure={message:error.message,stack:error.stack};console.error(error)}finally{await writeFile(out+'/compat-summary.json',JSON.stringify({checks,errors,failure},null,2));await browser.close();wss.close();server.close();http.close()}if(failure||checks.some(x=>!x.pass))process.exitCode=1;
