/* One presentation queue; combat authorities retain their ledgers and handlers. */
(()=>{'use strict';
 const handlers=new Map(),sources=new Map();let current='',paused=false,scheduled=false,busy=false;
 const host=document.createElement('dialog');host.id='mjDecisionDialog';host.className='mj-decision-dialog';host.setAttribute('aria-labelledby','mjDecisionTitle');
 host.innerHTML='<header class="mj-decision-heading"><div><span class="eyebrow">ENCOUNTER · ARBITRAGE MJ</span><h2 id="mjDecisionTitle">Décision en attente</h2></div><button type="button" data-decision-defer aria-label="Fermer et conserver les demandes">×</button></header><div id="mjDecisionBody"></div><footer><span id="mjDecisionCount"></span><button type="button" data-decision-defer>Décider plus tard</button></footer>';
 document.body.append(host);const body=host.querySelector('#mjDecisionBody'),custom=document.createElement('section');custom.id='mjContextDecision';body.append(custom);
 const dock=document.createElement('button');dock.id='mjDecisionDock';dock.type='button';dock.hidden=true;dock.className='mj-decision-dock';document.body.append(dock);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ledger=()=>state.encounter.mjDecisions||(state.encounter.mjDecisions={});
 function entries(){return Object.values(ledger()).filter(q=>q.status==='pending'&&handlers.has(q.kind)&&(!q.combatId||q.combatId===window.RPGConnectMJ?.getStatus().fight.requestId));}
 function request(q){if(!q.id||!handlers.has(q.kind))return false;const old=ledger()[q.id];if(old)return old;ledger()[q.id]={...q,status:'pending',createdAt:Date.now()};saveState();paused=false;schedule();return ledger()[q.id];}
 function register(node,{priority=40,title='Décision MJ'}={}){if(!node.id)node.id='mj-source-'+crypto.randomUUID();if(sources.has(node.id))return;const nativeClose=node.tagName==='DIALOG'?node.close.bind(node):null;
   if(nativeClose&&node.open)nativeClose();node.classList.add('mj-decision-source');body.append(node);sources.set(node.id,{node,priority,title});
   if(nativeClose){node.showModal=()=>{node.hidden=false;node.setAttribute('open','');paused=false;schedule()};node.close=()=>{node.hidden=true;node.removeAttribute('open');schedule()};}
   node.addEventListener('cancel',e=>{e.preventDefault();defer()});
   new MutationObserver(schedule).observe(node,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});schedule();
 }
 function renderCustom(q){const h=handlers.get(q.kind);custom.innerHTML=h.render(q,esc);custom.dataset.requestId=q.id;}
 function candidates(){return [...entries().map(q=>({key:q.id,priority:q.priority??30,q})),...[...sources].filter(([,s])=>s.node.isConnected&&!s.node.hidden&&s.node.childElementCount).map(([key,s])=>({key,priority:s.priority,s}))].sort((a,b)=>a.priority-b.priority);}
 function refresh(){scheduled=false;const all=candidates();dock.hidden=!all.length;dock.textContent=all.length+' décision'+(all.length>1?'s':'')+' en attente';
   const active=all.find(x=>x.key===current);const next=active&&active.priority<=all[0]?.priority?active:all[0];
   if(!next||paused){if(host.open)host.close();current='';return;}
   const changed=current!==next.key;current=next.key;custom.hidden=!next.q;for(const s of sources.values())s.node.classList.toggle('mj-queued-source',s!==next.s);
   if(next.q&&(changed||custom.dataset.requestId!==next.q.id))renderCustom(next.q);
   host.querySelector('#mjDecisionTitle').textContent=next.q?.title||next.s.title;
   host.querySelector('#mjDecisionCount').textContent=all.length+' demande'+(all.length>1?'s':'')+' · fermer conserve la file';
   if(!host.open)host.showModal();if(changed)host.querySelector('[data-decision-defer]').focus();
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(refresh)}}
 function defer(){paused=true;if(host.open)host.close();current='';dock.focus();}
 host.addEventListener('cancel',e=>{e.preventDefault();defer()});host.addEventListener('click',e=>{if(e.target.closest('[data-decision-defer]'))defer();});dock.onclick=()=>{paused=false;schedule()};
 custom.addEventListener('click',e=>{const b=e.target.closest('[data-decision-choice]');if(!b||busy)return;const q=ledger()[custom.dataset.requestId];if(!q||q.status!=='pending')return;const h=handlers.get(q.kind);busy=true;custom.querySelectorAll('button').forEach(x=>x.disabled=true);
   try{const done=h.resolve(q,b.dataset.decisionChoice,custom);if(done===false){custom.querySelectorAll('button').forEach(x=>x.disabled=false);return;}q.status='resolved';q.choice=b.dataset.decisionChoice;saveState();current='';schedule();}catch(error){console.error('MJ decision',error);custom.querySelectorAll('button').forEach(x=>x.disabled=false);const errorBox=custom.querySelector('[data-decision-error]');if(errorBox)errorBox.textContent='La décision reste en attente : '+error.message;}finally{busy=false}
 });
 window.EncounterDecisions={request,register,refresh:schedule,handler(kind,h){handlers.set(kind,h);schedule()},pending:()=>entries(),escape:esc};
 window.EncounterDecisions.handler('initiative-correction',{render:(q,esc)=>'<p class="mj-decision-description">Corriger l’initiative de '+esc(q.name)+' à '+esc(q.value)+' ? L’ordre actuel et le tour sont conservés ; le nouvel ordre s’appliquera au prochain round.</p><div class="mj-decision-actions"><button data-decision-choice="no">Conserver l’initiative</button><button class="primary" data-decision-choice="yes">Corriger l’initiative</button></div>',resolve:(q,choice)=>{const p=state.encounter.participants.find(p=>p.id===q.participantId);if(choice==='yes'&&p){checkpoint();preserveFightPosition(()=>p.initiative=q.value);saveState();render()}return true}});
 window.EncounterDecisions.handler('model-update',{render:(q,esc)=>'<p class="mj-decision-description">Modifier la fiche de '+esc(q.model.name)+' liée au combat ? Ses capacités et défenses seront actualisées. Les PV, CA d’instance, états, initiative et tour restent conservés.</p><div class="mj-decision-actions"><button data-decision-choice="no">Conserver la fiche</button><button class="primary" data-decision-choice="yes">Actualiser la fiche</button></div>',resolve:(q,choice)=>{if(choice==='yes'){mutate(()=>{const i=state.monsters.findIndex(m=>m.id===q.model.id);if(i>=0)state.monsters[i]=q.model;else state.monsters.push(q.model)},q.model.name+' · fiche actualisée.');document.querySelector('#monsterEditor')?.close()}return true}});
 window.EncounterDecisions.handler('concentration-control',{render:(q,esc)=>'<p class="mj-decision-description">'+esc(q.connected?'Rompre la concentration de '+q.name+' via son Companion ? Les effets connectés seront arrêtés.':'Définir la concentration de '+q.name+' ; vide signifie inactive.')+'</p>'+(!q.connected?'<label>Effet de concentration<input data-local-concentration value="'+esc(q.value)+'"></label>':'')+'<div class="mj-decision-actions"><button data-decision-choice="no">Conserver la concentration</button><button class="primary" data-decision-choice="yes">'+(q.connected?'Rompre la concentration':'Enregistrer la concentration')+'</button></div>',resolve:(q,choice,root)=>{const p=state.encounter.participants.find(p=>p.id===q.participantId);if(choice==='yes'&&p){if(q.connected)window.EncounterMJControl?.breakConcentration(p.id);else{const value=root.querySelector('[data-local-concentration]').value.trim();mutate(()=>p.localConcentration=value?{name:value,source:value}:null,p.name+' · concentration '+(value||'inactive'))}}return true}});

})();
