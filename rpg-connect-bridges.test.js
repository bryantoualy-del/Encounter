import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
for(const name of ['Kentaro','Nans','Samoth','Brackmard','Zephyr','Rufus'])test(`${name} : API locale et événements natifs`,async()=>{
 const errors=[];const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>errors.push(error));
 const dir=join(root,name),dom=new JSDOM(readFileSync(join(dir,'index.html'),'utf8'),{url:`https://example.test/${name}/`,runScripts:'outside-only',virtualConsole});
 const w=dom.window;
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.URL.createObjectURL=()=>'';w.URL.revokeObjectURL=()=>{};w.requestAnimationFrame=fn=>w.setTimeout(fn,0);w.cancelAnimationFrame=id=>w.clearTimeout(id);w.fetch=async()=>({ok:true,status:200,json:async()=>({}),text:async()=>'',blob:async()=>new w.Blob([]),arrayBuffer:async()=>new ArrayBuffer(0)});
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.visualViewport={width:1024,height:768,offsetTop:0,offsetLeft:0,scale:1,addEventListener(){},removeEventListener(){}};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const scripts=[...w.document.scripts].filter(s=>s.type!=='module').map(s=>{const src=s.getAttribute('src');return src?readFileSync(join(dir,src.split('?')[0]),'utf8'):s.textContent}).join('\n;\n');
 try{
  w.eval(scripts);const api=w.CompanionAPI,events=[];assert.ok(api);assert.equal(api.getState().characterId,name.toLowerCase());api.subscribe(event=>events.push(event));
  const before=api.getState().hp.current;api.damage(1);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(api.getState().hp.current,before-1);assert.ok(events.some(e=>e.type==='hp:changed'));
  api.heal(1);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(api.getState().hp.current,before);
  api.nextTurn();await new Promise(resolve=>setTimeout(resolve,0));assert.ok(api.getState().turn.number>=2);api.resetCombat();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(api.getState().turn.number,1);assert.equal(api.getState().turn.round,1);
  const client=readFileSync(join(dir,'rpg-connect-client.js'),'utf8');
  assert.match(client,/event\.type==='state:sync'/,'state sync absent');
  assert.match(client,/event\.type==='conditions:set'/,'condition sync absent');
  assert.match(client,/event\.type==='save:result'/,'save result absent');
  assert.match(client,/event\.type==='attack:decision'/,'GM attack decision absent');
  assert.match(client,/attackTargetLocks/,'attack target lock absent');
  assert.match(client,/mechanics:t\?\.mechanics/,'target mechanics absent');
  assert.match(client,/durationType==='nextAttack'/,'next-attack state support absent');
  if(name==='Kentaro'){
    const html=readFileSync(join(dir,'index.html'),'utf8');
    assert.match(html,/blade\('sun','bonus'\)/,'Kentaro bonus Solinar attack path absent');
    assert.match(html,/blade\('moon','bonus'\)/,'Kentaro bonus Selhane attack path absent');
    assert.match(html,/pending:\(\)=>S\.pendingHit/,'Kentaro bonus attack is not exposed through the shared pending pipeline');
    assert.match(html,/emitsAttackDamage:true/,'Kentaro explicit damage transport disabled');
    assert.match(html,/attack:damage[^\n]+p\.attackId/,'Kentaro damage is not correlated to the pending attackId');
  }
  assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
 }finally{dom.window.close()}
});
