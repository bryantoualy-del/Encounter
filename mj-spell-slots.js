/* A cast spends one slot per journal transaction, independently of target count. */
(()=>{'use strict';
 function slot(p,a){if(!a?.isSpell||Number(a.spellLevel)<=0)return null;return modelFor(p)?.resources?.find(r=>r.spellLevel===Number(a.spellLevel))||null}
 function available(p,a){const r=slot(p,a);return !r||Number(p.resourceState?.[r.id]??r.start)>0}
 const use=useAbility;useAbility=function(pid,aid,section,...rest){const p=state.encounter.participants.find(p=>p.id===pid),a=p&&modelFor(p)?.[({action:'actions',reaction:'reactions',legendary:'legendaryActions',lair:'lairActions'})[section]||section]?.find(a=>a.id===aid);if(p&&!available(p,a))return toast('Aucun emplacement N'+a.spellLevel+' disponible.');return use(pid,aid,section,...rest)};
 const start=startTargeting;startTargeting=function(...args){const result=start(...args);if(ui.targeting)ui.targeting.castId??=uid('cast');return result};
 const consume=consumeEconomyAfterResolution;consumeEconomyAfterResolution=function(p,a,section,...rest){const r=slot(p,a);if(r){const id=window.EncounterJournal?.current()?.id||ui.targeting?.mjActionId||ui.targeting?.castId;if(!id)throw Error('Lancement de sort sans transaction');p.spellSlotLedger??={};if(!p.spellSlotLedger[id]){if(!available(p,a))throw Error('Emplacement épuisé avant résolution');p.resourceState??={};p.resourceState[r.id]=Number(p.resourceState[r.id]??r.start)-1;p.spellSlotLedger[id]={resourceId:r.id,level:a.spellLevel};log(p.name+' · '+a.name+' · 1 emplacement N'+a.spellLevel+' consommé · '+p.resourceState[r.id]+' restant(s).')}}return consume(p,a,section,...rest)};
 const resolve=resolveTargetSelection;resolveTargetSelection=function(id){const t=ui.targeting,p=t&&state.encounter.participants.find(p=>p.id===t.actorId),a=currentTargetingAbility();if(p&&!available(p,a)&&!p.spellSlotLedger?.[t.mjActionId]){toast('Emplacement épuisé : action annulée.');ui.targeting=null;render();return false}return resolve(id)};
 window.MJSpellSlots={slot,available};
})();
