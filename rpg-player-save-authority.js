/* Browser-side resolution ledger for hostile saving throws; the MJ owns effects. */
(()=>{'use strict';
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function rules(conditions,ability,requested='normal'){
  const keys=new Set((conditions||[]).map(c=>norm(c.name)));
  const autoFail=['FOR','DEX'].includes(ability)&&['etourdi','paralyse','inconscient','petrifie'].some(k=>keys.has(k));
  const adv=requested==='adv'||ability==='DEX'&&globalThis.EncounterConditionRolls?.mechanics(conditions).dexSaveAdvantage,dis=requested==='dis'||ability==='DEX'&&keys.has('entrave');
  return {autoFail,mode:autoFail?'auto-fail':adv===dis?'normal':adv?'adv':'dis'};
 }
 function evasion(characterId,ability,half){return characterId==='rufus'&&ability==='DEX'&&half===true}
 function damage(raw,success,half,context={}){return evasion(context.characterId,context.ability,half)?(success?0:Math.floor(raw/2)):success?(half?Math.floor(raw/2):0):raw}
 globalThis.RPGPlayerSaveAuthority={rules,damage,evasion};
})();

