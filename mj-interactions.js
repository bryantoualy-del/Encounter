/* Presentation only: existing participant fields and authorities remain canonical. */
(()=>{
 'use strict';
 const fields=[['rpgSeesInvisible','Perçoit l’invisible'],['rpgSeesThroughShadows','Perçoit à travers Ombre d’égarement'],['rpgIgnoresIllusions','Ignore les illusions']];
 function section(root){let box=root.querySelector('[data-mj-interactions]');if(!box){box=document.createElement('details');box.dataset.mjInteractions='1';box.className='mj-interactions';box.innerHTML='<summary>Contexte et interactions</summary><div data-interaction-body></div>';root.append(box);}return box.querySelector('[data-interaction-body]');}
 function check(parent,p,key,label){const row=document.createElement('label');row.className='mj-context-setting';const input=document.createElement('input');input.type='checkbox';input.checked=p[key]===true;input.dataset.contextField=key;input.onchange=()=>{mutate(()=>{p[key]=input.checked;},p.name+' · '+label+' : '+(input.checked?'confirmé':'non confirmé'));window.EncounterMJControl?.sync();};row.append(input,document.createTextNode(label));parent.append(row);}
 const openSheets=new Set();
 const base=renderDetail;renderDetail=function(){base();return;const old=document.querySelector('[data-mj-interactions]');if(old?.dataset.participantId){old.open?openSheets.add(old.dataset.participantId):openSheets.delete(old.dataset.participantId);}base();const p=selectedParticipant(),root=document.querySelector('#activeDetail');if(!p||!root||isLair(p))return;const body=section(root),box=body.closest('details');box.dataset.participantId=p.id;box.open=openSheets.has(p.id);root.querySelector('.detail-tabs')?.before(box);
 const perception=document.createElement('fieldset');perception.innerHTML='<legend>Sens et perception · '+esc(p.name)+'</legend>';fields.forEach(([k,t])=>check(perception,p,k,t));body.prepend(perception);const opportunity=root.querySelector('[data-provoke-opportunity]');if(opportunity)body.append(opportunity);
 const b=state.encounter.participants.find(x=>window.EncounterMJControl?.controller(x.id)==='brackmard'||x.id==='cc-brackmard');if(p.kind==='enemy'&&b){const group=document.createElement('fieldset');group.innerHTML='<legend>Brack Mard · visibilité et proximité</legend>';check(group,p,'rpgBrackVisible','Brack voit cet assaillant · Esquiver');check(group,p,'rpgBrackMeleeConfirmed','À 1,50 m de Brack · Sentinelle');body.append(group);}
 };
 const yes=v=>v===true?'confirmé':v===false?'non confirmé':'à confirmer';
 function decision(q){return ''; const candidates=[q.targetId,q.actorId,q.participantId,q.context?.targetId,q.context?.attack?.attackerId,...(q.event?.payload?.targetIds||[])];const w=state.encounter.rpgReactions?.[q.reactionId];if(w?.context?.targetId)candidates.push(w.context.targetId);
 const ps=[...new Set(candidates)].map(id=>state.encounter.participants.find(p=>p.id===id)).filter(Boolean);if(!ps.length)return '';
 const kind=q.kind||'',companion=q.event?.characterId||w?.claim?.characterId;
 return '<aside class="mj-decision-context"><strong>Contexte et interactions</strong>'+ps.map(p=>{const lines=[];if(/brack|opportunity|reaction|protection/.test(kind)||companion==='brackmard'){lines.push('Brack Mard · visibilité : '+yes(p.rpgBrackVisible)+' · proximité à 1,50 m : '+yes(p.rpgBrackMeleeConfirmed));}if(/shadow|shroud|attack|reaction|opportunity/.test(kind))lines.push('Perçoit l’invisible : '+yes(p.rpgSeesInvisible)+' · à travers Ombre d’égarement : '+yes(p.rpgSeesThroughShadows));
 const cover=state.encounter.rpgZephyrCoverage;if(cover&&/protection|reaction|opportunity/.test(kind))lines.push('Zéphyr · couverture à 3 m : '+((p.kind==='enemy'?cover.enemies:cover.allies)?.includes(p.id)?'confirmée':'non confirmée'));
 if(/nans/.test(kind)&&p.kind==='enemy')lines.push('Nans · zone des ancêtres : '+(state.encounter.participants.find(x=>x.rpgNansAncestors)?.rpgNansAncestors?.targets?.includes(p.id)?'confirmée':'à confirmer'));
 return lines.length?'<p><b>'+esc(p.name)+'</b><br>'+lines.map(esc).join('<br>')+'</p>':'';}).join('')+'<small>Le MJ confirme la situation actuelle sur la table ; ces réglages ne remplacent pas sa décision.</small></aside>';
 }
 const dock=document.querySelector('#mjDecisionDock'),cockpit=document.querySelector('#rpgMjCockpit');function placeDock(){if(!dock||!cockpit)return;const detail=document.querySelector('.detail-panel');if(innerWidth<=720&&document.body.classList.contains('table-detail-open')&&detail)detail.insertBefore(dock,document.querySelector('#activeDetail'));else cockpit.querySelector('.rpg-mj-netline').append(dock);}
 placeDock();new MutationObserver(placeDock).observe(document.body,{attributes:true,attributeFilter:['class']});addEventListener('resize',placeDock);
 window.EncounterInteractions={section,decision};renderDetail();
})();
