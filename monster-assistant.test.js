import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const ctx={};vm.runInNewContext(readFileSync(new URL('./monster-assistant.js',import.meta.url),'utf8'),ctx);const api=ctx.MonsterAssistant;
test('wolf proposal is untrusted, nonmagical, and carries a hit-gated structured save',()=>{
 const m=api.propose('Loup\nCA 14\nPV 37\nMorsure. Attaque au corps à corps : +5 au toucher. 2d6+3 dégâts perforants. JdS de Force DD 13 : à terre.','2014'),a=m.actions[0];
 assert.equal(m.rulesEdition,'2014');assert.equal(a.isSpell,false);assert.equal(a.onHitSave.dc,13);assert.equal(api.assess(a).status,'information manquante');
 a.assistantMeta={type:'hitSave',reviewed:true,trigger:'Sur touche',targets:'1 cible'};assert.equal(api.assess(a).status,'décision MJ nécessaire');a.onHitSave.conditionOnFailure='';assert.equal(api.assess(a).status,'automatisée');
});
test('spell levels must be explicit; changing edition never converts rules',()=>{
 const m=api.propose('Mage\nCA 12\nPV 40\nBoule de feu. Sort niveau 3. JdS de Dextérité DD 14. 8d6 dégâts de feu.','2024'),a=m.actions[0];assert.equal(a.isSpell,true);assert.equal(a.spellLevel,3);assert.equal(a.save,'DEX');assert.equal(m.rulesEdition,'2024');a.spellLevel=null;assert.ok(api.assess(a).missing.includes('vrai sort et niveau 0–9'));
});
test('textual saves, unresolved costs and durations cannot be labeled automated',()=>{
 const a={name:'Vision',kind:'text',detail:'JdS décrit en texte',assistantMeta:{type:'text',reviewed:true,trigger:'Action',targets:'1',duration:'1 min',end:'JdS fin de tour'}};const report=api.assess(a);assert.equal(report.status,'information manquante');assert.equal(report.connectedSave,false);assert.ok(report.missing.some(x=>x.includes('non connecté')));
 a.detail='Vision';assert.equal(api.assess(a).status,'décision MJ nécessaire');
});
test('empty modifiers, malformed dice and contradictory magic remain visible',()=>{
 const a={name:'Morsure',kind:'attack',bonus:null,damage:'2d6+evil',isSpell:true,assistantMeta:{type:'attack',reviewed:true,trigger:'Touche',targets:'1'}};const q=api.assess(a);assert.ok(q.missing.includes('bonus de toucher'));assert.ok(q.missing.includes('formule de dégâts'));assert.ok(q.manual.includes('Classification magique à corriger'));
});
