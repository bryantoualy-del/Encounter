/* Shared display labels only; participant IDs remain the authority. */
(()=>{'use strict';
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 globalThis.encounterTargetLabel=(participant,participants=[],modelFor=()=>null)=>{
  if(!participant)return 'Cible';
  if(participant.kind!=='enemy')return participant.name||'Cible';
  const baseOf=p=>String(p.baseName||modelFor(p)?.name||p.name||'Cible');
  const base=baseOf(participant),group=participants.filter(p=>p.kind==='enemy'&&normalize(baseOf(p))===normalize(base));
  // Keep defeated participants in the group so survivors retain their number.
  const index=group.findIndex(p=>p.id===participant.id);
  return group.length>1&&index>=0?base+' #'+(index+1):participant.name||base;
 };
})();
