/* Encounter V1.3 lot 1: presentation only; never mutates combat state or dice. */
(() => {
  const box = document.getElementById('actionPopup');
  if (!box || typeof showActionPopup !== 'function') return;
  const titleNode = document.getElementById('actionPopupTitle');
  const textNode = document.getElementById('actionPopupText');
  const eyebrow = box.querySelector('.eyebrow');
  const queue = [];
  let active = null;
  box.setAttribute('role','status');
  box.setAttribute('aria-live','polite');
  box.setAttribute('aria-atomic','true');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'v13-result-close';
  close.setAttribute('aria-label','Fermer ce résultat');
  close.textContent = '×';
  box.appendChild(close);
  const count = document.createElement('span');
  count.className = 'v13-result-count';
  count.setAttribute('aria-live','off');
  box.appendChild(count);
  const numeric = document.createElement('strong');
  numeric.className = 'v13-result-total';
  textNode.before(numeric);
  const summary = document.createElement('div');
  summary.className = 'v131-summary';
  numeric.before(summary);
  const detail = document.createElement('small');
  detail.className = 'v13-result-detail';
  textNode.after(detail);

  function classify(message, heading) {
    if (message && typeof message === 'object' && message.freeEnemy === true)
      return {kind:'enemy-roll',number:'',message:message.text||'',title:String(heading||message.ability||'Action ennemie'),free:message};
    const s = String(message || '');
    const t = String(heading || 'Résolution');
    const damage = /dégâts?|dommages?|\bdamage\b/i.test(s+' '+t);
    const healing = /soins?|soigné|guéri|récupère.*(?:PV|points de vie)/i.test(s+' '+t);
    const condition = /(?:à terre|terrorisé|empoisonné|paralysé|étourdi|aveuglé|entravé|charmé)/i.test(s+' '+t);
    const match = s.match(/(?:^|[^\d])(\d{1,4})(?=\s*(?:dégâts?|dommages?|PV|points de vie|soins?|\btotal\b))/i)
       || s.match(/(?:total|résultat|jet)\s*[:=]?\s*(\d{1,4})/i);
    return {kind: damage?'damage':healing?'heal':condition?'condition':'roll',number:match?.[1]||'',message:s,title:t};
  }
  function parseCombat(item) {
    const m = item.message.match(/^(.+?)\s*[—-]\s*(.+?)\s*→\s*(.+?)\s*:\s*d20\s*(\d+)\s*([+-]\s*\d+)\s*=\s*(\d+)\s*vs\s*CA\s*(\d+)\s*→\s*(TOUCHÉ|RATÉ)(?:\s*[·•]\s*(\d+)\s*dégâts?\s*\(([^)]*)\))?/i);
    if (!m) return null;
    return {actor:m[1].trim(),weapon:m[2].trim(),target:m[3].trim(),die:m[4],modifier:m[5].replace(/\s/g,''),attack:m[6],ac:m[7],outcome:m[8].toUpperCase(),damage:m[9]||'',damageDetail:m[10]||''};
  }
  function paint() {
    if (!active) { box.classList.remove('show');box.classList.remove('v13-result-visible');return; }
    const free = active.free;
    const combat = free ? null : parseCombat(active);
    box.classList.toggle('v131-combat',!!combat);
    box.classList.toggle('v13-free-enemy',!!free);
    summary.replaceChildren();
    titleNode.textContent = combat ? combat.weapon : active.title;
    textNode.textContent = free ? (free.note || '') : active.message;
    textNode.hidden = !!combat;
    numeric.textContent = combat ? combat.damage : active.number;
    numeric.hidden = !!free || !(combat ? combat.damage : active.number);
    if (free) {
      const heading = document.createElement('div');
      heading.className = 'v13-free-head';
      heading.textContent = free.actor + ' · ' + free.ability;
      summary.appendChild(heading);
      for (const item of free.rolls || []) {
        const line = document.createElement('div');line.className='v13-free-row';
        const label = document.createElement('span');label.textContent=item.label;
        const total = document.createElement('strong');total.textContent=String(item.total);
        const dice = document.createElement('small');dice.textContent=item.detail+(item.critical?' · 20 naturel':'')+(item.damage!=null?' · '+item.damage+' dégâts potentiels ('+item.damageDetail+')':'');
        line.append(label,total,dice);summary.appendChild(line);
      }
      if (free.save) {
        const line=document.createElement('div');line.className='v13-free-row';
        line.textContent='JS '+free.save.ability+' · DD '+free.save.dc+' — résolution par les joueurs';
        summary.appendChild(line);
      }
      if (free.effect) {
        const line=document.createElement('div');line.className='v13-free-row';
        const label=document.createElement('span');label.textContent=free.effect.label;
        const total=document.createElement('strong');total.textContent=String(free.effect.total);
        const dice=document.createElement('small');dice.textContent=free.effect.detail||'';
        line.append(label,total,dice);summary.appendChild(line);
      }
      eyebrow.textContent='ACTION ENNEMIE · MODE LIBRE';
    } else if (combat) {
      const line = document.createElement('div');line.className='v131-actors';line.textContent=combat.actor+' attaque '+combat.target;
      const attack = document.createElement('div');attack.className='v131-attack';
      const roll = document.createElement('strong');roll.textContent=combat.attack;
      const ac = document.createElement('span');ac.textContent='contre CA '+combat.ac;
      const outcome=document.createElement('span');outcome.className='v131-outcome';outcome.dataset.hit=combat.outcome==='TOUCHÉ'?'yes':'no';outcome.textContent=combat.outcome;
      attack.append(roll,ac,outcome);
      const bottom=document.createElement('div');bottom.className='v131-bottom';
      const label=document.createElement('span');label.textContent=combat.damage?'DÉGÂTS':'JET D’ATTAQUE';
      const dice=document.createElement('small');dice.textContent=combat.damageDetail||('d20 '+combat.die+' '+combat.modifier);
      bottom.append(label,dice);
      summary.append(line,attack,bottom);
      eyebrow.textContent='ATTAQUE · '+combat.weapon.toUpperCase();
    } else if (!free) eyebrow.textContent=active.kind==='damage'?'DÉGÂTS':active.kind==='heal'?'SOINS':active.kind==='condition'?'ÉTAT':'RÉSULTAT';
    detail.textContent = free ? 'Résultat indicatif · le MJ arbitre · aucun Companion modifié' : active.kind==='damage'?'Valeur annoncée · vérifier son application à la cible':active.kind==='condition'?'État à confirmer selon le jet et la cible':'';
    if(combat)detail.textContent='Valeur annoncée · dégâts non appliqués automatiquement';
    count.textContent = queue.length ? '+'+queue.length+' résultat(s) suivant(s)' : '';
    box.dataset.resultKind=active.kind;
    box.classList.add('show','v13-result-visible');
  }
  function advance() {active=queue.shift()||null;paint();}
  // Capture before legacy click-to-dismiss listeners without swallowing the close action.
  box.addEventListener('click',e=>{if(e.target.closest('.v13-result-close') || e.target===box)advance();e.stopImmediatePropagation();},true);
  showActionPopup = function(message,title='Résolution') {
    const item = classify(message,title);
    if (active) queue.push(item); else active=item;
    clearTimeout(showActionPopup.t);
    paint();
  };
})();
