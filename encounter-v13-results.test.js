import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const source=readFileSync(new URL('./encounter-v13-results.js',import.meta.url),'utf8');
function setup(){
 const dom=new JSDOM('<div id="actionPopup"><span class="eyebrow"></span><strong id="actionPopupTitle"></strong><p id="actionPopupText"></p></div>',{runScripts:'outside-only'});
 dom.window.showActionPopup=function(){throw Error('legacy popup called')};
 dom.window.eval(source);
 const box=dom.window.document.getElementById('actionPopup');
 const close=box.querySelector('.v13-result-close');
 return {dom,box,close,show:(...args)=>dom.window.showActionPopup(...args)};
}
test('damage is an announced amount, not automatically HP removed',()=>{
 const {box,show}=setup();
 show('18 dégâts de feu','Souffle');
 assert.equal(box.querySelector('.v13-result-total').textContent,'18');
 assert.match(box.querySelector('.v13-result-detail').textContent,/vérifier son application/);
 assert.doesNotMatch(box.textContent,/PV retirés/);
});
test('healing and conditions are visually distinct',()=>{
 const {box,close,show}=setup();
 show('12 soins','Guérison');assert.equal(box.dataset.resultKind,'heal');
 close.click();show('À terre si échec','Onde');assert.equal(box.dataset.resultKind,'condition');
});
test('results persist until voluntary close, including successive results',()=>{
 const {box,close,show}=setup();
 show('Jet total : 21','Attaque');show('8 dégâts de feu','Brûlure');
 assert.match(box.textContent,/21/);
 assert.match(box.textContent,/\+1 résultat/);
 close.click();assert.match(box.textContent,/8 dégâts/);
 close.click();assert.equal(box.classList.contains('show'),false);
});
test('clicking inner content does not dismiss results',()=>{
 const {box,show}=setup();show('Jet total : 17');
 box.querySelector('#actionPopupText').click();
 assert.equal(box.classList.contains('show'),true);
});
test('advantage, critical, save and mixed damage text is retained',()=>{
 for(const value of ['Avantage : 18 / 12, total 24','Critique : 2d8+4 = 17','Sauvegarde DEX DD 15 : 19','8 feu + 5 froid']){
  const {box,show}=setup();show(value);assert.equal(box.querySelector('#actionPopupText').textContent,value);
 }
});

test('structured attack shows roll, target AC, hit and damage separately',()=>{
 const {box,show}=setup();
 show('Orc — Hache à deux mains → Kobe Kozzo : d20 17 +5 = 22 vs CA 15 → TOUCHÉ · 13 dégâts (13 tranchants [10 + 3])','Hache à deux mains');
 assert.equal(box.querySelector('.v131-actors').textContent,'Orc attaque Kobe Kozzo');
 assert.equal(box.querySelector('.v131-attack strong').textContent,'22');
 assert.equal(box.querySelector('.v131-outcome').textContent,'TOUCHÉ');
 assert.equal(box.querySelector('.v13-result-total').textContent,'13');
 assert.equal(box.querySelector('#actionPopupText').hidden,true);
});
test('unrecognized roll retains original wording',()=>{
 const {box,show}=setup();show('Jet total : 18','Test');
 assert.equal(box.querySelector('#actionPopupText').hidden,false);
 assert.equal(box.querySelector('.v131-summary').textContent,'');
});

test('Table libre enemy rolls are labelled as proposed, never as resolved hits',()=>{
 const {box,show}=setup();
 show({freeEnemy:true,actor:'Mage',ability:'Trait de feu',text:'Mage lance Trait de feu',note:'Sur touche : condition à arbitrer',
   rolls:[{label:'Trait de feu',total:19,detail:'d20 13 +6',damage:12,damageDetail:'2d10 feu'}],save:null,effect:null},'Trait de feu');
 assert.equal(box.dataset.resultKind,'enemy-roll');
 assert.equal(box.querySelector('.v13-free-row strong').textContent,'19');
 assert.equal(box.querySelector('.v131-free-attack .v131-free-damage strong').textContent,'12');
 assert.match(box.querySelector('.v131-free-damage .v131-free-caption').textContent,/DÉGÂTS POTENTIELS/);
 assert.match(box.querySelector('.v131-free-damage small').textContent,/2d10 feu/);
 assert.match(box.querySelector('.v13-result-detail').textContent,/aucun Companion modifié/);
 assert.doesNotMatch(box.textContent,/TOUCHÉ|RATÉ|contre CA/);
});

test('Mode Libre: attack roll and potential damage are separate high-contrast figures',()=>{
 const {box,show}=setup();
 show({freeEnemy:true,actor:'Fausse hydre',ability:'Morsure',rolls:[{label:'Morsure',total:20,detail:'d20 11 +9',damage:9,damageDetail:'9 perforants [2+2+5]'}],note:'Indication uniquement'},'Morsure');
 const figures=box.querySelectorAll('.v131-free-attack .v131-free-figure');
 assert.equal(figures.length,2);
 assert.equal(figures[0].querySelector('strong').textContent,'20');
 assert.equal(figures[1].querySelector('strong').textContent,'9');
 assert.match(figures[1].className,/v131-free-damage/);
 assert.match(box.querySelector('.v13-result-detail').textContent,/aucun Companion modifié/);
});
test('Mode Libre: save DC and potential damages are displayed without auto-resolution',()=>{
 const {box,show}=setup();
 show({freeEnemy:true,actor:'Dragon',ability:'Souffle',rolls:[],save:{ability:'DEX',dc:17},effect:{label:'Dégâts potentiels',total:37,detail:'10d6 feu'},note:''},'Souffle');
 assert.equal(box.querySelector('.v131-free-save strong').textContent,'DD 17');
 assert.equal(box.querySelector('.v131-free-effect .v131-free-damage strong').textContent,'37');
 assert.doesNotMatch(box.textContent,/TOUCHÉ|RATÉ/);
});
test('Mode Libre: potential healing is green-labelled and separate from damage',()=>{
 const {box,show}=setup();
 show({freeEnemy:true,actor:'Clerc',ability:'Soin',rolls:[],effect:{label:'Soins potentiels',total:18,detail:'3d8+5'},note:''},'Soin');
 assert.equal(box.querySelector('.v131-free-heal strong').textContent,'18');
 assert.equal(box.querySelectorAll('.v131-free-damage').length,0);
 assert.match(box.querySelector('.v131-free-heal .v131-free-caption').textContent,/SOINS POTENTIELS/);
});
test('Mode Libre: multiple attacks keep each damage associated with its own roll',()=>{
 const {box,show}=setup();
 show({freeEnemy:true,actor:'Hydre',ability:'Multiattaque',rolls:[{label:'Morsure 1/2',total:17,detail:'d20 10 +7',damage:8,damageDetail:'perforants'},{label:'Morsure 2/2',total:24,detail:'d20 17 +7',damage:13,damageDetail:'perforants'}],note:''},'Multiattaque');
 const rows=box.querySelectorAll('.v131-free-attack');
 assert.equal(rows.length,2);
 assert.equal(rows[0].querySelector('.v131-free-damage strong').textContent,'8');
 assert.equal(rows[1].querySelector('.v131-free-damage strong').textContent,'13');
});
