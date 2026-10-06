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
