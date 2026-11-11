/* Encounter V1.3 Lot 2 — enemy rolls are proposals, never player-state transactions. */
(() => {
  'use strict';
  const priorUse = useAbility;
  const priorCard = abilityCard;
  const freeEnemy = p => p?.kind === 'enemy' && (state.encounter.rpgSessionMode || 'table-free') === 'table-free';
  const find = (m, id) => [...m.actions, ...m.reactions, ...m.legendaryActions, ...m.lairActions, ...m.traits].find(a => a.id === id);
  const hasDamage = a => Boolean(a.damage || a.damageParts?.length || a.damagePartsText?.trim());

  function rollDamage(a, critical = false) {
    const spec = globalThis.EncounterTypedDamage.forAbility(a);
    if (spec.errors.length) throw Error(spec.errors.join(' · '));
    if (spec.parts.length) {
      const result = rollAbilityDamage(a, critical);
      if (result.error) throw Error(result.error);
      return {total:result.total, detail:result.detail};
    }
    if (!a.damage) return null;
    const result = rollDamageCrit(a.damage, critical);
    return {total:result.total,detail:result.detail + (a.damageType ? ' ' + a.damageType : '')};
  }

  function reportFor(p, m, a, mode) {
    const rolls = [], notes = [];
    const result = {freeEnemy:true,actor:participantLabel(p),ability:a.name,kind:a.kind,rolls,save:null,effect:null,note:'Résultat indicatif · le MJ arbitre, les Companions appliquent manuellement.'};
    const lines = [];
    const doAttack = (attackAbility, label) => {
      const r=rollD20(mode), bonus=Number(attackAbility.bonus)||0;
      const penalty=globalThis.EncounterConditionRolls.penalty(p.conditions||[],'attack',rollDie);
      const total = r.roll + bonus - penalty.amount;
      const critical = r.roll===20;
      const damage=hasDamage(attackAbility)?rollDamage(attackAbility,critical):null;
      const detail=`d20 ${r.detail} ${signed(bonus)}${penalty.detail?' '+penalty.detail:''}`;
      rolls.push({label,total,detail,critical,damage:damage?.total??null,damageDetail:damage?.detail||''});
      lines.push(`${label} : ${detail} = ${total}${critical?' · 20 naturel':''}${damage?' · '+damage.total+' dégâts potentiels ('+damage.detail+')':''}`);
      if(attackAbility.onHitSave)notes.push(`Sur touche : JS ${attackAbility.onHitSave.ability} DD ${attackAbility.onHitSave.dc}${attackAbility.onHitSave.conditionOnFailure?' · '+attackAbility.onHitSave.conditionOnFailure:''}`);
    };
    if(a.kind==='multiattack'){
      for(const part of parseMultiSequence(a.sequence)){
        const single=m.actions.find(x=>x.name===part.name);
        if(!single)throw Error('Attaque introuvable : '+part.name);
        for(let i=0;i<part.count;i++)doAttack(single,`${single.name} ${i+1}/${part.count}`);
      }
    } else if (a.kind==='attack' || (a.kind==='recharge' && a.bonus!=null)) doAttack(a,a.name);
    else if (a.kind==='save' || (a.kind==='recharge' && a.dc!=null)) {
      result.save={ability:a.save||'?',dc:a.dc??'?'};
      lines.push(`JS ${result.save.ability} DD ${result.save.dc} à résoudre par les joueurs`);
      if(hasDamage(a))result.effect={label:'Dégâts potentiels',...rollDamage(a)};
      if(a.halfOnSuccess===true)notes.push('Sauvegarde réussie : moitié des dégâts potentiels (au jugement du MJ)');
    } else if (a.kind==='heal') {
      if (hasDamage(a))result.effect={label:'Soins potentiels',...rollDamage(a)};
    } else if (hasDamage(a))result.effect={label:'Effet potentiel',...rollDamage(a)};
    if(a.onHitSave && !notes.length)notes.push(`Sur touche : JS ${a.onHitSave.ability} DD ${a.onHitSave.dc}`);
    if(a.dc!=null && !result.save && !notes.length)notes.push(`JS ${a.save||'?'} DD ${a.dc} si applicable`);
    if(result.effect)lines.push(`${result.effect.label} : ${result.effect.total} (${result.effect.detail})`);
    if(notes.length)lines.push(notes.join(' · '));
    if(a.detail)lines.push(a.detail);
    result.note=[...notes,a.detail].filter(Boolean).join(' · ') || result.note;
    result.text=`${result.actor} — ${a.name} : ${lines.join(' · ')||'Capacité déclarée'} · conséquences à arbitrer par le MJ (aucune cible ni PV modifié).`;
    return result;
  }

  function canUse(p,a,section) {
    const st=p.abilityState?.[a.id]||{ready:true};
    if(a.kind==='recharge'&&!st.ready) return 'Recharge indisponible.';
    if(section==='legendary' && p.legendaryRemaining<(a.cost||1))return 'Actions légendaires insuffisantes.';
    if(section==='lair' && p.actionUsed)return 'Action de repaire déjà utilisée.';
    const eco=abilityEconomy(a,section), max=attacksPerAction(p), progress=p.attackProgress||0;
    if(section!=='legendary'&&section!=='lair'){
      if(eco==='action'&&p.actionUsed && !(a.kind==='attack'&&progress>0&&progress<max))return 'Action déjà utilisée.';
      if(eco==='bonus'&&p.bonusActionUsed)return 'Action bonus déjà utilisée.';
      if(eco==='reaction'&&p.reactionUsed)return 'Réaction déjà utilisée.';
    }
    if(a.isSpell && globalThis.MJSpellSlots && !globalThis.MJSpellSlots.available(p,a))return 'Emplacement de sort épuisé.';
    return '';
  }

  useAbility = function(pid,aid,section,mode='normal') {
    const p=state.encounter.participants.find(x=>x.id===pid);
    if(!freeEnemy(p))return priorUse(pid,aid,section,mode);
    const m=modelFor(p),a=m&&find(m,aid);
    if(!a)return;
    if(ui.targeting)return toast('Annule le ciblage précédent avant de lancer cette capacité.');
    const reason=canUse(p,a,section);if(reason)return toast(reason);
    const abilities=a.kind==='multiattack'?parseMultiSequence(a.sequence).map(part=>m.actions.find(x=>x.name===part.name)): [a];
    if(!abilities.length||abilities.some(x=>!x))return toast('Séquence de multiattaque incomplète.');
    for(const item of abilities){const check=globalThis.EncounterTypedDamage.forAbility(item);if(check.errors.length)return toast('Dégâts typés incomplets : '+check.errors.join(' · '));}
    const perform=()=>{
      const report=reportFor(p,m,a,mode);
      checkpoint();
      if(a.kind==='recharge'){p.abilityState??={};p.abilityState[a.id]??={};p.abilityState[a.id].ready=false;}
      const spellSlot=globalThis.MJSpellSlots?.slot?.(p,a);
      const spellLevel=spellSlot?globalThis.MJSpellSlots.level?.(p,a):null;
      consumeEconomyAfterResolution(p,a,section,{forceAction:a.kind==='multiattack'});
      // Slot spending and dice are one action; keep one journal record and
      // include the consumed slot in the same visible result.
      if(spellSlot){
        const remaining=Number(p.resourceState?.[spellSlot.id]??spellSlot.start);
        const slotLabel='Emplacement N'+spellLevel+' consommé · '+remaining+' restant(s)';
        report.note=[report.note,slotLabel].filter(Boolean).join(' · ');
        report.text+=' · '+slotLabel;
      }
      state.encounter.selectedId=p.id;
      log(report.text);saveState();render();showActionPopup(report,a.name);
      if(document.getElementById('legendaryDialog')?.open){
        const bosses=eligibleLegendaryBosses(activeParticipant());
        if(bosses.length)renderLegendaryDialog(activeParticipant(),bosses);
        else {document.getElementById('legendaryDialog').close();actualAdvanceTurn();}}
      return report;
    };
    try{return globalThis.EncounterJournal?.run
      ?globalThis.EncounterJournal.run({actor:participantLabel(p),title:a.name,kind:'enemy:informative-roll'},perform)
      :perform();}
    catch(error){toast('Capacité non exécutée : '+error.message);return false;}
  };

  abilityCard = function(p,a,section){
    const html=priorCard(p,a,section);
    if(!freeEnemy(p))return html;
    const label=html.replace('>Cibler & soigner</button>','>Lancer les soins</button>')
      .replace('>Cibler</button>','>Lancer le jet</button>');
    const reason=canUse(p,a,section);
    return reason ? label.replace(/<button(?=[^>]*data-use-ability)(?![^>]*disabled)/g,'<button disabled') : label;
  };
  globalThis.EncounterFreeEnemyActions={isFreeEnemy:freeEnemy};
})();
