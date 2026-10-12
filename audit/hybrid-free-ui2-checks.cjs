const assert=require('assert/strict'),ui=require('./rpg-panel-ui-helpers.cjs');
module.exports=async function(p){
 await p.evaluate(()=>RPGResolution.enterFree());await ui.close(p);
 const name=await p.evaluate(()=>({kentaro:'Kentaro',brackmard:'Brackmard',samoth:'Samoth',nans:'Nans',rufus:'Rufus',zephyr:'Zephyr'}[__CompanionBridge.id]));
 const before=await p.evaluate(()=>{for(const key of ['action','bonus','reaction','movement'])RPGCorrectionSchema.apply(__CompanionBridge,key,false);__CompanionBridge.healthRefresh();CompanionAPI.sync();const s=__CompanionBridge.read();return{api:CompanionAPI.getState(),turn:s.turn,round:s.round,phase:s.phase,turnPhase:s.turnPhase,dragon:s.dragon,spectreHp:s.spectreHp};});
 for(const key of ['action','bonus','reaction','movement'])await p.locator(ui.economy(name,key)).click();
 const after=await p.evaluate(()=>{const s=__CompanionBridge.read();return{api:CompanionAPI.getState(),turn:s.turn,round:s.round,phase:s.phase,turnPhase:s.turnPhase,dragon:s.dragon,spectreHp:s.spectreHp};});
 for(const k of ['turn','round','phase','turnPhase','dragon','spectreHp'])assert.deepEqual(after[k],before[k],k+' conservé');
 for(const k of ['hp','resources','statuses','concentration'])assert.deepEqual(after.api[k],before.api[k]);
 for(const k of ['action','bonus','reaction','movement'])assert.equal(await p.evaluate(k=>RPGCorrections.values()[k],k),true);
 assert.equal(await p.evaluate(()=>__CompanionBridge.commands.nextTurn()),false);assert(!await p.locator('.rpg-connect [data-end-turn-request]').isVisible());
 for(const width of [320,390,768,1180,1536]){await p.setViewportSize({width,height:960});await ui.open(p,'mode');const box=await p.locator('.rpg-connect-panel').boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);const hit=await p.locator('[data-resolution="free"]').evaluate(b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});assert(hit);await ui.close(p);}
 await p.setViewportSize({width:1180,height:820});
 if(await p.evaluate(()=>RPGConnect.getStatus().connected)){await ui.mode(p,'encounter');const text=await p.locator('#rpgResolutionReview').innerText();assert(!/authorityRevision|spellCastRevision|"statuses"|"slots"|\{"/.test(text));assert(text.includes('Vos PV'));await p.locator('#rpgResolutionReview button').filter({hasText:'Continuer en Libre'}).click();await ui.close(p);}
 await p.reload();await p.waitForFunction(()=>RPGResolution.free());assert.deepEqual((await p.evaluate(()=>CompanionAPI.getState())).resources,after.api.resources);
};
