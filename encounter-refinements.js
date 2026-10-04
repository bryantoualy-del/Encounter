(function encounterRefinementBootstrap(){
'use strict';

const REF_VERSION='2026.10.04.1';
const CAT_KEY='encounter:refinement:categories:v1';
const MODEL_CAT_KEY='encounter:refinement:model-categories:v1';
const PARTICIPANT_CAT_KEY='encounter:refinement:participant-categories:v1';
const CONC_KEY='encounter:refinement:concentration:v1';
const DEFAULT_CATEGORIES=[
  {id:'enemy',name:'Adversaires',short:'ADVERSAIRE',color:'#e34d55',semantic:'enemy',builtin:true},
  {id:'character',name:'Personnages',short:'PJ',color:'#4d8ee8',semantic:'character',builtin:true},
  {id:'companion',name:'Compagnons',short:'COMP.',color:'#45b879',semantic:'companion',builtin:true},
  {id:'npc',name:'PNJ Alliés',short:'PNJ ALLIÉ',color:'#d8b84a',semantic:'npc',builtin:true}
];
const CLASS_NAMES=['artificier','druide','rodeur','clerc','barbare','ensorceleur','moine','barde','paladin','occultiste','magicien','guerrier','roublard'];
const CLASS_POS=Object.fromEntries(CLASS_NAMES.map((name,i)=>[name,{x:(i%7)/6*100,y:Math.floor(i/7)*100}]));
const KNOWN_CLASSES={
  kentaro:'occultiste',samoth:'ensorceleur','brack mard':'guerrier',brackmard:'guerrier',
  rufus:'roublard',nans:'barbare','zéphyr':'paladin',zephyr:'paladin',
  sylas:'artificier',silas:'artificier',wonq:'barde',willy:'barde',tuskhan:'barbare',pik:'roublard'
};
const CONDITION_DETAILS={
  aveugle:"Une créature aveuglée ne voit pas. Elle échoue automatiquement aux tests qui nécessitent la vue. Les attaques contre elle ont l’avantage et ses attaques ont le désavantage.",
  charme:"Une créature charmée ne peut pas attaquer celui qui l’a charmée ni le cibler avec des capacités ou effets magiques nuisibles. Le charmeur a l’avantage aux interactions sociales avec elle.",
  assourdi:"Une créature assourdie n’entend pas et échoue automatiquement aux tests qui nécessitent l’ouïe.",
  epuisement:"L’épuisement est un état cumulatif dont les effets dépendent du niveau d’épuisement. Utilise la fiche ou la source de l’effet pour suivre le niveau exact.",
  effraye:"Une créature effrayée a le désavantage aux tests de caractéristique et jets d’attaque tant que la source de sa peur est dans sa ligne de vue. Elle ne peut pas volontairement se rapprocher de cette source.",
  agrippe:"La vitesse d’une créature agrippée devient 0 et elle ne bénéficie d’aucun bonus de vitesse. L’état prend fin si l’agrippeur est neutralisé ou si un effet éloigne la cible de sa portée.",
  incapacite:"Une créature neutralisée ne peut effectuer ni action ni réaction.",
  invisible:"Une créature invisible est impossible à voir sans magie ou sens spécial. Ses attaques ont l’avantage et les attaques contre elle ont le désavantage, sous réserve que sa position ne soit pas autrement révélée.",
  paralyse:"Une créature paralysée est neutralisée, ne peut ni bouger ni parler, et échoue automatiquement aux JS de Force et Dextérité. Les attaques contre elle ont l’avantage ; à 1,50 m, un coup réussi est critique.",
  petrifie:"Une créature pétrifiée est transformée avec son équipement en substance solide. Elle est neutralisée, ne peut bouger ni parler, ignore son environnement, gagne une forte résistance aux dégâts et échoue automatiquement aux JS de Force et Dextérité.",
  empoisonne:"Une créature empoisonnée a le désavantage aux jets d’attaque et aux tests de caractéristique.",
  a_terre:"Une créature à terre ne peut se déplacer qu’en rampant sauf si elle se relève. Ses attaques ont le désavantage. Les attaques à 1,50 m contre elle ont l’avantage ; au-delà, elles ont le désavantage.",
  entrave:"Une créature entravée a une vitesse de 0. Les attaques contre elle ont l’avantage, ses attaques ont le désavantage et elle a le désavantage aux JS de Dextérité.",
  etourdi:"Une créature étourdie est neutralisée, ne peut pas bouger et parle de façon hésitante. Elle échoue automatiquement aux JS de Force et Dextérité et les attaques contre elle ont l’avantage.",
  inconscient:"Une créature inconsciente est neutralisée, ne peut ni bouger ni parler et ignore son environnement. Elle lâche ce qu’elle tient, tombe à terre, échoue automatiquement aux JS de Force et Dextérité ; les attaques contre elle ont l’avantage et, à 1,50 m, un coup réussi est critique."
};
const CONDITION_KEY_ALIASES={
  'aveugle':'aveugle','charme':'charme','assourdi':'assourdi','epuisement':'epuisement','effraye':'effraye',
  'agrippe':'agrippe','neutralise':'incapacite','incapacite':'incapacite','invisible':'invisible','paralyse':'paralyse',
  'petrifie':'petrifie','empoisonne':'empoisonne','a terre':'a_terre','à terre':'a_terre','entrave':'entrave',
  'etourdi':'etourdi','inconscient':'inconscient'
};

const safeJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
const saveJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(err){console.warn('Encounter refinement storage',err)}};
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
let categories=normaliseCategories(safeJson(CAT_KEY,DEFAULT_CATEGORIES));
let modelCats=safeJson(MODEL_CAT_KEY,{});
let participantCats=safeJson(PARTICIPANT_CAT_KEY,{});
let concentration=new Set(safeJson(CONC_KEY,[]));
let conditionIcons={};
let advanced={category:'all',className:'',type:'',acMin:'',acMax:'',cr:'',hpMin:'',hpMax:''};
let stage=new Map();
let stagedApplying=false;
let refLibraryFilter='all';
let statesTargets=new Set();
let stateChoice=(typeof CONDITIONS!=='undefined'&&CONDITIONS[0])||'Aveuglé';
let hpTargets=new Set();
let hpMode='damage';
let hpValue='';
let hpMods=new Map();

function normaliseCategories(input){
  const map=new Map();
  for(const d of DEFAULT_CATEGORIES){
    const found=(Array.isArray(input)?input:[]).find(x=>x?.id===d.id);
    map.set(d.id,{...d,...found,id:d.id,semantic:d.semantic,builtin:true});
  }
  for(const c of Array.isArray(input)?input:[]){
    if(!c?.id||map.has(c.id))continue;
    map.set(c.id,{id:String(c.id),name:String(c.name||'Catégorie'),short:String(c.short||c.name||'CATÉGORIE').toUpperCase(),color:String(c.color||'#8c86d8'),semantic:['enemy','character','companion','npc'].includes(c.semantic)?c.semantic:'enemy',builtin:false});
  }
  return [...map.values()];
}
function persistCategories(){saveJson(CAT_KEY,categories);saveJson(MODEL_CAT_KEY,modelCats);saveJson(PARTICIPANT_CAT_KEY,participantCats)}
function categoryById(id){return categories.find(c=>c.id===id)||categories.find(c=>c.id==='enemy')}
function modelCategory(m){
  if(!m)return categoryById('enemy');
  const id=modelCats[m.id]||m.category||'enemy';
  return categoryById(id)||categoryById(m.category)||categoryById('enemy');
}
function participantCategory(p){
  if(!p)return categoryById('enemy');
  if(participantCats[p.id])return categoryById(participantCats[p.id]);
  const m=typeof modelFor==='function'?modelFor(p):null;
  if(m)return modelCategory(m);
  return categoryById(p.kind==='player'?'character':p.kind==='ally'?'npc':'enemy');
}
function isConcentrating(p){return !!p&&concentration.has(p.id)}
function setConcentration(pid,on){
  if(on)concentration.add(pid);else concentration.delete(pid);
  saveJson(CONC_KEY,[...concentration]);
}
function conditionKey(name){
  const k=norm(name).replace(/\s+/g,' ');
  return CONDITION_KEY_ALIASES[k]||k.replace(/\s+/g,'_');
}
function conditionIcon(name){
  const key=conditionKey(name);
  return conditionIcons[`conditions/${key}`]||conditionIcons[key]||'';
}
function conditionDetail(name){return CONDITION_DETAILS[conditionKey(name)]||"Consulte la description de l’effet qui applique cet état pour ses éventuelles règles supplémentaires."}
function conditionIconHtml(name,cls='ref-condition-icon'){
  const src=conditionIcon(name);
  return src?`<img class="${cls}" src="${src}" alt="" aria-hidden="true">`:`<span class="${cls} ref-condition-fallback">${html(String(name||'?').slice(0,1))}</span>`;
}
function actionIcon(kind,mini=false){
  const k=kind==='bonus'?'bonus':kind==='reaction'?'reaction':'action';
  return `<span class="ref-action-icon ${mini?'mini':'full'} ref-action-${k}" aria-hidden="true"><span class="ref-icon-fallback">${k==='action'?'A':k==='bonus'?'B':'R'}</span></span>`;
}
function classNameForModel(m){
  if(!m)return'';
  const known=KNOWN_CLASSES[norm(m.name)]||KNOWN_CLASSES[norm(m.id)];
  if(known)return known;
  const text=norm(`${m.subtitle||''} ${(m.tags||[]).join(' ')} ${m.type||''}`);
  const hits=CLASS_NAMES.map(c=>({name:c,index:text.indexOf(norm(c))})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index);
  return hits[0]?.name||'';
}
function classIconHtml(m){
  const name=classNameForModel(m),pos=CLASS_POS[name];
  if(!pos)return'';
  return `<span class="ref-class-icon" title="${html(name)}" style="--class-x:${pos.x}%;--class-y:${pos.y}%"><span>${html(name.slice(0,1).toUpperCase())}</span></span>`;
}
function loadAssets(){
  const root=document.documentElement;
  Promise.all([
    fetch('./assets/refinement/actions-sprite.b64',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.text()}),
    fetch('./assets/refinement/classes-sprite.b64',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.text()}),
    fetch('./assets/refinement/condition-icons.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()})
  ]).then(([actions,classes,conds])=>{
    root.style.setProperty('--ref-actions-sprite',`url("data:image/webp;base64,${actions.trim()}")`);
    root.style.setProperty('--ref-classes-sprite',`url("data:image/webp;base64,${classes.trim()}")`);
    conditionIcons=conds?.icons||conds||{};
    root.classList.add('ref-assets-ready');
    try{render()}catch{}
  }).catch(err=>console.warn('Encounter refinement assets',err));
}

