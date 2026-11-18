import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, extname} from 'node:path';
import {chromium, webkit} from 'playwright';

const root=fileURLToPath(new URL('../../',import.meta.url));
const engine=process.env.RPG_BROWSER==='webkit'?webkit:chromium;
const names=['Brackmard','Samoth','Rufus','Nans','Zephyr','Kentaro','Kobe'];
const room='V24TURNS';
const key='local-turns-browser-test';
process.env.PORT='0';
process.env.RPG_CONNECT_GM_KEY=key;
const backend=await import('../../RPG-Connect/rpg-connect-server.js');
if(!backend.server.listening)await new Promise(ok=>backend.server.once('listening',ok));
const endpoint='ws://127.0.0.1:'+backend.server.address().port;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const http=createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root))throw Error('Unknown path');
    res.setHeader('content-type',mime[extname(path)]||'application/octet-stream');
    res.end(await readFile(path));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>http.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+http.address().port;
const errors=[];
let browser;
try {
 browser=await engine.launch({headless:true,...(process.env.CHROMIUM_PATH&&engine===chromium?{executablePath:process.env.CHROMIUM_PATH}:{} )});
 async function open(name){
   const context=await browser.newContext({viewport:{width:name==='Encounter'?1280:1180,height:820},hasTouch:true,serviceWorkers:'block'});
   await context.route('https://cdn.jsdelivr.net/npm/three@0.186.1/build/*',async route=>route.fulfill({
     body:await readFile(resolve(root,'Encounter/node_modules/three/build',new URL(route.request().url()).pathname.split('/').at(-1))),
     contentType:'application/javascript',
   }));
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(name+': '+error.message));
   await page.goto(origin+'/'+name+'/index.html',{waitUntil:'domcontentloaded'});
   return page;
 }
 const gm=await open('Encounter');
 await gm.waitForFunction(()=>window.RPGConnectMJ&&window.__encounterBootReady);
 await gm.evaluate(({endpoint,room,key})=>{
   state.encounter.participants=[...CC_PLAYERS,{id:'cc-kobe',name:'Kobe Kozzo',hp:83,ac:15}].map(ccParticipant);
   saveState();render();
   document.querySelector('#rpgMjEndpoint').value=endpoint;
   document.querySelector('#rpgMjRoom').value=room;
   document.querySelector('#rpgMjKey').value=key;
   document.querySelector('#rpgMjConnect').click();
 },{endpoint,room,key});
 await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);
 const pages={};
 for(const name of names){
   const id=name.toLowerCase(),page=pages[id]=await open(name);
   await page.waitForSelector(name==='Kobe'?'#kobe-rpg-panel':'#cc-turnbar-standard',{state:'attached'});
   await page.evaluate(({id,endpoint,room,token})=>{
     if(id==='kobe'){
       const panel=document.querySelector('#kobe-rpg-panel');
       panel.querySelector('[name=invite]').value=['RPGCONNECT',endpoint,room,id,token].join('|');
       panel.querySelector('[data-connect]').click();
     }else{
       for(const [field,value] of Object.entries({endpoint,room,token}))document.querySelector('[name='+field+']').value=value;
       RPGConnect.connect();
     }
   },{id,endpoint,room,token:backend.rooms.get(room).tokens.get(id)});
 }
 await gm.waitForFunction(()=>RPGConnectMJ.getStatus().players.filter(p=>p.online).length===7);
 await gm.evaluate(()=>RPGConnectMJ.prepareFight());
 if(process.env.RPG_TEST_SUPPORT==='1'){
   for(const target of [pages.rufus,pages.kentaro]){
     const initiative=target.locator('dialog.rpg-initiative-request');
     await initiative.waitFor({state:'visible'});
     await initiative.locator('[data-init-manual]').fill('10');
     await initiative.locator('[data-init-roll]').evaluate(button=>button.click());
     await initiative.waitFor({state:'hidden'});
     const result=target.locator('#ccDiceOverlay[data-dismissable="1"]');
     await result.waitFor({state:'visible'});
     await result.click();
     await result.waitFor({state:'hidden'});

   }
 }

 await gm.evaluate(ids=>{
   ids.forEach((id,i)=>RPGConnectMJ.validateInitiative(id,28-i*3));
   if(!RPGConnectMJ.startFight())throw Error('Le combat ne démarre pas');
 },Object.keys(pages));
 for(const [id,page] of Object.entries(pages)){
   if(id==='kobe'){
     await page.waitForFunction(()=>document.querySelector('.turn-finish')?.dataset.action==='signal-turn-end');
     if(process.env.RPG_TEST_SUPPORT==='1'){
       async function grant(name,recipient){
         await page.locator('[data-combat=inspiration]').filter({visible:true}).first().click();
         await page.getByRole('button',{name,exact:true}).last().click();
         const form=recipient.locator('details').filter({has:recipient.locator('input[name=die]')}).last();
         await form.waitFor({state:'visible'});
         await form.locator('summary').click();
         await form.locator('[name=total]').fill('12');
         await form.locator('[name=die]').fill('7');
         await form.getByRole('button',{name:'Confirmer l’utilisation'}).click();
         await form.locator('output').filter({hasText:'12 + 7 = 19'}).waitFor();
         assert.equal(await form.getByRole('button',{name:'Confirmer l’utilisation'}).isDisabled(),true);
       }
       await grant('Rufus',pages.rufus);
       await page.locator('.turn-local').click();
       await grant('Kentaro',pages.kentaro);
     }

     const before=await page.evaluate(()=>{
       const {turn,slots,resources}=JSON.parse(localStorage.getItem('kobe-companion:v1')).state;
       return {revision:turn.startRevision,slots,resources};
     });
     await page.evaluate(()=>document.querySelector('.turn-finish').click());
     await page.waitForFunction(()=>document.querySelector('.turn-finish')?.disabled);
     await page.context().setOffline(true);
     await page.evaluate(()=>document.querySelector('.turn-local').click());
     await page.waitForFunction(()=>!document.querySelector('.turn-finish')?.disabled);
     const after=await page.evaluate(()=>{
       const {turn,slots,resources}=JSON.parse(localStorage.getItem('kobe-companion:v1')).state;
       return {revision:turn.startRevision,slots,resources};
     });
     assert.deepEqual(after,{...before,revision:before.revision+1});
     await page.context().setOffline(false);
   }else{
     await page.waitForFunction(id=>RPGTable.getContext()?.session?.activeCharacterId===id,id);
     assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),true,id+' reaction');
     if(id==='brackmard'){
       const attacks=await page.evaluate(()=>{
         const state=__CompanionBridge.read(),left=[];
         const manual=document.querySelector('#manualRoll');
         for(let i=0;i<3;i++){manual.value=1;startAttack();left.push(state.attacksLeft);}
         actionSurge();manual.value=1;startAttack();
         return {left,fougue:state.surge,remaining:state.attacksLeft};
       });
       assert.deepEqual(attacks,{left:[2,1,0],fougue:0,remaining:2});
     }
     if(id==='zephyr'){
       const reaction=await page.evaluate(async()=>{
         document.querySelector('#protectBtn').click();
         await __CompanionBridge.nativeReactionAttack();
         return {available:CompanionAPI.getState().turn.reaction,pending:__CompanionBridge.read().rpgZephyrAttack??null};
       });
       assert.deepEqual(reaction,{available:false,pending:null});
       if(process.env.RPG_TEST_SUPPORT==='1'){
         await page.locator('[data-select=blessLevel]').first().evaluate(button=>button.click());
         await page.locator('#rpgGroup [data-group-actor="cc-rufus"]').click();
         await page.locator('#rpgGroup [data-group-actor="cc-kentaro"]').click();
         await page.locator('#rpgGroup [data-group-confirm]').click();
         await page.waitForFunction(()=>CompanionAPI.getState().blessing?.targets?.length===2);
         await gm.waitForFunction(()=>RPGConnectMJ.groupProfiles().filter(row=>row.conditions.some(c=>c.origin==='rpg-table-blessing')).length===2);
         for(const target of [pages.rufus,pages.kentaro]){
           try {
             await target.waitForFunction(()=>document.querySelector('[data-combat-saves] summary')?.textContent.includes('Bénédiction'),null,{timeout:7000});
           } catch (error) {
             console.log('Recipient projection:',await target.evaluate(()=>({state:RPGConnect.getStatus(),context:RPGTable.getContext()?.conditionActors?.map(a=>({companionId:a.companionId,conditions:a.conditions}))})));
             throw error;
           }
         }
         await page.evaluate(()=>CompanionAPI.clearConcentration());
         for(const target of [pages.rufus,pages.kentaro]){
           await target.waitForFunction(()=>!document.querySelector('[data-combat-saves] summary')?.textContent.includes('Bénédiction'));
         }
       }

     }
     await page.evaluate(()=>RPGReactions.setAvailable(false));
     await page.evaluate(()=>document.querySelector('.cc-turn-next').click());
     await page.waitForFunction(()=>RPGTable.localEnded());
     assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),false);
     if(id==='brackmard'){
       await page.reload({waitUntil:'domcontentloaded'});
       await page.waitForFunction(()=>RPGConnect?.getStatus().connected&&RPGTable.getContext()?.stale===false);
       assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),false,'replay after reload');
     }
     await page.evaluate(()=>document.querySelector('.cc-turn-local').click());
     assert.equal(await page.evaluate(()=>CompanionAPI.getState().turn.reaction),true,id+' restoration locale');
     if(id==='brackmard'){
       assert.deepEqual(await page.evaluate(()=>{
         const state=__CompanionBridge.read();
         return {fougue:state.surge,remaining:state.attacksLeft};
       }),{fougue:0,remaining:3});
     }
   }
   assert.equal(await gm.evaluate(()=>activeParticipant().id),'cc-'+id,id+' retains GM initiative');
   if(id==='brackmard'){
     const result=await gm.evaluate(()=>{
       mutate(()=>state.encounter.participants.push(normalizeParticipant({
         id:'reinforcement',name:'Renfort',kind:'enemy',initiative:24,hp:20,maxHp:20,
       })));
       return sortedParticipants().slice(0,3).map(p=>p.id);
     });
     assert.deepEqual(result,['cc-brackmard','cc-samoth','reinforcement']);
     await page.waitForFunction(()=>RPGGroup.getActors().some(a=>a.id==='reinforcement'));
     await gm.evaluate(()=>{
       mutate(()=>state.encounter.participants.find(p=>p.id==='reinforcement').initiative=26);
     });
     assert.deepEqual(await gm.evaluate(()=>sortedParticipants().slice(0,3).map(p=>p.id)),
       ['cc-brackmard','reinforcement','cc-samoth']);
     await gm.evaluate(()=>removeParticipant('reinforcement'));
     assert.equal(await gm.evaluate(()=>activeParticipant().id),'cc-brackmard');
     assert.equal(await gm.evaluate(()=>state.encounter.round),1);
     await page.waitForFunction(()=>!RPGGroup.getActors().some(a=>a.id==='reinforcement'));
   }
   if(id!=='kobe'){
     await gm.evaluate(()=>actualAdvanceTurn());
     await gm.waitForTimeout(230);
     if(await gm.evaluate(()=>activeParticipant().kind==='enemy')){await gm.evaluate(()=>actualAdvanceTurn());await gm.waitForTimeout(230);}
   }
   console.log('PASS',id);
 }
 await gm.evaluate(()=>{
   mutate(()=>state.encounter.participants.push(normalizeParticipant({
     id:'opponent',name:'Adversaire',kind:'enemy',initiative:1,hp:20,maxHp:20,
   })));
   actualAdvanceTurn();
 });
 const rufus=pages.rufus;
 await rufus.waitForFunction(()=>RPGTable.getContext()?.session?.activeParticipantId==='opponent');
 const reaction=await rufus.evaluate(()=>{
   RPGReactions.setAvailable(true);
   document.querySelector('[data-cond=allyAdjacent]').click();
   document.querySelector('#manualRoll').value=12;
   document.querySelector('[data-reaction-attack=veille]').click();
   const first=!!document.querySelector('[data-hit-sneak]');
   document.querySelector('[data-hit-sneak]')?.click();
   const state=__CompanionBridge.read();
   const spent=!state.economy.reaction&&state.sneakReaction&&!state.sneakOwn;
   RPGReactions.setAvailable(true);
   document.querySelector('#manualRoll').value=12;
   document.querySelector('[data-reaction-attack=veille]').click();
   const duplicate=!!document.querySelector('[data-hit-sneak]');
   return {first,spent,duplicate};
 });
 assert.deepEqual(reaction,{first:true,spent:true,duplicate:false});
 assert.equal(await gm.evaluate(()=>activeParticipant().id),'opponent');
 const next=await gm.evaluate(()=>{
   const brack=state.encounter.participants.find(p=>p.id==='cc-brackmard');
   const start=brack.turnStartRevision;
   removeParticipant('opponent');
   return {active:activeParticipant().id,round:state.encounter.round,starts:brack.turnStartRevision-start};
 });
 assert.deepEqual(next,{active:'cc-brackmard',round:2,starts:1});
 console.log('PASS reaction economy, off-turn Sneak Attack and active enemy removal');
 if(process.env.RPG_TEST_LOT3==='1'){
   const samoth=await open('Samoth');
   const snapshotStaff=()=>samoth.evaluate(()=>{
     const {staff,concentration,eco,history}=window.__CompanionBridge.read();
     return {staff,concentration,action:eco.action,last:history[0]?.detail};
   });
   const staffBeforeCast=await snapshotStaff();
   await samoth.locator('#combatSpell').selectOption('wall');
   await samoth.locator('#combatCast').evaluate(button=>button.click());
   await samoth.locator('[data-wall-roll=appearance]').waitFor({state:'attached'});
   const staffAfterCast=await snapshotStaff();
   console.log('Wall cast',JSON.stringify({staffBeforeCast,staffAfterCast}));
   const wall=await samoth.evaluate(()=>{
     const before=window.__CompanionBridge.read();
     const staff=before.staff,damage=before.turnDamage;
     document.querySelector('[data-wall-roll=appearance]').click();
     const appearance=document.querySelector('#resultText').textContent;
     const rolled=document.querySelector('[data-wall-roll=appearance]').disabled;
     document.querySelector('[data-wall-roll=breach]').click();
     return {appearance,rolled,breach:document.querySelector('#resultText').textContent,
       charges:staff-__CompanionBridge.read().staff,damageChanged:damage!==__CompanionBridge.read().turnDamage};
   });
   assert.match(wall.appearance,/10d6.*DEX DD18/);
   assert.match(wall.breach,/5d6.*CON DD18/);
   assert.deepEqual([wall.rolled,wall.charges,wall.damageChanged],[true,0,false]);

   const rogue=await open('Rufus');
   const daggers=await rogue.evaluate(()=>{
     const attack=id=>{
       document.querySelector('#manualRoll').value=12;
       document.querySelector('[data-attack='+id+']').click();
     };
     const before=document.querySelector('[data-attack=kori]').disabled;
     attack('veille');
     document.querySelector('[data-miss]').click();
     const armed=!document.querySelector('[data-attack=kori]').disabled;
     attack('kori');
     document.querySelector('[data-hit]').click();
     return {before,armed,blocked:document.querySelector('[data-attack=kori]').disabled,
       action:__CompanionBridge.read().economy.action,bonus:__CompanionBridge.read().economy.bonus,
       damage:window.__lastDamageComponents};
   });
   assert.deepEqual([daggers.before,daggers.armed,daggers.blocked,daggers.action,daggers.bonus],[true,true,true,false,false]);
   assert.ok(daggers.damage?.length===1&&daggers.damage[0].amount>=1&&daggers.damage[0].amount<=4);

   const zephyr=await open('Zephyr');
   assert.deepEqual(await zephyr.evaluate(async()=>{
     const before=JSON.stringify(__CompanionBridge.read());
     const confirm=RPGDialogs.confirm('Validation');
     const prompt=RPGDialogs.prompt('Saisie','2');
     document.querySelector('.rpg-native-dialog-close').click();
     const cancelledConfirm=await confirm;
     document.querySelector('.rpg-native-dialog-close').click();
     const cancelledPrompt=await prompt;
     document.querySelector('#longRest').click();
     document.querySelector('.companion-rest-close').click();
     return [cancelledConfirm,cancelledPrompt,before===JSON.stringify(__CompanionBridge.read())];
   }),[false,null,true]);
   const kentaro=await open('Kentaro');
   const valid=await kentaro.evaluate(()=>{
     const storage=Object.fromEntries(['kentaro-eclipse-v4','kentaro-social-v2','kentaro-session-v1','kentaro-session-v2','kentaro-session-v3'].map(key=>[key,localStorage.getItem(key)]));
     storage['kentaro-eclipse-v4']=JSON.stringify({...__CompanionBridge.read(),hp:80});
     return {kind:'kentaro-complete-backup',version:1,storage};
   });
   const backupFile=kentaro.locator('#backupFile');
   const importJson=data=>backupFile.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
   await importJson({...valid,storage:{'kentaro-eclipse-v4':valid.storage['kentaro-eclipse-v4']}});
   await kentaro.locator('dialog[open] [data-dialog-accept]').click();
   assert.notEqual(await kentaro.evaluate(()=>__CompanionBridge.read().hp),80);
   await importJson(valid);
   await kentaro.locator('dialog[open] [data-dialog-accept]').click();
   await kentaro.waitForFunction(()=>window.__CompanionBridge?.read().hp===80);
   assert.ok(await kentaro.evaluate(()=>localStorage.getItem('kentaro-backup-recovery-v1')));
   assert.equal(staffBeforeCast.staff-staffAfterCast.staff,4);
   console.log('PASS Ice Wall, physical off-hand attack, dialog cancellation and Kentaro backup');
 }
 assert.deepEqual(errors,[]);
}finally{
 await browser?.close();
 for(const peer of backend.wss.clients)peer.terminate();
 await new Promise(ok=>backend.server.close(ok));
 await new Promise(ok=>http.close(ok));
}
