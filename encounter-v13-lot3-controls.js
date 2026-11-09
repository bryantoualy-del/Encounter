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
  const body=root.querySelector('.detail-tab-body'),button=root.querySelector('[data-lot3-tests]');
  if(!body||!button)return;
  const m=modelFor(p),markup=characterChecks(p,m);
  body.hidden=false;
  body.innerHTML='<section class="lot3-tests-section" aria-label="Tests, compétences et jets de sauvegarde"><h3>Tests de caractéristiques · Compétences · Jets de sauvegarde</h3>'+(markup||'<p class="muted">Aucune caractéristique renseignée pour cette créature.</p>')+'</section>';
  button.setAttribute('aria-pressed','true');
  button.classList.add('active');
  for(const tab of root.querySelectorAll('[data-detail-tab]')){
   tab.classList.remove('active');
   tab.setAttribute('aria-expanded','false');
  }
 };
 document.querySelector('#activeDetail').addEventListener('click',e=>{
  const tests=e.target.closest('[data-lot3-tests]');
  if(tests){
   const p=selectedParticipant();
   if(!freeEnemy(p))return;
   e.preventDefault();e.stopImmediatePropagation();
   testsFor=testsFor===p.id?null:p.id;
   if(testsFor)closedDetailSection=null;
   render();
   return;
  }
  const tab=e.target.closest('[data-detail-tab]');
  if(tab&&testsFor){
   testsFor=null;
   e.preventDefault();e.stopImmediatePropagation();
   ui.detailTab=tab.dataset.detailTab;
   closedDetailSection=null;
   render();
  }
 },true);
 window.EncounterLot3={freeEnemy,testsOpen:()=>testsFor===selectedParticipant()?.id};
})();
