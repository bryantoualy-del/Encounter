/* Quantified penalties attached to conditions; Encounter resolves the affected rolls. */
(()=>{'use strict';
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function penalty(conditions,kind,rollDie){
  const affected=['attack','ability','concentration'].includes(kind);
  if(!affected||!(conditions||[]).some(c=>normalize(c?.name)==='perturbationssynaptiques'))return{amount:0,detail:''};
  const die=rollDie(6);
  return{amount:die,detail:`− 1d6 (${die})`};
 }
 function saveRules(conditions,ability,requestedMode='normal'){
  const keys=new Set((conditions||[]).map(c=>normalize(c?.name))),autoFail=['FOR','DEX'].includes(ability)&&['etourdi','paralyse','inconscient'].some(k=>keys.has(k));
  const disadvantage=ability==='DEX'&&keys.has('entrave'),advantage=requestedMode==='adv';
  return{autoFail,mode:autoFail?'auto-fail':disadvantage?(advantage?'normal':'dis'):requestedMode};
 }
 globalThis.EncounterConditionRolls={penalty,saveRules};
})();
