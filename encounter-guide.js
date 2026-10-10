/* Encounter tour: highlights the actual application DOM without dispatching combat actions. */
(()=>{'use strict';
 if(document.getElementById('btnEncounterGuide'))return;
 const host=document.querySelector('.top-actions')||document.querySelector('.topbar');if(!host)return;
 const button=document.createElement('button');button.id='btnEncounterGuide';button.type='button';button.className='ghost persistent-action';button.textContent='✦ Guide';button.title='Visite guidée des vrais écrans';host.append(button);
 const css=document.createElement('style');css.textContent=`
 #encounterTour:popover-open{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;color:white;z-index:2147483647;overflow:visible}
 #encounterTourRing{position:fixed;pointer-events:none;border:3px solid #f5d58c;border-radius:12px;box-shadow:0 0 0 9999px #030914b6,0 0 28px #eac374;transition:all .18s}
 #encounterTourCard{position:fixed;top:100px;right:14px;box-sizing:border-box;width:min(340px,calc(100vw - 28px));max-height:calc(100dvh - 115px);overflow:auto;background:#17283d;border:1px solid #ebc984;border-radius:16px;padding:18px;color:#f6f2e9;box-shadow:0 16px 55px #000b;font:14px/1.45 system-ui}
 #encounterTourCard h2{margin:12px 0;font:700 20px/1.2 system-ui}#encounterTourCard p{margin:8px 0 14px;color:#e1e8f0}#encounterTourCard small{color:#f0d290}#encounterTourCard .progress{height:4px;background:#40536a;border-radius:3px;margin:13px 0}#encounterTourCard .progress span{display:block;height:100%;background:#ebc984}#encounterTourCard .controls{display:flex;gap:7px;flex-wrap:wrap}
 #encounterTourCard button{min-height:44px;padding:8px 11px;border:1px solid #8ba0b6;border-radius:9px;background:#294059;color:#fff;font:inherit}#encounterTourCard button:focus-visible{outline:3px solid #ffe19d}#encounterTourCard button:disabled{opacity:.5}#encounterTourCard [data-next]{background:#ebc984;color:#221c13;border-color:#ebc984;font-weight:700}
 @media(max-width:700px){#encounterTourCard{top:auto;bottom:max(8px,env(safe-area-inset-bottom));left:9px;right:9px;width:auto;max-height:min(37dvh,310px);padding:13px}#encounterTourCard h2{font-size:18px;margin:5px 0}#encounterTourCard p{margin:5px 0}#encounterTourCard .progress{margin:7px 0}}
 @media(prefers-reduced-motion:reduce){#encounterTourRing{transition:none}}
 `;document.head.append(css);
 const steps=[
  ['#btnModePrep','Préparation','Voici la vraie console MJ. Le guide ne modifie ni la rencontre ni les données du combat.'],
  ['#prepView .prep-hero','Composer','Préparer les profils, les joueurs et l’ordre d’initiative.',{mode:'prep'}],
  ['#btnPrepOpenLibrary','Bibliothèque','Ouvrir les fiches existantes et les profils créés par le MJ.',{mode:'prep'}],
  ['#monsterLibrary','Adversaires','Choisir une fiche et la quantité à ajouter. Le guide ne valide aucune composition.',{drawer:'library'}],
  ['#btnCreateMonster','Créer une fiche','Le MJ renseigne une fiche de catégorie Adversaire : CA, PV et défenses.',{drawer:'library'}],
  ['#monsterForm .editor-grid','Profil','Ce sont les champs du véritable éditeur. Le guide ouvre un brouillon sans l’enregistrer.',{dialog:'monsterEditor'}],
  ['#actionsRows','Actions','Renseigner bonus, dégâts, type, DD et JdS sur touche dans les champs prévus.',{dialog:'monsterEditor'}],
  ['#mjCompatibility','Compatibilité RPG Connect','Relire chaque capacité : automatisée, décision MJ nécessaire ou information manquante. Essayer sur cibles fictives avant la séance.',{dialog:'monsterEditor'}],
  ['#rpgMjEndpoint','Connexion RPG','Renseigner serveur et clé MJ pendant la partie. La visite ne se connecte pas.',{dialog:'rpgMjDialog'}],
  ['#rpgMjPlayers','Invitations','Associer chaque compagnon à son participant et transmettre son invitation personnelle.',{dialog:'rpgMjDialog'}],
  ['#rpgMjPrepareFight','Prépa Fight','En partie réelle, demander et vérifier les initiatives. Le bouton n’est pas activé par le guide.',{dialog:'rpgMjDialog'}],
  ['#rpgMjStartFight','FIGHT','Valider les initiatives avant de lancer le combat. Aucun message réseau n’est envoyé.',{dialog:'rpgMjDialog'}],
  ['#btnModeCombat','Combat','Voici les sections réelles du mode Combat. Une rencontre vide reste vide.'],
  ['#combatList','Participants','Le tour actif et les cibles figurent dans la vraie liste des combattants.',{mode:'combat'}],
  ['#activeDetail','Fiche active','Examiner la fiche et ses capacités ; le MJ valide les résultats selon la situation.',{mode:'combat'}],
  ['#mjOpenHealth','Points de vie','Pour adversaires et compagnons : dégâts, soins et PV temporaires. Vérifier avant toute application.',{mode:'combat'}],
  ['#mjSidePanel','Résolution locale','Après les dés à la table, sélectionner la cible et le type de dégâts ; appliquer une seule fois. Le guide n’appuie jamais sur APPLIQUER.',{mode:'combat',health:true}],
  ['#btnNextTurn','Tour suivant','Terminer les demandes en attente ; cette visite ne change ni le tour ni le round.',{mode:'combat'}],
  ['#combatLog','Journal','Relire les effets déjà appliqués avant toute correction. Quitter ramène à la même rencontre.',{drawer:'journal'}]
 ];
 const $=s=>document.querySelector(s);let root,card,ring,previous,original,opened=null,health=false,active=false,index=0,raf=0;
 function snapshot(){let selectors=['#prepView','#combatView','#quickBar','#btnModePrep','#btnModeCombat','#libraryDrawer','#journalDrawer','#drawerScrim','#mjSidePanel','.detail-panel'];return {classes:selectors.map(s=>[s,$(s)?.className]),aria:['#libraryDrawer','#journalDrawer'].map(s=>[s,$(s)?.getAttribute('aria-hidden')]),body:document.body.className,detail:typeof tableDetailOpen!=='undefined'?tableDetailOpen:null,x:window.scrollX,y:window.scrollY}}
 function restore(){if(!original)return;for(const [s,v] of original.classes){let el=$(s);if(el&&v!=null)el.className=v}for(const [s,v] of original.aria){let el=$(s);if(el&&v!=null)el.setAttribute('aria-hidden',v)}document.body.className=original.body;if(original.detail!==null)tableDetailOpen=original.detail;window.scrollTo(original.x,original.y);original=null}
 // A modal makes every element outside its subtree inert, including a popover
 // above it in the top layer. Keep the tour within the open dialog's DOM tree.
 function dock(parent,show=true){if(root?.matches(':popover-open'))root.hidePopover();parent.append(root);if(show)root.showPopover()}
 function closeOpened(){if(opened?.open){dock(document.body);opened.close()}opened=null;if(health){$('#mjSidePanel [data-panel-close]')?.click();health=false}}
 function preview(opt={}){
  const wanted=opt.dialog||null;if(opened?.id!==wanted)closeOpened();
  for(const s of ['#libraryDrawer','#journalDrawer','#drawerScrim'])$(s)?.classList.remove('open');for(const s of ['#libraryDrawer','#journalDrawer'])$(s)?.setAttribute('aria-hidden','true');
  if(opt.mode){let prep=opt.mode==='prep';$('#prepView')?.classList.toggle('hidden',!prep);$('#combatView')?.classList.toggle('hidden',prep);$('#btnModePrep')?.classList.toggle('active',prep);$('#btnModeCombat')?.classList.toggle('active',!prep);document.body.classList.toggle('combat-mode',!prep);if(prep&&typeof renderPrep==='function')renderPrep();if(!prep&&typeof renderCombat==='function'){renderCombat();if(typeof renderDetail==='function')renderDetail()}}
  if(opt.drawer){if(opt.drawer==='library'&&typeof renderLibrary==='function')renderLibrary();let d=$('#'+opt.drawer+'Drawer');d?.classList.add('open');d?.setAttribute('aria-hidden','false');$('#drawerScrim')?.classList.add('open')}
  if(wanted&&!opened){let d=$('#'+wanted);if(d){
   dock(d,false);
   try{if(!d.open){if(wanted==='monsterEditor'&&typeof openMonsterEditor==='function')openMonsterEditor();else d.showModal()}}catch(error){console.warn('Guide : fenêtre indisponible',error)}
   opened=d.open?d:null;
   if(opened)root.showPopover();else dock(document.body);
  }}
  if(opt.health&&!health){$('#mjOpenHealth')?.click();health=!$('#mjSidePanel')?.classList.contains('hidden')}
 }
 function position(){if(!active)return;let t=$(steps[index][0]);if(!t)return;let b=t.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;ring.style.top=Math.max(2,b.top-5)+'px';ring.style.left=Math.max(2,b.left-5)+'px';ring.style.width=Math.max(4,Math.min(vw-b.left-3,b.width+10))+'px';ring.style.height=Math.max(4,Math.min(vh-b.top-3,b.height+10))+'px';if(vw>700){card.style.top=Math.min(Math.max(10,b.top),Math.max(10,vh-card.offsetHeight-10))+'px';let left=b.right>vw-350;card.style.left=left?'14px':'';card.style.right=left?'auto':'14px'}}
 function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(position)}
 function show(){if(!active)return;let [sel,title,description,options]=steps[index];preview(options);let t=$(sel);if(!t||options?.health&&!health||t.closest('dialog')&&!t.closest('dialog').open){if(index<steps.length-1){index++;show()}else stop();return}card.querySelector('[data-count]').textContent=`ÉTAPE ${index+1} / ${steps.length}`;card.querySelector('h2').textContent=title;card.querySelector('p').textContent=description;card.querySelector('.progress span').style.width=((index+1)/steps.length*100)+'%';card.querySelector('[data-back]').disabled=index===0;card.querySelector('[data-next]').textContent=index===steps.length-1?'Terminer ✓':'Suivant →';t.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});schedule();card.querySelector('[data-next]').focus({preventScroll:true})}
 function stop(){if(!active)return;active=false;cancelAnimationFrame(raf);if(root?.matches(':popover-open'))root.hidePopover();closeOpened();root?.remove();root=null;restore();previous?.focus?.({preventScroll:true});window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);document.removeEventListener('keydown',keys,true)}
 function keys(e){if(!active)return;if(!['Escape','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')stop();else{index=Math.max(0,Math.min(steps.length-1,index+(e.key==='ArrowRight'?1:-1)));show()}}
 function start(){if(active)return;if(document.querySelector('dialog[open]')||($('#mjSidePanel')&&!$('#mjSidePanel').classList.contains('hidden'))){button.title='Fermer le panneau en cours avant la visite';return}if(!HTMLElement.prototype.showPopover){button.title='Visite guidée indisponible sur ce navigateur';return}previous=document.activeElement;original=snapshot();root=document.createElement('div');root.id='encounterTour';root.setAttribute('popover','manual');ring=document.createElement('div');ring.id='encounterTourRing';card=document.createElement('section');card.id='encounterTourCard';card.setAttribute('role','dialog');card.setAttribute('aria-label','Visite guidée d’Encounter');card.innerHTML='<small data-count></small><h2></h2><p></p><div class="progress"><span></span></div><div class="controls"><button type="button" data-back>← Précédent</button><button type="button" data-next>Suivant →</button><button type="button" data-exit>Quitter</button></div>';root.append(ring,card);document.body.append(root);card.querySelector('[data-back]').onclick=()=>{index=Math.max(0,index-1);show()};card.querySelector('[data-next]').onclick=()=>index===steps.length-1?stop():(index++,show());card.querySelector('[data-exit]').onclick=stop;root.showPopover();active=true;index=0;window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);document.addEventListener('keydown',keys,true);show()}
 button.addEventListener('click',start);
 window.EncounterGuide={start,stop,get active(){return active},get step(){return index+1},get count(){return steps.length}};
})();
