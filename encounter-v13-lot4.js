/* Encounter V1.3 Lot 4 — enemy-only Mode Libre house rules and tactile boss correction.
   Loaded after app.js, MJ panels and the V1.3 modules; never alters Companion data. */
(()=>{
 'use strict';
 const LIMIT=99;
 const integer=(value)=>Math.max(0,Math.min(LIMIT,Math.trunc(Number(value)||0)));
 const freeEnemy=p=>!!p&&p.kind==='enemy'&&(state.encounter.rpgSessionMode||'table-free')==='table-free';
 // Explicit home rule: round the halved resistance UP (25 -> 13).
 const halfUp=n=>Math.ceil(Math.max(0,Number(n)||0)/2);
 const previousDamage=resolveDamageAmount;
 resolveDamageAmount=function(target,amount,type){
  if(!freeEnemy(target))return previousDamage(target,amount,type);
  const override=window.MJDamageOverride?.[target.id];
  if(override){
   const raw=Math.max(0,Math.trunc(Number(amount)||0));
   const adjusted=override==='immunity'?0:override==='resistance'?halfUp(raw):override==='vulnerability'?raw*2:raw;
   return {amount:adjusted,reason:'Correction ponctuelle : '+override};
  }
  const result=previousDamage(target,amount,type);
  // The native resolver already checks immunity first and cancels resistance
  // against vulnerability. Only adjust a resistance-only result.
  return result.reason==='résistance'?{...result,amount:halfUp(amount)}:result;
 };
 const previousMax=effectiveLegendaryMax;
 effectiveLegendaryMax=function(p,m=modelFor(p)){
  if(p?.kind==='enemy'&&p.legendaryMaxOverride!=null&&Number.isFinite(Number(p.legendaryMaxOverride)))
   return integer(p.legendaryMaxOverride);
  return previousMax(p,m);
 };
 const previousRenderDetail=renderDetail;
 function controls(p){
  const max=effectiveLegendaryMax(p),remaining=Math.max(0,Math.min(max,integer(p.legendaryRemaining)));
  return '<section class="v13-legendary-controls" aria-label="Actions légendaires de '+esc(participantLabel(p))+'">'+
    '<div class="v13-legendary-stepper"><span class="v13-legendary-label">★ Actions restantes</span>'+
    '<button type="button" data-v13-leg-remaining="-1" aria-label="Retirer une action légendaire" '+(!remaining?'disabled':'')+'>−</button>'+
    '<strong data-v13-leg-current aria-live="polite">'+remaining+' / '+max+'</strong>'+
    '<button type="button" data-v13-leg-remaining="1" aria-label="Ajouter une action légendaire" '+(remaining>=max?'disabled':'')+'>+</button></div>'+
    '<div class="v13-legendary-stepper v13-legendary-max"><span class="v13-legendary-label">Maximum</span>'+
    '<button type="button" data-v13-leg-max="-1" aria-label="Réduire le maximum" '+(!max?'disabled':'')+'>−</button>'+
    '<strong data-v13-leg-cap aria-live="polite">'+max+'</strong>'+
    '<button type="button" data-v13-leg-max="1" aria-label="Augmenter le maximum" '+(max>=LIMIT?'disabled':'')+'>+</button></div>'+
    '<small class="v13-legendary-info">Correction MJ · maximum propre à ce boss · recharge normale au début de son tour</small></section>';
 }
 renderDetail=function(){
  previousRenderDetail();
  const p=selectedParticipant();
  if(!freeEnemy(p)||isLair(p)||!(modelFor(p)?.legendaryActions?.length||effectiveLegendaryMax(p)>0))return;
  const grid=document.querySelector('#activeDetail .stat-grid');
  if(grid&&!document.querySelector('#activeDetail .v13-legendary-controls'))
   grid.insertAdjacentHTML('afterend',controls(p));
 };
 document.querySelector('#activeDetail').addEventListener('click',event=>{
  const button=event.target.closest('[data-v13-leg-remaining],[data-v13-leg-max]');
  if(!button)return;
  const p=selectedParticipant();
  if(!freeEnemy(p)||isLair(p))return;
  const isCap=button.hasAttribute('data-v13-leg-max'),delta=Number(button.dataset[isCap?'v13LegMax':'v13LegRemaining']);
  if(!Number.isInteger(delta)||Math.abs(delta)!==1)return;
  const oldMax=effectiveLegendaryMax(p),oldRemaining=integer(p.legendaryRemaining);
  const nextMax=isCap?integer(oldMax+delta):oldMax;
  const nextRemaining=isCap?Math.min(oldRemaining,nextMax):Math.min(nextMax,Math.max(0,oldRemaining+delta));
  if(nextMax===oldMax&&nextRemaining===oldRemaining)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  mutate(()=>{
   if(isCap)p.legendaryMaxOverride=nextMax;
   p.legendaryRemaining=nextRemaining;
  },participantLabel(p)+' — actions légendaires : '+nextRemaining+'/'+nextMax+' (correction MJ).');
 },true);
 window.EncounterV13Lot4={halfUp,freeEnemy,capFor:effectiveLegendaryMax};
})();
