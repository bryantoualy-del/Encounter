import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, extname} from 'node:path';
import {chromium, webkit} from 'playwright';

const root=fileURLToPath(new URL('../../',import.meta.url));
const engine=process.env.RPG_BROWSER==='webkit'?webkit:chromium;
const names=['Brackmard','Samoth','Rufus','Nans','Zephyr','Kentaro','Kobe'];
const room='V24TURNS';
const key='local-turns-browser-test';
process.env.PORT='0';
process.env.RPG_CONNECT_GM_KEY=key;
const backend=await import('../../RPG-Connect/rpg-connect-server.js');
if(!backend.server.listening)await new Promise(ok=>backend.server.once('listening',ok));
const endpoint='ws://127.0.0.1:'+backend.server.address().port;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const http=createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root))throw Error('Unknown path');
    res.setHeader('content-type',mime[extname(path)]||'application/octet-stream');
    res.end(await readFile(path));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>http.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+http.address().port;
const errors=[];
let browser;
try {
 browser=await engine.launch({headless:true,...(process.env.CHROMIUM_PATH&&engine===chromium?{executablePath:process.env.CHROMIUM_PATH}:{} )});
 async function open(name){
   const context=await browser.newContext({viewport:{width:name==='Encounter'?1280:1180,height:820},hasTouch:true,serviceWorkers:'block'});
   await context.route('https://cdn.jsdelivr.net/npm/three@0.186.1/build/*',async route=>route.fulfill({
     body:await readFile(resolve(root,'Encounter/node_modules/three/build',new URL(route.request().url()).pathname.split('/').at(-1))),
     contentType:'application/javascript',
   }));
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(name+': '+error.message));
   await page.goto(origin+'/'+name+'/index.html',{waitUntil:'domcontentloaded'});
   return page;
 }
 const gm=await open('Encounter');
 await gm.waitForFunction(()=>window.RPGConnectMJ&&window.__encounterBootReady);
 await gm.evaluate(({endpoint,room,key})=>{
   state.encounter.participants=[...CC_PLAYERS,{id:'cc-kobe',name:'Kobe Kozzo',hp:83,ac:15}].map(ccParticipant);
   saveState();render();
   document.querySelector('#rpgMjEndpoint').value=endpoint;
   document.querySelector('#rpgMjRoom').value=room;
   document.querySelector('#rpgMjKey').value=key;
   document.querySelector('#rpgMjConnect').click();
 },{endpoint,room,key});
 await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);
 const pages={};
 for(const name of names){
   const id=name.toLowerCase(),page=pages[id]=await open(name);
   await page.waitForSelector(name==='Kobe'?'#kobe-rpg-panel':'#cc-turnbar-standard',{state:'attached'});
   await page.evaluate(({id,endpoint,room,token})=>{
     if(id==='kobe'){
       const panel=document.querySelector('#kobe-rpg-panel');
       panel.querySelector('[name=invite]').value=['RPGCONNECT',endpoint,room,id,token].join('|');
       panel.querySelector('[data-connect]').click();
     }else{
       for(const [field,value] of Object.entries({endpoint,room,token}))document.querySelector('[name='+field+']').value=value;
       RPGConnect.connect();
     }
   },{id,endpoint,room,token:backend.rooms.get(room).tokens.get(id)});
 }
 await gm.waitForFunction(()=>RPGConnectMJ.getStatus().players.filter(p=>p.online).length===7);
 await gm.evaluate(()=>RPGConnectMJ.prepareFight());
 await gm.evaluate(ids=>{
   ids.forEach((id,i)=>RPGConnectMJ.validateInitiative(id,28-i*3));
   if(!RPGConnectMJ.startFight())throw Error('Le combat ne démarre pas');
 },Object.keys(pages));
 for(const [id,page] of Object.entries(pages)){
   if(id==='kobe'){
     await page.waitForFunction(()=>document.querySelector('.turn-finish')?.dataset.action==='signal-turn-end');
     await page.evaluate(()=>document.querySelector('.turn-finish').click());
     await page.waitForFunction(()=>document.querySelector('.turn-finish')?.disabled);
     await page.evaluate(()=>document.querySelector('.turn-local').click());
     await page.waitForFunction(()=>!document.querySelector('.turn-finish')?.disabled);
   }else{
     await page.waitForFunction(id=>RPGTable.getContext()?.session?.activeCharacterId===id,id);
     assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),true,id+' reaction');
     await page.evaluate(()=>RPGReactions.setAvailable(false));
     await page.evaluate(()=>document.querySelector('.cc-turn-next').click());
     await page.waitForFunction(()=>RPGTable.localEnded());
     assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),false);
     if(id==='brackmard'){
       await page.reload({waitUntil:'domcontentloaded'});
       await page.waitForFunction(()=>RPGConnect?.getStatus().connected&&RPGTable.getContext()?.stale===false);
       assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),false,'replay after reload');
     }
     await page.evaluate(()=>document.querySelector('.cc-turn-local').click());
     assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),true,id+' restoration locale');
   }
   assert.equal(await gm.evaluate(()=>activeParticipant().id),'cc-'+id,id+' retains GM initiative');
   if(id==='brackmard'){
     const result=await gm.evaluate(()=>{
       mutate(()=>state.encounter.participants.push(normalizeParticipant({
         id:'reinforcement',name:'Renfort',kind:'enemy',initiative:24,hp:20,maxHp:20,
       })));
       return sortedParticipants().slice(0,3).map(p=>p.id);
     });
     assert.deepEqual(result,['cc-brackmard','cc-samoth','reinforcement']);
     await page.waitForFunction(()=>RPGGroup.getActors().some(a=>a.id==='reinforcement'));
     await gm.evaluate(()=>{
       mutate(()=>state.encounter.participants.find(p=>p.id==='reinforcement').initiative=26);
     });
     assert.deepEqual(await gm.evaluate(()=>sortedParticipants().slice(0,3).map(p=>p.id)),
       ['cc-brackmard','reinforcement','cc-samoth']);
     await gm.evaluate(()=>removeParticipant('reinforcement'));
     assert.equal(await gm.evaluate(()=>activeParticipant().id),'cc-brackmard');
     assert.equal(await gm.evaluate(()=>state.encounter.round),1);
     await page.waitForFunction(()=>!RPGGroup.getActors().some(a=>a.id==='reinforcement'));
   }
   if(id!=='kobe'){
     await gm.evaluate(()=>actualAdvanceTurn());
     await gm.waitForTimeout(230);
     if(await gm.evaluate(()=>activeParticipant().kind==='enemy')){await gm.evaluate(()=>actualAdvanceTurn());await gm.waitForTimeout(230);}
   }
   console.log('PASS',id);
 }
 assert.deepEqual(errors,[]);
}finally{
 await browser?.close();
 for(const peer of backend.wss.clients)peer.terminate();
 await new Promise(ok=>backend.server.close(ok));
 await new Promise(ok=>http.close(ok));
}
