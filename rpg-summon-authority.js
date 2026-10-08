/* Companion lifecycle; Encounter health. Profiles use the native character data. */
(function(root){'use strict';
 const profiles={samoth:{dragon:{name:'Esprit draconique — Samoth',type:'dragon',hp:50,ac:19}},kentaro:{spectre:{name:'Spectre maudit — Kentaro',type:'mort-vivant',hp:22,ac:12}}};
 const objectProfiles={tiny:{hp:20,ac:18,attack:8,n:1,f:4,bonus:4,max:10},small:{hp:25,ac:16,attack:6,n:1,f:8,bonus:2,max:10},medium:{hp:40,ac:13,attack:5,n:2,f:6,bonus:1,max:5},large:{hp:50,ac:10,attack:6,n:2,f:10,bonus:2,max:2},huge:{hp:80,ac:10,attack:8,n:2,f:12,bonus:4,max:1}};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function remove(enc,p,reason='dismissed'){
  if(!p?.rpgSummon)return false;
  const s=p.rpgSummon;enc.rpgSummonTombstones=enc.rpgSummonTombstones||{};
  enc.rpgSummonTombstones[p.id]={id:p.id,...s,reason,health:root.RPGHealthAuthority.health(p)};
  enc.participants=enc.participants.filter(x=>x.id!==p.id);return true;
 }
 function reconcile(enc,ownerId,owner,descriptors){
  if(!owner||!Array.isArray(descriptors)||descriptors.length>10)return false;
  let changed=false;const wanted=new Set();enc.rpgSummonTombstones=enc.rpgSummonTombstones||{};
  for(const d of descriptors){const obj=ownerId==='samoth'&&d.kind==='animated-object'?objectProfiles[d.size]:null;const profile=obj?{name:'Objet animé '+(Number(d.index)+1)+' — Samoth',type:'artificiel',hp:obj.hp,ac:obj.ac}:profiles[ownerId]?.[d.kind];if(!profile||(obj&&(!Number.isInteger(d.index)||d.index<0||d.index>=obj.max))||typeof d.instanceId!=='string'||!/^[-\w]{1,80}$/.test(d.instanceId))continue;
   const id='summon:'+ownerId+':'+d.instanceId;wanted.add(id);if(enc.rpgSummonTombstones[id])continue;
   let p=enc.participants.find(p=>p.id===id);
   if(!p){const current=Number(d.hp);if(!Number.isFinite(current)||current<=0||current>profile.hp)continue;
    p={id,modelId:null,kind:owner.kind==='enemy'?'enemy':'ally',name:profile.name,baseName:profile.name,ac:profile.ac,hp:current,maxHp:profile.hp,tempHp:d.kind==='spectre'?Math.max(0,Math.min(5,Number(d.temp)||0)):0,conditions:[],initiative:owner.initiative,companionOf:owner.id,entityType:profile.type,rpgSummon:{ownerId,ownerParticipantId:owner.id,kind:d.kind,instanceId:d.instanceId,...(obj?{expiresRound:(Number(enc.round)||1)+10,size:d.size,attackBonus:obj.attack,damageCount:obj.n,damageFaces:obj.f,damageBonus:obj.bonus}:{}),expiresAt:d.kind==='dragon'?(Number(d.createdAt)||Date.now())+3600000:null},actionUsed:false,bonusActionUsed:false,reactionUsed:false};
    p.tempSource=p.tempHp?'Spectre maudit — invocation':'';root.RPGHealthAuthority.bump(p);enc.participants.push(p);changed=true;
   }
   // Once created, local snapshots never overwrite health or MJ defenses/conditions.
   const camp=owner.kind==='enemy'?'enemy':'ally';if(p.kind!==camp){p.kind=camp;changed=true}const used=obj?!!p.actionUsed:!!d.actionUsed;if(p.actionUsed!==used){p.actionUsed=used;changed=true}
  }
  for(const p of [...enc.participants])if(p.rpgSummon?.ownerId===ownerId&&(!wanted.has(p.id)||p.hp<=0)){remove(enc,p,p.hp<=0?'zero-hp':'dismissed');changed=true}
  return changed;
 }
 function owned(enc,ownerId){return [...enc.participants.filter(p=>p.rpgSummon?.ownerId===ownerId).map(p=>({id:p.id,...p.rpgSummon,health:root.RPGHealthAuthority.health(p),conditions:clone(p.conditions||[]),active:true})),...Object.values(enc.rpgSummonTombstones||{}).filter(p=>p.ownerId===ownerId).map(p=>({...clone(p),active:false}))];}
 root.RPGSummonAuthority={profiles,objectProfiles,reconcile,remove,owned};
})(globalThis);
