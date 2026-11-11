import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const root=resolve(new URL('../',import.meta.url).pathname);
const http=createServer(async(req,res)=>{
 try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!path.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':'text/html');res.end(await readFile(path));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>http.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+http.address().port;
async function run(engine,label){
 const browser=await engine.launch({headless:true,args:label==='chromium'?['--no-sandbox']:[]});
 try{
   const ctx=await browser.newContext({serviceWorkers:'block'});
   const page=await ctx.newPage();
   await page.goto(base+'/index.html');
   await page.waitForFunction(()=>window.__encounterBootReady===true);
   const result=await page.evaluate(async()=>{
     const db=EncounterIndexedDB;
     await db.clearForTests();
     const empty=await db.load();
     const large='x'.repeat(1_500_000);
     const initial={schemaVersion:1,encounter:{round:7,participants:[],log:[{text:large}]},monsters:[{id:'mage',name:'Mage'}],savedEncounters:[]};
     await db.commit(initial);
     // Mutating caller-owned input after commit must never alter committed snapshot.
     initial.encounter.round=100;
     const stored=await db.load();
     const jobs=[];
     for(let i=0;i<50;i++)jobs.push(db.commit({schemaVersion:1,encounter:{round:i+1,participants:[],log:[]},monsters:[],savedEncounters:[]}));
     await Promise.all(jobs);
     const latest=await db.load();
     await db.backup('test-backup',{round:7});
     const backup=await db.backups();
     let rejected=false;
     try{await db.restore({bad:true},()=>{throw Error('invalid schema')});}
     catch{rejected=true;}
     const afterRejected=await db.load();
     return {empty:empty===undefined,largeRound:stored.encounter.round,
       largeLen:stored.encounter.log[0].text.length,round:latest.encounter.round,
       backups:backup.some(b=>b.round===7),rejected,unchanged:afterRejected.encounter.round===50};
   });
   assert.deepEqual(result,{empty:true,largeRound:7,largeLen:1500000,round:50,backups:true,rejected:true,unchanged:true},label);
   await page.reload();
   await page.waitForFunction(()=>window.__encounterBootReady===true);
   assert.equal(await page.evaluate(async()=> (await EncounterIndexedDB.load()).encounter.round),50);
   console.log('PASS '+label+' IndexedDB: 1.5MB, ordered 50 commits, backups, invalid import, reload');
   await ctx.close();
 }finally{await browser.close();}
}
try{await run(chromium,'chromium');await run(webkit,'webkit');}
finally{http.close();}