function removeDeviceSwitch(){
  document.querySelector('.device-profile-setting')?.remove();
  document.body.classList.remove('device-samsung-s7fe','samsung-s7fe');
  if(typeof state!=='undefined'&&state.ui&&state.ui.deviceProfile!=='ipad'){
    state.ui.deviceProfile='ipad';
    try{saveState()}catch{}
  }
  const prep=document.getElementById('btnModePrep');if(prep)prep.textContent='Préparation';
}

function injectDialogMarkup(){
  if(document.getElementById('refAdvancedDialog'))return;
  document.body.insertAdjacentHTML('beforeend',`
  <dialog id="refAdvancedDialog" class="modal ref-dialog">
    <form method="dialog" id="refAdvancedForm">
      <div class="modal-head"><div><span class="eyebrow">BIBLIOTHÈQUE</span><h2>Recherche avancée</h2></div><button type="button" class="icon-btn" data-ref-close="refAdvancedDialog">×</button></div>
      <div class="ref-filter-grid">
        <label>Catégorie<select name="category"></select></label>
        <label>Classe<select name="className"><option value="">Toutes</option>${CLASS_NAMES.map(c=>`<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join('')}</select></label>
        <label>Type de créature<input name="type" placeholder="humanoïde, dragon…"></label>
        <label>FP<input name="cr" placeholder="ex. 5, 1/2…"></label>
        <label>CA min<input name="acMin" type="number" min="0"></label>
        <label>CA max<input name="acMax" type="number" min="0"></label>
        <label>PV min<input name="hpMin" type="number" min="0"></label>
        <label>PV max<input name="hpMax" type="number" min="0"></label>
      </div>
      <div class="modal-actions"><button type="button" class="ghost" id="refAdvancedReset">Réinitialiser</button><button type="submit" class="primary">Rechercher</button></div>
    </form>
  </dialog>
  <dialog id="refCategoryDialog" class="modal wide ref-dialog">
    <div class="modal-shell">
      <div class="modal-head"><div><span class="eyebrow">BIBLIOTHÈQUE</span><h2>Catégories principales</h2></div><button type="button" class="icon-btn" data-ref-close="refCategoryDialog">×</button></div>
      <p class="muted">Le nom et la couleur sont purement visuels. Le comportement conserve la logique de combat correspondante afin de ne pas modifier le moteur.</p>
      <div id="refCategoryRows"></div>
      <div class="ref-category-add"><input id="refNewCategoryName" placeholder="Nouvelle catégorie"><input id="refNewCategoryColor" type="color" value="#8c86d8"><select id="refNewCategorySemantic"><option value="enemy">Comportement adversaire</option><option value="character">Comportement personnage</option><option value="companion">Comportement compagnon</option><option value="npc">Comportement PNJ allié</option></select><button id="refAddCategory" type="button" class="primary">+ Ajouter</button></div>
      <div class="modal-actions"><button type="button" class="primary" id="refSaveCategories">Enregistrer</button></div>
    </div>
  </dialog>
  <dialog id="refSkillDialog" class="modal ref-dialog">
    <div class="modal-shell"><div class="modal-head"><div><span class="eyebrow">TEST DE COMPÉTENCE</span><h2 id="refSkillTitle">Compétence</h2></div><button type="button" class="icon-btn" data-ref-close="refSkillDialog">×</button></div>
      <p id="refSkillText" class="muted"></p>
      <div class="ref-skill-choice"><button type="button" data-ref-skill-mode="adv" class="primary">Avantage</button><button type="button" data-ref-skill-mode="normal">Normal</button><button type="button" data-ref-skill-mode="dis">Désavantage</button><button type="button" data-ref-close="refSkillDialog" class="ghost">Annuler</button></div>
    </div>
  </dialog>`);
}

function ensureLibraryTools(){
  const drawer=document.getElementById('libraryDrawer');if(!drawer)return;
  drawer.classList.add('refined-library-drawer');
  const premium=drawer.querySelector('.premium-library-toolbar');
  if(premium&&!document.getElementById('refAdvancedSearch')){
    premium.querySelector('#libraryTagFilter')?.classList.add('hidden');
    premium.insertAdjacentHTML('beforeend','<button id="refAdvancedSearch" class="ghost small">Recherche avancée</button><button id="refManageCategories" class="ghost small">Catégories</button>');
  }
  if(!document.getElementById('refLibraryPreview')){
    const preview=document.createElement('section');preview.id='refLibraryPreview';preview.className='ref-library-preview';
    drawer.append(preview);
  }
}
function renderCategoryFilter(){
  const host=document.querySelector('#libraryDrawer .library-filters');if(!host)return;
  host.innerHTML=`<button class="${refLibraryFilter==='all'?'active':''}" data-ref-library-filter="all">Tous</button>`+categories.map(c=>`<button class="${refLibraryFilter===c.id?'active':''}" data-ref-library-filter="${html(c.id)}" style="--cat:${html(c.color)}">${html(c.name)}</button>`).join('');
}
function renderCategoryRows(){
  const host=document.getElementById('refCategoryRows');if(!host)return;
  host.innerHTML=categories.map(c=>`<div class="ref-category-row" data-ref-cat-row="${html(c.id)}"><input data-ref-cat-name value="${html(c.name)}" aria-label="Nom"><input data-ref-cat-short value="${html(c.short||c.name)}" aria-label="Libellé court"><input data-ref-cat-color type="color" value="${html(c.color)}" aria-label="Couleur"><select data-ref-cat-semantic ${c.builtin?'disabled':''}><option value="enemy" ${c.semantic==='enemy'?'selected':''}>Adversaire</option><option value="character" ${c.semantic==='character'?'selected':''}>Personnage</option><option value="companion" ${c.semantic==='companion'?'selected':''}>Compagnon</option><option value="npc" ${c.semantic==='npc'?'selected':''}>PNJ allié</option></select>${c.builtin?'<span class="ref-built-in">BASE</span>':`<button type="button" class="danger ghost small" data-ref-delete-category="${html(c.id)}">Supprimer</button>`}</div>`).join('');
}
function saveCategoryRows(){
  const next=[];
  for(const row of document.querySelectorAll('[data-ref-cat-row]')){
    const old=categoryById(row.dataset.refCatRow);if(!old)continue;
    next.push({...old,name:row.querySelector('[data-ref-cat-name]').value.trim()||old.name,short:(row.querySelector('[data-ref-cat-short]').value.trim()||old.short||old.name).toUpperCase(),color:row.querySelector('[data-ref-cat-color]').value||old.color,semantic:old.builtin?old.semantic:row.querySelector('[data-ref-cat-semantic]').value});
  }
  categories=normaliseCategories(next);persistCategories();renderLibrary();try{render()}catch{}
}
function advancedCategoryOptions(select){
  if(!select)return;
  select.innerHTML='<option value="all">Toutes les catégories</option>'+categories.map(c=>`<option value="${html(c.id)}">${html(c.name)}</option>`).join('');
  select.value=advanced.category||'all';
}
function passesAdvanced(m){
  const cat=modelCategory(m);
  if(advanced.category&&advanced.category!=='all'&&cat.id!==advanced.category)return false;
  if(advanced.className&&classNameForModel(m)!==advanced.className)return false;
  if(advanced.type&&!norm(m.type).includes(norm(advanced.type)))return false;
  if(advanced.cr&&norm(m.cr)!==norm(advanced.cr))return false;
  const ac=Number(m.ac),hp=Number(m.hp);
  if(advanced.acMin!==''&&ac<Number(advanced.acMin))return false;
  if(advanced.acMax!==''&&ac>Number(advanced.acMax))return false;
  if(advanced.hpMin!==''&&hp<Number(advanced.hpMin))return false;
  if(advanced.hpMax!==''&&hp>Number(advanced.hpMax))return false;
  return true;
}

const previousRenderLibrary=renderLibrary;
renderLibrary=function(){
  ensureLibraryTools();renderCategoryFilter();
  const q=(document.getElementById('monsterSearch')?.value||'').trim().toLowerCase(),locked=isLocked();
  const ms=state.monsters.filter(m=>{
    const cat=modelCategory(m);
    if(refLibraryFilter!=='all'&&cat.id!==refLibraryFilter)return false;
    if(!passesAdvanced(m))return false;
    if(ui.favoritesOnly&&!m.favorite)return false;
    return `${m.name} ${m.type} ${m.cr} ${m.source} ${m.subtitle} ${(m.tags||[]).join(' ')}`.toLowerCase().includes(q);
  });
  const host=document.getElementById('monsterLibrary');
  if(host)host.innerHTML=ms.map(m=>{
    const cat=modelCategory(m),boss=!!(m.isBoss||m.legendaryActions?.length),clazz=classNameForModel(m);
    return `<article class="library-card ref-library-card ${boss?'ref-boss-card':''}" style="--cat:${html(cat.color)}">
      <div class="library-title"><h3>${html(m.name)}</h3><span class="ref-category-badge">${html(cat.name)}</span></div>
      <div class="library-meta">${html(m.subtitle||[m.size,m.type].filter(Boolean).join(' · ')||'Profil de combat')} · CA ${m.ac} · ${m.hp} PV${m.cr?` · FP ${html(m.cr)}`:''}${clazz?` · ${html(clazz)}`:''}</div>
      ${m.source?`<div class="source-badge">${html(m.source)}</div>`:''}
      <div class="library-actions"><button class="ghost small" data-favorite="${html(m.id)}" title="Favori">${m.favorite?'★':'☆'}</button><button class="primary small" data-add-monster="${html(m.id)}" ${locked?'disabled':''}>+ Ajouter</button><button class="ghost small" data-edit-monster="${html(m.id)}" ${locked?'disabled':''}>Modifier</button></div>
    </article>`;
  }).join('')||'<p class="muted">Aucun profil ne correspond aux filtres.</p>';
  const create=document.getElementById('btnCreateMonster');if(create)create.disabled=locked;
  const fav=document.getElementById('btnFavoriteFilter');if(fav)fav.classList.toggle('active',!!ui.favoritesOnly);
  renderStage();
};

function stageMonster(id){
  const m=state.monsters.find(x=>x.id===id);if(!m)return;
  const existing=stage.get(id);
  if(existing){if(m.category==='enemy')existing.count=Math.min(50,(existing.count||1)+1)}
  else stage.set(id,{modelId:id,count:1,initiative:Number(m.initiative)||10,shared:true,includeCompanion:id==='pj-silas-veyr'&&state.monsters.some(x=>x.id==='comp-crasseuse'),includeLair:!!m.lairActions?.length});
  renderStage();
}
function renderStage(){
  ensureLibraryTools();
  const host=document.getElementById('refLibraryPreview');if(!host)return;
  const entries=[...stage.values()];
  host.innerHTML=`<div class="ref-library-preview-head"><div><span class="eyebrow">PRÉVISUALISATION</span><h3>Sélection à ajouter</h3></div><span class="count-badge">${entries.reduce((n,x)=>n+(x.count||1),0)}</span></div>
    <p class="muted tiny">Ajoute les profils ici, règle le nombre et l’initiative, puis termine en une seule fois.</p>
    <div class="ref-stage-list">${entries.length?entries.map(entry=>{
      const m=state.monsters.find(x=>x.id===entry.modelId);if(!m)return'';
      const multiple=m.category==='enemy',hasCompanion=entry.modelId==='pj-silas-veyr'&&state.monsters.some(x=>x.id==='comp-crasseuse'),hasLair=!!m.lairActions?.length;
      return `<article class="ref-stage-item" data-ref-stage="${html(entry.modelId)}"><div><strong>${html(m.name)}</strong><small>${html(modelCategory(m).name)}</small></div><label>Nb <div class="ref-stepper"><button type="button" data-ref-stage-count="${html(entry.modelId)}|-1" ${!multiple?'disabled':''}>−</button><span>${entry.count}</span><button type="button" data-ref-stage-count="${html(entry.modelId)}|1" ${!multiple?'disabled':''}>+</button></div></label><label>INI <input data-ref-stage-initiative="${html(entry.modelId)}" type="number" value="${entry.initiative}"></label>${multiple?`<label class="ref-shared"><input type="checkbox" data-ref-stage-shared="${html(entry.modelId)}" ${entry.shared?'checked':''}> initiative commune</label>`:'<span></span>'}${hasCompanion?`<label class="ref-stage-option"><input type="checkbox" data-ref-stage-companion="${html(entry.modelId)}" ${entry.includeCompanion?'checked':''}> ajouter C.R.A.S.S.E.U.S.E.</label>`:''}${hasLair?`<label class="ref-stage-option"><input type="checkbox" data-ref-stage-lair="${html(entry.modelId)}" ${entry.includeLair?'checked':''}> ajouter le repaire</label>`:''}<button type="button" class="danger ghost small" data-ref-stage-remove="${html(entry.modelId)}">Retirer</button></article>`;
    }).join(''):'<div class="ref-stage-empty">Aucun profil sélectionné.</div>'}</div>
    <button type="button" id="refStageFinish" class="primary ref-stage-finish" ${entries.length?'':'disabled'}>Terminer · ajouter à la rencontre</button>`;
}
function applyStage(){
  if(!stage.size||stagedApplying)return;
  if(structuralGuard())return;
  stagedApplying=true;
  try{
    const staged=[...stage.values()].map(x=>({...x}));
    mutate(()=>{
      for(const entry of staged){
        const m=state.monsters.find(x=>x.id===entry.modelId);if(!m)continue;
        const count=m.category==='enemy'?Math.max(1,Math.min(50,Number(entry.count)||1)):1;
        const groupId=count>1?uid('group'):null;
        let main=null;
        for(let i=1;i<=count;i++){
          const ini=entry.shared?(Number(entry.initiative)||0):(Number(entry.initiative)||0)+rollDie(6)-3;
          const p=makeParticipant(m,count>1?i:1,ini,groupId);state.encounter.participants.push(p);if(i===1)main=p;
        }
        if(entry.includeCompanion&&entry.modelId==='pj-silas-veyr'&&main){
          const cm=state.monsters.find(x=>x.id==='comp-crasseuse');if(cm)state.encounter.participants.push(makeParticipant(cm,1,main.initiative,null,main.id));
        }
        if(entry.includeLair&&m.lairActions?.length&&main)state.encounter.participants.push(makeLairParticipant(main,m));
      }
      state.encounter.currentTurn=0;
      state.encounter.selectedId=sortedParticipants()[0]?.id||null;
    },`${staged.reduce((n,x)=>n+(Number(x.count)||1),0)} participant(s) ajouté(s) depuis la bibliothèque.`);
    stage.clear();closeDrawers();
  }finally{stagedApplying=false}
}

function ensureEditorCategory(selectId,currentId){
  const form=document.getElementById(selectId==='refMonsterCategory'?'monsterForm':'participantEditorForm');if(!form)return;
  let sel=document.getElementById(selectId);
  if(!sel){
    const core=selectId==='refMonsterCategory'?form.elements.category:form.elements.kind;
    const label=core?.closest('label');if(!label)return;
    core.classList.add('ref-core-category-hidden');
    sel=document.createElement('select');sel.id=selectId;sel.className='ref-category-select';label.append(sel);
  }
  sel.innerHTML=categories.map(c=>`<option value="${html(c.id)}">${html(c.name)}</option>`).join('');
  sel.value=currentId&&categoryById(currentId)?currentId:(categories[0]?.id||'enemy');
}
const baseOpenMonsterEditor=openMonsterEditor;
openMonsterEditor=function(id=null){
  baseOpenMonsterEditor(id);
  const m=id?state.monsters.find(x=>x.id===id):null;
  ensureEditorCategory('refMonsterCategory',m?modelCategory(m).id:'enemy');
};
const baseSaveMonsterFromForm=saveMonsterFromForm;
saveMonsterFromForm=function(){
  const form=document.getElementById('monsterForm'),sel=document.getElementById('refMonsterCategory');
  if(form&&sel){
    if(!form.elements.monsterId.value)form.elements.monsterId.value=uid('monster');
    const c=categoryById(sel.value);if(c){form.elements.category.value=c.semantic;modelCats[form.elements.monsterId.value]=c.id;persistCategories()}
  }
  return baseSaveMonsterFromForm();
};
const baseOpenParticipantEditor=typeof openParticipantEditor==='function'?openParticipantEditor:null;
if(baseOpenParticipantEditor)openParticipantEditor=function(id){
  baseOpenParticipantEditor(id);
  const p=state.encounter.participants.find(x=>x.id===id);
  if(p)ensureEditorCategory('refParticipantCategory',participantCategory(p).id);
};
const baseSaveParticipantInstance=typeof saveParticipantInstance==='function'?saveParticipantInstance:null;
if(baseSaveParticipantInstance)saveParticipantInstance=function(){
  const form=document.getElementById('participantEditorForm'),sel=document.getElementById('refParticipantCategory'),pid=form?.elements.participantId?.value;
  if(pid&&sel){
    const c=categoryById(sel.value);
    if(c&&form.elements.kind)form.elements.kind.value=c.semantic==='enemy'?'enemy':c.semantic==='npc'?'ally':'player';
    participantCats[pid]=sel.value;persistCategories();
  }
  return baseSaveParticipantInstance();
};

function ensureCombatPanels(){
  const head=document.querySelector('#combatView .participant-head-actions');
  if(head&&!document.getElementById('refStatesButton')){
    head.insertAdjacentHTML('afterbegin','<button id="refStatesButton" class="ghost small">États</button><button id="refHpButton" class="ghost small">Points de vie</button>');
  }
  if(!document.getElementById('refStatesPanel')){
    document.body.insertAdjacentHTML('beforeend',`
    <aside id="refStatesPanel" class="ref-side-panel" aria-hidden="true">
      <div class="ref-side-head"><div><span class="eyebrow">COMBAT</span><h2>États</h2></div><button type="button" class="icon-btn" data-ref-panel-close>×</button></div>
      <div id="refStatesBody"></div>
    </aside>
    <aside id="refHpPanel" class="ref-side-panel" aria-hidden="true">
      <div class="ref-side-head"><div><span class="eyebrow">COMBAT</span><h2>Points de vie</h2></div><button type="button" class="icon-btn" data-ref-panel-close>×</button></div>
      <div id="refHpBody"></div>
    </aside>`);
  }
}
function participantChooser(selected,attr){
  const list=sortedParticipants().filter(p=>!isLair(p));
  return `<div class="ref-target-list">${list.map(p=>`<button type="button" class="ref-target-chip ${selected.has(p.id)?'selected':''}" ${attr}="${html(p.id)}" style="--cat:${html(participantCategory(p).color)}"><span class="ref-check">${selected.has(p.id)?'✓':''}</span><span><b>${html(p.name)}</b><small>${p.hp}/${p.maxHp} PV · CA ${effectiveAc(p)}</small></span></button>`).join('')}</div>`;
}
function renderStatesPanel(){
  const body=document.getElementById('refStatesBody');if(!body)return;
  statesTargets=new Set([...statesTargets].filter(id=>state.encounter.participants.some(p=>p.id===id&&!isLair(p))));
  if(!statesTargets.size&&selectedParticipant()&&!isLair(selectedParticipant()))statesTargets.add(selectedParticipant().id);
  const choice=stateChoice||CONDITIONS[0];
  body.innerHTML=`<section><h3>Cibles</h3>${participantChooser(statesTargets,'data-ref-state-target')}</section>
    <section><h3>État à appliquer</h3><div class="ref-condition-grid">${CONDITIONS.map(c=>`<button type="button" class="ref-condition-choice ${c===choice?'selected':''}" data-ref-state-choice="${html(c)}">${conditionIconHtml(c)}<span>${html(c)}</span></button>`).join('')}</div>
      <div class="ref-condition-help"><strong>${html(choice)}</strong><p>${html(conditionDetail(choice))}</p></div>
    </section>
    <section class="ref-state-options"><label>Durée<select id="refStateDuration"><option value="indefinite">Indéfinie</option><option value="rounds">Nombre de tours</option><option value="untilStart">Jusqu’au début du prochain tour</option><option value="untilEnd">Jusqu’à la fin du prochain tour</option><option value="saveEnd">Sauvegarde à la fin du tour</option></select></label><label id="refStateRoundsWrap">Tours<input id="refStateRounds" type="number" min="1" value="1"></label><label id="refStateSaveWrap" class="hidden">JS<select id="refStateSave"><option>FOR</option><option>DEX</option><option>CON</option><option>INT</option><option>SAG</option><option>CHA</option></select></label><label id="refStateDcWrap" class="hidden">DD<input id="refStateDc" type="number" min="1" value="15"></label><label class="span2">Source / note<input id="refStateSource" placeholder="Source de l’effet"></label></section>
    <button type="button" id="refApplyState" class="primary ref-apply" ${statesTargets.size?'':'disabled'}>APPLIQUER</button>`;
}
function updateStateOptionVisibility(){
  const v=document.getElementById('refStateDuration')?.value;
  document.getElementById('refStateRoundsWrap')?.classList.toggle('hidden',v!=='rounds');
  document.getElementById('refStateSaveWrap')?.classList.toggle('hidden',v!=='saveEnd');
  document.getElementById('refStateDcWrap')?.classList.toggle('hidden',v!=='saveEnd');
}
function applyStateFromPanel(){
  if(!statesTargets.size)return toast('Sélectionne au moins une cible.');
  const duration=document.getElementById('refStateDuration')?.value||'indefinite';
  const data={name:stateChoice,durationType:duration,remaining:duration==='rounds'?Math.max(1,Number(document.getElementById('refStateRounds')?.value)||1):null,saveAbility:duration==='saveEnd'?(document.getElementById('refStateSave')?.value||'CON'):'',dc:duration==='saveEnd'?Math.max(1,Number(document.getElementById('refStateDc')?.value)||15):null,source:(document.getElementById('refStateSource')?.value||'').trim()};
  if(addConditionMany([...statesTargets],data))renderStatesPanel();
}

function renderHpPanel(){
  const body=document.getElementById('refHpBody');if(!body)return;
  hpTargets=new Set([...hpTargets].filter(id=>state.encounter.participants.some(p=>p.id===id&&!isLair(p))));
  if(!hpTargets.size&&selectedParticipant()&&!isLair(selectedParticipant()))hpTargets.add(selectedParticipant().id);
  const digitButtons=['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k=>`<button type="button" data-ref-key="${k}">${k}</button>`).join('');
  const mods=hpMode==='damage'?`<section class="ref-damage-mods"><h3>Ajustement par cible</h3>${[...hpTargets].map(id=>{const p=state.encounter.participants.find(x=>x.id===id),v=hpMods.get(id)||'';if(!p)return'';return `<div class="ref-damage-target"><span>${html(p.name)}</span><div><button type="button" class="${v==='weak'?'selected':''}" data-ref-hp-mod="${html(id)}|weak">Faiblesse</button><button type="button" class="${v==='res'?'selected':''}" data-ref-hp-mod="${html(id)}|res">Résistance</button><button type="button" class="${v==='imm'?'selected':''}" data-ref-hp-mod="${html(id)}|imm">Immunité</button></div></div>`}).join('')}</section>`:'';
  body.innerHTML=`<section><h3>Cibles</h3>${participantChooser(hpTargets,'data-ref-hp-target')}</section>
    <section class="ref-keypad-section"><div class="ref-number-display" aria-live="polite">${hpValue||'0'}</div><div class="ref-keypad">${digitButtons}</div>
      <div class="ref-hp-modes"><button type="button" class="danger ${hpMode==='damage'?'selected':''}" data-ref-hp-mode="damage">DÉGÂTS</button><button type="button" class="heal ${hpMode==='heal'?'selected':''}" data-ref-hp-mode="heal">SOINS</button><button type="button" class="ref-temp ${hpMode==='temp'?'selected':''}" data-ref-hp-mode="temp">PV TEMP</button></div>
    </section>${mods}<button type="button" id="refApplyHp" class="ref-apply ref-apply-yellow" ${hpTargets.size&&Number(hpValue)>0?'':'disabled'}>APPLIQUER</button>`;
}
function appendHpDigit(k){
  if(k==='C')hpValue='';
  else if(k==='⌫')hpValue=hpValue.slice(0,-1);
  else if(/^\d$/.test(k)){hpValue=(hpValue==='0'?'':hpValue)+k;hpValue=hpValue.slice(0,4)}
  renderHpPanel();
}
function remoteCharacterForParticipant(pid){
  try{const bindings=JSON.parse(localStorage.getItem('rpg-connect:bindings:v1')||'{}');return Object.keys(bindings).find(cid=>bindings[cid]===pid)||null}catch{return null}
}
function applyTempMany(ids,amount){
  amount=Math.max(0,Number(amount)||0);if(!amount)return;
  const localIds=[],remoteIds=[];
  for(const id of ids){const cid=remoteCharacterForParticipant(id);if(cid&&window.RPGConnectMJ?.getStatus?.().connected)remoteIds.push([id,cid]);else localIds.push(id)}
  if(localIds.length)mutate(()=>{for(const id of localIds){const p=state.encounter.participants.find(x=>x.id===id);if(p&&!isLair(p))p.tempHp=Math.max(p.tempHp||0,amount)}},`${amount} PV temporaires appliqués à ${localIds.length} cible(s).`);
  for(const [,cid] of remoteIds)window.RPGConnectMJ?.send?.(cid,'tempHp:set',{value:amount});
  if(remoteIds.length)toast(`${amount} PV temporaires envoyés à ${remoteIds.length} Companion${remoteIds.length>1?'s':''}.`);
}
function applyHpFromPanel(){
  const ids=[...hpTargets],amount=Math.max(0,Number(hpValue)||0);if(!ids.length||!amount)return;
  if(hpMode==='heal')applyHealMany(ids,amount);
  else if(hpMode==='temp')applyTempMany(ids,amount);
  else{
    const hasMods=ids.some(id=>hpMods.get(id));
    if(!hasMods)applyDamageMany(ids,amount,'');
    else for(const id of ids){
      const mod=hpMods.get(id)||'';
      const adjusted=mod==='imm'?0:mod==='weak'?amount*2:mod==='res'?Math.floor(amount/2):amount;
      applyDamageMany([id],adjusted,'');
    }
  }
  hpValue='';renderHpPanel();
}
function openSidePanel(which){
  ensureCombatPanels();
  const states=document.getElementById('refStatesPanel'),hp=document.getElementById('refHpPanel');
  const target=which==='states'?states:hp,other=which==='states'?hp:states;
  other?.classList.remove('open');other?.setAttribute('aria-hidden','true');
  target?.classList.add('open');target?.setAttribute('aria-hidden','false');
  if(which==='states')renderStatesPanel();else renderHpPanel();
}
function closeSidePanels(){for(const el of document.querySelectorAll('.ref-side-panel')){el.classList.remove('open');el.setAttribute('aria-hidden','true')}}

function abilityGroup(p,m,title,tone,list,section){
  if(!list.length)return'';
  return `<section class="ref-capacity-group tone-${tone}"><div class="ref-capacity-title"><h3>${html(title)}</h3><span>${list.length}</span></div><div class="ref-card-grid">${list.map(a=>abilityCard(p,a,section)).join('')}</div></section>`;
}
const baseRenderActionsTab=renderActionsTab;
renderActionsTab=function(p,m){
  if(!m)return'<div class="empty-tab">Participant manuel : aucune capacité enregistrée.</div>';
  const spells=[],bonus=[],actions=[],reactions=[...(m.reactions||[])];
  for(const a of m.actions||[]){
    const eco=abilityEconomy(a,'action');
    const spellish=/\b(sort|spell|cantrip|incant|magie|niveau\s*\d)\b/i.test(`${a.name||''} ${a.detail||''}`);
    if(spellish)spells.push(a);else if(eco==='bonus')bonus.push(a);else if(eco==='reaction')reactions.push(a);else actions.push(a);
  }
  const blocks=[
    abilityGroup(p,m,'Actions','action',actions,'action'),
    abilityGroup(p,m,'Actions Bonus','bonus',bonus,'action'),
    abilityGroup(p,m,'Réactions','reaction',reactions,'reaction'),
    abilityGroup(p,m,'Sorts','spell',spells,'action')
  ];
  if(m.legendaryActions?.length)blocks.push(abilityGroup(p,m,'Actions légendaires','legendary',m.legendaryActions,'legendary'));
  if(m.lairActions?.length)blocks.push(abilityGroup(p,m,'Actions de repaire','lair',m.lairActions,'lair'));
  return blocks.filter(Boolean).join('')||'<div class="empty-tab">Aucune capacité enregistrée.</div>';
};
const baseRenderStateTab=renderStateTab;
renderStateTab=function(p,m){
  const resources=m?.resources||[];
  const cap=effectiveLegendaryMax(p,m);
  const resourceCards=resources.map(r=>{const cur=Number.isFinite(Number(p.resourceState?.[r.id]))?Number(p.resourceState[r.id]):r.start;return `<article class="ref-resource-card"><div><b>${html(r.name)}</b><small>${html(r.reset||'')}</small></div><div class="resource-stepper"><button data-resource="${html(p.id)}|${html(r.id)}|-1">−</button><strong>${cur}/${r.max}</strong><button data-resource="${html(p.id)}|${html(r.id)}|1">+</button></div></article>`});
  if(cap)resourceCards.push(`<article class="ref-resource-card"><div><b>Actions légendaires</b><small>Boss</small></div><strong>${p.legendaryRemaining}/${cap}</strong></article>`);
  return `<section class="detail-section ref-resources-section"><div class="section-title-row"><h3>Ressources</h3><span class="resource-chip">${resourceCards.length}</span></div><div class="ref-resource-grid">${resourceCards.join('')||'<p class="muted">Aucune ressource suivie sur cette fiche.</p>'}</div></section>`;
};
const baseCharacterChecks=characterChecks;
characterChecks=function(p,m){return baseCharacterChecks(p,m).replace('class="skill-grid"','class="skill-grid ref-skill-grid"')};

const baseEconomyStrip=economyStrip;
economyStrip=function(p){
  const max=attacksPerAction(p),progress=Math.min(max,p.attackProgress||0);
  const actionLabel=p.actionUsed?(max>1&&progress<max?`${progress}/${max}`:'utilisée'):'disponible';
  return `<div class="economy-strip ref-economy-strip">
    <button class="economy-marker action ${p.actionUsed?'spent':''} ${p.actionUsed&&progress<max?'partial':''}" data-economy="${html(p.id)}|action">${actionIcon('action')}<b>Action</b><small>${html(actionLabel)}</small></button>
    <button class="economy-marker bonus ${p.bonusActionUsed?'spent':''}" data-economy="${html(p.id)}|bonus">${actionIcon('bonus')}<b>Action bonus</b><small>${p.bonusActionUsed?'utilisée':'disponible'}</small></button>
    <button class="economy-marker reaction ${p.reactionUsed?'spent':''}" data-economy="${html(p.id)}|reaction">${actionIcon('reaction')}<b>Réaction</b><small>${p.reactionUsed?'utilisée':'disponible'}</small></button>
    <button class="economy-marker concentration ${isConcentrating(p)?'spent active':''}" data-ref-concentration="${html(p.id)}"><span class="ref-concentration-icon full" aria-hidden="true">◈</span><b>Concentration</b><small>${isConcentrating(p)?'active':'disponible'}</small></button>
  </div>`;
};

const baseRenderConditionModal=renderConditionModal;
renderConditionModal=function(){
  baseRenderConditionModal();
  const grid=document.getElementById('conditionModalGrid');
  if(grid)for(const b of grid.querySelectorAll('[data-choose-condition]')){
    const name=b.dataset.chooseCondition;
    b.innerHTML=`${conditionIconHtml(name)}<span>${html(name)}</span>`;
  }
  let info=document.getElementById('refConditionSrd');
  if(!info){info=document.createElement('div');info.id='refConditionSrd';info.className='ref-condition-help';grid?.insertAdjacentElement('afterend',info)}
  if(info)info.innerHTML=`<strong>${html(ui.conditionName)}</strong><p>${html(conditionDetail(ui.conditionName))}</p><small>Résumé de règle SRD D&D 5e ; la source de l’effet peut ajouter des précisions.</small>`;
};
function editCondition(pid,cid){
  const p=state.encounter.participants.find(x=>x.id===pid),c=p?.conditions?.find(x=>x.id===cid);if(!p||!c)return;
  openConditionDialog([pid]);ui.conditionName=c.name;
  document.getElementById('conditionDuration').value=c.durationType||'indefinite';
  document.getElementById('conditionRounds').value=c.remaining||1;
  document.getElementById('conditionSaveAbility').value=c.saveAbility||'CON';
  document.getElementById('conditionDc').value=c.dc||15;
  document.getElementById('conditionSource').value=c.source||'';
  renderConditionModal();
}

function detailConditionStrip(p){
  if(!p.conditions?.length)return'';
  return `<div class="ref-detail-conditions">${p.conditions.map(c=>`<button type="button" class="ref-detail-condition" data-ref-edit-condition="${html(p.id)}|${html(c.id)}" title="${html(c.name)} · ${html(conditionDurationLabel(c))}">${conditionIconHtml(c.name,'ref-condition-icon large')}<span>${html(c.name)}</span><small>${html(conditionDurationLabel(c))}</small></button>`).join('')}</div>`;
}
function enhanceDetail(){
  const p=selectedParticipant(),root=document.getElementById('activeDetail');if(!p||!root)return;
  const tabs=root.querySelectorAll('.detail-tabs button');
  for(const b of tabs){
    if(b.dataset.detailTab==='actions')b.textContent='Capacités';
    if(b.dataset.detailTab==='state')b.textContent='Ressources';
  }
  const edit=root.querySelector('[data-edit-participant]');
  if(edit){edit.textContent='✎';edit.classList.add('ref-pencil-only');edit.setAttribute('aria-label',`Modifier ${p.name}`);edit.title='Modifier cette instance'}
  root.querySelector('.detail-condition-summary')?.remove();
  let cond=root.querySelector('.ref-detail-conditions');
  if(cond)cond.remove();
  const stats=root.querySelector('.stat-grid');
  if(stats)stats.insertAdjacentHTML('afterend',detailConditionStrip(p));
  root.classList.toggle('ref-concentrating',isConcentrating(p));
  const rpgInline=root.querySelector('[data-rpg-inline]');
  if(rpgInline&&rpgInline.parentElement?.classList.contains('detail-tab-body')){
    rpgInline.classList.add('ref-rpg-inline');
    root.append(rpgInline);
  }
  const cat=participantCategory(p);root.style.setProperty('--ref-role-color',cat.color);
}
function enhancePrep(){
  for(const row of document.querySelectorAll('#prepParticipants .prep-row')){
    const id=row.dataset.select||row.querySelector('[data-select]')?.dataset.select,p=state.encounter.participants.find(x=>x.id===id);if(!p)continue;
    row.style.setProperty('--ref-role-color',participantCategory(p).color);
    row.classList.toggle('ref-boss',typeof isBossParticipant==='function'&&isBossParticipant(p));
  }
}
function enhanceRoster(){
  const active=activeParticipant(),playerTurn=!!active&&(active.kind==='player'||modelFor(active)?.category==='character');
  for(const row of document.querySelectorAll('#combatList .table-row')){
    const pid=row.dataset.rowId,p=state.encounter.participants.find(x=>x.id===pid);if(!p||isLair(p))continue;
    const cat=participantCategory(p);row.classList.add(`ref-role-${cat.semantic}`);row.style.setProperty('--ref-role-color',cat.color);
    row.classList.toggle('ref-boss',typeof isBossParticipant==='function'&&isBossParticipant(p));
    row.classList.toggle('ref-concentrating',isConcentrating(p));
    const role=row.querySelector('.table-role');if(role)role.textContent=(typeof isBossParticipant==='function'&&isBossParticipant(p))?'BOSS':cat.short||cat.name.toUpperCase();
    const m=modelFor(p),nameHost=row.querySelector('.table-name > strong');
    if(nameHost&&m?.category==='character'&&!row.querySelector('.ref-class-icon'))nameHost.insertAdjacentHTML('beforebegin',classIconHtml(m));
    const meta=row.querySelector('.table-meta'),eco=meta?meta.querySelectorAll('.table-eco'):[];
    eco.forEach((el,i)=>{const kind=i===0?'action':i===1?'bonus':'reaction';el.innerHTML=actionIcon(kind,true)+(kind==='action'&&attacksPerAction(p)>1?`<small>${Math.min(attacksPerAction(p),p.attackProgress||0)}/${attacksPerAction(p)}</small>`:'');if(kind==='reaction')el.classList.toggle('ref-reaction-alert',playerTurn&&p.kind==='enemy'&&!p.reactionUsed)});
    if(meta&&isConcentrating(p)&&!meta.querySelector('.ref-concentration-mini'))meta.insertAdjacentHTML('beforeend','<span class="ref-concentration-mini" title="Concentration">◈</span>');
    const cond=row.querySelector('.table-conditions');
    if(cond){
      const zero=p.hp<=0?'<span class="table-condition zero">À 0 PV</span>':'',phase=currentPhase(p),phaseHtml=phase?`<span class="table-condition">${html(phase.name)}</span>`:'';
      cond.innerHTML=zero+phaseHtml+p.conditions.slice(0,5).map(c=>`<button type="button" class="ref-roster-condition" data-ref-edit-condition="${html(p.id)}|${html(c.id)}" title="${html(c.name)} · ${html(conditionDurationLabel(c))}">${conditionIconHtml(c.name,'ref-condition-icon mini')}</button>`).join('')+(p.conditions.length>5?`<span class="table-condition more">+${p.conditions.length-5}</span>`:'');
    }else if(p.conditions.length){
      row.querySelector('.table-name')?.insertAdjacentHTML('beforeend',`<div class="table-conditions">${p.conditions.slice(0,5).map(c=>`<button type="button" class="ref-roster-condition" data-ref-edit-condition="${html(p.id)}|${html(c.id)}">${conditionIconHtml(c.name,'ref-condition-icon mini')}</button>`).join('')}</div>`);
    }
    row.querySelector('.row-sheet')?.remove();
  }
}

let pendingSkill=null;
function openSkillDialog(pid,key){
  const p=state.encounter.participants.find(x=>x.id===pid),m=modelFor(p),sk=SKILLS.find(x=>x.key===key),data=sk&&skillData(m,sk);if(!p||!sk||!data)return;
  pendingSkill={pid,key};document.getElementById('refSkillTitle').textContent=sk.name;document.getElementById('refSkillText').textContent=`${p.name} · ${sk.ability} ${signed(data.mod)} · DD ${Math.max(1,Number(document.getElementById('checkDc')?.value)||ui.checkDc)}`;document.getElementById('refSkillDialog').showModal();
}
function executeSkill(mode){
  if(!pendingSkill)return;const {pid,key}=pendingSkill,p=state.encounter.participants.find(x=>x.id===pid),m=modelFor(p),sk=SKILLS.find(x=>x.key===key),data=sk&&skillData(m,sk);if(!p||!sk||!data)return;
  const dc=Math.max(1,Number(document.getElementById('checkDc')?.value)||ui.checkDc);ui.checkDc=dc;
  const r=rollD20(mode),total=r.roll+Number(data.mod),ok=total>=dc,msg=`${p.name} — ${sk.name} (${sk.ability}) DD ${dc} : ${r.detail} ${signed(data.mod)} = ${total} → ${ok?'RÉUSSITE':'ÉCHEC'}${data.note?` · ${data.note}`:''}.`;
  actionLog(msg,'Test de compétence');saveState();renderLog();document.getElementById('refSkillDialog').close();pendingSkill=null;
}

const baseRenderPrep=renderPrep;
renderPrep=function(){baseRenderPrep();enhancePrep()};
const baseRenderDetailFinal=renderDetail;
renderDetail=function(){baseRenderDetailFinal();enhanceDetail()};
const baseRenderFinal=render;
render=function(){
  baseRenderFinal();
  removeDeviceSwitch();ensureCombatPanels();ensureLibraryTools();enhancePrep();enhanceRoster();enhanceDetail();
  if(ui.drawer==='library')renderStage();
};

function showCategoryDialog(){renderCategoryRows();document.getElementById('refCategoryDialog').showModal()}
function showAdvancedDialog(){
  const form=document.getElementById('refAdvancedForm');advancedCategoryOptions(form.elements.category);
  for(const [k,v] of Object.entries(advanced))if(form.elements[k])form.elements[k].value=v;
  document.getElementById('refAdvancedDialog').showModal();
}

document.addEventListener('click',e=>{
  const button=e.target.closest('button');
  const prepRow=e.target.closest('#prepParticipants .prep-row[data-select]');
  if(prepRow&&!e.target.closest('button,input,select,label')){
    e.preventDefault();e.stopImmediatePropagation();state.encounter.selectedId=prepRow.dataset.select;saveState();renderPrep();return;
  }
  if(!button)return;
  if(button.dataset.addMonster&&state.ui.mode==='prep'){
    e.preventDefault();e.stopImmediatePropagation();stageMonster(button.dataset.addMonster);return;
  }
  if(button.dataset.refLibraryFilter){
    e.preventDefault();e.stopImmediatePropagation();refLibraryFilter=button.dataset.refLibraryFilter;renderLibrary();return;
  }
  if(button.id==='refAdvancedSearch'){e.preventDefault();e.stopImmediatePropagation();showAdvancedDialog();return}
  if(button.id==='refManageCategories'){e.preventDefault();e.stopImmediatePropagation();showCategoryDialog();return}
  if(button.dataset.refDeleteCategory){
    e.preventDefault();e.stopImmediatePropagation();
    const id=button.dataset.refDeleteCategory;
    categories=categories.filter(c=>c.id!==id);for(const [k,v] of Object.entries(modelCats))if(v===id)delete modelCats[k];for(const [k,v] of Object.entries(participantCats))if(v===id)delete participantCats[k];persistCategories();renderCategoryRows();renderLibrary();return;
  }
  if(button.id==='refAddCategory'){
    e.preventDefault();e.stopImmediatePropagation();
    const name=document.getElementById('refNewCategoryName').value.trim();if(!name)return toast('Donne un nom à la catégorie.');
    const id='custom-'+norm(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,6);
    categories.push({id,name,short:name.toUpperCase(),color:document.getElementById('refNewCategoryColor').value||'#8c86d8',semantic:document.getElementById('refNewCategorySemantic').value||'enemy',builtin:false});persistCategories();renderCategoryRows();return;
  }
  if(button.id==='refSaveCategories'){e.preventDefault();e.stopImmediatePropagation();saveCategoryRows();document.getElementById('refCategoryDialog').close();return}
  if(button.dataset.refStageRemove){e.preventDefault();e.stopImmediatePropagation();stage.delete(button.dataset.refStageRemove);renderStage();return}
  if(button.dataset.refStageCount){e.preventDefault();e.stopImmediatePropagation();const [id,d]=button.dataset.refStageCount.split('|'),entry=stage.get(id);if(entry){entry.count=Math.max(1,Math.min(50,entry.count+Number(d)));renderStage()}return}
  if(button.id==='refStageFinish'){e.preventDefault();e.stopImmediatePropagation();applyStage();return}
  if(button.id==='refStatesButton'){e.preventDefault();e.stopImmediatePropagation();openSidePanel('states');return}
  if(button.id==='refHpButton'){e.preventDefault();e.stopImmediatePropagation();openSidePanel('hp');return}
  if(button.dataset.refPanelClose!=null){e.preventDefault();e.stopImmediatePropagation();closeSidePanels();return}
  if(button.dataset.refStateTarget){e.preventDefault();e.stopImmediatePropagation();const id=button.dataset.refStateTarget;statesTargets.has(id)?statesTargets.delete(id):statesTargets.add(id);renderStatesPanel();return}
  if(button.dataset.refStateChoice){e.preventDefault();e.stopImmediatePropagation();stateChoice=button.dataset.refStateChoice;renderStatesPanel();return}
  if(button.id==='refApplyState'){e.preventDefault();e.stopImmediatePropagation();applyStateFromPanel();return}
  if(button.dataset.refHpTarget){e.preventDefault();e.stopImmediatePropagation();const id=button.dataset.refHpTarget;hpTargets.has(id)?hpTargets.delete(id):hpTargets.add(id);renderHpPanel();return}
  if(button.dataset.refKey){e.preventDefault();e.stopImmediatePropagation();appendHpDigit(button.dataset.refKey);return}
  if(button.dataset.refHpMode){e.preventDefault();e.stopImmediatePropagation();hpMode=button.dataset.refHpMode;renderHpPanel();return}
  if(button.dataset.refHpMod){e.preventDefault();e.stopImmediatePropagation();const [id,mod]=button.dataset.refHpMod.split('|');hpMods.set(id,hpMods.get(id)===mod?'':mod);renderHpPanel();return}
  if(button.id==='refApplyHp'){e.preventDefault();e.stopImmediatePropagation();applyHpFromPanel();return}
  if(button.dataset.refConcentration){e.preventDefault();e.stopImmediatePropagation();const id=button.dataset.refConcentration;setConcentration(id,!concentration.has(id));render();return}
  if(button.dataset.refEditCondition){e.preventDefault();e.stopImmediatePropagation();const [pid,cid]=button.dataset.refEditCondition.split('|');editCondition(pid,cid);return}
  if(button.dataset.skillCheck){e.preventDefault();e.stopImmediatePropagation();const [pid,key]=button.dataset.skillCheck.split('|');openSkillDialog(pid,key);return}
  if(button.dataset.refSkillMode){e.preventDefault();e.stopImmediatePropagation();executeSkill(button.dataset.refSkillMode);return}
  if(button.dataset.refClose){e.preventDefault();e.stopImmediatePropagation();document.getElementById(button.dataset.refClose)?.close();return}
},true);

document.addEventListener('input',e=>{
  if(e.target.matches('[data-ref-stage-initiative]')){const entry=stage.get(e.target.dataset.refStageInitiative);if(entry)entry.initiative=Number(e.target.value)||0}
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-ref-stage-shared]')){const entry=stage.get(e.target.dataset.refStageShared);if(entry)entry.shared=e.target.checked}
  if(e.target.matches('[data-ref-stage-companion]')){const entry=stage.get(e.target.dataset.refStageCompanion);if(entry)entry.includeCompanion=e.target.checked}
  if(e.target.matches('[data-ref-stage-lair]')){const entry=stage.get(e.target.dataset.refStageLair);if(entry)entry.includeLair=e.target.checked}
  if(e.target.id==='refStateDuration')updateStateOptionVisibility();
});
injectDialogMarkup();
document.getElementById('refAdvancedForm')?.addEventListener('submit',e=>{
  e.preventDefault();advanced=Object.fromEntries(new FormData(e.currentTarget).entries());refLibraryFilter='all';renderLibrary();document.getElementById('refAdvancedDialog').close();
});
document.getElementById('refAdvancedReset')?.addEventListener('click',()=>{
  advanced={category:'all',className:'',type:'',acMin:'',acMax:'',cr:'',hpMin:'',hpMax:''};renderLibrary();document.getElementById('refAdvancedDialog').close();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidePanels()});

ensureLibraryTools();
ensureCombatPanels();
removeDeviceSwitch();
loadAssets();
try{render()}catch(err){console.error('Encounter refinement initial render',err)}
window.EncounterRefinements={version:REF_VERSION,renderLibrary,openStates:()=>openSidePanel('states'),openHp:()=>openSidePanel('hp')};
})();
