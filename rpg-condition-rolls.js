/* Quantified penalties attached to conditions; Encounter resolves the affected rolls. */
(()=>{'use strict';
 const clean=list=>(list||[]).filter(c=>!c.nansRageSuppressed);
 const exhaustion=list=>Math.max(0,...clean(list).map(c=>Number(c.exhaustionLevel)||0));
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function penalty(conditions,kind,rollDie){
  const list=clean(conditions);let amount=0;const detail=[];
  if(['attack','ability','concentration'].includes(kind)&&list.some(c=>normalize(c?.name)==='perturbationssynaptiques')){const die=rollDie(6);amount+=die;detail.push(`− 1d6 (${die})`)}
  if(['attack','save','concentration'].includes(kind)&&list.some(c=>c.effectKind==='bless')){const die=rollDie(4);amount-=die;detail.push(`+ 1d4 Bénédiction (${die})`)}
  if(['save','concentration'].includes(kind)){const bonus=list.reduce((n,c)=>n+(Number(c.saveBonus)||0),0);amount-=bonus;if(bonus)detail.push(`${bonus>=0?'+':''}${bonus} Aura de protection`)}
  return {amount,detail:detail.join(' · ')};
 }
 function saveRules(conditions,ability,requestedMode='normal'){
  conditions=clean(conditions);const keys=new Set((conditions||[]).map(c=>normalize(c?.name))),autoFail=['FOR','DEX'].includes(ability)&&['etourdi','paralyse','inconscient','petrifie'].some(k=>keys.has(k));
  const dodge=(conditions||[]).some(c=>c.effectKind==='brackDodge')&&!mechanics(conditions).incapacitated&&!mechanics(conditions).speedZero;
  const disadvantage=requestedMode==='dis'||exhaustion(conditions)>=3||ability==='DEX'&&keys.has('entrave'),advantage=requestedMode==='adv'||ability==='DEX'&&(conditions||[]).some(c=>c.effectKind==='haste')||ability==='DEX'&&dodge;
  return{autoFail,mode:autoFail?'auto-fail':disadvantage?(advantage?'normal':'dis'):advantage?'adv':requestedMode};
 }
 function mechanics(conditions,context={}){
  const list=clean(conditions),keys=new Set(list.map(c=>normalize(c?.name))),has=(...names)=>names.some(n=>keys.has(n)&&!(n==='invisible'&&keys.has('revele')));
  const incapacitated=has('incapacite','inconscient','paralyse','etourdi','petrifie','mort','dead')||list.some(c=>c.effectKind==='lazarus'),speedZero=has('lethargiedehate','agrippe','entrave','paralyse','inconscient','etourdi','petrifie')||list.some(c=>normalize(c.name).startsWith('vitesse0')||c.effectKind==='lethargy'),dodge=list.some(c=>c.effectKind==='brackDodge')&&!incapacitated&&!speedZero&&exhaustion(list)<5;
  const close=context.distanceFeet!=null&&Number(context.distanceFeet)<=5;
  return {attackDisadvantage:exhaustion(list)>=3||has('aveugle','empoisonne','entrave','aterre')||(has('effraye')&&context.fearSourceVisible===true),attackAdvantage:(has('invisible')&&!context.seesInvisible)||list.some(c=>c.effectKind==='shadowOfMoil')&&!context.seesThroughShadows||list.some(c=>c.effectKind==='stoneVision'&&(!c.expiresAt||c.expiresAt>Date.now())),attacksAgainstAdvantage:list.some(c=>c.effectKind==='nansReckless')||has('aveugle','entrave','etourdi','paralyse','inconscient','petrifie')||(has('aterre')&&close),attacksAgainstDisadvantage:list.some(c=>c.effectKind==='shadowOfMoil')&&!context.seesThroughShadows||(has('esquive')&&!list.some(c=>c.effectKind==='brackDodge')||dodge&&!has('aveugle')&&context.defenderSeesAttacker===true)||(has('invisible')&&!context.seesInvisible)||(has('aterre')&&context.distanceFeet!=null&&!close),abilityDisadvantage:has('empoisonne')||(has('effraye')&&context.fearSourceVisible===true),speedMultiplier:exhaustion(list)>=2?.5:1,speedZero:exhaustion(list)>=5||has('lethargiedehate')||has('agrippe','entrave','paralyse','inconscient','etourdi','petrifie')||(conditions||[]).some(c=>normalize(c?.name).startsWith('vitesse0')),incapacitated:list.some(c=>c.effectKind==='lazarus')||has('incapacite','inconscient','paralyse','etourdi','petrifie','mort','dead'),autoFailStrDex:has('etourdi','paralyse','inconscient','petrifie'),dexSaveAdvantage:dodge,dexSaveDisadvantage:has('entrave'),autoCritical:close&&has('paralyse','inconscient'),reminders:[...(has('effraye')&&context.fearSourceVisible==null?['Effrayé : vérifier la visibilité de la source.']:[]),...(has('charme')?['Charmé : vérifier la source avant attaque.']:[]),...(has('aterre')&&context.distanceFeet==null?['À terre : vérifier la distance pour les attaques reçues.']:[]),...(has('paralyse','inconscient')&&context.distanceFeet==null?['Critique automatique uniquement si attaquant à 1,5 m.']:[])]};
 }
 function abilityRules(conditions,requestedMode='normal',context={}){conditions=clean(conditions);const adv=requestedMode==='adv'||context.ability==='FOR'&&conditions.some(c=>c.effectKind==='nansRage'),dis=requestedMode==='dis'||exhaustion(conditions)>=1||mechanics(conditions,context).abilityDisadvantage||(conditions||[]).some(c=>c.abilityDisadvantage===context.ability);return {mode:adv===dis?'normal':adv?'adv':'dis'};}
 globalThis.EncounterConditionRolls={penalty,saveRules,mechanics,abilityRules};
})();

