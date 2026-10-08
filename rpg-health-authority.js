/* Pure Encounter health resolution. Transport and character resources stay outside. */
(function(root){'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const TYPES=['heal:request','tempHp:request','maxHp:request','revive:request'];
 const dead=p=>p.dead===true||p.lifeStatus==='dead'||p.conditions?.some(c=>/^(mort|dead)$/i.test(c.name));
 const friendly=p=>['player','ally'].includes(p.kind);
 const integer=n=>Number.isSafeInteger(n)&&n>0&&n<=100000;
 const health=p=>({epoch:p.rpgHealthEpoch||'',current:p.hp,max:p.maxHp,temp:p.tempHp||0,tempSource:p.tempSource||'',tempMetadata:copy(p.tempMetadata||{}),judgmentSpent:p.rpgJudgmentSpent||null,revision:p.rpgHealthRevision||0});
 function bump(p){p.rpgHealthEpoch=p.rpgHealthEpoch||(globalThis.crypto?.randomUUID?.()||String(p.id)+':'+Date.now()+':'+Math.random());p.rpgHealthManaged=true;p.rpgHealthRevision=(p.rpgHealthRevision||0)+1;if(!p.tempHp)p.tempSource='';}
 function resolve(enc,event,actorId,context={}){
  const q=event.payload||{},id=String(q.actionId||event.id||''),ledger=enc.rpgHealthLedger||(enc.rpgHealthLedger={});
  const fingerprint=JSON.stringify([event.type,event.characterId,actorId,q.combatId,q.targetIds,q.source,q.amount,q.replace,q.durationMs,q.effectId,q.operation,q.recoveryKind,q.metadata,q.operation]);
  if(!id||id.length>160)return{ok:false,error:'Identifiant invalide',actionId:id};
  const old=ledger[id];if(old)return old.fingerprint===fingerprint?{...copy(old.result),replayed:true}:{ok:false,error:'Identifiant déjà utilisé pour une autre action',actionId:id};
  const fail=error=>{const result={ok:false,error,actionId:id,family:event.type};ledger[id]={fingerprint,result};return copy(result)};
  if(!TYPES.includes(event.type))return fail('Famille inconnue');
  if(q.combatId!==context.combatId)return fail('Combat périmé');
  const actor=enc.participants.find(p=>p.id===actorId);if(!actor||!friendly(actor)||dead(actor))return fail('Acteur absent, mort ou camp invalide');
  const ids=q.targetIds;if(!Array.isArray(ids)||(!ids.length&&!(q.source==='Ancre sacrée'&&Number.isFinite(q.metadata?.anchorDamage)))||ids.length>(q.source==='Ancre sacrée'?50:6)||ids.some(x=>typeof x!=='string')||new Set(ids).size!==ids.length)return fail('Cibles distinctes requises (1 à 6)');
  const targets=ids.map(id=>enc.participants.find(p=>p.id===id));
  if(targets.some(p=>!p||!friendly(p)||!Number.isFinite(p.hp)||!Number.isFinite(p.maxHp)||p.maxHp<1))return fail('Cible absente ou camp invalide');
  if(!String(q.source||'').trim())return fail('Source requise');
  if(event.type!=='maxHp:request'||q.operation!=='expire')if(!integer(q.amount))return fail('Montant entier positif requis');
  if(event.type!=='revive:request'&&targets.some(dead))return fail('Un soin ordinaire ne ramène pas un mort');
  if(event.type==='heal:request'&&targets.some(p=>p.conditions?.some(c=>c.effectKind==='shroudHealingBlock')))return fail('Voile spirituel : soins empêchés');
  if(event.type==='heal:request'&&q.source==='Imposition des mains'&&targets.some(p=>/mort.?vivant|undead|artificiel|construct/i.test(context.targetTypes?.[p.id]||p.entityType||'')))return fail('Imposition sans effet sur morts-vivants ou artificiels');
  if(event.type==='revive:request'){
   if(q.amount!==1||targets.some(p=>p.hp!==0))return fail('Récupération exige 0 PV et retour à 1 PV');
   if(q.recoveryKind==='revivify'){
    if(ids.length!==1||!context.gmValidated||targets.some(p=>{const deathAt=Number.isFinite(p.diedAt)?p.diedAt:context.validatedDeathAt;return !dead(p)||!Number.isFinite(deathAt)||context.now-deathAt>=60000||context.now<deathAt}))return fail('Revivifier exige validation MJ et mort depuis moins de 1 minute');
   }else if(q.recoveryKind==='judgment'){
    if(ids.length!==1||ids[0]!==actorId||dead(actor)||!context.judgmentEligible)return fail('Jugement différé non admissible');
   }else return fail('Récupération inconnue');
  }
  const markRest=event.type==='maxHp:request'&&q.source==='Marque d’Asmodeus'&&q.operation==='expire';
  if(markRest&&(event.characterId!=='zephyr'||ids.length!==1||ids[0]!==actorId))return fail('Repos de Zéphyr uniquement');
  if(event.type==='maxHp:request'&&!markRest){
   if(!q.effectId||!['apply','expire'].includes(q.operation))return fail('Effet et opération requis');
   if(q.operation==='apply'&&(![5,10].includes(q.amount)||ids.length>3||q.source!=='Aide'||q.durationMs!==28800000))return fail('Aide : +5/+10, 3 cibles, 8 heures');
   if(q.operation==='apply'&&targets.some(p=>Object.values(p.rpgMaxHpEffects||{}).some(e=>e.source==='Aide')))return fail('Aide déjà active : retrait MJ requis avant remplacement');
   if(q.operation==='expire'&&targets.some(p=>!p.rpgMaxHpEffects?.[q.effectId]))return fail('Effet absent');
  }
  if(event.type==='tempHp:request'&&q.source==='Cri de ralliement'&&(event.characterId!=='nans'||q.amount<6||q.amount>16))return fail('Cri de ralliement : Nans, 2d6+4 requis');
  const anchor=q.source==='Ancre sacrée'&&event.type==='heal:request';
  if(anchor&&(event.characterId!=='zephyr'||q.amount!==14||dead(actor)))return fail('Ancre sacrée : Zéphyr, soin de 14 PV');
  if(anchor&&q.operation==='arm'){if(actor.rpgAnchorPending)return fail('Ancre déjà préparée');actor.rpgAnchorPending={actionId:id,targetIds:ids,combatId:q.combatId};bump(actor);const result={ok:true,actionId:id,family:event.type,source:q.source,results:[{targetId:actor.id,targetName:actor.name,requestedAmount:14,appliedAmount:0,armed:true}]};ledger[id]={fingerprint,result};return copy(result)}
  const anchorDamage=anchor&&q.operation==='trigger';
  if(anchorDamage&&(!context.anchorApproved||!Number.isSafeInteger(q.metadata?.anchorDamage)||q.metadata.anchorDamage<0))return fail('Attaque liée à l’Ancre requise');
  const sacrifice=event.type==='heal:request'&&q.source==='Flèche sacrificielle';
  if(sacrifice&&(event.characterId!=='zephyr'||ids.length!==1||ids[0]===actorId||dead(actor)||q.metadata?.selfDamage!==q.amount))return fail('Flèche sacrificielle : coût et soin identiques, allié distinct requis');
  const results=[];
  if(anchorDamage){const before=health(actor),damage=q.metadata.anchorDamage,absorbed=Math.min(actor.tempHp||0,damage);actor.tempHp=(actor.tempHp||0)-absorbed;actor.hp=Math.max(0,actor.hp-(damage-absorbed));actor.rpgAnchorPending=null;bump(actor);results.push({targetId:actor.id,targetName:actor.name,requestedAmount:0,appliedAmount:0,damageTaken:damage,tempAbsorbed:absorbed,before,after:health(actor)})}
  if(sacrifice){const before=health(actor),absorbed=Math.min(actor.tempHp||0,q.amount);actor.tempHp=(actor.tempHp||0)-absorbed;actor.hp=Math.max(0,actor.hp-(q.amount-absorbed));bump(actor);results.push({targetId:actor.id,targetName:actor.name,requestedAmount:0,appliedAmount:0,damageTaken:q.amount,tempAbsorbed:absorbed,before,after:health(actor)})}
  for(const p of targets){
   const before=health(p);let applied=0,kept=false;
   if(event.type==='heal:request'){applied=Math.min(q.amount,Math.max(0,p.maxHp-p.hp));p.hp+=applied;if(p.hp>0)p.conditions=(p.conditions||[]).filter(c=>!/^(inconscient|unconscious)$/i.test(c.name));}
   if(event.type==='tempHp:request'){
    // Recipient may explicitly choose replacement; otherwise retain the greater pool and its source.
    kept=!q.replace&&(p.tempHp||0)>=q.amount;
    if(!kept){p.tempHp=q.amount;p.tempSource=q.source;p.tempMetadata=copy(q.metadata||{});applied=q.amount;}
   }
   if(markRest){p.maxHp+=p.rpgAsmodeusReduction||0;p.rpgAsmodeusReduction=0;p.hp=p.maxHp;p.tempHp=0;p.tempMetadata={};p.rpgAnchorPending=null;}
   if(event.type==='maxHp:request'&&!markRest){
    p.rpgMaxHpEffects=p.rpgMaxHpEffects||{};
    if(q.operation==='apply'){p.rpgMaxHpEffects[q.effectId]={source:q.source,amount:q.amount,expiresAt:context.now+q.durationMs};p.maxHp+=q.amount;p.hp+=q.amount;applied=q.amount;}
    else{const e=p.rpgMaxHpEffects[q.effectId];p.maxHp=Math.max(1,p.maxHp-e.amount);p.hp=Math.min(p.hp,p.maxHp);delete p.rpgMaxHpEffects[q.effectId];}
   }
   if(event.type==='heal:request'&&q.source==='Imposition des mains'&&targets.some(p=>/mort.?vivant|undead|artificiel|construct/i.test(context.targetTypes?.[p.id]||p.entityType||'')))return fail('Imposition sans effet sur morts-vivants ou artificiels');
  if(event.type==='revive:request'){p.hp=1;p.dead=false;p.lifeStatus='alive';delete p.diedAt;p.conditions=(p.conditions||[]).filter(c=>!/^(mort|dead|inconscient|unconscious)$/i.test(c.name));applied=1;}
   if(event.type==='tempHp:request'&&q.source==='Cri de ralliement'){p.conditions=(p.conditions||[]).filter(c=>!/^effray[ée]|^frightened$/i.test(c.name)&&c.source!=='Cri de ralliement');p.conditions.push({id:'rally-fear:'+id+':'+p.id,name:'Immunité Effrayé (Cri de ralliement)',source:'Cri de ralliement',durationType:'indefinite'},{id:'rally-adv:'+id+':'+p.id,name:'Avantage prochaine attaque d’arme',source:'Cri de ralliement',durationType:'nextWeaponAttack'});}
   if(p.hp>0){p.rpgJudgmentPending=null;p.lifeStatus='alive';p.conditions=(p.conditions||[]).filter(c=>!/^(inconscient|unconscious)$/i.test(c.name));}
   bump(p);results.push({targetId:p.id,targetName:p.name,requestedAmount:q.amount||0,appliedAmount:applied,kept,before,after:health(p)});
  }
  // The grimoire applies this cost only to actual Lay on Hands healing of others.
  if(event.type==='heal:request'&&event.characterId==='zephyr'&&q.source==='Imposition des mains'&&q.metadata?.asmodeusMark===true){
   const restored=results.filter(r=>r.targetId!==actorId).reduce((n,r)=>n+r.appliedAmount,0);
   const reduction=Math.min(Math.floor(restored/2),Math.max(0,42-(actor.rpgAsmodeusReduction||0)));
   if(reduction){const before=health(actor);actor.rpgAsmodeusReduction=(actor.rpgAsmodeusReduction||0)+reduction;actor.maxHp-=reduction;actor.hp=Math.min(actor.hp,actor.maxHp);bump(actor);results.push({targetId:actor.id,targetName:actor.name,requestedAmount:0,appliedAmount:0,maxHpReduction:reduction,before,after:health(actor)})}
  }
  const result={ok:true,actionId:id,family:event.type,source:q.source,results};ledger[id]={fingerprint,result};return copy(result);
 }
 function expire(enc,now){const changed=[];for(const p of enc.participants){if(p.tempHp>0&&((Number.isFinite(p.tempMetadata?.expiresAt)&&p.tempMetadata.expiresAt<=now)||(Number.isFinite(p.tempMetadata?.expiresAtRound)&&Number.isFinite(enc.round)&&enc.round>=p.tempMetadata.expiresAtRound))){p.tempHp=0;p.tempMetadata={};bump(p);changed.push(p.id)}for(const [id,e]of Object.entries(p.rpgMaxHpEffects||{}))if(e.expiresAt<=now){p.maxHp=Math.max(1,p.maxHp-e.amount);p.hp=Math.min(p.hp,p.maxHp);delete p.rpgMaxHpEffects[id];bump(p);changed.push(p.id)}}return changed;}
 const api={resolve,expire,health,dead,friendly,bump};root.RPGHealthAuthority=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
