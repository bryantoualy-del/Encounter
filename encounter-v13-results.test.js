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
