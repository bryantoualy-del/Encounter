import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import WebSocket from 'ws';
process.env.RPG_CONNECT_GM_KEY='test-key-abcdefghijklmnopqrstuvwxyz';process.env.PORT='0';
const {server,wss}=await import('./rpg-connect-server.js');await new Promise(r=>server.listening?r():server.once('listening',r));
const url=`ws://127.0.0.1:${server.address().port}`;
const until=fn=>new Promise((resolve,reject)=>{let origin=new Error('wait at').stack;let start=Date.now();const check=()=>fn()?resolve():Date.now()-start>2000?reject(Error('timeout '+origin)):setTimeout(check,10);check()});
const wait=(ws,type)=>new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('timeout '+type)),2000);let fn=data=>{let m=JSON.parse(String(data));if(m.type!==type)return;clearTimeout(timer);ws.off('message',fn);resolve(m)};ws.on('message',fn)});
const waitCommand=(ws,eventType)=>new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('timeout command '+eventType)),2000);let fn=data=>{let m=JSON.parse(String(data));if(m.type!=='command'||m.event?.type!==eventType)return;clearTimeout(timer);ws.off('message',fn);resolve(m.event)};ws.on('message',fn)});
const waitUndo=ws=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('timeout undo reply')),2000);const fn=data=>{const m=JSON.parse(String(data));if(m.type!=='command'||m.event?.type!=='message:gm'||!m.event.payload?.text?.startsWith('Annulation réseau ignorée'))return;clearTimeout(timer);ws.off('message',fn);resolve(m.event)};ws.on('message',fn)});
const waitSession=(ws,phase)=>new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('timeout session '+phase)),2000);let fn=data=>{let m=JSON.parse(String(data));if(m.type!=='command'||m.event?.type!=='message:gm'||m.event?.payload?.session?.phase!==phase)return;clearTimeout(timer);ws.off('message',fn);resolve(m.event.payload.session)};ws.on('message',fn)});
const send=(ws,m)=>ws.send(JSON.stringify({v:1,protocolVersion:1,clientCapabilities:['event-receipts','initiative-ack','attack-id-ledger','authoritative-save-v1','state-revisions','condition-revisions'],...m}));
test('ENCOUNTER applique les dégâts autoritaires et synchronise les conséquences sans double mutation',async()=>{
 const dom=new JSDOM('<!doctype html><body><header class="topbar"></header></body>',{url:'https://biggie-mj.github.io/Table-de-jeu/',runScripts:'outside-only'});
 let player=null;
 try{
 dom.window.WebSocket=WebSocket;let copied='';Object.defineProperty(dom.window.navigator,'clipboard',{value:{writeText:async value=>{copied=String(value)}}});Object.defineProperty(dom.window.crypto,'randomUUID',{value:()=>Math.random().toString(36).slice(2)});
 dom.window.eval(`window.state={ui:{mode:'prep'},encounter:{participants:[{id:'p1',name:'Samoth',kind:'player',hp:72,maxHp:72,tempHp:0,ac:14,initiative:0},{id:'p2',name:'Nans',kind:'player',hp:95,maxHp:95,tempHp:0,ac:16,initiative:7},{id:'e1',name:'Gobelin A',kind:'enemy',hp:30,maxHp:30,tempHp:0,ac:13,initiative:5,conditions:[{id:'restrained-1',name:'Entravé'}]},{id:'e2',name:'Gobelin B',kind:'enemy',hp:30,maxHp:30,tempHp:0,ac:13,initiative:4,conditions:[]}],log:[],round:1,currentTurn:0,selectedId:null}};window.localDamage=0;window.__rolls=[];window.saveState=()=>{};window.render=()=>{};window.log=()=>{};window.actionLog=()=>{};window.checkpoint=()=>{};window.sortedParticipants=()=>[...state.encounter.participants].sort((a,b)=>b.initiative-a.initiative);window.activeParticipant=()=>sortedParticipants()[state.encounter.currentTurn]||null;window.processStartTurn=()=>{};window.setMode=mode=>{state.ui.mode=mode};window.modelFor=p=>p?.kind==='enemy'?{type:'humanoïde',saveMods:{DEX:2,FOR:1},abilities:{DEX:14,FOR:12}}:null;window.effectiveAc=p=>p.ac;window.isLair=()=>false;window.conditionImmune=()=>false;window.addConditionMany=(ids,data)=>{for(const id of ids){const p=state.encounter.participants.find(x=>x.id===id);if(p){p.conditions=p.conditions||[];p.conditions.push({id:'test-'+p.conditions.length,...data})}}};window.rollD20=()=>({roll:(window.__rolls.shift()??10)});window.applyDamageMany=(ids,amount)=>{localDamage+=amount};window.applyHealMany=()=>{};window.applyDamageDirect=(target,amount)=>{if(target?.kind==='enemy'){target.hp=Math.max(0,target.hp-amount);return{amount}}localDamage+=amount;const absorbed=Math.min(target.tempHp||0,amount);target.tempHp=(target.tempHp||0)-absorbed;target.hp=Math.max(0,target.hp-(amount-absorbed));return{amount}};window.applyHealDirect=()=>{};window.removeParticipant=id=>{state.encounter.participants=state.encounter.participants.filter(p=>p.id!==id)};window.actualAdvanceTurn=()=>{}`);
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
 dom.window.eval(readFileSync(new URL('./rpg-target-names.js',import.meta.url),'utf8'));
 dom.window.eval(readFileSync(new URL('./rpg-condition-rolls.js',import.meta.url),'utf8'));
 dom.window.rollDie=()=>4;
 dom.window.eval(readFileSync(new URL('./rpg-save-authority.js',import.meta.url),'utf8'));
 dom.window.eval(readFileSync(new URL('./rpg-health-authority.js',import.meta.url),'utf8'));
 dom.window.eval(readFileSync(new URL('./rpg-summon-authority.js',import.meta.url),'utf8'));
 dom.window.eval('function resolveTargetSelection(){};function renderDetail(){};function useAbility(){};function abilityCard(){return ""}');
 dom.window.eval(readFileSync(new URL('./rpg-participant-profiles.js',import.meta.url),'utf8'));dom.window.eval(readFileSync(new URL('./rpg-diversion-authority.js',import.meta.url),'utf8'));dom.window.eval(readFileSync(new URL('./rpg-reaction-authority.js',import.meta.url),'utf8'));
 dom.window.eval(readFileSync(new URL('./rpg-combat-effects.js',import.meta.url),'utf8'));dom.window.eval(readFileSync(new URL('./rpg-samoth-authority.js',import.meta.url),'utf8'));
 dom.window.eval(readFileSync(new URL('./rpg-zephyr-authority.js',import.meta.url),'utf8'));
 dom.window.eval(readFileSync(new URL('./rpg-connect-mj.js',import.meta.url),'utf8'));
 dom.window.document.querySelector('#rpgMjEndpoint').value=url;dom.window.document.querySelector('#rpgMjKey').value=process.env.RPG_CONNECT_GM_KEY;dom.window.document.querySelector('#rpgMjConnect').click();await until(()=>dom.window.RPGConnectMJ.getStatus().connected);const room=dom.window.RPGConnectMJ.getStatus().room;
 dom.window.document.querySelector('[data-invite="samoth"]').click();await until(()=>!!dom.window.document.querySelector('[data-copy="samoth"]'));dom.window.document.querySelector('[data-copy="samoth"]').click();await until(()=>copied.startsWith('RPGCONNECT|'));
 const token=copied.split('|').at(-1);
 player=new WebSocket(url);await new Promise(r=>player.once('open',r));let joined=wait(player,'welcome');send(player,{type:'hello',role:'player',room,characterId:'samoth',token});await joined;
 dom.window.RPGConnectMJ.bind('samoth','p1');dom.window.RPGConnectMJ.bind('nans','p2');send(player,{type:'state',state:{characterId:'samoth',hp:{current:60,max:72,temp:4},ac:15}});
 await until(()=>dom.window.eval('state.encounter.participants[0].hp')===60);
 let prepState=waitSession(player,'preparation'),initiativeCommand=waitCommand(player,'initiative:request');assert.equal(dom.window.RPGConnectMJ.prepareFight(),true);const prep=await prepState;assert.equal(prep.resetCombat,true);const request=await initiativeCommand;assert.equal(request.type,'initiative:request');send(player,{type:'event',event:{id:'samoth-init-1',type:'initiative:rolled',characterId:'samoth',timestamp:new Date().toISOString(),payload:{requestId:request.payload.requestId,dice:[14],chosen:14,bonus:1,total:15,mode:'normal'}}});await until(()=>dom.window.document.querySelector('[data-fight-init="samoth"]')?.value==='15');let validatedState=waitSession(player,'initiative-validated');assert.equal(dom.window.RPGConnectMJ.validateInitiative('samoth',15),true);const validated=await validatedState;assert.equal(validated.phase,'initiative-validated');assert.equal(validated.ready,true);assert.equal(dom.window.eval('state.encounter.participants[0].initiative'),15);assert.equal(dom.window.RPGConnectMJ.getStatus().fight.validated.samoth,true);assert.equal(Array.from(dom.window.RPGConnectMJ.getStatus().fight.roster).join(','),'samoth');send(player,{type:'command-ack',id:request.id,result:'applied'});
 let fightState=waitSession(player,'fight'),turnGrant=waitCommand(player,'turn:grant');assert.equal(dom.window.RPGConnectMJ.startFight(),true);const fightMsg=await fightState;assert.equal(fightMsg.phase,'fight');assert.equal(fightMsg.activeCharacterId,'samoth');assert.equal((await turnGrant).type,'turn:grant');assert.equal(dom.window.eval('state.ui.mode'),'combat');
 let command=waitCommand(player,'hp:damage');dom.window.eval("applyDamageMany(['p1'],8,'froid')");const authoritativeDamage=await command;assert.equal(authoritativeDamage.payload.amount,8);assert.equal(authoritativeDamage.payload.options.authoritative,true);
 assert.equal(dom.window.eval('localDamage'),8);assert.equal(dom.window.eval('state.encounter.participants[0].hp'),56);assert.equal(dom.window.eval('state.encounter.participants[0].tempHp'),0);send(player,{type:'event',event:{id:'samoth-authoritative-echo',type:'hp:changed',characterId:'samoth',payload:{before:60,after:56,authoritative:true}}});await new Promise(r=>setTimeout(r,20));assert.equal(dom.window.eval('state.encounter.participants[0].hp'),56);

 dom.window.eval("window.__rolls=[18,3]");
 let saveResultWait=waitCommand(player,'save:result');
 send(player,{type:'event',event:{id:'samoth-save-dis-1',type:'save:request',characterId:'samoth',timestamp:new Date().toISOString(),payload:{targetId:'e1',ability:'DEX',dc:12,source:'Vortex de test',damage:8,damageType:'froid',condition:'Aveuglé'}}});
 await until(()=>dom.window.document.querySelector('[data-save-auto]'));dom.window.document.querySelector('[data-save-auto]').click();
 const saveDis=await saveResultWait;
 assert.equal(saveDis.payload.mode,'dis');assert.equal(saveDis.payload.automaticFailure,false);assert.deepEqual(saveDis.payload.dice,[18,3]);assert.equal(saveDis.payload.total,5);assert.equal(saveDis.payload.success,false);assert.equal(saveDis.payload.effectiveDamage,8);assert.equal(saveDis.payload.conditionApplied,'Aveuglé');assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp"),22);
 send(player,{type:'command-ack',id:saveDis.id,result:'applied'});

 dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').conditions=[{id:'par-1',name:'Paralysé'}];window.__rolls=[20,20]");
 saveResultWait=waitCommand(player,'save:result');
 send(player,{type:'event',event:{id:'samoth-save-auto-1',type:'save:request',characterId:'samoth',timestamp:new Date().toISOString(),payload:{targetId:'e1',ability:'DEX',dc:1,source:'Test paralysie',damage:0}}});
 await until(()=>dom.window.document.querySelector('#rpgSavePopup').open);dom.window.document.querySelector('[data-save-auto]').click();
 const saveAuto=await saveResultWait;
 assert.equal(saveAuto.payload.mode,'auto-fail');assert.equal(saveAuto.payload.automaticFailure,true);assert.deepEqual(saveAuto.payload.dice,[]);assert.equal(saveAuto.payload.total,0);assert.equal(saveAuto.payload.success,false);
 send(player,{type:'command-ack',id:saveAuto.id,result:'applied'});

 // Attack IDs keep their original target even if a later payload names another target.
 send(player,{type:'event',event:{id:'samoth-roll-a',type:'attack:rolled',characterId:'samoth',timestamp:new Date().toISOString(),payload:{attackId:'attack-a',targetId:'e1',target:{id:'e1',name:'Gobelin A'},roll:19,total:19}}});
 send(player,{type:'event',event:{id:'pending-a',type:'attack:pending-hit',characterId:'samoth',payload:{attackId:'attack-a',targetId:'e1'}}});
 await until(()=>dom.window.document.querySelector('[data-popup-hit]'));{const decisionWait=waitCommand(player,'attack:decision');dom.window.document.querySelector('[data-popup-hit]').click();const decision=await decisionWait;send(player,{type:'command-ack',id:decision.id,result:'applied'});}
 send(player,{type:'event',event:{id:'samoth-dmg-a',type:'attack:damage',characterId:'samoth',timestamp:new Date().toISOString(),payload:{attackId:'attack-a',targetId:'e2',amount:5,components:[{amount:5,type:'froid'}]}}});
 await until(()=>dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp")===17);
 assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp"),30);

 send(player,{type:'event',event:{id:'samoth-roll-b',type:'attack:rolled',characterId:'samoth',timestamp:new Date().toISOString(),payload:{attackId:'attack-b',targetId:'e2',target:{id:'e2',name:'Gobelin B'},roll:21,total:21}}});
 send(player,{type:'event',event:{id:'pending-b',type:'attack:pending-hit',characterId:'samoth',payload:{attackId:'attack-b',targetId:'e2'}}});
 await until(()=>!dom.window.document.querySelector('#rpgHitPopup').hidden);{const decisionWait=waitCommand(player,'attack:decision');dom.window.document.querySelector('[data-popup-hit]').click();const decision=await decisionWait;send(player,{type:'command-ack',id:decision.id,result:'applied'});}
 send(player,{type:'event',event:{id:'samoth-dmg-b',type:'attack:damage',characterId:'samoth',timestamp:new Date().toISOString(),payload:{attackId:'attack-b',targetId:'e1',amount:6,components:[{amount:6,type:'force'}]}}});
 await until(()=>dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp")===24);
 assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp"),17);

 // A native on-hit save joins the validated attack transaction instead of colliding with its damage.
 const riderEvent={id:'on-hit-save',type:'save:request',characterId:'samoth',payload:{actionId:'attack-b',attackId:'attack-b',saveId:'on-hit-save',targetId:'e1',ability:'DEX',dc:1,source:'Native on-hit',damage:0}};
 send(player,{type:'event',event:riderEvent});await until(()=>dom.window.document.querySelector('#rpgSavePopup').open);
 const riderResult=waitCommand(player,'save:result');dom.window.document.querySelector('[data-save-die]').value='20';dom.window.document.querySelector('[data-save-manual]').click();const resolvedRider=await riderResult;
 assert.equal(resolvedRider.payload.targetId,'e2');assert.equal(resolvedRider.payload.error,undefined);assert.equal(dom.window.eval("state.encounter.rpgActionTransactions['attack-b'].targets.e2.hp"),30);
 const replayRider=waitCommand(player,'save:result');send(player,{type:'event',event:{...riderEvent,id:'on-hit-save-replay'}});assert.equal((await replayRider).payload.resolutionId,resolvedRider.payload.resolutionId);assert.equal(dom.window.document.querySelector('#rpgSavePopup').open,false);
 // Two validated attacks share a logical action; unsafe legacy undo is rejected without the coordinator.
 dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp=20;state.encounter.participants.find(p=>p.id==='e2').hp=20");
 for(const [attackId,targetId,amount] of [['multi-atk-1','e1',3],['multi-atk-2','e2',4]]){
  send(player,{type:'event',event:{id:attackId+'-roll',type:'attack:rolled',characterId:'samoth',payload:{attackId,actionId:'multi-attack-action',targetId,roll:20,total:20}}});
  send(player,{type:'event',event:{id:attackId+'-pending',type:'attack:pending-hit',characterId:'samoth',payload:{attackId,actionId:'multi-attack-action',targetId}}});
  await until(()=>!!dom.window.document.querySelector(`[data-popup-hit="${attackId}"]:not(:disabled)`));assert.match(dom.window.document.querySelector('#rpgHitPopup').textContent,new RegExp(targetId==='e1'?'Gobelin A':'Gobelin B'));assert.match(dom.window.document.querySelector('#rpgHitPopup').textContent,/CA 13/);const decisionWait=waitCommand(player,'attack:decision');dom.window.document.querySelector(`[data-popup-hit="${attackId}"]`).click();const decision=await decisionWait;assert.equal(decision.payload.attackId,attackId);send(player,{type:'command-ack',id:decision.id,result:'applied'});
  send(player,{type:'event',event:{id:attackId+'-damage',type:'attack:damage',characterId:'samoth',payload:{attackId,actionId:'multi-attack-action',targetId,amount,components:[{amount,type:'force'}]}}});
 }
 await until(()=>dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp")===17&&dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp")===16);
 await until(()=>dom.window.document.querySelector('#rpgHitPopup').hidden);
 {const undoWait=waitUndo(player);send(player,{type:'event',event:{id:'multi-attack-undo',type:'action:undo-request',characterId:'samoth',payload:{actionId:'multi-attack-action'}}});const undo=await undoWait;assert.match(undo.payload.text,/ignorée/);}
 assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp"),17);assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp"),16);
 dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp=20;state.encounter.participants.find(p=>p.id==='e2').hp=20");

 // A repeated roll with a changed target cannot move an existing attack lock.
 send(player,{type:'event',event:{id:'immutable-roll',type:'attack:rolled',characterId:'samoth',payload:{attackId:'immutable',actionId:'immutable-action',targetId:'e1',roll:20,total:20}}});
 send(player,{type:'event',event:{id:'immutable-pending',type:'attack:pending-hit',characterId:'samoth',payload:{attackId:'immutable',actionId:'immutable-action',targetId:'e1'}}});
 await until(()=>!!dom.window.document.querySelector('[data-popup-hit="immutable"]:not(:disabled)'));
 {const decisionWait=waitCommand(player,'attack:decision');dom.window.document.querySelector('[data-popup-hit="immutable"]').click();const decision=await decisionWait;send(player,{type:'command-ack',id:decision.id,result:'applied'});}
 send(player,{type:'event',event:{id:'immutable-retarget',type:'attack:rolled',characterId:'samoth',payload:{attackId:'immutable',actionId:'immutable-action',targetId:'e2',roll:20,total:20}}});
 send(player,{type:'event',event:{id:'immutable-damage',type:'attack:damage',characterId:'samoth',payload:{attackId:'immutable',actionId:'immutable-action',targetId:'e2',amount:1}}});
 await until(()=>dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').hp")===19);assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp"),20);
 {const undoWait=waitUndo(player);send(player,{type:'event',event:{id:'immutable-undo',type:'action:undo-request',characterId:'samoth',payload:{actionId:'immutable-action'}}});await undoWait;}

 // Encounter remains authoritative even if an outdated client emits an attack while incapacitated.
 dom.window.eval("state.encounter.participants.find(p=>p.id==='p1').conditions=[{id:'pc-par-1',name:'Paralysé'}]");
 send(player,{type:'event',event:{id:'samoth-blocked-roll',type:'attack:rolled',characterId:'samoth',timestamp:new Date().toISOString(),payload:{attackId:'attack-blocked',targetId:'e2',target:{id:'e2',name:'Gobelin B'},roll:25,total:25}}});
 await new Promise(resolve=>setTimeout(resolve,20));
 send(player,{type:'event',event:{id:'samoth-blocked-dmg',type:'attack:damage',characterId:'samoth',timestamp:new Date().toISOString(),payload:{attackId:'attack-blocked',targetId:'e2',amount:20,components:[{amount:20,type:'force'}]}}});
 await new Promise(resolve=>setTimeout(resolve,40));
 assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp"),20);

 // A summon is its own attack actor, including the final damage validation.
 dom.window.eval("RPGSummonAuthority.reconcile(state.encounter,'samoth',state.encounter.participants[0],[{kind:'dragon',instanceId:'actor-test',hp:50}])");
 send(player,{type:'event',event:{id:'dragon-independent-roll',type:'attack:rolled',characterId:'samoth',payload:{attackId:'dragon-independent',actor:'dragon',targetId:'e2',roll:20,total:20}}});
 send(player,{type:'event',event:{id:'dragon-independent-pending',type:'attack:pending-hit',characterId:'samoth',payload:{attackId:'dragon-independent',actor:'dragon',targetId:'e2'}}});
 await until(()=>!!dom.window.document.querySelector('[data-popup-hit="dragon-independent"]:not(:disabled)'));
 {const decisionWait=waitCommand(player,'attack:decision');dom.window.document.querySelector('[data-popup-hit="dragon-independent"]').click();const decision=await decisionWait;send(player,{type:'command-ack',id:decision.id,result:'applied'});}
 send(player,{type:'event',event:{id:'dragon-independent-damage',type:'attack:damage',characterId:'samoth',payload:{attackId:'dragon-independent',targetId:'e2',amount:1}}});
 await until(()=>dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp")===19);
 dom.window.eval("state.encounter.participants.find(p=>p.rpgSummon).conditions=[{name:'Paralysé'}];state.encounter.participants[0].conditions=[]");
 send(player,{type:'event',event:{id:'dragon-blocked-roll',type:'attack:rolled',characterId:'samoth',payload:{attackId:'dragon-blocked',actor:'dragon',targetId:'e2',roll:20,total:20}}});
 send(player,{type:'event',event:{id:'dragon-blocked-damage',type:'attack:damage',characterId:'samoth',payload:{attackId:'dragon-blocked',actor:'dragon',targetId:'e2',amount:10}}});
 await new Promise(resolve=>setTimeout(resolve,40));assert.equal(dom.window.eval("state.encounter.participants.find(p=>p.id==='e2').hp"),19);
 dom.window.eval("RPGSummonAuthority.reconcile(state.encounter,'samoth',state.encounter.participants[0],[])");

 // Multi-target save: one action, independent target results, then refusal of uncertified legacy network undo.
 dom.window.eval("state.encounter.participants.find(p=>p.id==='e1').conditions=[];state.encounter.participants.find(p=>p.id==='e2').conditions=[];state.encounter.participants.find(p=>p.id==='e1').hp=20;state.encounter.participants.find(p=>p.id==='e2').hp=20");
 const beforeMulti=dom.window.eval("state.encounter.participants.filter(p=>['e1','e2'].includes(p.id)).map(p=>({id:p.id,hp:p.hp,tempHp:p.tempHp,conditions:JSON.stringify(p.conditions)}))");
 send(player,{type:'event',event:{id:'multi-save-event',type:'save:request',characterId:'samoth',combatId:dom.window.RPGConnectMJ.getStatus().fight.requestId,timestamp:new Date().toISOString(),payload:{saveId:'multi-save',actionId:'multi-action',targetMode:'multi',targets:[{targetId:'e1'},{targetId:'e2'}],ability:'DEX',dc:15,source:'Vortex multi test',damageRollMode:'shared',components:[{amount:8,type:'froid'}],halfOnSuccess:true,condition:{name:'Entravé'}}}});
 await until(()=>dom.window.document.querySelector('#rpgSavePopup')?.open);let multiResult=waitCommand(player,'save:result');dom.window.document.querySelector('[data-save-die]').value='1';dom.window.document.querySelector('[data-save-manual]').click();const mr1=await multiResult;send(player,{type:'command-ack',id:mr1.id,result:'applied'});
 await until(()=>dom.window.document.querySelector('#rpgSavePopup')?.open);multiResult=waitCommand(player,'save:result');dom.window.document.querySelector('[data-save-die]').value='20';dom.window.document.querySelector('[data-save-manual]').click();const mr2=await multiResult;send(player,{type:'command-ack',id:mr2.id,result:'applied'});
 assert.equal(mr1.payload.actionId,'multi-action');assert.equal(mr2.payload.actionId,'multi-action');assert.notEqual(mr1.payload.targetId,mr2.payload.targetId);assert.equal(mr1.payload.rawDamage,8);assert.equal(mr2.payload.rawDamage,8);assert.equal(mr1.payload.success,false);assert.equal(mr2.payload.success,true);
 const afterMulti=dom.window.eval("state.encounter.participants.filter(p=>['e1','e2'].includes(p.id)).map(p=>p.hp)");assert.ok(afterMulti.some((hp,i)=>hp<beforeMulti[i].hp));
 send(player,{type:'event',event:{id:'stale-multi-undo',type:'action:undo-request',characterId:'samoth',combatId:'replaced-combat',payload:{actionId:'multi-action'}}});await new Promise(resolve=>setTimeout(resolve,40));
 assert.deepEqual(dom.window.eval("state.encounter.participants.filter(p=>['e1','e2'].includes(p.id)).map(p=>p.hp)"),afterMulti,'stale-combat undo cannot mutate a current action');
 const reused=waitCommand(player,'save:result');send(player,{type:'event',event:{id:'multi-reused-action',type:'save:request',characterId:'samoth',payload:{saveId:'new-save-id',actionId:'multi-action',targets:['e1','e2'],ability:'DEX',dc:15,damage:8}}});
 assert.equal((await reused).payload.cancelled,true);assert.equal(dom.window.document.querySelector('#rpgSavePopup').open,false);assert.deepEqual(dom.window.eval("state.encounter.participants.filter(p=>['e1','e2'].includes(p.id)).map(p=>p.hp)"),afterMulti);
 const undoAck=waitUndo(player);send(player,{type:'event',event:{id:'multi-undo-event',type:'action:undo-request',characterId:'samoth',combatId:dom.window.RPGConnectMJ.getStatus().fight.requestId,payload:{actionId:'multi-action'}}});const undoMsg=await undoAck;assert.match(undoMsg.payload.text,/ignorée/);
 const restored=dom.window.eval("state.encounter.participants.filter(p=>['e1','e2'].includes(p.id)).map(p=>({id:p.id,hp:p.hp,tempHp:p.tempHp,conditions:JSON.stringify(p.conditions)}))");assert.deepEqual(restored.map(p=>p.hp),afterMulti);
 assert.equal(dom.window.RPGConnectMJ.endFight(),true);assert.equal(dom.window.RPGConnectMJ.getStatus().machine.state,'END');assert.equal(dom.window.RPGConnectMJ.getStatus().fight.phase,'ended');
 assert.deepEqual(dom.window.eval("state.encounter.participants.filter(p=>['e1','e2'].includes(p.id)).map(p=>({id:p.id,hp:p.hp,tempHp:p.tempHp,conditions:JSON.stringify(p.conditions)}))"),restored);
 send(player,{type:'event',event:{id:'late-save-after-finish',type:'save:request',characterId:'samoth',payload:{saveId:'late-save',actionId:'late-action',targetId:'e1',ability:'DEX',dc:12,damage:10}}});
 await new Promise(resolve=>setTimeout(resolve,40));assert.equal(dom.window.document.querySelector('#rpgSavePopup').open,false);assert.deepEqual(dom.window.eval("state.encounter.participants.filter(p=>['e1','e2'].includes(p.id)).map(p=>p.hp)"),restored.map(p=>p.hp));
 dom.window.RPGConnectMJ.getStatus();
 }finally{
  try{dom.window.document.querySelector('#rpgMjDisconnect')?.click()}catch{}
  try{if(player&&player.readyState!==WebSocket.CLOSED)player.terminate()}catch{}
  dom.window.close();
 }
});
test.after(async()=>{for(const ws of wss.clients)ws.terminate();await new Promise(r=>server.close(r))});
