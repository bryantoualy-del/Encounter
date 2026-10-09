import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./rpg-connect-mj.js',import.meta.url),'utf8');
const panels=readFileSync(new URL('./mj-panels.js',import.meta.url),'utf8');
const match=source.match(/\bfunction criticalPending\(\)\{[^\n]*\}/);
assert.ok(match,'Encounter connected turn guard must be present');

function guard(pending=[],{concentration=[],triggers=[],reactions={}}={}) {
 const ctx={window:{EncounterDecisions:{pending:()=>pending}},concentrationLedger:()=>Object.fromEntries(concentration.map((x,i)=>[i,x])),triggerLedger:()=>Object.fromEntries(triggers.map((x,i)=>[i,x])),state:{encounter:{rpgReactions:reactions}},fight:{requestId:'combat-current'}};
 vm.createContext(ctx);
 return vm.runInContext(`${match[0]};criticalPending()`,ctx);
}

test('Concentration control is an optional editor, not a turn blocker, even for persisted legacy requests',()=>{
 assert.equal(guard([{id:'legacy',kind:'concentration-control',priority:60,status:'pending'}]),false);
 assert.equal(guard([{id:'current',kind:'concentration-control',priority:60,status:'pending',blocksTurn:false}]),false);
 assert.match(panels,/kind:'concentration-control'[^\n]*blocksTurn:false/,'the UI must mark optional concentration editing explicitly');
});

test('Mandatory combat decisions and saves still block the next turn',()=>{
 assert.equal(guard([{kind:'reaction-approval',priority:20,status:'pending'}]),true);
 assert.equal(guard([{kind:'concentration-control',priority:60,blocksTurn:false},{kind:'required-save',priority:30}]),true);
 assert.equal(guard([],{concentration:[{request:{combatId:'combat-current'}}]}),true);
 assert.equal(guard([],{triggers:[{request:{combatId:'combat-current'}}]}),true);
 assert.equal(guard([],{reactions:{r:{combatId:'combat-current',status:'granted'}}}),true);
 assert.equal(guard([{kind:'concentration-control',priority:60}]),false);
 assert.equal(guard([{kind:'noncritical-setting',priority:80,blocksTurn:false}]),false);
});

test('Unrelated or informational decisions do not prevent turn progression',()=>{
 assert.equal(guard([{kind:'note',priority:90,status:'pending'}]),false);
 assert.equal(guard([],{concentration:[{request:{combatId:'past'},result:null}]}),false);
 assert.equal(guard([],{reactions:{r:{combatId:'past',status:'granted'}}}),false);
});
