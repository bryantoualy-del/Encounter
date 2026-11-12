'use strict';
// Regression: free-table initiative must not inherit the RPG Fight-ended lock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'rpg-connect-mj.js'), 'utf8');
const anchor = "const oldAdvance=actualAdvanceTurn;actualAdvanceTurn=function(){";
const start = source.indexOf(anchor);
assert.ok(start >= 0, 'RPG turn adapter exists');
const body = source.slice(start + anchor.length, start + anchor.length + 240);
const guard = body.match(/^if\(([^)]*fight\.phase==='ended'[^)]*)\)\{note\('([^']+)'\);return false\}/);
assert.ok(guard, 'ended fight guard returns false explicitly');
assert.match(guard[1], /!tableMode\(\)/, 'guard must exclude free-table mode');
for (const [free, ended, blocked] of [[true,true,false],[true,false,false],[false,true,true],[false,false,false]]) {
  const notes = [];
  const context = { tableMode:()=>free, fight:{phase:ended?'ended':'fight'}, note:x=>notes.push(x) };
  const result = vm.runInNewContext('(function(){'+guard[0]+';return "advance"})()', context);
  assert.equal(result, blocked?false:'advance', 'free='+free+' ended='+ended);
  assert.equal(notes.length, blocked?1:0);
}
assert.match(source, /criticalPending=\(\)=>!tableMode\(\)&&tablePending\(\)/, 'free-table bypasses RPG critical pending');
assert.match(source, /const tableAdvance=actualAdvanceTurn;actualAdvanceTurn=\(\.\.\.args\)=>/, 'table advancement adapter remains installed');
console.log('PASS: free-table ended-fight guard / guided-mode protection / adapter presence');
