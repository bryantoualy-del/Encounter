/* Transaction orchestration only. Options, resources and roll rules remain in the Companion. */
(()=>{'use strict';
 globalThis.createRPGReactionAuthority=deps=>{
  const ledger=()=>deps.ledger(),persist=()=>deps.persist(),send=(id,type,payload)=>deps.send(id,type,payload),log=text=>deps.log(text);
  const context=w=>({...w.context,reactionId:w.reactionId,parentActionId:w.parentActionId,combatId:w.combatId,triggerMode:w.triggerMode});
  function open(q){const id=q.reactionId;if(!id||q.combatId!==deps.combatId()||!q.eligible?.length)return false;let w=ledger()[id];if(w)return w;w=ledger()[id]={reactionId:id,parentActionId:q.parentActionId||id,combatId:q.combatId,triggerMode:q.triggerMode||'encounter',context:q.context||{},eligible:[...new Set(q.eligible)],offers:{},declined:[],status:'open'};persist();log('Réaction · fenêtre ouverte · '+w.triggerMode+' · '+(w.context.source||w.context.kind||''));for(const id of w.eligible)send(id,'reaction:request',context(w));return w}
  function close(w,result){if(w.status==='closed')return;w.status='closed';w.result=result;persist();for(const id of w.eligible)send(id,'reaction:closed',{...context(w),result});log('Réaction · fenêtre fermée · '+(w.context.source||w.context.kind||'')+' · '+(result.characterId||'')+' · '+(result.declined?'passée':result.success===false?'échec':'résolue')+(result.consumed?' · réaction consommée':'')+(result.slot?' · emplacement N'+result.slot:'')+(result.total!=null?' · jet '+result.rolls?.join('/')+' +'+result.modifier+(result.penalty?' −'+result.penalty:'')+' = '+result.total+' / DD '+result.dc:'')+(result.cancelSpell?' · sort annulé':'')+(result.attackId?' · attaque '+result.attackId:'')+(result.damage!=null?' · dégâts '+result.damage:''));deps.resume?.(w,result)}
  function handle(event){const q=event.payload||{},id=event.characterId,w=ledger()[q.reactionId];if(!w||q.combatId!==w.combatId||w.combatId!==deps.combatId()||!w.eligible.includes(id))return false;
   if(w.status==='closed'){send(id,'reaction:closed',{...context(w),result:w.result});return true}
   if(event.type==='reaction:options'){if(w.status!=='open')return true;w.offers[id]=(q.options||[]).filter(x=>x&&typeof x.id==='string').map(x=>({id:x.id,label:String(x.label||x.id)}));persist();if(!w.offers[id].length)decline(w,id);return true}
   if(event.type==='reaction:decline'){if(w.claim?.characterId===id)return false;decline(w,id);return true}
   if(event.type==='reaction:claim'){
    if(w.claim){if(w.claim.characterId===id&&w.claim.optionId===q.optionId)send(id,'reaction:grant',{...context(w),optionId:q.optionId});else send(id,'reaction:closed',{...context(w),claimedBy:w.claim.characterId});return true}
    if(w.status!=='open'||w.declined.includes(id)||!w.offers[id]?.some(x=>x.id===q.optionId)||!deps.available(id,{...w,context:{...w.context,targetId:q.targetId||w.context.targetId}})||Object.values(ledger()).some(other=>other!==w&&other.status==='granted'&&other.claim?.characterId===id))return false;
    if(q.targetId)w.context.targetId=q.targetId;w.claim={characterId:id,optionId:q.optionId};w.status='granted';Object.assign(w.context,deps.grant?.(id,w)||{});persist();log('Réaction · accordée à '+id+' · '+q.optionId);send(id,'reaction:grant',{...context(w),optionId:q.optionId});for(const peer of w.eligible)if(peer!==id)send(peer,'reaction:closed',{...context(w),claimedBy:id});return true;
   }
   if(event.type==='reaction:resolve'){if(w.claim?.characterId!==id||w.claim.optionId!==q.optionId)return false;close(w,{...q,characterId:id});return true}
   return false;
  }
  function decline(w,id){if(!w.declined.includes(id))w.declined.push(id);persist();log('Réaction · '+id+' passe');if(w.eligible.every(id=>w.declined.includes(id)))close(w,{declined:true})}
  function pending(id){return Object.values(ledger()).filter(w=>w.combatId===deps.combatId()&&w.status!=='closed'&&w.eligible.includes(id)&&(!w.claim||w.claim.characterId===id)).map(w=>({...context(w),status:w.status,optionId:w.claim?.optionId||null}))}
  return{open,handle,pending,close,cancel(id,reason){const w=ledger()[id];if(w&&w.status!=='closed')close(w,{cancelled:true,reason})}};
 };
})();
