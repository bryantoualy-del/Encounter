/* Encounter V1.3 Lot 3 — place existing tests in their own enemy command. */
(()=>{
 'use strict';
 let testsFor=null;
 const freeEnemy=p=>p?.kind==='enemy'&&(state.encounter.rpgSessionMode||'table-free')==='table-free';
 const originalSheet=renderSheetTab;
 renderSheetTab=function(p,m){
  const sheet=originalSheet(p,m);
  if(!freeEnemy(p)||!m)return sheet;
  // Strip only the existing test widgets; keep the four business sections and editor.
  const checks=characterChecks(p,m);
  let display=checks?sheet.replace(checks,''):sheet;
  display=display.replace('<h3>Source</h3>','<h3>Sources</h3>');
  for(const heading of ['Défenses structurées & sens','Traits','Sources','Notes MJ']){
   if(!display.includes('<h3>'+heading+'</h3>'))
    display+='<section class="detail-section"><h3>'+heading+'</h3><p class="muted tiny">Non renseigné</p></section>';
  }
  return display;
 };
 const originalDetail=renderDetail;
 renderDetail=function(){
  originalDetail();
  const p=selectedParticipant(),root=document.querySelector('#activeDetail');
  if(!p||!freeEnemy(p)||testsFor!==p.id)return;
  const actions=root.querySelector('.table-target-actions'),tabs=root.querySelector('.detail-tabs'),button=root.querySelector('[data-lot3-tests]');
  if(!actions||!tabs||!button)return;
  const m=modelFor(p),markup=characterChecks(p,m),panel=document.createElement('section');
  panel.className='lot3-tests-panel';
  panel.setAttribute('aria-label','Tests de caractéristiques, compétences et jets de sauvegarde');
  panel.innerHTML='<div class="lot3-tests-head"><strong>Tests & sauvegardes</strong><button type="button" class="ghost" data-lot3-back>← Retour à Fiche</button></div>'+(markup||'<p class="muted">Aucune caractéristique renseignée pour cette créature.</p>');
  tabs.classList.add('hidden');
  actions.after(panel);
  button.setAttribute('aria-pressed','true');
  button.classList.add('active');
 };
 document.querySelector('#activeDetail').addEventListener('click',e=>{
  const tests=e.target.closest('[data-lot3-tests]');
  if(tests){
   const p=selectedParticipant();
   if(!freeEnemy(p))return;
   e.preventDefault();e.stopImmediatePropagation();
   testsFor=testsFor===p.id?null:p.id;
   render();
   return;
  }
  if(e.target.closest('[data-lot3-back]')&&testsFor){
   e.preventDefault();e.stopImmediatePropagation();
   testsFor=null;ui.detailTab='sheet';closedDetailSection=null;render();
  }
 },true);
 window.EncounterLot3={freeEnemy,testsOpen:()=>testsFor===selectedParticipant()?.id};
})();
