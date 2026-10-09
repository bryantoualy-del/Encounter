/* Validation et transaction de réaction avec un bus local simulé. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url)),ctx={};
for(const file of ['rpg-kentaro-armor-rules.js','rpg-reaction-authority.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),ctx);
const R=ctx.RPGKentaroArmorRules;
const window={status:'granted',context:{kind:R.OPTION}};
function result(mode,die){return{optionId:R.OPTION,success:die>=4,consumed:true,hexArmorRoll:die,hexArmorMode:mode,hexArmorOutcome:die>=4?'miss':'hit',manual:mode==='manual'}}
for(const mode of ['automatic','manual'])for(let die=1;die<=6;die++)test(mode+' '+die+' : même arbitrage pour le dé virtuel et physique',()=>{const p=result(mode,die);assert.equal(R.isValid(window,p),true);assert.equal(R.interpret(p).avoided,die>=4);assert.equal(R.interpret(p).spent,true);assert.equal(R.isValid(window,{...p,success:die<4}),false)});
test('Passer conserve la réaction',()=>{const p={optionId:R.OPTION,success:false,declined:true,consumed:false};assert.equal(R.isValid(window,p),true);assert.equal(R.interpret(p).spent,false)});
for(const die of [null,undefined,'',0,-1,7,1.5,'4','5.0',NaN])test('d6 invalide : '+String(die),()=>assert.equal(R.isValid(window,result('manual',die)),false));
test('Passer dans la fenêtre générique conserve la réaction et débloque les dégâts',()=>{assert.equal(R.isValid({...window,status:'closed'},{declined:true}),true);assert.equal(R.interpret({declined:true}).spent,false)});
test('Aucun résultat accepté avant autorisation MJ',()=>assert.equal(R.isValid({...window,status:'awaiting-mj'},result('manual',5)),false));
function simulate(mode,die){
 const ledger={},sent=[],resumed=[];let saves=0;
 const auth=ctx.createRPGReactionAuthority({ledger:()=>ledger,combatId:()=> 'fight-1',persist:()=>saves++,log:()=>{},send:(who,type,payload)=>sent.push({who,type,payload}),available:()=>true,validateResolution:(w,q)=>R.isValid(w,q),resume:(w,q)=>resumed.push(q)});
 const packet={reactionId:'rx-1',combatId:'fight-1',optionId:R.OPTION,...result(mode,die)};
 auth.open({reactionId:'rx-1',combatId:'fight-1',eligible:['kentaro'],context:{kind:R.OPTION,attackerId:'enemy1'}});
 auth.handle({type:'reaction:options',characterId:'kentaro',payload:{reactionId:'rx-1',combatId:'fight-1',options:[{id:R.OPTION,label:'Armure de Maléfice'}]}});
 auth.handle({type:'reaction:claim',characterId:'kentaro',payload:{reactionId:'rx-1',combatId:'fight-1',optionId:R.OPTION}});
 assert.equal(ledger['rx-1'].status,'granted');
 assert.equal(auth.handle({type:'reaction:resolve',characterId:'kentaro',payload:{...packet,success:die<4}}),false);
 assert.equal(ledger['rx-1'].status,'granted');
 assert.equal(auth.handle({type:'reaction:resolve',characterId:'kentaro',payload:packet}),true);
 assert.equal(ledger['rx-1'].status,'closed');
 // Même résultat renvoyé après reconnexion, sans deuxième application d'effets.
 assert.equal(auth.handle({type:'reaction:resolve',characterId:'kentaro',payload:packet}),true);
 assert.equal(resumed.length,1);assert.equal(sent.filter(x=>x.type==='reaction:grant').length,1);
 assert.equal(sent.filter(x=>x.type==='reaction:closed').length>=1,true);
 return resumed[0];
}
for(const mode of ['automatic','manual'])for(const die of [1,3,4,6])test('transaction bus local + idempotence '+mode+' '+die,()=>{const outcome=simulate(mode,die);assert.equal(R.interpret(outcome).avoided,die>=4)});
test('Fenêtre de réaction : aucun jet ne consomme avant confirmation',()=>{const ledger={};const auth=ctx.createRPGReactionAuthority({ledger:()=>ledger,combatId:()=> 'f',persist:()=>{},log:()=>{},send:()=>{},available:()=>true});auth.open({reactionId:'a',combatId:'f',eligible:['kentaro'],context:{kind:R.OPTION}});assert.equal(ledger.a.status,'open');assert.equal(ledger.a.claim,undefined)});
