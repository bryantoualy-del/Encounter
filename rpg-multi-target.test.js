import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

function saveHarness(){
 const dom=new JSDOM('<!doctype html><body></body>',{url:'https://encounter.test/',runScripts:'outside-only'});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
 const participants=[
  {id:'a',name:'Loup',hp:20,maxHp:20,tempHp:4,conditions:[]},
  {id:'b',name:'Gobelin',hp:20,maxHp:20,tempHp:0,conditions:[]},
  {id:'c',name:'Élémentaire',hp:8,maxHp:8,tempHp:0,conditions:[]},
  {id:'d',name:'Duergar',hp:20,maxHp:20,tempHp:0,conditions:[]},
  {id:'e',name:'Faible',hp:4,maxHp:4,tempHp:0,conditions:[]}
 ];
 const models={
  a:{type:'bête',saveMods:{DEX:0},damageResistances:['froid']},
  b:{type:'humanoïde',saveMods:{DEX:5}},
  c:{type:'élémentaire',saveMods:{DEX:-1},damageImmunities:['froid']},
  d:{type:'humanoïde',saveMods:{DEX:1},damageVulnerabilities:['froid']},
  e:{type:'humanoïde',saveMods:{DEX:0}}
 };
 const sent=[],ledger={},transactions=[],rolls=[];
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const damage=(p,amount,type)=>{
  const m=models[p.id]||{},k=norm(type);let n=amount,reason='';
  if((m.damageImmunities||[]).some(x=>norm(x)===k)){n=0;reason='immunité'}
  else{if((m.damageResistances||[]).some(x=>norm(x)===k)){n=Math.floor(n/2);reason='résistance'}if((m.damageVulnerabilities||[]).some(x=>norm(x)===k)){n*=2;reason='vulnérabilité'}}
  const absorbed=Math.min(p.tempHp||0,n);p.tempHp=(p.tempHp||0)-absorbed;n-=absorbed;p.hp=Math.max(0,p.hp-n);return{reason}
 };
 dom.window.eval(readFileSync(new URL('./rpg-target-names.js',import.meta.url),'utf8'));
 dom.window.eval(readFileSync(new URL('./rpg-save-authority.js',import.meta.url),'utf8'));
 const authority=dom.window.createRPGSaveAuthority({
  label:p=>dom.window.encounterTargetLabel(p,participants,x=>models[x.id]),target:id=>participants.find(p=>p.id===id&&p.hp>0),model:p=>models[p.id],mechanics:()=>({}),name:()=> 'Samoth',normalize:norm,participantId:()=> 'samoth',
  send:(id,type,payload)=>{sent.push({id,type,payload})},resetCombat:()=>{},ledger:()=>ledger,roll:()=>rolls.shift()??10,
  immune:(p,name)=>p.id==='c'&&norm(name)==='entrave',addCondition:(id,data)=>participants.find(p=>p.id===id).conditions.push(data),damage,
  beginAction:(actionId,characterId,targetIds,meta)=>transactions.push({actionId,characterId,targetIds:[...targetIds],meta}),icon:()=>'',persist:()=>{},refresh:()=>{},log:()=>{}
 });
 const manual=(die)=>{rolls.push(Number(die));const pop=dom.window.document.querySelector('#rpgSavePopup');pop.querySelector('[data-save-auto]').click()};
 return{dom,participants,models,sent,ledger,transactions,rolls,authority,manual};
}

test('1. legacy targetId is normalized as a single target',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt1',payload:{saveId:'legacy',targetId:'b',ability:'DEX',dc:12,source:'Legacy',damage:4,damageType:'froid'}});h.manual(10);
 assert.equal(h.sent.filter(x=>x.type==='save:result').length,1);assert.equal(h.sent.at(-1).payload.targetId,'b');h.dom.window.close();
});

test('2. one multi-target request creates three target resolutions under one action',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt2',payload:{saveId:'vortex',actionId:'action-vortex',targets:[{targetId:'a'},{targetId:'b'},{targetId:'c'}],ability:'DEX',dc:12,source:'Vortex',damage:12,damageType:'froid',halfOnSuccess:true}});
 assert.equal(h.authority.pending(),3);assert.equal(h.transactions.length,1);assert.deepEqual(h.transactions[0].targetIds,['a','b','c']);h.dom.window.close();
});

test('3. each target uses its own saving throw modifier',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt3',payload:{saveId:'mods',actionId:'mods-action',targets:['a','b'],ability:'DEX',dc:12,source:'Mods',damage:0}});
 h.manual(10);h.manual(10);const r=h.sent.filter(x=>x.type==='save:result').map(x=>x.payload);assert.equal(r[0].modifier,0);assert.equal(r[1].modifier,5);assert.equal(r[0].success,false);assert.equal(r[1].success,true);h.dom.window.close();
});

