// Exercise the actual MJ console and seven real clients; no production rooms or persisted user data.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const engine=process.env.E2E_BROWSER==='webkit'?webkit:chromium;
process.env.PORT='0';process.env.RPG_CONNECT_GM_KEY=randomBytes(32).toString('hex');
const backend=await import('../../RPG-Connect/rpg-connect-server.js');
if(!backend.server.listening)await new Promise(r=>backend.server.once('listening',r));
const endpoint='ws://127.0.0.1:'+backend.server.address().port,room='KOBERECETTE';
const http=createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 const root=resolve('..');
 const file=resolve(root,'.'+path);
 if(!file.startsWith(root+sep))throw Error('bad path');
 const bytes=await readFile(file);
 res.setHeader('content-type',({'.js':'text/javascript','.css':'text/css', ".svg": "image/svg+xml",'.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp'})[extname(file)]||'application/octet-stream');res.end(bytes);
}catch{res.writeHead(404).end();}});
await new Promise(r=>http.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+http.address().port;
const browser=await engine.launch();const errors=[];
const received=[];backend.wss.on('connection',ws=>ws.on('message',bytes=>{try{const msg=JSON.parse(bytes.toString());if(msg.type==='event')received.push(msg.event?.type)}catch{}}));
async function app(name){
 const page=await browser.newPage({viewport:name==='Encounter'?{width:1280,height:800}:{width:1180,height:820},hasTouch:true,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(name+': '+e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.186.1/build/*',async route=>route.fulfill({body:await readFile(resolve('node_modules/three/build',route.request().url().split('/').at(-1))),contentType:'text/javascript'}));
 await page.goto(origin+'/'+name+'/index.html');return page;
}
try{
 const gm=await app('Encounter');await gm.waitForFunction(()=>window.RPGConnectMJ);
 await gm.evaluate(({endpoint,key,room})=>{
  document.querySelector('#rpgMjEndpoint').value=endpoint;document.querySelector('#rpgMjRoom').value=room;
  document.querySelector('#rpgMjKey').value=key;document.querySelector('#rpgMjConnect').click();
 },{endpoint,room,key:process.env.RPG_CONNECT_GM_KEY});
 await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);
 let brack;
 for(const name of ['Kentaro','Brackmard','Samoth','Rufus','Nans','Zephyr']){
  const p=await app(name);await p.waitForFunction(()=>window.RPGConnect);
  if(name==='Brackmard')brack=p;
  const token=backend.rooms.get(room).tokens.get(name.toLowerCase());assert.ok(token,'MJ issued invitation for '+name);
  await p.evaluate(({endpoint,room,token})=>{document.querySelector('[name=endpoint]').value=endpoint;document.querySelector('[name=room]').value=room;document.querySelector('[name=token]').value=token;RPGConnect.connect();},{endpoint,room,token});
  await p.waitForFunction(()=>RPGConnect.getStatus().connected&&RPGTable.active());
  await p.evaluate(()=>RPGGroupView.open());
  const editor=p.locator('dialog.rpg-self-editor');
  const stunned=editor.locator('[data-self-condition="Étourdi"]');
  const edit=p.locator('#rpgGroupView [data-edit-self]');
  await edit.click();
  await stunned.check();
  await editor.getByRole('button',{name:'Appliquer',exact:true}).click();
  await p.waitForFunction(()=>CompanionAPI.getState().statuses.includes('Étourdi'));
  await edit.click();
  await stunned.uncheck();
  await editor.getByRole('button',{name:'Appliquer',exact:true}).click();
  await p.waitForFunction(()=>!CompanionAPI.getState().statuses.includes('Étourdi'));
  console.log(name+': état personnel ajouté et retiré en Table Libre.');
 }
 const k=await app('Kobe');await k.getByRole('tab',{name:'Groupe',exact:true}).click();await k.getByRole('button',{name:'RPG Connect',exact:true}).click();
 const token=backend.rooms.get(room).tokens.get('kobe');assert.ok(token,'MJ issued invitation for Kobe');
 await k.getByLabel('Invitation Kobe').fill(['RPGCONNECT',endpoint,room,'kobe',token].join('|'));
 await k.getByRole('button',{name:'Rejoindre la partie'}).click();await k.getByText(/Connecté · MJ en ligne/).waitFor();
 await gm.waitForFunction(()=>RPGConnectMJ.getStatus().players.filter(p=>p.online).length===7);
 await k.getByRole('tab',{name:'Combat',exact:true}).click();
 await k.getByRole('button',{name:'Dégâts',exact:true}).click();await k.locator('[name=answer]').fill('8');await k.locator('[data-dialog-accept]').click();
 await gm.waitForFunction(()=>state.encounter.participants.find(p=>p.id==='cc-kobe')?.hp===75);
 assert.equal(await gm.evaluate(()=>state.encounter.participants.filter(p=>p.id==='cc-kobe').length),1);
 await k.getByRole('tab',{name:'Groupe',exact:true}).click();
 await k.locator('#rpg-connect').getByText('Samoth',{exact:true}).waitFor();
 await brack.locator('#rpgGroupView [data-edit-self]').click();
 const brackEditor=brack.locator('dialog.rpg-self-editor');
 const brackHp=brackEditor.locator('[name=hp]');
 const before=Number(await brackHp.inputValue());
 await brackHp.fill(String(before-7));
 await brackEditor.getByRole('button',{name:'Appliquer',exact:true}).click();
 await k.locator('.rpg-health-changes summary').filter({hasText:/Brack Mard · −7 PV/}).waitFor();
 // A real local Brack attack must not send combat results to the server.
 await brack.evaluate(()=>{document.querySelector('.tab[data-tab="combat"]')?.click();document.getElementById('manualRoll').value='1';startAttack();});
 await brack.waitForTimeout(700);
 assert.equal(received.filter(t=>/^(attack:|save:request|player-save:result)/.test(t||'')).length,0,'Table Libre sends no combat results');
 await gm.evaluate(async()=>{await EncounterIndexedDB.ready()});
 const hp=await gm.evaluate(()=>state.encounter.participants.find(p=>p.id==='cc-kobe')?.hp);
 await gm.reload();await gm.waitForFunction(()=>window.__encounterBootReady&&window.RPGConnectMJ);
 assert.equal(await gm.evaluate(()=>state.encounter.participants.find(p=>p.id==='cc-kobe')?.hp),hp,'MJ state persists on reload');
 await gm.evaluate(({endpoint,key,room})=>{document.querySelector('#rpgMjEndpoint').value=endpoint;document.querySelector('#rpgMjRoom').value=room;document.querySelector('#rpgMjKey').value=key;document.querySelector('#rpgMjConnect').click()},{endpoint,room,key:process.env.RPG_CONNECT_GM_KEY});
 await gm.waitForFunction(()=>RPGConnectMJ.getStatus().connected);
 console.log('PASS: actual local Brack attack, zero transmitted results; MJ reload and reconnection');
 assert.deepEqual(errors,[]);
 console.log('SEVEN_CLIENTS: actual Encounter issued all seven invitations; six historical apps + Kobe connected; local damage 83→75 mirrored once; Kobe receives Samoth in group.');
}finally{await browser.close();for(const ws of backend.wss.clients)ws.terminate();backend.wss.close();backend.server.close();http.close();}
