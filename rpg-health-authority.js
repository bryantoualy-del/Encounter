/* Pure Encounter health resolution. Transport and character resources stay outside. */
(function(root){'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const TYPES=['heal:request','tempHp:request','maxHp:request','revive:request'];
 const dead=p=>p.dead===true||p.lifeStatus==='dead'||p.conditions?.some(c=>/^(mort|dead)$/i.test(c.name));
 const friendly=p=>['player','ally'].includes(p.kind);
 const integer=n=>Number.isSafeInteger(n)&&n>0&&n<=100000;
 const health=p=>({current:p.hp,max:p.maxHp,temp:p.tempHp||0,tempSource:p.tempSource||'',revision:p.rpgHealthRevision||0});
 function bump(p){p.rpgHealthManaged=true;p.rpgHealthRevision=(p.rpgHealthRevision||0)+1;if(!p.tempHp)p.tempSource='';}
 function resolve(enc,event,actorId,context={}){
  const q=event.payload||{},id=String(q.actionId||event.id||''),ledger=enc.rpgHealthLedger||(enc.rpgHealthLedger={});
  const fingerprint=JSON.stringify([event.type,event.characterId,actorId,q.combatId,q.targetIds,q.source,q.amount,q.replace,q.durationMs,q.effectId,q.operation,q.recoveryKind]);
  if(!id||id.length>160)return{ok:false,error:'Identifiant invalide',actionId:id};
  const old=ledger[id];if(old)return old.fingerprint===fingerprint?{...copy(old.result),replayed:true}:{ok:false,error:'Identifiant déjà utilisé pour une autre action',actionId:id};
  const fail=error=>{const result={ok:false,error,actionId:id,family:event.type};ledger[id]={fingerprint,result};return copy(result)};
  if(!TYPES.includes(event.type))return fail('Famille inconnue');
  if(q.combatId!==context.combatId)return fail('Combat périmé');
  const actor=enc.participants.find(p=>p.id===actorId);if(!actor||!friendly(actor))return fail('Acteur absent ou camp invalide');
  const ids=q.targetIds;if(!Array.isArray(ids)||!ids.length||ids.length>6||ids.some(x=>typeof x!=='string')||new Set(ids).size!==ids.length)return fail('Cibles distinctes requises (1 à 6)');
  const targets=ids.map(id=>enc.participants.find(p=>p.id===id));
  if(targets.some(p=>!p||!friendly(p)||!Number.isFinite(p.hp)||!Number.isFinite(p.maxHp)||p.maxHp<1))return fail('Cible absente ou camp invalide');
  if(!String(q.source||'').trim())return fail('Source requise');
  if(event.type!=='maxHp:request'||q.operation!=='expire')if(!integer(q.amount))return fail('Montant entier positif requis');
  if(event.type!=='revive:request'&&targets.some(dead))return fail('Un soin ordinaire ne ramène pas un mort');
  if(event.type==='revive:request'){
   if(q.amount!==1||targets.some(p=>p.hp!==0))return fail('Récupération exige 0 PV et retour à 1 PV');
   if(q.recoveryKind==='revivify'){
    if(!context.gmValidated||targets.some(p=>!dead(p)||!Number.isFinite(p.diedAt)||context.now-p.diedAt>60000||context.now<p.diedAt))return fail('Revivifier exige validation MJ et mort depuis moins de 1 minute');
   }else if(q.recoveryKind==='judgment'){
    if(ids.length!==1||ids[0]!==actorId||dead(actor)||!context.judgmentEligible)return fail('Jugement différé non admissible');
   }else return fail('Récupération inconnue');
  }
  if(event.type==='maxHp:request'){
   if(!q.effectId||!['apply','expire'].includes(q.operation))return fail('Effet et opération requis');
   if(q.operation==='apply'&&(![5,10].includes(q.amount)||ids.length>3||q.source!=='Aide'||q.durationMs!==28800000))return fail('Aide : +5/+10, 3 cibles, 8 heures');
   if(q.operation==='apply'&&targets.some(p=>Object.values(p.rpgMaxHpEffects||{}).some(e=>e.source==='Aide')))return fail('Aide déjà active : retrait MJ requis avant remplacement');
   if(q.operation==='expire'&&targets.some(p=>!p.rpgMaxHpEffects?.[q.effectId]))return fail('Effet absent');
  }
  const results=[];
  for(const p of targets){
   const before=health(p);let applied=0,kept=false;
   if(event.type==='heal:request'){applied=Math.min(q.amount,Math.max(0,p.maxHp-p.hp));p.hp+=applied;if(p.hp>0)p.conditions=(p.conditions||[]).filter(c=>!/^(inconscient|unconscious)$/i.test(c.name));}
   if(event.type==='tempHp:request'){
    // Recipient may explicitly choose replacement; otherwise retain the greater pool and its source.
    kept=!q.replace&&(p.tempHp||0)>=q.amount;
    if(!kept){p.tempHp=q.amount;p.tempSource=q.source;p.tempMetadata=copy(q.metadata||{});applied=q.amount;}
   }
   if(event.type==='maxHp:request'){
    p.rpgMaxHpEffects=p.rpgMaxHpEffects||{};
    if(q.operation==='apply'){p.rpgMaxHpEffects[q.effectId]={source:q.source,amount:q.amount,expiresAt:context.now+q.durationMs};p.maxHp+=q.amount;p.hp+=q.amount;applied=q.amount;}
    else{const e=p.rpgMaxHpEffects[q.effectId];p.maxHp=Math.max(1,p.maxHp-e.amount);p.hp=Math.min(p.hp,p.maxHp);delete p.rpgMaxHpEffects[q.effectId];}
   }
   if(event.type==='revive:request'){p.hp=1;p.dead=false;p.lifeStatus='alive';delete p.diedAt;p.conditions=(p.conditions||[]).filter(c=>!/^(mort|dead|inconscient|unconscious)$/i.test(c.name));applied=1;}
   bump(p);results.push({targetId:p.id,targetName:p.name,requestedAmount:q.amount||0,appliedAmount:applied,kept,before,after:health(p)});
  }
  const result={ok:true,actionId:id,family:event.type,source:q.source,results};ledger[id]={fingerprint,result};return copy(result);
 }
 function expire(enc,now){const changed=[];for(const p of enc.participants){for(const [id,e]of Object.entries(p.rpgMaxHpEffects||{}))if(e.expiresAt<=now){p.maxHp=Math.max(1,p.maxHp-e.amount);p.hp=Math.min(p.hp,p.maxHp);delete p.rpgMaxHpEffects[id];bump(p);changed.push(p.id)}}return changed;}
 const api={resolve,expire,health,dead,friendly,bump};root.RPGHealthAuthority=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
