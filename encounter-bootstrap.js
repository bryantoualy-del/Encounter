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
   overlay.textContent='Démarrage interrompu : '+error.message+'. Aucune donnée n’a été effacée. Vous pouvez restaurer votre export JSON après résolution.';
 }
})();
