const assert=require('assert/strict');
async function checks(p,{connected=false,back}={}){
 const initial=await p.evaluate(()=>CompanionAPI.getState().resources);
 for(const kind of ['prompt','confirm','alert']){
  if(!connected&&await p.evaluate(()=>RPGResolution.free())){await p.evaluate(()=>localStorage.removeItem('rpg-resolution:v4:'+__CompanionBridge.id));await p.reload();await p.waitForFunction(()=>!!window.RPGResolution);}
  await p.evaluate(kind=>{window.dialogAnswer='pending';RPGDialogs[kind]('Recette non bloquante '+kind,'12').then(v=>window.dialogAnswer=v===undefined?'undefined':v)},kind);
  const d=p.locator('[data-rpg-dialog="'+kind+'"]');await d.waitFor();
  const ticks=await p.evaluate(()=>{window.dialogTicks=0;window.dialogTimer=setInterval(()=>dialogTicks++,10);return dialogTicks});await p.waitForFunction(()=>dialogTicks>2);assert.equal(ticks,0);await p.evaluate(()=>clearInterval(dialogTimer));
  await d.locator('[data-resolution="free"]').click();await p.waitForFunction(()=>RPGResolution.free());assert.equal(await p.evaluate(()=>RPGConnect.getStatus().connected),connected);
  await p.waitForFunction(()=>window.dialogAnswer!=='pending');assert.equal(await p.evaluate(()=>window.dialogAnswer),kind==='prompt'?null:kind==='confirm'?false:'undefined');assert.equal(await d.count(),0);
  assert.deepEqual(await p.evaluate(()=>CompanionAPI.getState().resources),initial);
  if(connected)await back(p);else await p.reload();
 }
 // Real answer, cancellation, Escape, queued dialogs and no automatic agreement.
 await p.evaluate(()=>{window.dialogAnswer='pending';RPGDialogs.prompt('Valeur explicite','12').then(v=>window.dialogAnswer=v)});
 await p.locator('[data-rpg-dialog] input').fill('17');await p.locator('[data-dialog-accept]').click();await p.waitForFunction(()=>dialogAnswer==='17');
 await p.evaluate(()=>{window.dialogAnswer='pending';RPGDialogs.confirm('Choix explicite').then(v=>window.dialogAnswer=v)});
 await p.locator('[data-dialog-cancel]').click();await p.waitForFunction(()=>dialogAnswer===false);
 await p.evaluate(()=>{window.dialogAnswer='pending';RPGDialogs.confirm('Choix confirmé').then(v=>window.dialogAnswer=v)});
 await p.locator('[data-dialog-accept]').click();await p.waitForFunction(()=>dialogAnswer===true);
 await p.evaluate(()=>{window.dialogAnswer='pending';RPGDialogs.prompt('Échap').then(v=>window.dialogAnswer=v)});await p.keyboard.press('Escape');await p.waitForFunction(()=>dialogAnswer===null);
 await p.evaluate(()=>{window.queueAnswers=[];RPGDialogs.prompt('File A').then(v=>queueAnswers.push(v));RPGDialogs.confirm('File B').then(v=>queueAnswers.push(v));RPGDialogs.cancelAll()});await p.waitForFunction(()=>queueAnswers.length===2);assert.deepEqual(await p.evaluate(()=>queueAnswers),[false,null]);
 assert.deepEqual(await p.evaluate(()=>CompanionAPI.getState().resources),initial);
}
module.exports={checks};
