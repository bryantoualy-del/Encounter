import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve(new URL('../',import.meta.url).pathname);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{const f=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',types[extname(f)]||'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404);res.end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/index.html';
try {
 for(const [label,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:label==='chromium'?['--no-sandbox']:[]});
  try{
   const context=await browser.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.dismiss());
   await page.goto(url);await page.waitForFunction(()=>window.__encounterBootReady===true);
   await page.evaluate(async()=>{
    state.encounter.rpgSessionMode='table-free';
    state.encounter.participants=[{id:'audit-a',name:'Audit A',kind:'player',initiative:20,hp:20,maxHp:20,conditions:[],abilityState:{},resources:{},effects:[]},{id:'audit-b',name:'Audit B',kind:'player',initiative:10,hp:20,maxHp:20,conditions:[],abilityState:{},resources:{},effects:[]}];
    state.encounter.round=1;state.encounter.currentTurn=0;state.encounter.selectedId='audit-a';
    localStorage.setItem('rpg-connect:fight:v1',JSON.stringify({phase:'ended',requestId:'audit-ended',roster:[],rolls:{},validated:{}}));
    saveState();await EncounterIndexedDB.ready();
   });
   await page.reload();await page.waitForFunction(()=>window.__encounterBootReady===true);
   const initial=await page.evaluate(()=>({round:state.encounter.round,turn:state.encounter.currentTurn,mode:state.encounter.rpgSessionMode}));
   assert.equal(initial.mode,'table-free');assert.equal(initial.turn,0);
   await page.locator('#btnNextTurn').click();
   assert.equal(await page.evaluate(()=>state.encounter.currentTurn),1,label+' turn advances despite ended RPG fight');
   await page.evaluate(()=>EncounterIndexedDB.ready());
   await page.reload();await page.waitForFunction(()=>window.__encounterBootReady===true);
   assert.equal(await page.evaluate(()=>state.encounter.currentTurn),1,label+' turn persisted after reload');
   await page.locator('#btnNextTurn').click();
   const next=await page.evaluate(()=>({round:state.encounter.round,turn:state.encounter.currentTurn}));
   assert.equal(next.round,2,label+' round increments');assert.equal(next.turn,0,label+' wraps to first participant');
   assert.deepEqual(errors,[],label+' no uncaught errors');
   await context.close();console.log('PASS '+label+' ended Fight + free table: click, persistence, round rollover');
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>server.close(ok))}
