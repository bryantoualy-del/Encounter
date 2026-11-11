/* Start Encounter only after its asynchronous IndexedDB state is loaded.
 * The deferred classic/module scripts preserve their original execution order.
 * A failed/corrupt database blocks startup rather than overwriting saved data.
 */
(async()=>{'use strict';
 const overlay=document.createElement('div');
 overlay.id='encounterStorageBoot';
 overlay.setAttribute('role','status');
 overlay.style.cssText='position:fixed;inset:0;z-index:200000;background:#0d1723;color:#f4eddc;display:grid;place-items:center;padding:30px;text-align:center;font:16px system-ui';
 overlay.textContent='Chargement de la bibliothèque et des rencontres…';
 document.body.append(overlay);
 window.__encounterBootReady=false;
 try{
   const db=globalThis.EncounterIndexedDB;
   if(!db)throw Error('Moteur IndexedDB absent');
   await db.open();
   const saved=await db.load();
   const backups=await db.backups();
   const validated=saved===undefined?null:EncounterPersistence.migrate(saved).data;
   if(validated&&(!validated.encounter||!Array.isArray(validated.encounter.participants)||!Array.isArray(validated.monsters)))
     throw Error('État IndexedDB incomplet : impossible de démarrer sans restauration JSON');
   if(validated?.persistenceRestoreContext){
     EncounterPersistence.restoreContext(localStorage,validated.persistenceRestoreContext);
     delete validated.persistenceRestoreContext;
   }
   window.__encounterInitialState=validated;
   window.__encounterInitialBackups=Array.isArray(backups.find(x=>Array.isArray(x)))?backups.find(x=>Array.isArray(x)):[];
   const runtimeErrors=[];
   const captureRuntimeError=event=>runtimeErrors.push(event.message||event.error?.message||'Script error');
   window.addEventListener('error',captureRuntimeError);
   for(const old of document.querySelectorAll('script[data-encounter-deferred]')){
     const next=document.createElement('script');
     for(const attr of old.attributes){
       if(attr.name==='data-encounter-deferred'||attr.name==='type'||attr.name==='data-encounter-original-type')continue;
       next.setAttribute(attr.name,attr.value);
     }
     const originalType=old.dataset.encounterOriginalType;
     if(originalType)next.type=originalType;
     if(old.src){
       // A dynamically created script is async by default. Wait for each one
       // to finish before loading the next dependency.
       next.async=false;
       await new Promise((resolve,reject)=>{
         next.onload=resolve;
         next.onerror=()=>reject(Error('Script indisponible : '+old.getAttribute('src')));
         old.after(next);
       });
     }else{
       next.textContent=old.textContent;
       old.after(next);
     }
   }
   window.removeEventListener('error',captureRuntimeError);
   if(runtimeErrors.length)throw Error('Initialisation Encounter impossible : '+runtimeErrors[0]);
   window.dispatchEvent(new Event('encounter:boot-complete'));
   window.__encounterBootReady=true;
   overlay.remove();
 }catch(error){
   console.error('Encounter IndexedDB startup failure',error);
   overlay.setAttribute('role','alert');
   overlay.replaceChildren();
   const panel=document.createElement('div');
   panel.style.cssText='max-width:650px;display:grid;justify-items:center;gap:16px';
   const title=document.createElement('strong');
   title.textContent='Rencontre indisponible — sauvegarde locale non chargée';
   const detail=document.createElement('p');
   detail.textContent=error.message+'. Aucune donnée n’a été effacée. Restaurez un export complet JSON pour reprendre.';
   const input=document.createElement('input');
   input.type='file';
   input.accept='.json,application/json';
   input.setAttribute('aria-label','Restaurer un export Encounter JSON');
   const message=document.createElement('p');
   message.setAttribute('role','status');
   input.addEventListener('change',async()=>{
     const file=input.files?.[0];if(!file)return;
     input.disabled=true;message.textContent='Vérification et restauration du JSON…';
     try{
       const raw=JSON.parse((await file.text()).replace(/^\\uFEFF/,''));
       const data=EncounterPersistence.migrate(raw).data;
       if(!data.encounter||!Array.isArray(data.encounter.participants)||!Array.isArray(data.monsters))
         throw Error('Export Encounter complet requis (rencontre et bestiaire)');
       await globalThis.EncounterIndexedDB.commit(data);
       message.textContent='Restauration confirmée. Rechargement…';
       location.reload();
     }catch(restoreError){
       message.textContent='Restauration impossible : '+restoreError.message+'. Les données précédentes sont conservées.';
       input.disabled=false;
     }
   });
   panel.append(title,detail,input,message);overlay.append(panel);
 }
})();
