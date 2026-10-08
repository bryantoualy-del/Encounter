import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const sandbox={};vm.runInNewContext(readFileSync(new URL('./rpg-player-save-authority.js',import.meta.url),'utf8'),sandbox);
const A=sandbox.RPGPlayerSaveAuthority;
test('hostile saves use known condition rules and preserve half damage',()=>{
 assert.equal(A.rules([{name:'Entravé'}],'DEX').mode,'dis');
 assert.equal(A.rules([{name:'Entravé'}],'DEX','adv').mode,'normal');
 assert.equal(A.rules([{name:'Paralysé'}],'DEX').autoFail,true);
 assert.equal(A.rules([{name:'Étourdi'}],'FOR').autoFail,true);
 assert.equal(A.rules([{name:'Étourdi'}],'SAG').autoFail,false);
 assert.equal(A.damage(17,true,true),8);
 assert.equal(A.damage(17,true,false),0);
 assert.equal(A.damage(17,false,true),17);
});
test('Rufus evasion is driven only by DEX and explicit halfOnSuccess',()=>{
 for(const success of [true,false]){
  assert.equal(A.damage(17,success,true,{characterId:'rufus',ability:'DEX'}),success?0:8);
  assert.equal(A.damage(17,success,false,{characterId:'rufus',ability:'DEX'}),success?0:17);
  assert.equal(A.damage(17,success,true,{characterId:'rufus',ability:'CON'}),success?8:17);
  assert.equal(A.damage(17,success,true,{characterId:'samoth',ability:'DEX'}),success?8:17);
 }
});
