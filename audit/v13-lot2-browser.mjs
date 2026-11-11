import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const root=resolve(new URL('../../',import.meta.url).pathname);
const out=resolve(new URL('./v13-lot2-evidence',import.meta.url).pathname);
await mkdir(out,{recursive:true});
const engine=process.env.V13_BROWSER==='webkit'?webkit:chromium;
const browserName=process.env.V13_BROWSER==='webkit'?'webkit':'chromium';
const web=createServer(async(req,res)=>{
 try{
  let uri=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(uri.endsWith('/'))uri+='index.html';
  const file=resolve(root,'.'+uri);
  if(!file.startsWith(root+'/'))throw Error('traversal');
  res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');
  res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(ok=>web.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+web.address().port;
const browser=await engine.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
const checks=[],errors=[];let page,wsServer;
const check=(name,value,detail='')=>{const ok=!!value;checks.push({name,ok,detail});console.log(ok?'PASS':'FAIL',name,detail);assert.ok(ok,name+': '+detail)};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,serviceWorkers:'block'});
 await context.route('https://cdn.jsdelivr.net/npm/three@0.186.1/build/*',async route=>{
  const file=resolve(require.resolve('three'),'..',new URL(route.request().url()).pathname.split('/').pop());
  await route.fulfill({contentType:'application/javascript',body:await readFile(file)});
 });
 page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/Encounter/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.EncounterFreeEnemyActions && !!window.EncounterJournal && !!window.MJSpellSlots);
 check('Modules Lot 1 et Lot 2 chargés',await page.evaluate(()=>!!window.EncounterFreeEnemyActions && !!window.MJSpellSlots));
 const stateBefore=await page.evaluate(()=>{
  const m=normalizeMonster({id:'v13-fixture',name:'Mage de la recette',category:'enemy',ac:16,hp:80,attacksPerAction:1,legendaryMax:3,
   resources:[{id:'slot3',name:'Emplacements N3',spellLevel:3,max:2,start:2}],
   actions:[
    {id:'fire',name:'Trait de feu',kind:'attack',bonus:8,damage:'2d10',damageType:'feu',isSpell:false},
    {id:'claw',name:'Coup de griffe',kind:'attack',bonus:7,damage:'1d8+4',damageType:'tranchants'},
    {id:'multi',name:'Multiattaque',kind:'multiattack',sequence:'Coup de griffe x2'},
    {id:'blast',name:'Boule de feu',kind:'save',save:'DEX',dc:16,damage:'8d6',damageType:'feu',halfOnSuccess:true,isSpell:true,spellLevel:3},
    {id:'mixed',name:'Frappe mixte',kind:'attack',bonus:6,damagePartsText:'1d6 | feu\n1d6 | froid'},
    {id:'bite',name:'Morsure',kind:'attack',bonus:7,damage:'1d8',damageType:'perforants',onHitSave:{ability:'FOR',dc:14,conditionOnFailure:'À terre'}},
    {id:'heal',name:'Régénération',kind:'heal',damage:'2d6'},
    {id:'breath',name:'Souffle',kind:'recharge',save:'DEX',dc:15,damage:'6d6',damageType:'feu',recharge:'5-6'}
   ],
   legendaryActions:[{id:'legendary',name:'Frappe légendaire',kind:'attack',bonus:8,damage:'1d8',damageType:'force',cost:1}]
  });
  state.monsters.push(m);
  const enemy=makeParticipant(m,1,22);enemy.id='v13-enemy';enemy.legendaryRemaining=3;
  const player=ccParticipant({id:'cc-brackmard',name:'Brackmard',hp:100,ac:21});
  state.encounter.participants=[enemy,player];state.encounter.selectedId=enemy.id;state.encounter.currentTurn=0;
  state.encounter.rpgSessionMode='table-free';
  setMode('combat');render();
  return {enemyHp:enemy.hp,playerHp:player.hp,playerConditions:player.conditions.length,playerResources:JSON.stringify(player.resourceState)};
 });
 check('Ennemi et joueur présents dans Combat',await page.locator('[data-use-ability="v13-enemy|fire|action|normal"]').count()===1);
 async function reset(){
  await page.evaluate(()=>{
   const e=state.encounter.participants.find(p=>p.id==='v13-enemy');
   e.actionUsed=false;e.bonusActionUsed=false;e.reactionUsed=false;e.attackProgress=0;
   state.encounter.selectedId=e.id;
   render();
  });
 }
 async function close(){
  await page.locator('#actionPopup .v13-result-close').click();
 }
 async function click(id,expected){
  await reset();
  const button=page.locator('[data-use-ability="v13-enemy|'+id+'|action|normal"]');
  if(await button.count()===1){await button.click();}
  else await page.evaluate(id=>useAbility('v13-enemy',id,'action','normal'),id);
  await page.waitForFunction(()=>document.querySelector('#actionPopup.v13-free-enemy.show'));
  const data=await page.evaluate(()=>({
   body:document.querySelector('#actionPopup')?.textContent||'',
   targeting:!!ui.targeting,
   player:state.encounter.participants.find(p=>p.id==='cc-brackmard'),
   enemy:state.encounter.participants.find(p=>p.id==='v13-enemy')
  }));
  check(expected+' sans ciblage',!data.targeting);
  check(expected+' sans résolution automatique du joueur',data.player.hp===stateBefore.playerHp && data.player.conditions.length===0 && JSON.stringify(data.player.resourceState)===stateBefore.playerResources);
  check(expected+' popup indicative, sans touche/raté',/MJ arbitre/i.test(data.body)&&!/TOUCHÉ|RATÉ|contre CA/.test(data.body));
  return data;
 }
 let d=await click('fire','Trait de feu');
 check('D20 + résultat numérique du sort',await page.locator('.v131-free-attack .v131-free-figure strong').count()===2);
 check('Économie de tour consommée côté ennemi',d.enemy.actionUsed===true);
 await page.screenshot({path:out+'/'+browserName+'-samsung-result.png',fullPage:false});
 const bounds=await page.locator('#actionPopup').boundingBox();
 check('Popup visible dans le haut de la tablette',bounds&&bounds.y<300&&bounds.x>=0&&bounds.x+bounds.width<=1280,JSON.stringify(bounds));
 await close();
 d=await click('claw','Attaque physique');await close();
 d=await click('mixed','Dégâts mixtes');
 check('Dégâts multi-types visibles',/feu|froid/.test(d.body));
 await close();
 d=await click('bite','État conditionnel');
 check('JS sur touche annoncé, non résolu',/Sur touche|JS FOR/.test(d.body));
 await close();
 d=await click('multi','Multiattaque');
 check('Deux jets de multiattaque',await page.locator('.v131-free-attack').count()===2);
 await close();
 d=await click('blast','Sauvegarde de zone');
 check('Sauvegarde à résoudre par les joueurs',/JS DEX|JET DE SAUVEGARDE · DEX|DD 16/.test(d.body));
 check('Dégâts potentiels sans application',/DÉGÂTS POTENTIELS/i.test(d.body));
 check('Emplacement N3 consommé côté adversaire',d.enemy.resourceState.slot3===1);
 await close();
 d=await click('heal','Soins ennemis');
 check('Soins non appliqués automatiquement',d.enemy.hp===stateBefore.enemyHp);
 await close();
 d=await click('breath','Recharge ennemie');
 check('Recharge consommée',d.enemy.abilityState.breath.ready===false);
 await close();
 await reset();
 const before=await page.evaluate(()=>state.encounter.participants.find(p=>p.id==='v13-enemy').actionUsed);
 await page.evaluate(()=>useAbility('v13-enemy','breath','action'));
 const after=await page.evaluate(()=>state.encounter.participants.find(p=>p.id==='v13-enemy').actionUsed);
 check('Recharge indisponible bloquée',before===false&&after===false);
 await page.evaluate(()=>{const e=state.encounter.participants.find(p=>p.id==='v13-enemy');e.abilityState.breath.ready=true;e.resourceState.slot3=0;render();});
 await page.evaluate(()=>useAbility('v13-enemy','blast','action'));
 check('Emplacement épuisé non consommé',await page.evaluate(()=>state.encounter.participants.find(p=>p.id==='v13-enemy').resourceState.slot3===0));
 await page.evaluate(()=>{const e=state.encounter.participants.find(p=>p.id==='v13-enemy');e.actionUsed=false;state.encounter.rpgSessionMode='guided';render();useAbility(e.id,'claw','action');});
 check('Mode Guidé conserve la sélection de cible',await page.evaluate(()=>!!ui.targeting));
 await page.evaluate(()=>{cancelTargeting();state.encounter.rpgSessionMode='table-free';setMode('prep');});
 check('Mode Préparation conservé',await page.evaluate(()=>state.ui.mode==='prep'));
 await page.evaluate(()=>{const e=state.encounter.participants.find(p=>p.id==='v13-enemy');e.hp-=7;saveState();render();});
 check('Gestion manuelle PV des adversaires disponible',await page.evaluate(()=>state.encounter.participants.find(p=>p.id==='v13-enemy').hp===73));
 check('Aucune erreur JavaScript majeure',errors.length===0,JSON.stringify(errors));


 // Audit navigateur complet du bestiaire SRD : chaque capacité testée sur le vrai DOM.
 const catalog=await page.evaluate(async()=>{
  const monsters=await (await fetch('monsters.json')).json();
  const original={participants:state.encounter.participants,selectedId:state.encounter.selectedId,currentTurn:state.encounter.currentTurn,mode:state.encounter.rpgSessionMode};
  let count=0;const failures=[];
  try{
   for(const raw of monsters){
    const model=normalizeMonster(raw);model.id='audit-'+raw.id;state.monsters.push(model);
    const enemy=makeParticipant(model,1,20);
    const player=ccParticipant({id:'audit-pj',name:'PJ témoin',hp:83,ac:16});
    state.encounter.participants=[enemy,player];state.encounter.selectedId=enemy.id;state.encounter.currentTurn=0;state.encounter.rpgSessionMode='table-free';
    for(const section of ['actions','reactions','legendaryActions','lairActions','traits']){
     for(const a of model[section]||[]){
      const close=document.querySelector('#actionPopup.show .v13-result-close');if(close)close.click();
      ui.targeting=null;enemy.actionUsed=false;enemy.bonusActionUsed=false;enemy.reactionUsed=false;enemy.attackProgress=0;enemy.legendaryRemaining=10;
      if(enemy.abilityState[a.id])enemy.abilityState[a.id].ready=true;
      const beforeLog=state.encounter.log.length,beforeHP=player.hp,beforeConditions=JSON.stringify(player.conditions||[]);
      const sec={actions:'action',reactions:'reaction',legendaryActions:'legendary',lairActions:'lair',traits:'trait'}[section];
      try{
       useAbility(enemy.id,a.id,sec,'normal');
       const visible=!!document.querySelector('#actionPopup.show.v13-free-enemy');
       const journalDelta=state.encounter.log.length-beforeLog;
       if(!visible||journalDelta!==1||ui.targeting||player.hp!==beforeHP||JSON.stringify(player.conditions||[])!==beforeConditions)
        failures.push({monster:raw.name,ability:a.name,section,visible,journalDelta,targeting:!!ui.targeting,hp:player.hp});
      }catch(error){failures.push({monster:raw.name,ability:a.name,section,error:String(error)})}
      count++;
     }
    }
   }
  }finally{
   state.encounter.participants=original.participants;state.encounter.selectedId=original.selectedId;
   state.encounter.currentTurn=original.currentTurn;state.encounter.rpgSessionMode=original.mode;
   const close=document.querySelector('#actionPopup.show .v13-result-close');if(close)close.click();
   render();
  }
  return {monsters:monsters.length,count,failures};
 });
 check('Bestiaire complet en navigateur: 19 monstres et 69 capacités',catalog.monsters===19&&catalog.count===69,JSON.stringify(catalog));
 check('Bestiaire complet: zéro cible, zéro effet PJ, exactement un popup et une entrée de log par capacité',catalog.failures.length===0,JSON.stringify(catalog.failures));

 // Connected authority regression: the same enemy action must never issue
 // health/status/save commands to a real Companion through canonical RPG Connect.
 process.env.RPG_CONNECT_GM_KEY='lot2-full-recipe-secret-key-123456';
 process.env.PORT='0';
 process.env.RPG_CONNECT_ORIGINS='';
 const {server,rooms}=await import('../../RPG-Connect/rpg-connect-server.js');
 wsServer=server;
 await new Promise(ok=>server.listening?ok():server.once('listening',ok));
 const endpoint='ws://127.0.0.1:'+server.address().port,room='V13LOT2';
 const packets=[];
 page.on('websocket',socket=>socket.on('framesent',f=>{try{packets.push(JSON.parse(f.payload))}catch{}}));
 await page.evaluate(()=>{state.encounter.rpgSessionMode='table-free';setMode('combat');});
 await page.locator('#rpgMjOpen').click();
 await page.locator('#rpgMjEndpoint').fill(endpoint);
 await page.locator('#rpgMjRoom').fill(room);
 await page.locator('#rpgMjKey').fill(process.env.RPG_CONNECT_GM_KEY);
 await page.locator('#rpgMjConnect').click();
 await page.waitForFunction(()=>window.RPGConnectMJ?.getStatus()?.connected);
 check('Serveur RPG Connect réel connecté à Encounter',await page.evaluate(()=>RPGConnectMJ.getStatus().connected));
 await page.waitForFunction(()=>document.querySelectorAll('#rpgMjPlayers [data-copy]').length>=6);
 const token=rooms.get(room)?.tokens?.get('brackmard');
 check('Invitation native Brackmard créée',typeof token==='string' && token.length>8);
 const companion=await context.newPage();
 companion.on('pageerror',e=>errors.push('Brackmard: '+e.message));
 await companion.goto(base+'/Brackmard/',{waitUntil:'domcontentloaded'});
 await companion.waitForFunction(()=>!!window.RPGConnect && !!window.CompanionAPI);
 await companion.locator('.rpg-connect > .rpg-connect-launch').click();
 await companion.locator('[name=invite]').fill('RPGCONNECT|'+endpoint+'|'+room+'|brackmard|'+token);
 await companion.locator('[data-connect]').click();
 await companion.waitForFunction(()=>RPGConnect.getStatus().connected);
 await page.waitForFunction(()=>RPGConnectMJ.getStatus().players.some(p=>p.characterId==='brackmard'&&p.online));
 check('Companion Brackmard réel connecté',await companion.evaluate(()=>RPGConnect.getStatus().connected));
 const ownershipBefore=await companion.evaluate(()=>{
  const s=CompanionAPI.getState();return JSON.stringify({hp:s.hp,statuses:s.statuses,conditions:s.conditions,resources:s.resources});
 });
 const gmBefore=await page.evaluate(()=>state.encounter.participants.find(p=>p.id==='cc-brackmard')?.hp);
 const startPackets=packets.length;
 await page.evaluate(()=>{
  const e=state.encounter.participants.find(p=>p.id==='v13-enemy');
  e.actionUsed=false;e.attackProgress=0;state.encounter.selectedId=e.id;
  useAbility(e.id,'fire','action','normal');
 });
 await page.waitForTimeout(300);
 const ownershipAfter=await companion.evaluate(()=>{
  const s=CompanionAPI.getState();return JSON.stringify({hp:s.hp,statuses:s.statuses,conditions:s.conditions,resources:s.resources});
 });
 const gmAfter=await page.evaluate(()=>state.encounter.participants.find(p=>p.id==='cc-brackmard')?.hp);
 check('Companion conserve ses PV, états et ressources après jet ennemi connecté',ownershipAfter===ownershipBefore);
 check('Projection Encounter des PV de Brackmard inchangée',gmBefore===gmAfter);
 const forbidden=new Set(['hp:set','tempHp:set','conditions:set','player-save:request','concentration:request','save:result','attack:damage','target:condition','effect:request','damage:resolved']);
 const modifying=packets.slice(startPackets).filter(p=>p?.type==='command'&&forbidden.has(p.event?.type));
 check('Aucune commande WebSocket mutante après Trait de feu ennemi',modifying.length===0,JSON.stringify(modifying));
 check('Aucune erreur navigateur des deux applications',errors.length===0,JSON.stringify(errors));

} catch(e){
 console.error('RECETTE FAILED',e?.stack||e);
 process.exitCode=1;
} finally{
 await writeFile(out+'/'+browserName+'-results.json',JSON.stringify({checks,errors},null,2));
 await browser.close();await new Promise(r=>web.close(r));if(wsServer)await new Promise(r=>wsServer.close(r));
}
