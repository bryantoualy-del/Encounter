/* Perception overrides belong to the participant's editable combat sheet. */
(()=>{
 'use strict';
 const fields=[
  ['rpgSeesInvisible','Perçoit l’invisible'],
  ['rpgSeesThroughShadows','Perçoit à travers Ombre d’égarement'],
  ['rpgIgnoresIllusions','Ignore les illusions']
 ];
 const baseOpen=openParticipantEditor;
 openParticipantEditor=function(id){
  baseOpen(id);
  const p=state.encounter.participants.find(x=>x.id===id),form=document.querySelector('#participantEditorForm');
  if(!p||!form||isLair(p))return;
  form.querySelector('[data-rpg-perception-editor]')?.remove();
  const section=document.createElement('section');section.className='editor-section';section.dataset.rpgPerceptionEditor='1';
  const title=document.createElement('h3');title.textContent='Sens et perception';section.append(title);
  const hint=document.createElement('p');hint.className='muted tiny';hint.textContent='Le MJ confirme les sens et leur portée pour cette instance.';section.append(hint);
  for(const [key,text] of fields){
   const label=document.createElement('label');label.className='check-label';
   const input=document.createElement('input');input.type='checkbox';input.name=key;input.checked=!!p[key];
   label.append(input,document.createTextNode(' '+text));section.append(label);
  }
  form.querySelector('.modal-actions').before(section);
 };
 const baseSave=saveParticipantInstance;
 saveParticipantInstance=function(){
  const form=document.querySelector('#participantEditorForm'),p=state.encounter.participants.find(x=>x.id===form.elements.participantId.value);
  if(!p)return baseSave();
  const values=fields.map(([key])=>[key,form.elements[key]?.checked??!!p[key]]);
  // Apply inside the existing mutation so undo captures perception with the sheet.
  const baseMutate=mutate;
  mutate=function(fn,...args){return baseMutate(()=>{fn();for(const [key,value] of values)p[key]=value;},...args);};
  try{baseSave();}finally{mutate=baseMutate;}
  globalThis.EncounterMJControl?.sync();
 };
})();
