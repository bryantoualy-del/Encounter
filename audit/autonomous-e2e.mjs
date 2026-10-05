import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=resolve(process.env.E2E_ROOT||new URL('../../',import.meta.url).pathname);
const out=resolve(process.env.E2E_OUT||new URL('./results',import.meta.url).pathname);await mkdir(out,{recursive:true});
process.env.RPG_CONNECT_GM_KEY=crypto.randomUUID()+crypto.randomUUID();process.env.PORT='0';process.env.RPG_CONNECT_ORIGINS='';
const {server,wss}=await import(pathToFileURL(resolve(root,'Encounter/rpg-connect-server.js')).href);await new Promise(r=>server.listening?r():server.once('listening',r));
const authorityEndpoint=`ws://127.0.0.1:${server.address().port}`;
const {WebSocket:ProxySocket,WebSocketServer:ProxyServer}=require('ws');const faults=[];const proxy=new ProxyServer({port:0});await new Promise(r=>proxy.once('listening',r));
proxy.on('connection',front=>{const back=new ProxySocket(authorityEndpoint),buffer=[],types=new Map(),receipts=new Map();back.on('open',()=>buffer.splice(0).forEach(x=>back.send(String(x))));front.on('message',raw=>{const value=JSON.parse(String(raw)),type=value.event?.type;types.set(value.event?.id,type);const forward=()=>{back.send(String(raw));if(process.env.E2E_FAULTS==='1'&&((value.type==='event'&&['initiative:rolled','turn:end-request','attack:damage','save:request'].includes(type))||(value.type==='command'&&type==='attack:decision'))){back.send(String(raw));faults.push({kind:'duplicate-real-frame',id:value.event.id,type})}};if(back.readyState===1)forward();else buffer.push(raw)});back.on('message',raw=>{const value=JSON.parse(String(raw)),type=types.get(value.id),count=receipts.get(value.id)||0;if(process.env.E2E_FAULTS==='1'&&value.type==='ack'&&['initiative:rolled','turn:end-request','attack:damage','save:request'].includes(type)&&count<2){receipts.set(value.id,count+1);faults.push({kind:'lost-receipt',id:value.id,type});return}if(front.readyState===1)front.send(String(raw))});front.on('close',()=>back.close());back.on('close',()=>front.close());back.on('error',()=>front.close())});
const endpoint=`ws://127.0.0.1:${proxy.address().port}`;
const http=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://local').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('path');const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[extname(file)]||'application/octet-stream');res.end(data)}catch{res.writeHead(404);res.end()}});await new Promise(r=>http.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${http.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?'/tmp/chromium':undefined),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:true});
const pages={},errors=[],frames=[],checks=[];let failure; const combats=[]; let scenario=0;
async function page(name){const ctx=await browser.newContext({viewport:{width:1180,height:820},serviceWorkers:'allow',permissions:['clipboard-read','clipboard-write']});await ctx.tracing.start({screenshots:true,snapshots:true});await ctx.addInitScript(root=>{window.RPG_CONNECT_ICON_ROOT=root},base+'/RPG-Connect/');const p=await ctx.newPage();p.setDefaultTimeout(7000);p.on('dialog',d=>d.type()==='prompt'?d.accept('20'):d.accept());p.on('pageerror',e=>errors.push({page:name,message:e.message,stack:e.stack}));p.on('websocket',ws=>{ws.on('framesent',f=>{try{frames.push({page:name,direction:'sent',data:JSON.parse(f.payload)})}catch{}});ws.on('framereceived',f=>{try{frames.push({page:name,direction:'received',data:JSON.parse(f.payload)})}catch{}})});await p.goto(`${base}/${name}/`);pages[name]=p;return p}
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
const names=['Kentaro','Brackmard','Zephyr','Rufus','Samoth','Nans'];
for(const name of names){const p=await page(name);await playerDiceHandler(p);p.removeAllListeners('dialog');p.on('dialog',d=>d.type()==='prompt'?d.accept('12'):d.accept());
 if(name==='Kentaro'){await p.locator('[data-tab=combat]').click();await p.locator('[data-roll-group=sun] [data-manual-roll]').fill('12');await p.locator('#solinar').click()}
 if(name==='Brackmard'){await p.locator('[data-combat-subtab=offense]').click();await p.locator('#manualRoll').fill('12');await p.locator('button[onclick="startAttack()"]').first().click()}
 if(name==='Samoth'){await p.locator('#combatSpell').selectOption('rayon');await p.locator('#manual').fill('12');await p.locator('#combatCast').click()}
 if(name==='Zephyr'){await p.locator('#rollModeBtn').click();await p.locator('#attackBtn').click()}
 if(name==='Rufus'){await p.locator('#manualRoll').fill('12');await p.locator('[data-attack=spectral]').click()}
 if(name==='Nans'){await p.locator('#manualRoll').fill('12');await p.locator('#attackBtn').click()}
 if(name==='Rufus')await p.locator('[data-hit]').click();else if(name==='Samoth')await p.locator('#resolution .hit-yes').click();else await p.locator('#hitYes:visible,#confirmHit:visible').first().click();
 await dismissDice(p);await p.waitForFunction(()=>CompanionAPI.getState().turn.damage>0);checks.push({name:name+' attaque autonome',pass:true});await p.screenshot({path:out+'/autonome-'+name+'.png'});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:out+'/mobile-'+name+'.png'});checks.push({name:name+' boutons RPG mobile accessibles',pass:await p.locator('.rpg-connect-launch').isVisible()});await p.context().close();delete pages[name];}
const gm=await page('Encounter');await gm.evaluate(()=>navigator.serviceWorker.ready);await gm.reload();checks.push({name:'Service worker contrôle la version finale',pass:await gm.evaluate(()=>!!navigator.serviceWorker.controller)});await gm.locator('#btnPrepOpenLibrary').click();await gm.locator('#monsterSearch').fill('Loup sanguinaire');await gm.locator('.library-card img').first().waitFor();const img=await gm.locator('.library-card img').first().evaluate(e=>({ok:e.complete&&e.naturalWidth>0,width:e.naturalWidth}));checks.push({name:'Bibliothèque depuis cache final',pass:img.ok});
}catch(e){failure=e.stack;console.error(failure)}finally{await writeFile(out+'/autonomous-report.json',JSON.stringify({checks,errors,failure},null,2));await browser.close();proxy.close();wss.close();server.close();http.close();process.exitCode=failure||checks.some(c=>!c.pass)||errors.length?1:0}
