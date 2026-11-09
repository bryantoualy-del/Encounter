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
  const detail = document.createElement('small');
  detail.className = 'v13-result-detail';
  textNode.after(detail);

  function classify(message, heading) {
    const s = String(message || '');
    const t = String(heading || 'Résolution');
    const damage = /dégâts?|dommages?|\bdamage\b/i.test(s+' '+t);
    const healing = /soins?|soigné|guéri|récupère.*(?:PV|points de vie)/i.test(s+' '+t);
    const condition = /(?:à terre|terrorisé|empoisonné|paralysé|étourdi|aveuglé|entravé|charmé)/i.test(s+' '+t);
    const match = s.match(/(?:^|[^\d])(\d{1,4})(?=\s*(?:dégâts?|dommages?|PV|points de vie|soins?|\btotal\b))/i)
       || s.match(/(?:total|résultat|jet)\s*[:=]?\s*(\d{1,4})/i);
    return {kind: damage?'damage':healing?'heal':condition?'condition':'roll',number:match?.[1]||'',message:s,title:t};
  }
  function paint() {
    if (!active) { box.classList.remove('show');box.classList.remove('v13-result-visible');return; }
    titleNode.textContent = active.title;
    textNode.textContent = active.message;
    numeric.textContent = active.number;
    numeric.hidden = !active.number;
    eyebrow.textContent = active.kind==='damage'?'DÉGÂTS':active.kind==='heal'?'SOINS':active.kind==='condition'?'ÉTAT':'RÉSULTAT';
    detail.textContent = active.kind==='damage'?'Valeur annoncée · vérifier son application à la cible':active.kind==='condition'?'État à confirmer selon le jet et la cible':'';
    count.textContent = queue.length ? '+'+queue.length+' résultat(s) suivant(s)' : '';
    box.dataset.resultKind=active.kind;
    box.classList.add('show','v13-result-visible');
  }
  function advance() {active=queue.shift()||null;paint();}
  close.addEventListener('click',e=>{e.stopPropagation();advance();});
  // Earlier scripts attached a click-to-dismiss listener: intercept only our card.
  box.addEventListener('click',e=>{e.stopImmediatePropagation();if(e.target===box)advance();},true);
  showActionPopup = function(message,title='Résolution') {
    const item = classify(message,title);
    if (active) queue.push(item); else active=item;
    clearTimeout(showActionPopup.t);
    paint();
  };
})();
