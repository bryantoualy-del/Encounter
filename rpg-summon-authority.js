/* Companion lifecycle; Encounter health. Profiles use the native character data. */
(function(root){'use strict';
 const profiles={samoth:{dragon:{name:'Esprit draconique — Samoth',type:'dragon',hp:50,ac:19}},kentaro:{spectre:{name:'Spectre maudit — Kentaro',type:'mort-vivant',hp:22,ac:12}}};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function remove(enc,p,reason='dismissed'){
  if(!p?.rpgSummon)return false;
  const s=p.rpgSummon;enc.rpgSummonTombstones=enc.rpgSummonTombstones||{};
  enc.rpgSummonTombstones[p.id]={id:p.id,...s,reason,health:root.RPGHealthAuthority.health(p)};
  enc.participants=enc.participants.filter(x=>x.id!==p.id);return true;
 }
 function reconcile(enc,ownerId,owner,descriptors){
  if(!owner||!Array.isArray(descriptors)||descriptors.length>1)return false;
  let changed=false;const wanted=new Set();enc.rpgSummonTombstones=enc.rpgSummonTombstones||{};
  for(const d of descriptors){const profile=profiles[ownerId]?.[d.kind];if(!profile||typeof d.instanceId!=='string'||!/^[-\w]{1,80}$/.test(d.instanceId))continue;
   const id='summon:'+ownerId+':'+d.instanceId;wanted.add(id);if(enc.rpgSummonTombstones[id])continue;
   let p=enc.participants.find(p=>p.id===id);
   if(!p){const current=Number(d.hp);if(!Number.isFinite(current)||current<=0||current>profile.hp)continue;
    p={id,modelId:null,kind:owner.kind==='enemy'?'enemy':'ally',name:profile.name,baseName:profile.name,ac:profile.ac,hp:current,maxHp:profile.hp,tempHp:d.kind==='spectre'?Math.max(0,Math.min(5,Number(d.temp)||0)):0,conditions:[],initiative:owner.initiative,companionOf:owner.id,entityType:profile.type,rpgSummon:{ownerId,ownerParticipantId:owner.id,kind:d.kind,instanceId:d.instanceId,expiresAt:d.kind==='dragon'?(Number(d.createdAt)||Date.now())+3600000:null},actionUsed:false,bonusActionUsed:false,reactionUsed:false};
    p.tempSource=p.tempHp?'Spectre maudit — invocation':'';root.RPGHealthAuthority.bump(p);enc.participants.push(p);changed=true;
   }
   // Once created, local snapshots never overwrite health or MJ defenses/conditions.
   const camp=owner.kind==='enemy'?'enemy':'ally';if(p.kind!==camp){p.kind=camp;changed=true}const used=!!d.actionUsed;if(p.actionUsed!==used){p.actionUsed=used;changed=true}
  }
  for(const p of [...enc.participants])if(p.rpgSummon?.ownerId===ownerId&&(!wanted.has(p.id)||p.hp<=0)){remove(enc,p,p.hp<=0?'zero-hp':'dismissed');changed=true}
  return changed;
 }
 function owned(enc,ownerId){return [...enc.participants.filter(p=>p.rpgSummon?.ownerId===ownerId).map(p=>({id:p.id,...p.rpgSummon,health:root.RPGHealthAuthority.health(p),conditions:clone(p.conditions||[]),active:true})),...Object.values(enc.rpgSummonTombstones||{}).filter(p=>p.ownerId===ownerId).map(p=>({...clone(p),active:false}))];}
 root.RPGSummonAuthority={profiles,reconcile,remove,owned};
})(globalThis);
