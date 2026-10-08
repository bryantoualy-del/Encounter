import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const source=readFileSync(new URL('../Nans/rpg-nans-recoil.js',import.meta.url),'utf8');
function create(saved=null){
 const dom=new JSDOM('',{url:'https://local.test/',runScripts:'outside-only'}),w=dom.window,sent=[],listeners=[];
 w.__CompanionBridge={id:'nans'};
 const emitted=new Set();w.CompanionAPI={subscribe:fn=>listeners.push(fn),emitLocal:(type,payload,id)=>{if(emitted.has(id))return;emitted.add(id);sent.push({type,payload,id})}};
 w.RPGConnect={getStatus:()=>({connected:true})};
 w.RPGHealth={getContext:()=>({combatId:'combat-42'})};
 w.setInterval=fn=>{w.retry=fn;return 1};
 if(saved)w.localStorage.setItem('rpg-nans-recoil:v1',saved);
 w.eval(source);
 return {dom,w,sent,receive:event=>listeners.forEach(fn=>fn(event)),saved:()=>w.localStorage.getItem('rpg-nans-recoil:v1')};
}
test('Ring recoil sends a stable request, retries, and stops after Encounter receipt',()=>{
 const x=create();
 assert.equal(x.w.RPGRingRecoil.submit('attack-3',3),true);
 assert.equal(x.sent.length,0,'recoil cannot precede Encounter damage confirmation');
 x.receive({type:'damage:resolved',payload:{attackId:'attack-3',effective:10}});
 assert.equal(x.sent.length,1);
 assert.equal(x.sent[0].payload.actionId,'attack-3:ring-recoil');
 assert.equal(x.sent[0].payload.amount,3);
 x.w.retry();
 assert.equal(x.sent.length,1,'local API deduplicates retries; transport owns durable outbox');
 x.receive({type:'message:gm',payload:{recoilResult:{actionId:'attack-3:ring-recoil',combatId:'combat-42',ok:true,amount:3,effective:2}}});
 assert.equal(x.w.RPGRingRecoil.pending().length,0);
 const n=x.sent.length;x.w.retry();assert.equal(x.sent.length,n);
 x.dom.window.close();
});
test('Ring recoil resumes across reload without rolling or applying a second damage locally',()=>{
 const a=create();a.w.RPGRingRecoil.submit('attack-5',4);a.receive({type:'damage:resolved',payload:{attackId:'attack-5',effective:7}});const pending=a.saved();a.dom.window.close();
 const b=create(pending);b.w.retry();
 assert.equal(b.sent.length,1);
 assert.equal(b.sent[0].payload.amount,4);
 b.receive({type:'message:gm',payload:{recoilResult:{actionId:'attack-5:ring-recoil',combatId:'combat-42',ok:false,error:'transaction annulée'}}});
 assert.equal(b.w.RPGRingRecoil.pending().length,0);
 b.dom.window.close();
});
test('Ring recoil rejects unconnected combat, invalid rolls and missing attack authority',()=>{
 const x=create();
 assert.equal(x.w.RPGRingRecoil.submit('attack-6',0),false);
 assert.equal(x.w.RPGRingRecoil.submit('',2),false);
 x.w.RPGConnect.getStatus=()=>({connected:false});
 assert.equal(x.w.RPGRingRecoil.submit('attack-6',3),false);
 assert.equal(x.sent.length,0);
 x.dom.window.close();
});

test('Ring recoil is never emitted for a cancelled or unconfirmed hit',()=>{
 const x=create();x.w.RPGRingRecoil.submit('attack-7',2);
 x.receive({type:'damage:resolved',payload:{attackId:'attack-7',cancelled:true}});
 x.w.retry();assert.equal(x.sent.length,0);
 assert.equal(x.w.RPGRingRecoil.pending().length,1);
 x.dom.window.close();
});
