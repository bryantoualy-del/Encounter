import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const root=resolve(new URL('../../',import.meta.url).pathname);
const out=resolve(new URL('./result-focus-evidence/',import.meta.url).pathname);
await mkdir(out,{recursive:true});
const name=process.env.RESULT_BROWSER==='webkit'?'webkit':'chromium';
const engine=name==='webkit'?webkit:chromium;
const web=createServer(async(req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=resolve(root,'.'+pathname);
  if(!file.startsWith(root+'/'))throw Error('Path traversal');
  const content=await readFile(file);
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[extname(file)]||'application/octet-stream');
  res.end(content);
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(ok=>web.listen(0,'127.0.0.1',ok));
const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
const target='http://127.0.0.1:'+web.address().port;
const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,serviceWorkers:'block'});
const types={fire:'#FF6538',cold:'#65D9F5',lightning:'#F6D44B',thunder:'#568BEB',acid:'#A4D64F',poison:'#39B87B',necrotic:'#9461BC',radiant:'#FFE19A',psychic:'#E577D6',force:'#B18BFF',bludgeoning:'#B49B7B',piercing:'#A9BAC8',slashing:'#E17A80'};
const companions=['Brackmard','Kentaro','Samoth','Nans','Rufus','Zephyr','Kobe'];
const results=[];
try{
 for(const repo of companions){
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(target+'/'+repo+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.CompanionResultFocus?.showStructured,{timeout:25000});
  if(repo==='Brackmard'){
   const btn=page.locator('#gwmBtn');
   await btn.click();
   await page.waitForTimeout(50);
   const toggle=await page.evaluate(()=>({active:document.querySelector('#gwmBtn').getAttribute('aria-pressed'),card:!!document.querySelector('#companion-result-focus:not([hidden])')}));
   assert.equal(toggle.active,'true','Cogneur lourd must activate');
   assert.equal(toggle.card,false,'Cogneur lourd must not show damage result');
  }
  const result=await page.evaluate(async palette=>{
   const api=window.CompanionResultFocus;
   const aliases={Brackmard:'#rbody',Kentaro:'#kentaro-ribbon .body',Samoth:'#resultText',Nans:'#rb',Rufus:'#resultRibbonText',Zephyr:'#ribbonText',Kobe:'#ribbon .rb'};
   const repo=location.pathname.split('/')[1];
   const raw=document.querySelector(aliases[repo]);
   if(raw)raw.textContent='18 dégâts feu';
   for(const id of ['ribbon','kentaro-ribbon','result','resultRibbon']){
    const el=document.getElementById(id);if(el)el.hidden=false;
   }
   const old=document.getElementById('kentaro-ribbon');if(old)old.classList.add('show');
   await new Promise(r=>setTimeout(r,20));
   const errors=[],seen=[];
   for(const [type,expected] of Object.entries(palette)){
    api.showStructured({eventId:'audit-'+type,title:'Audit dégâts',damages:[{type,amount:18,formula:'1d20',dice:[18]}]});
    const card=document.querySelector('#companion-result-focus:not([hidden])');
    const typed=card?.querySelector('.crf-typed strong');
    const color=typed?getComputedStyle(typed).color:'';
    const rgb=expected.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16));
    const correct='rgb('+rgb.join(', ')+')';
    if(color!==correct)errors.push(type+': '+color+' != '+correct);
    seen.push(type);
   }
   api.showStructured({eventId:'audit-mixed',title:'Mixte',damages:[{type:'fire',amount:11},{type:'cold',amount:7}]});
   const focus=document.querySelector('#companion-result-focus:not([hidden])');
   const mixed=[...focus.querySelectorAll('.crf-typed strong')].map(x=>getComputedStyle(x).color);
   if(mixed.length!==2||mixed[0]===mixed[1])errors.push('mixed damage components not independently colored');
   const visible=el=>{
    if(!el)return false;
    for(let p=el;p&&p.nodeType===1;p=p.parentElement){
     const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;
    }
    return el.getClientRects().length>0;
   };
   const duplicates=Object.values(aliases).filter(selector=>visible(document.querySelector(selector)));
   if(duplicates.length)errors.push('legacy ribbon still showing result: '+duplicates.join(', '));
   if(document.querySelectorAll('#companion-result-focus').length!==1)errors.push('multiple focus cards');
   const repeat=api.showStructured({eventId:'audit-mixed',title:'Mixte',damages:[{type:'fire',amount:11}]});
   if(repeat!==false)errors.push('eventId deduplication failed');
   await new Promise(r=>setTimeout(r,20));
   if(focus.querySelectorAll('.crf-typed').length!==2)errors.push('late ribbon overwrote structured result');
   return {errors,types:seen.length,mixed,duplicates};
  },types);
  await page.screenshot({path:out+'/'+name+'-'+repo.toLowerCase()+'.png'});
  results.push({repo,...result,pageErrors:errors.slice(0,5)});
  assert.deepEqual(result.errors,[],repo+' result focus');
  assert.equal(result.types,13,repo+' 13 semantic types');
  console.log('PASS',repo,'13 damage types, mixed types, dedup, no legacy ribbon overlap');
  await page.close();
 }
}catch(error){console.error('AUDIT FAILED',error.stack||error);process.exitCode=1}
finally{
 await writeFile(out+'/'+name+'-audit.json',JSON.stringify(results,null,2));
 await browser.close();await new Promise(r=>web.close(r));
}
