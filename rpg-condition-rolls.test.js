import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('./rpg-condition-rolls.js',import.meta.url),'utf8'),context);
const {penalty}=context.EncounterConditionRolls;
test('Perturbations synaptiques affects only attack, ability and concentration rolls',()=>{
 const conditions=[{name:'Perturbations synaptiques'}];
 for(const kind of ['attack','ability','concentration'])assert.equal(penalty(conditions,kind,()=>4).amount,4);
 for(const kind of ['save','initiative','damage'])assert.equal(penalty(conditions,kind,()=>{throw Error('unwanted die')}).amount,0);
 assert.equal(penalty([{name:'Aveuglé'}],'attack',()=>4).amount,0);
 assert.equal(penalty([{name:'Perturbations synaptiques'},{name:'Perturbations synaptiques'}],'attack',()=>4).amount,4);
});
test('manual saving throws match Encounter network condition rules',()=>{
 const rules=context.EncounterConditionRolls.saveRules;
 assert.equal(rules([{name:'Entravé'}],'DEX').mode,'dis');
 assert.equal(rules([{name:'Entravé'}],'DEX','adv').mode,'normal');
 assert.equal(rules([{name:'Entravé'}],'CON').mode,'normal');
 for(const name of ['Étourdi','Paralysé','Inconscient'])assert.equal(rules([{name}],'FOR').autoFail,true);
 assert.equal(rules([{name:'Paralysé'}],'CON').autoFail,false);
 assert.equal(rules([{name:'Perturbations synaptiques'}],'DEX').mode,'normal');
});
