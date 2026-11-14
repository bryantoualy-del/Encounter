/* Real application pages, local isolated server, no production room. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('..'),name=process.env.E2E_BROWSER||'chromium',engine=name==='webkit'?webkit:chromium;
const out=resolve('docs/v23/evidence/'+name);await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!path.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await engine.launch({headless:true});const report=[];
try{
 for(const app of ['Kobe','Brackmard','Samoth','Nans','Rufus','Zephyr','Encounter']){
  const context=await browser.newContext({viewport:app==='Encounter'?{width:1280,height:800}:{width:1180,height:820},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.186.1/build/*',async route=>{const f=route.request().url().split('/').at(-1);await route.fulfill({body:await readFile(resolve('node_modules/three/build',f)),contentType:'text/javascript'});});
  console.log('Checking '+app);
  await page.goto(origin+'/'+app+'/index.html');
  if(app==='Encounter')await page.waitForFunction(()=>window.__encounterBootReady && window.RPGVisualTypes);else await page.waitForFunction(()=>window.CompanionResultFocus&&window.RPGVisualTypes);
  await page.screenshot({path:out+'/'+app+'-combat.png'});
  const types=JSON.parse(await readFile(resolve(root,app,'assets/icons/damage/manifest.json'),'utf8')).types;
  for(const t of types){assert.equal(await page.evaluate(id=>RPGVisualTypes.damage(id).name_fr,t.id),t.name_fr);}
  // Exercise the actual result renderer without changing character values.
  await page.evaluate(app=>{
   const parts=[{type:'slashing',amount:12},{type:'fire',amount:8},{type:'cold',amount:7},{type:'force',amount:6},{type:'psychic',amount:5}];
   if(app==='Encounter')showActionPopup({freeEnemy:true,actorKind:'enemy',ability:'Attaque mixte',rolls:[{label:'Lame élémentaire',total:23,detail:'d20 16 + 7',damage:38,damageParts:parts}]},'Attaque mixte');
   else CompanionResultFocus.showStructured({id:'v23-mixed',title:'Attaque mixte',damages:parts});
  },app);
  const result=page.locator(app==='Encounter'?'#actionPopup':'#companion-result-focus');await result.waitFor({state:'visible'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.rpg-damage-icon')].length>=5&&[...document.querySelectorAll('.rpg-damage-icon')].every(i=>i.complete&&i.naturalWidth===256));
  const rendered=await result.locator('.rpg-damage-icon').evaluateAll(xs=>xs.map(i=>({src:i.getAttribute('src'),width:i.getBoundingClientRect().width,text:i.parentElement.textContent})));
  assert.equal(rendered.length,5);for(let i=0;i<5;i++){assert.equal(rendered[i].width,28);assert.match(rendered[i].text,new RegExp(String([12,8,7,6,5][i])));}
  await page.screenshot({path:out+'/'+app+'-mixed.png'});
  if(app!=='Encounter'){
   const unchanged=await page.evaluate(()=>{const before=document.querySelector('#companion-result-focus').textContent;const accepted=CompanionResultFocus.showStructured({id:'v23-mixed',damages:[{type:'fire',amount:999}]});return !accepted&&before===document.querySelector('#companion-result-focus').textContent;});assert.ok(unchanged,'duplicate result ignored');
  }
  // Real image loads at both required sizes, on both backgrounds, all 13 types.
  await page.evaluate(types=>{const grid=document.createElement('section');grid.id='v23-proof';grid.style='position:fixed;inset:0;z-index:999999;background:#151419;padding:24px;display:grid;grid-template-columns:repeat(13,1fr);gap:6px;align-content:start';for(const bg of ['#151419','#f3eee4'])for(const t of types){const cell=document.createElement('div');cell.style='background:'+bg+';padding:8px;color:#888';for(const size of [24,32])cell.append(RPGVisualTypes.damageIcon(t.id,size));cell.append(document.createTextNode(t.name_fr));grid.append(cell)}document.body.append(grid)},types);
  await page.waitForFunction(()=>[...document.querySelectorAll('#v23-proof img')].every(i=>i.complete&&i.naturalWidth===256));
  await page.screenshot({path:out+'/'+app+'-13-types.png'});
  assert.deepEqual(errors,[],app+' uncaught errors');report.push({app,types:13,mixed:rendered,errors});await context.close();
 }
 await writeFile(out+'/results.json',JSON.stringify(report,null,2));console.log('PASS '+name+': seven apps, 13 PNGs, five separate components, replay suppression, real 24/28/32px screenshots');
}finally{await browser.close();server.close();}
