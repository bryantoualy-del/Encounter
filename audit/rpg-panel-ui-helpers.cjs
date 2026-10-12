const assert=require('assert/strict');
const selectors={Kentaro:{action:'#ecoAction',bonus:'#ecoBonus',reaction:'#ecoReaction',movement:'#ecoMove'},Brackmard:{action:'#ecoAction',bonus:'#ecoBonus',reaction:'#ecoReaction',movement:'#v3-movement'},Nans:{action:'#ecoAction',bonus:'#ecoBonus',reaction:'#ecoReaction',movement:'#v3-movement'},Zephyr:{action:'#ecoA',bonus:'#ecoB',reaction:'#ecoR',movement:'#ecoM'}};
const economy=(name,key)=>'#cc-turnbar-standard .cc-turn-'+(key==='movement'?'move':key);
async function open(p,name){if(!await p.locator('.rpg-connect-panel').isVisible()){const modal=p.locator('dialog[open] .rpg-dialog-launch').last();if(await modal.isVisible())await modal.locator('.rpg-connect-dot').click();else await p.locator('.rpg-connect > .rpg-connect-launch .rpg-connect-dot').click();}await p.locator('[data-rpg-tab="'+name+'"]').click();}
async function close(p){if(await p.locator('.rpg-connect-panel').isVisible())await p.locator('.rpg-connect-panel [data-close]').click();}
async function mode(p,name){await open(p,'mode');await p.locator('[data-resolution="'+name+'"]').click();if(name==='free')await close(p);}
async function localChecks(p,name){
 assert.equal(await p.locator('[data-reset-actions]').count(),0);
 assert.equal(await p.locator('[data-session-banner] [data-resolution-controls]').count(),0);
 assert.equal(await p.locator('[data-session-banner] [data-correction-open]').count(),0);
 await close(p);assert(!await p.locator('[data-resolution="free"]').isVisible());assert(!await p.locator('#rpgCorrectionDialog').isVisible());
 await open(p,'mode');assert(await p.locator('[data-resolution="free"]').isVisible());assert(!await p.locator('[name="invite"]').isVisible());
 await p.locator('[data-rpg-tab="mode"]').press('ArrowRight');assert(await p.locator('#rpgCorrectionDialog').isVisible());assert(!await p.locator('[data-resolution="free"]').isVisible());
 await close(p);await mode(p,'free');
 const before=await p.evaluate(()=>{for(const key of ['action','bonus','reaction','movement'])RPGCorrectionSchema.apply(__CompanionBridge,key,false);RPGCorrectionSchema.apply(__CompanionBridge,'movementRemaining',0);const s=__CompanionBridge.read();if(__CompanionBridge.id==='kentaro'){s.attackCount=2;s.eldritchCount=2;}if(['nans','brackmard'].includes(__CompanionBridge.id))s.attacksLeft=0;if(__CompanionBridge.id==='zephyr')s.attackCount=2;__CompanionBridge.healthRefresh();CompanionAPI.sync();return CompanionAPI.getState();});
 for(const [i,key]of ['action','bonus','reaction','movement'].entries()){await p.locator(economy(name,key)).click();const values=await p.evaluate(()=>RPGCorrections.values());for(const [j,k]of ['action','bonus','reaction','movement'].entries())assert.equal(values[k],j<=i,name+' '+k+' restitution isolée');assert(!await p.locator('.rpg-connect-panel').isVisible());await p.locator(economy(name,key)).click();assert.equal(await p.evaluate(k=>RPGCorrections.values()[k],key),true,'Disponible : clic sans consommation');}
 const after=await p.evaluate(()=>CompanionAPI.getState());for(const key of ['hp','resources','statuses','concentration'])assert.deepEqual(after[key],before[key]);assert.equal(after.turn.number,before.turn.number);assert.equal(after.turn.round,before.turn.round);assert((await p.evaluate(()=>RPGCorrections.values().movementRemaining))>0);
 await p.reload();await p.waitForFunction(()=>window.RPGCorrections);for(const k of ['action','bonus','reaction','movement'])assert.equal(await p.evaluate(k=>RPGCorrections.values()[k],k),true);
 await p.evaluate(()=>{const d=document.createElement('dialog');d.id='rpg-ui-modal-fixture';d.innerHTML='<p>Validation locale en attente</p>';document.body.append(d);d.showModal();});
 await open(p,'mode');assert(await p.locator('[data-resolution="free"]').isVisible());await close(p);await p.evaluate(()=>document.getElementById('rpg-ui-modal-fixture').remove());
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1180,height:820}]){await p.setViewportSize(size);await open(p,'corrections');const box=await p.locator('.rpg-connect-panel').boundingBox();assert(box.x>=0&&box.x+box.width<=size.width+1);assert(box.y>=0&&box.y+box.height<=size.height);await p.locator('[data-correction-value]').fill('1');await close(p);}
 await p.setViewportSize({width:1180,height:820});
}
module.exports={economy,open,close,mode,localChecks};
