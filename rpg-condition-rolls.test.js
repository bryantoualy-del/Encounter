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

test('condition hardening uses only known context',()=>{
 const {mechanics,abilityRules}=context.EncounterConditionRolls;
 assert.equal(abilityRules([{name:'Empoisonné'}]).mode,'dis');
 assert.equal(abilityRules([{name:'Empoisonné'}],'adv').mode,'normal');
 for(const name of ['Agrippé','Entravé'])assert.equal(mechanics([{name}]).speedZero,true);
 for(const name of ['Incapacité','Étourdi','Paralysé','Inconscient'])assert.equal(mechanics([{name}]).incapacitated,true);
 assert.equal(mechanics([{name:'Effrayé'}]).attackDisadvantage,false);
 assert.equal(mechanics([{name:'Effrayé'}],{fearSourceVisible:true}).attackDisadvantage,true);
 assert.equal(mechanics([{name:'À terre'}]).attacksAgainstAdvantage,false);
 assert.equal(mechanics([{name:'À terre'}],{distanceFeet:5}).attacksAgainstAdvantage,true);
 assert.equal(mechanics([{name:'Paralysé'}]).autoCritical,false);
 assert.equal(mechanics([{name:'Paralysé'}],{distanceFeet:5}).autoCritical,true);
});

test('central registry includes all fifteen standard icons',()=>{const data=JSON.parse(readFileSync(new URL('../RPG-Connect/assets/icon-data/condition-icons.json',import.meta.url),'utf8'));for(const name of ['aveugle','charme','assourdi','effraye','empoisonne','entrave','etourdi','inconscient','invisible','paralyse','petrifie','a_terre','agrippe','incapacite','epuisement'])assert.ok(data.icons['conditions/'+name],name)});

test('petrified is incapacitating and fails STR/DEX automatically',()=>{const r=context.EncounterConditionRolls;assert.equal(r.mechanics([{name:'Pétrifié'}]).incapacitated,true);assert.equal(r.mechanics([{name:'Pétrifié'}]).attacksAgainstAdvantage,true);assert.equal(r.saveRules([{name:'Pétrifié'}],'DEX').autoFail,true)});

test('Nans Reckless Attack exposes temporary incoming advantage only while active',()=>{
 const mechanics=context.EncounterConditionRolls.mechanics;
 assert.equal(mechanics([{name:'attaque téméraire',origin:'rpg-local'}]).attacksAgainstAdvantage,true);
 assert.equal(mechanics([{name:'attaque téméraire',origin:'rpg-local'}, {name:'À terre'}]).attacksAgainstAdvantage,true);
 assert.equal(mechanics([{name:'attaque téméraire',origin:'rpg-combat-effect'}]).attacksAgainstAdvantage,false,'only Nans native status may grant this effect');
 assert.equal(mechanics([]).attacksAgainstAdvantage,false,'expires when Companion clears the state');
});
