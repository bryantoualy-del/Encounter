/* Encounter V1.5: asynchronous local persistence engine.
 * No network access. Keep export/import JSON as the portable backup format.
 * This module does NOT switch Encounter to IndexedDB until app bootstrap is migrated.
 */
(()=>{'use strict';
 const DB_NAME='encounter-v15', DB_VERSION=1;
 const STORES=['state','backups'];
 let openPromise,writeTail=Promise.resolve();
 function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('IndexedDB request failed'));});}
 function transaction(db,stores,mode,run){
   return new Promise((resolve,reject)=>{
     const tx=db.transaction(stores,mode);
     let result,failed=false;
     tx.oncomplete=()=>resolve(result);
     tx.onerror=()=>{failed=true;reject(tx.error||Error('IndexedDB transaction failed'));};
     tx.onabort=()=>{if(!failed)reject(tx.error||Error('IndexedDB transaction aborted'));};
     try{result=run(tx);}catch(error){try{tx.abort();}catch{}reject(error);}
   });
 }
 function open(){
   if(!('indexedDB' in globalThis))return Promise.reject(Error('IndexedDB indisponible'));
   if(!openPromise){
     openPromise=new Promise((resolve,reject)=>{
       const req=indexedDB.open(DB_NAME,DB_VERSION);
       req.onupgradeneeded=()=>{const db=req.result;for(const store of STORES)if(!db.objectStoreNames.contains(store))db.createObjectStore(store);};
       req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();openPromise=null;};resolve(db);};
       req.onerror=()=>reject(req.error||Error('IndexedDB open failed'));
       req.onblocked=()=>reject(Error('IndexedDB blocked by another tab'));
     }).catch(error=>{openPromise=null;throw error;});
   }
   return openPromise;
 }
 async function get(store,key){const db=await open();return request(db.transaction(store,'readonly').objectStore(store).get(key));}
 async function put(store,key,value){
   const db=await open();
   return transaction(db,[store],'readwrite',tx=>tx.objectStore(store).put(value,key));
 }
 async function remove(store,key){
   const db=await open();return transaction(db,[store],'readwrite',tx=>tx.objectStore(store).delete(key));
 }
 function enqueue(job){const running=writeTail.then(job);writeTail=running.catch(()=>{});return running;}
 function commit(value){
   // Take a snapshot at invocation time: later UI mutations must not alter queued writes.
   const snapshot=structuredClone(value);
   return enqueue(()=>put('state','current',snapshot));
 }
 async function load(){await writeTail;return get('state','current');}
 function backup(id,value){const snapshot=structuredClone(value);return enqueue(()=>put('backups',id,snapshot));}
 async function backups(){await writeTail;const db=await open();return request(db.transaction('backups','readonly').objectStore('backups').getAll());}
 function restore(value,validate){
   // The caller supplies EncounterPersistence.migrate for schema validation.
   const migrated=validate(value).data;
   return commit(migrated);
 }
 async function clearForTests(){await writeTail;await remove('state','current');}
 globalThis.EncounterIndexedDB={open,load,commit,backup,backups,restore,clearForTests,ready:()=>writeTail};
})();
