/* Public activity is explicitly authored by Encounter. Never relay player state here. */
const text=(v,max=240)=>String(v??'').slice(0,max);
export function publicActivity(q){
 if(!q||typeof q.id!=='string'||!q.id||q.id.length>120||!q.text)throw Error('Activité invalide');
 const out={id:q.id,combatId:text(q.combatId,120),actor:text(q.actor,80),action:text(q.action,120),target:text(q.target,80),text:text(q.text,600),stage:text(q.stage,40),kind:text(q.kind,40),effect:text(q.effect,120),significant:!!q.significant};
 for(const key of ['round','turn','roll','damage','heal'])if(Number.isFinite(q[key]))out[key]=Math.max(0,Math.min(100000,q[key]));
 return out;
}
export function appendActivity(room,q){
 room.activity??=[];room.activityIds??=new Map();
 if(room.activityIds.has(q.id))return {entry:room.activityIds.get(q.id),fresh:false};
 const entry={...publicActivity(q),serverEpoch:room.activityEpoch,serverOrder:++room.eventOrder,serverTime:new Date().toISOString()};
 room.activity.push(entry);room.activity.splice(0,Math.max(0,room.activity.length-500));room.activityIds.set(entry.id,entry);
 if(room.activityIds.size>2000)room.activityIds.delete(room.activityIds.keys().next().value);
 return {entry,fresh:true};
}
