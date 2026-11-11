import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=resolve(new URL('../',import.meta.url).pathname);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const http=createServer(async(req,res)=>{
  try{
    const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(!file.startsWith(root+'/'))throw Error('Invalid path');
    res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>http.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+http.address().port+'/index.html';
const errors=[];

async function exercise(browserType,label){
  const browser=await browserType.launch({
    headless:true,
    ...(label==='chromium'?{executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']}:
      process.env.WEBKIT_PATH?{executablePath:process.env.WEBKIT_PATH}:{}),
  });
  try{
    const context=await browser.newContext({viewport:{width:1180,height:820},acceptDownloads:true,serviceWorkers:'block'});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(label+': '+e.message));
    page.on('dialog',d=>d.dismiss());
    await page.goto(base);
    await page.waitForFunction(()=>typeof state!=='undefined'&&typeof addMonsterToCombat==='function');
    const baseline=await page.evaluate(()=>{
      state.encounter.round=2;
      saveState();
      const persisted=localStorage.getItem(STORAGE_KEY);
      const original=Storage.prototype.setItem;
      window.__p0OriginalSetItem=original;
      window.__p0RenderCount=0;
      const previousRender=render;
      render=function(...args){window.__p0RenderCount++;return previousRender(...args);};
      Storage.prototype.setItem=function(key,value){
        if(key===STORAGE_KEY)throw new DOMException('P0 quota simulated','QuotaExceededError');
        return original.call(this,key,value);
      };
      return persisted;
    });
    assert.ok(baseline,label+': baseline persisted');

    const action=await page.evaluate(()=>{
      const model=state.monsters.find(m=>m.category==='enemy');
      if(!model)throw Error('No built-in enemy');
      for(let i=0;i<40;i++)mutate(()=>{state.encounter.round+=1;},'P0 action '+i);
      for(let i=0;i<5;i++)addMonsterToCombat(model.id,1,10,true);
      return {
        round:state.encounter.round,
        enemies:state.encounter.participants.filter(p=>p.kind==='enemy').length,
        rendered:window.__p0RenderCount,
        unsaved:encounterHasUnsavedChanges,
        banner:document.getElementById('encounterStorageStatus')?.textContent||'',
        persisted:localStorage.getItem(STORAGE_KEY),
      };
    });
    assert.equal(action.round,42,label+': 40 actions continue');
    assert.ok(action.enemies>=5,label+': adding built-in monsters continues');
    assert.ok(action.rendered>=45,label+': actions still render');
    assert.equal(action.unsaved,true,label+': dirty state recorded');
    assert.match(action.banner,/Sauvegarde non effectuée/i,label+': sticky warning');
    assert.equal(action.persisted,baseline,label+': previous save preserved');
    assert.equal(errors.length,0,label+': no page exceptions');

    // Export the CURRENT in-memory state, not the previous persistent snapshot.
    await page.locator('#btnMore').click();
    const pending=page.waitForEvent('download');
    await page.locator('#btnExport').click();
    const download=await pending;
    const exported=JSON.parse(await readFile(await download.path(),'utf8'));
    assert.equal(exported.encounter.round,42,label+': JSON export includes unsaved actions');
    assert.ok(exported.encounter.participants.length>=5,label+': JSON export includes new monsters');

    await page.evaluate(()=>{
      Storage.prototype.setItem=window.__p0OriginalSetItem;
      if(!saveState())throw Error('Recovery save failed');
    });
    assert.equal(await page.evaluate(()=>encounterHasUnsavedChanges),false,label+': dirty state clears after recovery');
    await page.reload();
    assert.equal(await page.evaluate(()=>state.encounter.round),42,label+': recovered actions survive reload');
    assert.ok(await page.evaluate(()=>state.encounter.participants.filter(p=>p.kind==='enemy').length>=5));

    // Test the real browser quota too (not only a simulated exception).
    const full=await page.evaluate(()=>{
      const old=localStorage.getItem(STORAGE_KEY);
      const chunk='x'.repeat(32768);
      let ballast='';
      for(let i=0;i<500;i++){
        try{localStorage.setItem('quota-test-ballast',ballast+chunk);ballast+=chunk;}
        catch(error){if(error.name==='QuotaExceededError')break;throw error;}
      }
      // Make the new state substantially larger than the recovery copy freed
      // by EncounterPersistence.write() when quota is exhausted.
      state.encounter.log.push({id:'quota-large-log',text:'x'.repeat(1200000)});
      const model=state.monsters.find(m=>m.category==='enemy');
      const previous=state.encounter.participants.length;
      addMonsterToCombat(model.id,1,10,true);
      return {previous,current:state.encounter.participants.length,old,persisted:localStorage.getItem(STORAGE_KEY),
        dirty:encounterHasUnsavedChanges};
    });
    assert.equal(full.current,full.previous+1,label+': real saturation still adds a monster');
    assert.equal(full.dirty,true,label+': real saturation marks unsaved');
    assert.equal(full.persisted,full.old,label+': real saturation retains last save');
    await page.evaluate(()=>{localStorage.removeItem('quota-test-ballast');if(!saveState())throw Error('Real quota recovery failed');});
    await page.reload();
    assert.equal(await page.evaluate(()=>state.encounter.participants.length),full.current,label+': real quota recovery durable');
    assert.deepEqual(errors,[],label+': no uncaught exceptions');
    await context.close();
    console.log('PASS '+label+': simulated and real quota, 40 actions, five monsters, export and reload');
  }finally{await browser.close();}
}
try{
  await exercise(chromium,'chromium');
  await exercise(webkit,'webkit');
}finally{http.close();}
