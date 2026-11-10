import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./encounter-typed-damage.js',import.meta.url),'utf8');
function get(){const context={};context.globalThis=context;vm.runInNewContext(source,context);return context.EncounterTypedDamage;}
test('universal palette has correct 13 damage types and utility colors',()=>{
 const t=get(),palette=t.semanticColors;
 assert.equal(palette.feu,'#FF6538');
 assert.equal(palette.froid,'#65D9F5');
 assert.equal(palette.tonnerre,'#568BEB');
 assert.equal(palette.force,'#B18BFF');
 assert.equal(palette.radiants,'#FFE19A');
 assert.equal(palette.soins,'#34D399');
 assert.equal(palette.temporaires,'#38BDF8');
 assert.equal(palette.attaque,'#E5B963');
});
test('french and english types normalize identically without dice rolls',()=>{
 const t=get();
 assert.equal(t.semanticType('fire'),'feu');
 assert.equal(t.semanticType('feu'),'feu');
 assert.equal(t.semanticType('bludgeoning'),'contondants');
 assert.equal(t.semanticType('nécrotiques'),'nécrotiques');
 assert.equal(t.semanticType('cold'),'froid');
 assert.equal(t.semanticType('healing'),'soins');
 assert.equal(t.semanticType('temporary'),'temporaires');
 assert.equal(t.semanticType('unknown'),null);
});
test('typed formula parsing and existing scaling remain unchanged',()=>{
 const t=get();
 const x=t.parse('1d10+7 | contondants; 2d8 | feu');
 assert.equal(x.errors.length,0);
 assert.equal(x.parts.length,2);
 const c=t.scale([{amount:10,type:'feu'},{amount:20,type:'froid'}],15);
 assert.equal(c[0].amount+c[1].amount,15);
});
