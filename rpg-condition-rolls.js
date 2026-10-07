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
  const keys=new Set((conditions||[]).map(c=>normalize(c?.name))),autoFail=['FOR','DEX'].includes(ability)&&['etourdi','paralyse','inconscient','petrifie'].some(k=>keys.has(k));
  const disadvantage=ability==='DEX'&&keys.has('entrave'),advantage=requestedMode==='adv';
  return{autoFail,mode:autoFail?'auto-fail':disadvantage?(advantage?'normal':'dis'):requestedMode};
 }
 function mechanics(conditions,context={}){
  const keys=new Set((conditions||[]).map(c=>normalize(c?.name))),has=(...names)=>names.some(n=>keys.has(n));
  const close=context.distanceFeet!=null&&Number(context.distanceFeet)<=5;
  return {attackDisadvantage:has('aveugle','empoisonne','entrave','aterre')||(has('effraye')&&context.fearSourceVisible===true),attackAdvantage:has('invisible'),attacksAgainstAdvantage:has('aveugle','entrave','etourdi','paralyse','inconscient','petrifie')||(has('aterre')&&close),attacksAgainstDisadvantage:has('invisible')||(has('aterre')&&context.distanceFeet!=null&&!close),abilityDisadvantage:has('empoisonne')||(has('effraye')&&context.fearSourceVisible===true),speedZero:has('agrippe','entrave','paralyse','inconscient','etourdi','petrifie')||(conditions||[]).some(c=>normalize(c?.name).startsWith('vitesse0')),incapacitated:has('incapacite','inconscient','paralyse','etourdi','petrifie','mort','dead'),autoFailStrDex:has('etourdi','paralyse','inconscient','petrifie'),dexSaveDisadvantage:has('entrave'),autoCritical:close&&has('paralyse','inconscient'),reminders:[...(has('effraye')&&context.fearSourceVisible==null?['Effrayé : vérifier la visibilité de la source.']:[]),...(has('charme')?['Charmé : vérifier la source avant attaque.']:[]),...(has('aterre')&&context.distanceFeet==null?['À terre : vérifier la distance pour les attaques reçues.']:[]),...(has('paralyse','inconscient')&&context.distanceFeet==null?['Critique automatique uniquement si attaquant à 1,5 m.']:[])]};
 }
 function abilityRules(conditions,requestedMode='normal',context={}){const dis=mechanics(conditions,context).abilityDisadvantage;return {mode:dis?(requestedMode==='adv'?'normal':'dis'):requestedMode};}
 globalThis.EncounterConditionRolls={penalty,saveRules,mechanics,abilityRules};
})();