test('4. mixed save results reuse the same raw damage roll',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt4',payload:{saveId:'shared',actionId:'shared-action',targets:['a','b'],ability:'DEX',dc:12,source:'Shared',damageRollMode:'shared',components:[{amount:12,type:'froid'}],halfOnSuccess:true}});
 h.manual(5);h.manual(15);const r=h.sent.filter(x=>x.type==='save:result').map(x=>x.payload);assert.deepEqual(r.map(x=>x.rawDamage),[12,12]);assert.deepEqual(r.map(x=>x.requestedDamage),[12,6]);h.dom.window.close();
});

test('5. resistance is applied per target after save scaling',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt5',payload:{saveId:'res',actionId:'res-action',targets:['a','b'],ability:'DEX',dc:30,source:'Cold',components:[{amount:12,type:'froid'}]}});
 h.manual(1);h.manual(1);const r=h.sent.filter(x=>x.type==='save:result').map(x=>x.payload);assert.equal(r[0].effectiveDamage,6);assert.equal(r[1].effectiveDamage,12);h.dom.window.close();
});

test('6. immunity is evaluated independently per target',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt6',payload:{saveId:'imm',actionId:'imm-action',targets:['b','c'],ability:'DEX',dc:30,source:'Cold',components:[{amount:12,type:'froid'}]}});
 h.manual(1);h.manual(1);const r=h.sent.filter(x=>x.type==='save:result').map(x=>x.payload);assert.equal(r[0].effectiveDamage,12);assert.equal(r[1].effectiveDamage,0);h.dom.window.close();
});

test('7. vulnerability is evaluated independently per target',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt7',payload:{saveId:'vuln',actionId:'vuln-action',targets:['b','d'],ability:'DEX',dc:30,source:'Cold',components:[{amount:6,type:'froid'}]}});
 h.manual(1);h.manual(1);const r=h.sent.filter(x=>x.type==='save:result').map(x=>x.payload);assert.equal(r[0].effectiveDamage,6);assert.equal(r[1].effectiveDamage,12);h.dom.window.close();
});

test('8. temporary HP are consumed before normal HP',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt8',payload:{saveId:'temp',targetId:'a',ability:'DEX',dc:30,source:'Cold',components:[{amount:12,type:'froid'}]}});
 h.manual(1);assert.equal(h.participants[0].tempHp,0);assert.equal(h.participants[0].hp,18);assert.equal(h.sent.at(-1).payload.effectiveDamage,6);h.dom.window.close();
});

test('9. a target can reach 0 HP without cancelling remaining resolutions',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt9',payload:{saveId:'death',actionId:'death-action',targets:['e','b'],ability:'DEX',dc:30,source:'Blast',components:[{amount:8,type:'force'}]}});
 h.manual(1);assert.equal(h.participants.find(p=>p.id==='e').hp,0);assert.equal(h.authority.pending(),1);h.manual(1);assert.equal(h.participants.find(p=>p.id==='b').hp,12);assert.equal(h.authority.pending(),0);h.dom.window.close();
});

test('10. failure conditions apply only to failed saves',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt10',payload:{saveId:'cond',actionId:'cond-action',targets:['a','b'],ability:'DEX',dc:12,source:'Entrave',condition:{name:'Entravé'},damage:0}});
 h.manual(1);h.manual(20);assert.equal(h.participants.find(p=>p.id==='a').conditions.length,1);assert.equal(h.participants.find(p=>p.id==='b').conditions.length,0);h.dom.window.close();
});

test('11. condition immunity is evaluated per target',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'evt11',payload:{saveId:'condimm',actionId:'condimm-action',targets:['a','c'],ability:'DEX',dc:30,source:'Entrave',condition:{name:'Entravé'},damage:0}});
 h.manual(1);h.manual(1);assert.equal(h.participants.find(p=>p.id==='a').conditions.length,1);assert.equal(h.participants.find(p=>p.id==='c').conditions.length,0);assert.equal(h.sent.at(-1).payload.conditionImmune,true);h.dom.window.close();
});

test('12. saveId deduplication prevents damage from being applied twice',()=>{
 const h=saveHarness(),event={id:'evt12a',payload:{saveId:'dedup',actionId:'dedup-action',targets:['b'],ability:'DEX',dc:30,source:'Dedup',components:[{amount:5,type:'force'}]}};
 h.authority.enqueue('samoth',event);h.manual(1);const hp=h.participants.find(p=>p.id==='b').hp;
 h.authority.enqueue('samoth',{...event,id:'evt12b'});assert.equal(h.participants.find(p=>p.id==='b').hp,hp);assert.equal(h.sent.filter(x=>x.payload.actionId==='dedup-action').length,2);h.dom.window.close();
});

