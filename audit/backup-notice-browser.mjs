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
 await page.clock.install();await page.goto(base);await page.waitForFunction(()=>typeof state!=='undefined');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;let attempts=0;Storage.prototype.setItem=function(k,v){if(k===BACKUP_KEY){attempts++;throw new DOMException('plein','QuotaExceededError')}return original.call(this,k,v)};lastBackupAt=0;saveState();window.bannerAttempts=attempts;Storage.prototype.setItem=original;});
 check('Partie effectivement enregistrée malgré backup refusé',await page.evaluate(()=>!!localStorage.getItem(STORAGE_KEY)));
 check('Backup refusé affiche avertissement et pas erreur rouge',await page.evaluate(()=>document.querySelector('#encounterStorageStatus')?.dataset.level==='warning'&&document.querySelector('#encounterStorageStatus')?.getAttribute('role')==='status'));
 await page.clock.fastForward(8500);check('Avertissement disparaît automatiquement',await page.locator('#encounterStorageStatus').count()===0);
 check('Échec backup temporisé pendant cinq minutes',await page.evaluate(()=>{const original=forceBackup;let attempts=0;forceBackup=()=>{attempts++;throw Error('plein')};try{saveState();return attempts===0}finally{forceBackup=original}}));
 await page.evaluate(()=>EncounterPersistence.notify('Backup indisponible',{level:'warning'}));await page.locator('#encounterStorageStatus button').click();check('Avertissement refermable',await page.locator('#encounterStorageStatus').count()===0);
 await page.evaluate(()=>{EncounterPersistence.notify('Ancien avertissement',{level:'warning'});const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('plein','QuotaExceededError')};try{saveState()}catch{}finally{Storage.prototype.setItem=original}});
 check('Véritable échec de sauvegarde affiche une erreur',await page.evaluate(()=>document.querySelector('#encounterStorageStatus')?.dataset.level==='error'&&document.querySelector('#encounterStorageStatus')?.textContent.includes('Sauvegarde non effectuée')));
 await page.clock.fastForward(9000);check('Ancien minuteur ne supprime pas la vraie erreur',await page.evaluate(()=>document.querySelector('#encounterStorageStatus')?.dataset.level==='error'));
 await page.evaluate(()=>EncounterPersistence.notify('Backup indisponible',{level:'warning'}));check('Avertissement secondaire ne masque pas erreur réelle',await page.evaluate(()=>document.querySelector('#encounterStorageStatus')?.dataset.level==='error'));
 await page.evaluate(()=>saveState());check('Sauvegarde réussie retire erreur résolue',await page.locator('#encounterStorageStatus').count()===0);check('Aucune exception JavaScript',errors.length===0);
}finally{await writeFile(resolve(root,'audit/backup-notice-results.json'),JSON.stringify({checks,errors},null,2));await browser.close();http.close()}
