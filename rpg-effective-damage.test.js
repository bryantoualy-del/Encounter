import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const names=['Kentaro','Brackmard','Zephyr','Rufus','Samoth','Nans'];
const modulePath=name=>resolve('../'+name+'/rpg-effective-damage.js');
function fixture(name){
 const saved=new Map(),subscribers=[];
 const state={turn:1,damage:0},bridge={id:'test',adjustTurnDamage:delta=>{state.damage=Math.max(0,state.damage+delta)}};
 const api={getState:()=>({turn:{number:state.turn,damage:state.damage}}),subscribe:fn=>subscribers.push(fn)};
 const context={window:{CompanionAPI:api,__CompanionBridge:bridge},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},queueMicrotask};
 vm.runInNewContext(readFileSync(modulePath(name),'utf8'),context);
 return{state,emit:(type,payload)=>subscribers.forEach(fn=>fn({type,payload}))};
}
for(const name of names){
 test(name+' replaces raw damage and ignores replay',async()=>{
  const {state,emit}=fixture(name);
  emit('attack:rolled',{attackId:'a',actionId:'action'});
  state.damage+=20;emit('attack:damage',{attackId:'a',actionId:'action',amount:20});
  await Promise.resolve();
  emit('damage:resolved',{attackId:'a',actionId:'action',raw:20,effective:6,targetId:'ogre'});
  assert.equal(state.damage,6);
  emit('damage:resolved',{attackId:'a',actionId:'action',raw:20,effective:6,targetId:'ogre'});
  assert.equal(state.damage,6);
 });
 test(name+' credits each save target once',()=>{
  const {state,emit}=fixture(name);
  emit('save:request',{saveId:'s',actionId:'action',targets:[{targetId:'one'},{targetId:'two'}]});
  emit('save:result',{saveId:'s',resolutionId:'s:one',targetId:'one',effectiveDamage:8});
  emit('save:result',{saveId:'s',resolutionId:'s:two',targetId:'two',effectiveDamage:3});
  emit('save:result',{saveId:'s',resolutionId:'s:two',targetId:'two',effectiveDamage:3});
  emit('save:result',{saveId:'s',resolutionId:'s:three',targetId:'three',effectiveDamage:0});
  assert.equal(state.damage,11);
 });
 test(name+' ignores corrections after undo or turn change',async()=>{
  const {state,emit}=fixture(name);
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
}

test('page loader exists on six Companions',()=>{
 for(const name of names){
  const html=readFileSync(resolve('../'+name+'/index.html'),'utf8');
  assert.match(html,/<script\s+src="rpg-effective-damage\.js(?:\?v=[^"]+)?"/,name);
 }
});
