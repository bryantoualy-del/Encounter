const assert=require('assert/strict');
module.exports=async function freeChecks(p){
 await p.evaluate(()=>RPGResolution.enterFree());
 await p.evaluate(()=>{const move=document.querySelector('#v3-movement');if(move&&!move.classList.contains('used'))move.click();});
 const before=await p.evaluate(()=>{const s=__CompanionBridge.read(),eco=s.economy||s.eco||s.used;if(eco)for(const k of Object.keys(eco)){if(typeof eco[k]==='boolean')eco[k]=__CompanionBridge.used!==false;}if(__CompanionBridge.id==='kentaro'){s.actionUsed=s.bonusUsed=s.reactionUsed=true;s.attackCount=2;}__CompanionBridge.healthRefresh();CompanionAPI.sync();return{api:CompanionAPI.getState(),turn:s.turn,round:s.round,phase:s.phase,turnPhase:s.turnPhase,dragon:s.dragon,spectreHp:s.spectreHp};});
 await p.evaluate(()=>{const d=document.createElement('dialog');d.id='economyFixture';d.innerHTML='<p>Animation / validation en cours</p>';document.body.append(d);d.showModal();});
 await p.locator('#economyFixture [data-reset-actions]').click();
 const after=await p.evaluate(()=>({api:CompanionAPI.getState(),turn:__CompanionBridge.read().turn,round:__CompanionBridge.read().round,phase:__CompanionBridge.read().phase,turnPhase:__CompanionBridge.read().turnPhase,dragon:__CompanionBridge.read().dragon,spectreHp:__CompanionBridge.read().spectreHp}));
 for(const key of ['turn','round','phase','turnPhase','dragon','spectreHp'])assert.deepEqual(after[key],before[key],key+' inchangé');
 for(const key of ['hp','resources','statuses','concentration'])assert.deepEqual(after.api[key],before.api[key],key+' conservés');
 assert.equal(after.api.turn.action,true);assert.equal(after.api.turn.bonus,true);assert.equal(after.api.turn.reaction,true);
 assert.equal(await p.locator('#v3-movement.used').count(),0);
 assert.equal(await p.evaluate(()=>__CompanionBridge.commands.nextTurn()),false);
 assert.equal(await p.locator('.rpg-connect [data-end-turn-request]').isVisible(),false);
 await p.evaluate(()=>document.getElementById('economyFixture').remove());
 for(const width of [320,390,768,1180,1536]){await p.setViewportSize({width,height:960});const layout=await p.evaluate(()=>{const node=document.querySelector('.rpg-connect [data-resolution-controls]'),r=node.getBoundingClientRect(),header=document.querySelector('.rpg-connect [data-resolution-ribbon]');return{x:r.x,right:r.right,width:r.width,integrated:node.closest('.rpg-session-banner')===header,bodyRoot:!!document.querySelector('body > [data-resolution-controls]'),hit:[...node.querySelectorAll('button:not([hidden])')].every(b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})};});assert(layout.integrated&&!layout.bodyRoot);assert(layout.x>=0&&layout.right<=width+1);assert(layout.hit,'Ruban accessible '+width);}
 await p.setViewportSize({width:1180,height:820});
 if(await p.evaluate(()=>RPGConnect.getStatus().connected)){await p.locator('.rpg-connect [data-resolution="encounter"]').click();const text=await p.locator('#rpgResolutionReview').innerText();assert(!/authorityRevision|spellCastRevision|"statuses"|"slots"|\{"/.test(text));assert(text.includes('Vos PV'));await p.locator('#rpgResolutionReview button').filter({hasText:'Continuer en Libre'}).click();}
 await p.reload();await p.waitForFunction(()=>RPGResolution.free());assert.deepEqual((await p.evaluate(()=>CompanionAPI.getState())).resources,after.api.resources);
};
