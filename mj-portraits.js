/* A single identity slot for every combat faction, including local characters. */
(()=>{'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function portrait(p){
  const model=modelFor(p);
  const src=window.EncounterMJControl?.portrait(p.id)||model?.image||globalThis.ENCOUNTER_CREATURE_ICONS?.iconPath?.(model,!!p.bossOverride);
  return src?`<img class="mj-fighter-portrait" src="${esc(src)}" alt="">`:`<span class="mj-fighter-portrait mj-fighter-fallback" aria-hidden="true">${esc(p.name?.[0]||'◆')}</span>`;
 }
 const base=tableRow;tableRow=function(p,...args){const html=base(p,...args);return isLair(p)?html:html.replace('<div class="table-name">','<div class="table-name">'+portrait(p))};
 const baseDetail=renderDetail;renderDetail=function(){
  baseDetail();
  const p=selectedParticipant(),head=$('#activeDetail .detail-header');
  if(!head||!p||isLair(p))return;
  const identity=head.querySelector('h2')?.parentElement;
  const stats=$('#activeDetail .stat-grid');
  if(!identity||!stats)return;
  const opportunity=head.querySelector('[data-provoke-opportunity]');
  if(opportunity)$('#activeDetail .detail-tabs')?.after(opportunity);
  head.classList.add('target-portrait-header');
  head.insertAdjacentHTML('afterbegin',portrait(p));
  identity.append(stats);
  const actions=document.createElement('div');
  actions.className='target-header-actions';
  for(const control of head.querySelectorAll('.header-resources,[data-edit-participant]')){
   if(control.parentElement===head)actions.append(control);
  }
  head.append(actions);
  stats.querySelector('.hp-stat')?.insertAdjacentHTML('beforeend',`<div class="table-health ${hpClass(p)}" aria-hidden="true"><i style="width:${hpPct(p)}%"></i></div>`);
 };
 document.addEventListener('error',e=>{const img=e.target;if(!img.matches?.('.mj-fighter-portrait,.mj-decision-person img'))return;const fallback=document.createElement('span');fallback.className=img.className+' mj-fighter-fallback';if(img.alt){fallback.setAttribute('role','img');fallback.setAttribute('aria-label',img.alt)}else fallback.setAttribute('aria-hidden','true');fallback.textContent='◆';img.replaceWith(fallback)},true);renderCombat();
})();
