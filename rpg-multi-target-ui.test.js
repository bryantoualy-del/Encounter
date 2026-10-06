import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync(new URL('../Kentaro/rpg-multi-target-ui.js',import.meta.url),'utf8');
function harness(){
 const dom=new JSDOM('<body><section hidden id="combat"><div id="rpg-target-dock"></div></section><section id="spells"><input id="synTargets" value="4"><input id="synFails" value="2"><p data-help>Manual</p><button id="cast">Lancer + dégâts</button></section>',{url:'https://test.local/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const listeners=[],state={connected:false,targetMode:'single'},targets=[{id:'a',name:'Ogre #1'},{id:'b',name:'Ogre #2'}];let selected=[];
 w.CompanionAPI={getCharacter:()=>({id:'kentaro'}),subscribe:fn=>listeners.push(fn)};
 w.RPGConnect={getStatus:()=>({...state}),getTargets:()=>targets,getSelectedTargets:()=>selected,prepareTargets:()=>{state.targetMode='multi'},selectTargets:ids=>{selected=targets.filter(t=>ids.includes(t.id))},clearSelectedTargets:()=>{selected=[]},openTargetPicker:()=>{}};
 w.RPGMultiTargetUIConfig={bindings:[{selector:'#cast',source:'Synaptic',fields:true}],fields:{'#synTargets':'targets','#synFails':'failures'},manualHelp:'[data-help]'};w.eval(source);
 const emit=(type,payload)=>{for(const fn of listeners)fn({type,payload});w.RPGMultiTargetUI.refresh()};const ui=w.RPGMultiTargetUI;
 return{dom,w,state,ui,emit,targets,get selected(){return selected},q:s=>w.document.querySelector(s)};
}
test('offline fields remain editable; online picker works outside hidden combat and restores offline values',()=>{
 const h=harness();h.ui.refresh();assert.equal(h.q('#synTargets').readOnly,false);h.state.connected=true;h.ui.refresh();assert.equal(h.q('#synTargets').readOnly,true);
 h.q('#cast').click();assert.equal(h.q('#rpgMultiTargetPicker').open,true);h.q('[data-multi-target=a]').click();h.q('[data-multi-target=b]').click();assert.equal(h.q('#synTargets').value,'2');assert.equal(h.selected.length,2);
 h.state.connected=false;h.ui.refresh();assert.equal(h.q('#synTargets').value,'4');assert.equal(h.q('#synFails').value,'2');assert.equal(h.q('#synFails').readOnly,false);assert.equal(h.q('#cast').textContent,'Lancer + dégâts');h.dom.window.close();
});
test('authoritative results are deduplicated, persisted, and keep pending action guarded on disconnect',()=>{
 const h=harness();h.state.connected=true;h.w.RPGConnect.selectTargets(['a','b']);h.w.RPGConnect.prepareTargets();
 h.emit('save:request',{source:'Synaptic',targetMode:'multi',actionId:'x',targets:h.targets});h.emit('save:result',{actionId:'x',targetId:'a',success:false,dead:true,effectiveDamage:7});h.emit('save:result',{actionId:'x',targetId:'a',success:true});
 assert.equal(h.q('#synFails').value,'1');assert.match(h.q('[data-multi-progress]').textContent,/1 en attente/);h.state.connected=false;h.ui.refresh();assert.match(h.q('[data-multi-progress]').textContent,/Reconnexion/);assert.equal(h.q('#synTargets').readOnly,true);
 let native=0;h.q('#cast').onclick=()=>native++;h.q('#cast').click();assert.equal(native,0);
 h.emit('save:result',{actionId:'x',targetId:'b',success:true,effectiveDamage:3});assert.equal(h.ui.getActions()[0].targets[0].result.success,false);assert.match(h.q('[data-multi-progress]').textContent,/1 réussite/);assert.equal(h.q('#synTargets').readOnly,false);assert.match(h.w.localStorage.getItem('rpg-connect:multi-ui:v1:kentaro'),/effectiveDamage/);h.dom.window.close();
});
test('undo matches its actionId and combat reset clears stale progress',()=>{
 const h=harness();h.state.connected=true;h.emit('save:request',{source:'Synaptic',targetMode:'multi',actionId:'x',targets:h.targets});h.emit('action:undo-request',{actionId:'different-attack'});assert.equal(h.ui.getActions()[0].cancelled,undefined);h.emit('action:undo-request',{actionId:'x'});assert.equal(h.ui.getActions()[0].cancelled,true);h.emit('state:synced',{machine:{state:'PREP'}});assert.equal(h.ui.getActions().length,0);h.dom.window.close();
});
test('new selection clears completed display without discarding the event history',()=>{
 const h=harness();h.state.connected=true;h.w.RPGConnect.prepareTargets();h.w.RPGConnect.selectTargets(['a','b']);h.emit('save:request',{source:'Synaptic',actionId:'x',targets:h.targets,damage:9});h.emit('save:result',{actionId:'x',targetId:'a',success:false,effectiveDamage:9});h.emit('save:result',{actionId:'x',targetId:'b',success:true,effectiveDamage:4});h.ui.openPicker('Synaptic');h.q('[data-multi-target=b]').click();assert.equal(h.q('#synTargets').value,'1');assert.equal(h.q('#synFails').value,'0');assert.equal(h.ui.getActions()[0].targets[0].result.effectiveDamage,9);h.dom.window.close();
});
test('all six Companions load the identical shared presentation module',()=>{
 for(const repo of ['Samoth','Nans','Brackmard','Zephyr','Rufus'])assert.equal(readFileSync(new URL('../'+repo+'/rpg-multi-target-ui.js',import.meta.url),'utf8'),source);
});