function clientHarness(){
 const dom=new JSDOM('<!doctype html><body><section id="rpg-target-dock"><div class="rpg-target-dock-head"><span>CIBLE ENCOUNTER</span><button data-rpg-target-toggle></button></div><div data-rpg-target-empty></div><aside class="rpg-target-active"></aside><div><button data-target-id="a"></button><button data-target-id="b"></button><button data-target-id="c"></button></div></section><p class="rpg-connect-message"></p></body>',{url:'https://companion.test/',runScripts:'outside-only'});
 const listeners=[],events=[],targets=[{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}];let primary=targets[0];
 dom.window.crypto.randomUUID=()=> 'action-uuid';
 dom.window.CompanionAPI={getCharacter:()=>({id:'samoth',name:'Samoth'}),subscribe:fn=>listeners.push(fn),emitLocal:(type,payload,eventId)=>{const e={id:eventId||type,type,payload:payload||{}};events.push(e);for(const fn of [...listeners])fn(e);return e}};
 dom.window.RPGConnect={getStatus:()=>({connected:true,target:primary}),getTargets:()=>targets,selectTarget:id=>{primary=targets.find(t=>t.id===id)||null;return !!primary},requestSave:()=>true};
 dom.window.eval(readFileSync(new URL('../Samoth/rpg-multi-target.js',import.meta.url),'utf8'));
 return{dom,events,listeners,targets};
}

test('13. client multi selection sends one logical save event with targets[]',()=>{
 const h=clientHarness();h.dom.window.RPGConnect.prepareTargets({targetMode:'multi'});h.dom.window.RPGConnect.selectTargets(['a','b','c']);h.dom.window.RPGConnect.requestSave({ability:'DEX',dc:16,source:'Vortex',targetMode:'multi',damage:12});
 const saves=h.events.filter(e=>e.type==='save:request');assert.equal(saves.length,1);assert.equal(saves[0].payload.targets.length,3);assert.equal(saves[0].payload.actionId,'action-uuid');h.dom.window.close();
});

test('14. maxTargets caps the selected target set',()=>{
 const h=clientHarness();h.dom.window.RPGConnect.prepareTargets({targetMode:'multi',maxTargets:2});h.dom.window.RPGConnect.selectTargets(['a','b','c']);assert.equal(Array.from(h.dom.window.RPGConnect.getSelectedTargets(),x=>x.id).join(','),'a,b');h.dom.window.close();
});

test('15. network undo carries the logical actionId instead of target-scoped ids',async()=>{
 const h=clientHarness();h.dom.window.RPGConnect.prepareTargets({targetMode:'multi'});h.dom.window.RPGConnect.selectTargets(['a','b']);h.dom.window.RPGConnect.requestSave({ability:'DEX',dc:16,source:'Vortex',targetMode:'multi',damage:12,actionId:'logical-1'});
 h.dom.window.CompanionAPI.emitLocal('undo:performed',{});await new Promise(r=>setTimeout(r,0));const undo=h.events.find(e=>e.type==='action:undo-request');assert.equal(undo.payload.actionId,'logical-1');h.dom.window.close();
});

test('16. cancelling a partially resolved action removes every remaining save',()=>{
 const h=saveHarness();h.authority.enqueue('samoth',{id:'interrupt',payload:{saveId:'interrupt',actionId:'interrupt-action',targets:['a','b'],ability:'DEX',dc:18,damage:4,damageType:'force'}});
 h.manual(1);assert.equal(h.authority.pending(),1);const hp=h.participants[1].hp;
 h.authority.cancelAction('interrupt-action');assert.equal(h.authority.pending(),0);assert.equal(h.dom.window.document.querySelector('#rpgSavePopup').open,false);
 assert.equal(h.sent.at(-1).payload.cancelled,true);h.manual(1);assert.equal(h.participants[1].hp,hp);h.dom.window.close();
});


test('17. duplicate labels agree across save results and remain stable after death',()=>{
 const h=saveHarness();for(const p of h.participants.slice(0,2))Object.assign(p,{kind:'enemy',name:'Ogre des ruines',baseName:'Ogre des ruines'});
 Object.assign(h.participants[0],{hp:1,tempHp:0});
 const label=p=>h.dom.window.encounterTargetLabel(p,h.participants,x=>h.models[x.id]);
 assert.equal(label(h.participants[0]),'Ogre des ruines #1');assert.equal(label(h.participants[1]),'Ogre des ruines #2');
 assert.equal(label(h.participants[2]),'Élémentaire');
 h.authority.enqueue('samoth',{id:'duplicates',payload:{saveId:'duplicates',actionId:'duplicates',targets:['a','b'],ability:'DEX',dc:18,damage:4,damageType:'force'}});
 assert.match(h.dom.window.document.querySelector('#rpgSavePopup').textContent,/Ogre des ruines #1/);
 assert.match(h.dom.window.document.querySelector('#rpgSavePopup').textContent,/Ogre des ruines #2/);
 h.manual(1);assert.equal(h.participants[0].hp,0);assert.equal(h.sent.at(-1).payload.targetName,'Ogre des ruines #1');
 assert.equal(label(h.participants[1]),'Ogre des ruines #2');assert.match(h.dom.window.document.querySelector('.rpg-hit-question').textContent,/Ogre des ruines #2/);
 h.manual(20);assert.equal(h.sent.at(-1).payload.targetName,'Ogre des ruines #2');h.dom.window.close();
});
