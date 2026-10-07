/* Single shared target effect. Reserve before the native die; consume on its first roll. */
(()=>{'use strict';globalThis.createRPGDiversionAuthority=d=>{
 const effect=p=>(p?.conditions||[]).find(c=>c.durationType==='nextAllyAttack'&&c.source==='Diversion');
 function apply(target,source,actionId){if(!target||target.hp<=0)return false;target.conditions=(target.conditions||[]).filter(c=>!(c.source==='Diversion'&&c.sourceParticipantId===source.id));target.conditions.push({id:actionId+':diversion',name:'Diversion · prochaine attaque alliée avec avantage',source:'Diversion',sourceParticipantId:source.id,durationType:'nextAllyAttack',appliedActionId:actionId,reservation:null});d.log('Diversion appliquée · '+target.name);d.persist();return true}
 function reserve(target,actor,reservationId){const c=effect(target);if(!c||target.hp<=0||!actor||actor.hp<=0||actor.id===c.sourceParticipantId||!['player','ally'].includes(actor.kind))return false;if(c.reservation&&c.reservation!==reservationId)return false;c.reservation=reservationId;c.reservationActorId=actor.id;d.persist();return true}
 function consume(target,actor,reservationId){const c=effect(target);if(!c||c.reservation!==reservationId||c.reservationActorId!==actor.id||actor.id===c.sourceParticipantId)return false;target.conditions=target.conditions.filter(x=>x!==c);d.log('Diversion consommée · '+actor.name+' → '+target.name);d.persist();return true}
 function release(reservationId){for(const p of d.participants()){const c=effect(p);if(c?.reservation===reservationId){c.reservation=null;delete c.reservationActorId}}d.persist()}
 function expire(sourceId){for(const p of d.participants()){const c=effect(p);if(c&&(c.sourceParticipantId===sourceId||p.hp<=0)){p.conditions=p.conditions.filter(x=>x!==c);d.log('Diversion expirée sans utilisation · '+p.name)}}d.persist()}
 return{apply,reserve,consume,release,expire,effect};
};})();
