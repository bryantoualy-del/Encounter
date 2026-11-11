import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const root=resolve(new URL('../',import.meta.url).pathname);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
   const f=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
   if(!f.startsWith(root+'/'))throw Error('path');
   res.setHeader('Content-Type',types[extname(f)]||'application/octet-stream');
   res.end(await readFile(f));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/index.html';
async function run(engine,label){
 const browser=await engine.launch({headless:true,args:label==='chromium'?['--no-sandbox']:[]});
 try{
   const context=await browser.newContext({viewport:{width:1180,height:820},acceptDownloads:true,serviceWorkers:'block'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.dismiss());
   await page.goto(url);
   await page.waitForFunction(()=>window.__encounterBootReady===true,{timeout:30000});
   const data=await page.evaluate(async()=>{
     const enemy=state.monsters.find(x=>x.category==='enemy');
     if(!enemy)throw Error('No enemy model');
     for(let i=0;i<25;i++)mutate(()=>{state.encounter.round++;},'V1.5 test '+i);
     for(let i=0;i<4;i++)addMonsterToCombat(enemy.id,1,10,true);
     await EncounterIndexedDB.ready();
     return {round:state.encounter.round,participants:state.encounter.participants.length,
       dbRound:(await EncounterIndexedDB.load()).encounter.round,
       localState:localStorage.getItem(STORAGE_KEY)};
   });
   assert.equal(data.round,26,label+' round');
   assert.equal(data.dbRound,26,label+' persisted');
   assert.ok(data.participants>=4,label+' monsters');
   assert.equal(data.localState,null,label+' no oversized localStorage state writes');
   await page.reload();
   await page.waitForFunction(()=>window.__encounterBootReady===true);
   const loaded=await page.evaluate(()=>({round:state.encounter.round,count:state.encounter.participants.length}));
   assert.deepEqual(loaded,{round:26,count:data.participants},label+' reload');

   await page.locator('#btnMore').click();
   const requested=page.waitForEvent('download');
   await page.locator('#btnExport').click();
   const download=await requested, exported=JSON.parse(await readFile(await download.path(),'utf8'));
   assert.equal(exported.encounter.round,26,label+' JSON export');

   await page.evaluate(async()=>{await EncounterIndexedDB.clearForTests();});
   await page.reload();
   await page.waitForFunction(()=>window.__encounterBootReady===true);
   assert.equal(await page.evaluate(()=>state.encounter.round),1,label+' cleared state');

   await page.evaluate(()=>{
     document.querySelectorAll('dialog[open]').forEach(d=>d.close());
     document.querySelector('#importDialog').showModal();
   });
   await page.locator('#importFile').setInputFiles({name:'encounter.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
   await page.waitForFunction(()=>document.querySelector('#importText').value.length>0);
   await Promise.all([
     page.waitForNavigation({waitUntil:'domcontentloaded'}),
     page.locator('#importForm button[type=submit]').click()
   ]);
   await page.waitForFunction(()=>window.__encounterBootReady===true&&state.encounter.round===26);
   assert.equal(await page.evaluate(async()=> (await EncounterIndexedDB.load()).encounter.round),26,label+' JSON import persisted');
   // A malformed persisted object must never be silently replaced by a blank game.
   await page.evaluate(async()=>{await EncounterIndexedDB.commit({schemaVersion:1,monsters:[]});});
   await page.reload();
   await page.locator('#encounterStorageBoot[role="alert"]').waitFor({state:'visible'});
   const rejected=await page.evaluate(async()=>({
     ready:window.__encounterBootReady,
     original:await EncounterIndexedDB.load()
   }));
   assert.equal(rejected.ready,false,label+' malformed state blocks initialization');
   assert.equal(rejected.original.encounter,undefined,label+' malformed state was not overwritten');
   // Restore the portable JSON using the storage engine without starting the game.
   await page.evaluate(async data=>{await EncounterIndexedDB.restore(data,EncounterPersistence.migrate);},exported);
   await page.reload();
   await page.waitForFunction(()=>window.__encounterBootReady===true);
   assert.equal(await page.evaluate(()=>state.encounter.round),26,label+' JSON repair after corrupt IndexedDB');
   assert.deepEqual(errors,[],label+' page errors');
   console.log('PASS '+label+': Encounter startup, 25 actions, four monsters, IndexedDB reload and JSON export/import');
   await context.close();
 }finally{await browser.close();}
}
try{await run(chromium,'chromium');await run(webkit,'webkit');}
finally{server.close();}
