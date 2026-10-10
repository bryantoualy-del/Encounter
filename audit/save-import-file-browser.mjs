import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=resolve(new URL('../',import.meta.url).pathname),checks=[],errors=[];
const http=createServer(async(req,res)=>{try{const f=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(f)]||'application/octet-stream');res.end(await readFile(f))}catch{res.writeHead(404);res.end()}});await new Promise(r=>http.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/chromium',headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());const base='http://127.0.0.1:'+http.address().port+'/index.html';
function check(name,value){assert.ok(value,name);checks.push(name);console.log('PASS',name)}
async function importFile(data){await page.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.querySelector('#importDialog').showModal()});await page.locator('#importFile').setInputFiles({name:'ancien.json',mimeType:'application/json',buffer:Buffer.from(data)});await page.waitForFunction(()=>document.querySelector('#importText').value.length>0);await page.locator('#importForm button[type=submit]').click();await page.locator('#mjImportProfileDialog').waitFor({state:'visible'});await page.locator('#mjImportProfileDialog button[data-close]').first().click();}
try{
 const fixturePath=resolve(process.argv[2]||'input.json'),raw=await readFile(fixturePath,'utf8'),fixture=JSON.parse(raw.replace(/^\uFEFF/,''));
 await page.goto(base);await page.waitForFunction(()=>typeof state!=='undefined');
 await importFile(raw);
 check('Fichier fourni importé par le sélecteur réel',await page.evaluate(items=>items.every(m=>state.monsters.some(x=>x.id===m.id)),fixture));
 check('Toutes les fiches correspondent à leur normalisation complète',await page.evaluate(items=>items.every(m=>JSON.stringify(state.monsters.find(x=>x.id===m.id))===JSON.stringify(normalizeMonster(EncounterPersistence.migrate([m]).data[0]))),fixture));
 await page.evaluate(items=>{for(const item of items)addMonsterToCombat(item.id,1,12,false);state.encounter.name='Validation technique';state.encounter.round=3;saveState();openEncounterManager()},fixture);
 await page.locator('#btnSaveEncounter').click();await page.locator('#saveEncounterNameDialog input').fill('Validation technique');await page.locator('#saveEncounterNameDialog button[type=submit]').click();
 check('Sauvegarde des fiches et de la préparation',await page.evaluate(n=>state.savedEncounters.length===1&&state.encounter.participants.length===n,fixture.length));
 await page.reload();check('Rechargement de la préparation conservé',await page.evaluate(n=>state.encounter.participants.length===n&&state.encounter.round===3,fixture.length));
 const stress=await page.evaluate(()=>{let failures=0;for(let i=0;i<20;i++){try{forceBackup('Validation quota')}catch{failures++}}return {failures,backups:backupStore().length}});check('Historique saturé réduit et backups continuent',stress.failures===0&&stress.backups>0);
 await page.locator('#btnMore').click();const waiting=page.waitForEvent('download');await page.locator('#btnExport').click();const dl=await waiting,exported=JSON.parse(await readFile(await dl.path(),'utf8'));check('Export contient la préparation et ses sauvegardes',exported.savedEncounters.length===1&&exported.encounter.participants.length===fixture.length);
 const before=exported.monsters;await page.evaluate(()=>localStorage.clear());await page.reload();await importFile(JSON.stringify(exported));
 check('Réimport identique de toutes les fiches',await page.evaluate(items=>items.every(m=>JSON.stringify(state.monsters.find(x=>x.id===m.id))===JSON.stringify(m)),before));
 check('Réimport conserve les participants et le round',await page.evaluate(n=>state.encounter.round===3&&state.encounter.participants.length===n&&state.savedEncounters.length===1,fixture.length));
 check('Aucune exception JavaScript',errors.length===0);
}finally{await writeFile(resolve(root,'audit/save-import-file-results.json'),JSON.stringify({checks,errors},null,2));await browser.close();http.close()}
