/* Quantified penalties attached to conditions; Encounter resolves the affected rolls. */
(()=>{'use strict';
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function penalty(conditions,kind,rollDie){
  const affected=['attack','ability','concentration'].includes(kind);
  if(!affected||!(conditions||[]).some(c=>normalize(c?.name)==='perturbationssynaptiques'))return{amount:0,detail:''};
  const die=rollDie(6);
  return{amount:die,detail:`− 1d6 (${die})`};
 }
 globalThis.EncounterConditionRolls={penalty};
})();
