import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const window={};vm.runInNewContext(read('builtins.js'),{window});
const monsters=window.ENCOUNTER_BUILTINS;
test('5e 2014 spellcasters expose classified spells and levels; mundane attacks stay mundane',()=>{
 for(const name of ['Acolyte','Fanatique','Prêtre','Mage']){
  const m=monsters.find(x=>x.name===name);assert.ok(m,name);assert.ok(m.actions.some(x=>x.isSpell&&Number.isInteger(x.spellLevel)),name);assert.ok(m.actions.some(x=>x.kind==='attack'&&!x.isSpell),name);
 }
 const mage=monsters.find(x=>x.name==='Mage');assert.deepEqual([mage.actions.find(x=>x.name==='Boule de feu').save,mage.actions.find(x=>x.name==='Boule de feu').dc,mage.actions.find(x=>x.name==='Boule de feu').spellLevel],['DEX',14,3]);
 const exports=['monsters.json','bibliotheque-integree.json'].map(file=>JSON.parse(read(file)));
 for(const exported of exports)for(const name of ['Loup sanguinaire','Acolyte','Fanatique','Prêtre','Mage'])assert.ok(exported.some(x=>x.name===name),name+' missing from JSON export');
});
test('wolf bite carries a hit-gated STR save; neither bite nor nonspells can declare Counterspell',()=>{
 const bite=monsters.find(x=>x.name==='Loup sanguinaire').actions.find(x=>x.name==='Morsure');assert.equal(bite.isSpell,undefined);assert.equal(bite.attackMode,'melee');assert.equal(bite.onHitSave.ability,'FOR');assert.equal(bite.onHitSave.dc,13);assert.equal(bite.onHitSave.conditionOnFailure,'À terre');
});
test('library editor retains spell metadata and on-hit saves when normalizing',()=>{
 const source=read('app.js');const start=source.indexOf('function abilityAttackMode('),end=source.indexOf('function normalizeResource(',start);assert.ok(start>0&&end>start);
 const sandbox={ABILITIES:['FOR','DEX','CON','INT','SAG','CHA'],numOrNull:v=>v===''||v==null?null:Number(v),uid:()=> 'id',EncounterTypedDamage:{forAbility:()=>({parts:[],errors:[]})}};vm.runInNewContext(source.slice(start,end),sandbox);
 const spell=sandbox.normalizeAbility({name:'Boule de feu',isSpell:true,spellLevel:3,kind:'save',save:'DEX',dc:14});assert.equal(spell.isSpell,true);assert.equal(spell.spellLevel,3);
 const cantrip=sandbox.normalizeAbility({name:'Flamme sacrée',isSpell:true,spellLevel:0});assert.equal(cantrip.spellLevel,0);
 const wolf=sandbox.normalizeAbility({name:'Morsure',onHitSaveAbility:'FOR',onHitSaveDc:13,onHitSaveCondition:'À terre'});assert.equal(wolf.onHitSave.conditionOnFailure,'À terre');
});
test('existing customized wolf gains bite save once and can then deliberately remove it',()=>{
 const code=read('app.js'),start=code.indexOf('function mergeBuiltinEnhancements('),end=code.indexOf('const CC_PLAYERS=',start);
 const sandbox={normalizeMonster:x=>({lairActions:[],phases:[],reactions:[],legendaryActions:[],traits:[],...structuredClone(x)}),normalizeAbility:x=>x};vm.runInNewContext(code.slice(start,end),sandbox);
 const builtin=monsters.find(m=>m.name==='Loup sanguinaire'),base={actions:[{name:'Morsure',kind:'attack'}],reactions:[],legendaryActions:[],traits:[],lairActions:[],phases:[],abilities:{},saveMods:{},skills:{},damageResistances:[],damageVulnerabilities:[],damageImmunities:[],conditionImmunities:[]};
 const upgraded=sandbox.mergeBuiltinEnhancements(base,builtin);assert.equal(upgraded.actions[0].onHitSave.dc,13);
 const optOut={...base,actions:[{name:'Morsure',kind:'attack',onHitSave:null}]};assert.equal(sandbox.mergeBuiltinEnhancements(optOut,builtin).actions[0].onHitSave,null);
});
test('an on-hit save is requested once, applies prone only on failure, and replays safely',()=>{
 const code=read('rpg-connect-mj.js');const request=code.slice(code.indexOf(' function requestEnemyHitSave('),code.indexOf(' function requestEnemySaves(',code.indexOf(' function requestEnemyHitSave(')));
 const apply=code.slice(code.indexOf(' function applyPlayerSave('),code.indexOf(' const nativePlayerSaveEvent=',code.indexOf(' function applyPlayerSave(')));
 const dom=new JSDOM('',{runScripts:'outside-only'});const w=dom.window;const wolf={id:'wolf',name:'Loup sanguinaire'},kentaro={id:'cc-kentaro',name:'Kentaro',kind:'player',hp:93,conditions:[]};
 const ledger={},commands=[],logs=[];Object.defineProperty(w.crypto,'randomUUID',{value:()=>String(Object.keys(ledger).length+1)});
 Object.assign(w,{state:{encounter:{participants:[wolf,kentaro],round:2}},fight:{requestId:'fight'},manualQueue:[],playerSaveLedger:()=>ledger,characterIdForParticipant:id=>id==='cc-kentaro'?'kentaro':null,conditionPayload:p=>p.conditions,command:(id,type,q)=>commands.push({id,type,q}),saveState:()=>{},render:()=>{},nextManual:()=>{},log:x=>logs.push(x),broadcastTargets:()=>{},RPGPlayerSaveAuthority:{damage:(n,success,half)=>success?(half?Math.floor(n/2):0):n},applyDamageDirect:()=>{throw Error('bite save must not inflict its damage twice')},conditionImmune:()=>false,addConditionMany:(ids,data)=>{kentaro.conditions.push(data)}});
 w.eval(read('rpg-player-save-authority.js'));w.eval(request+'\n'+apply);
 const bite={name:'Morsure',onHitSave:{ability:'FOR',dc:13,conditionOnFailure:'À terre'}};
 w.requestEnemyHitSave(wolf,kentaro,bite);assert.equal(commands.length,1);const q=commands[0].q;assert.equal(q.damage,0);assert.equal(q.conditionOnFailure,'À terre');assert.equal(q.ability,'FOR');
 const item=ledger[q.requestId];w.applyPlayerSave(item,{rolls:[1],modifier:0,total:1,success:false});assert.equal(kentaro.conditions.length,1);assert.equal(kentaro.conditions[0].name,'À terre');assert.equal(kentaro.hp,93);
 w.applyPlayerSave(item,{rolls:[1],modifier:0,total:1,success:false});assert.equal(kentaro.conditions.length,1);
 w.requestEnemyHitSave(wolf,kentaro,bite);const second=ledger['2'];w.applyPlayerSave(second,{rolls:[20],modifier:0,total:20,success:true});assert.equal(kentaro.conditions.length,1);dom.window.close();
});
test('the connected attack wrapper opens the bite save only after a recorded hit',()=>{
 const code=read('rpg-connect-mj.js'),start=code.indexOf(" if(typeof resolveTargetSelection==='function'){const baseResolveTargetSelection=resolveTargetSelection;"),end=code.indexOf('\n function controllerFor(',start);assert.ok(start>0&&end>start);
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window,actor={id:'wolf',kind:'enemy',hp:37,conditions:[]},target={id:'kentaro',kind:'player',hp:93,conditions:[]},ability={id:'bite',name:'Morsure',kind:'attack',onHitSave:{ability:'FOR',dc:13,conditionOnFailure:'À terre'}};
 let hit=false,saves=0;Object.assign(w,{state:{encounter:{participants:[actor,target],log:[{text:'attack'}]}},ui:{targeting:{actorId:'wolf',mode:'normal'}},fight:{},bindings:{kentaro:'kentaro'},online:()=>true,conditionMechanics:()=>({incapacitated:false}),conditionPayload:p=>p.conditions,eligibleTarget:()=>true,currentTargetingAbility:()=>ability,requestEnemyHitSave:()=>saves++,command:()=>{},netlog:()=>{},names:{},log:()=>{},saveState:()=>{},render:()=>{},syncAllConditions:()=>{},note:()=>{},resolveTargetSelection:()=>{w.ui.lastTargetResolution={actorId:'wolf',targetId:'kentaro',abilityId:'bite',hit,critical:false,attackTotal:hit?20:1,rollText:String(hit?20:1),damage:hit?6:0,damageType:'perforants'};return true}});
 w.eval(code.slice(start,end));w.resolveTargetSelection('kentaro');assert.equal(saves,0);hit=true;w.resolveTargetSelection('kentaro');assert.equal(saves,1);dom.window.close();
});
