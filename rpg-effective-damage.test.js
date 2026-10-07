import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const source=readFileSync(resolve('../Kentaro/rpg-effective-damage.js'),'utf8');
function fixture(){
 const saved=new Map(),subscribers=[];
 const state={turn:1,damage:0},bridge={id:'test',adjustTurnDamage:delta=>{state.damage=Math.max(0,state.damage+delta)}};
 const api={getState:()=>({turn:{number:state.turn,damage:state.damage}}),subscribe:fn=>subscribers.push(fn)};
 const context={window:{CompanionAPI:api,__CompanionBridge:bridge},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},queueMicrotask};
 vm.runInNewContext(source,context);
 return{state,emit:(type,payload)=>subscribers.forEach(fn=>fn({type,payload})),saved};
}
test('authoritative attack result replaces local raw damage and ignores replay',async()=>{
 const {state,emit}=fixture();
 emit('attack:rolled',{attackId:'a',actionId:'action'});
 state.damage+=20;emit('attack:damage',{attackId:'a',actionId:'action',amount:20});
 await Promise.resolve();
 emit('damage:resolved',{attackId:'a',actionId:'action',raw:20,effective:6,targetId:'ogre'});
 assert.equal(state.damage,6);
 emit('damage:resolved',{attackId:'a',actionId:'action',raw:20,effective:6,targetId:'ogre'});
 assert.equal(state.damage,6);
});
test('multi-save credits each target once, including zero and retransmission',()=>{
 const {state,emit}=fixture();
 emit('save:request',{saveId:'s',actionId:'action',targets:[{targetId:'one'},{targetId:'two'}]});
 emit('save:result',{saveId:'s',resolutionId:'s:one',targetId:'one',effectiveDamage:8});
 emit('save:result',{saveId:'s',resolutionId:'s:two',targetId:'two',effectiveDamage:3});
 emit('save:result',{saveId:'s',resolutionId:'s:two',targetId:'two',effectiveDamage:3});
 emit('save:result',{saveId:'s',resolutionId:'s:three',targetId:'three',effectiveDamage:0});
 assert.equal(state.damage,11);
});
test('undo and turn change prevent late corrections',async()=>{
 const {state,emit}=fixture();
 emit('save:request',{saveId:'s',actionId:'action'});
 emit('action:undo-request',{actionId:'action'});
 emit('save:result',{saveId:'s',targetId:'one',effectiveDamage:9});
 assert.equal(state.damage,0);
 emit('attack:rolled',{attackId:'a',actionId:'late'});
 state.damage+=10;emit('attack:damage',{attackId:'a',actionId:'late',amount:10});
 await Promise.resolve();state.turn=2;state.damage=0;
 emit('damage:resolved',{attackId:'a',raw:10,effective:4});
 assert.equal(state.damage,0);
});
test('shared module and page loader exist on six Companions',()=>{
 for(const name of ['Kentaro','Brackmard','Zephyr','Rufus','Samoth','Nans']){
  assert.equal(readFileSync(resolve('../'+name+'/rpg-effective-damage.js'),'utf8'),source,name);
  const html=readFileSync(resolve('../'+name+'/index.html'),'utf8');
  assert.match(html,/rpg-effective-damage\.js\?v=mj-20261007-1/);
 }
});
