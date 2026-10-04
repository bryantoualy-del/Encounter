import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const source=readFileSync(new URL('./encounter-refinements.js',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const worker=readFileSync(new URL('./service-worker.js',import.meta.url),'utf8');

test('refinement layer compiles and is loaded after RPG Connect',()=>{
  assert.doesNotThrow(()=>new Function(source));
  const rpg=index.indexOf('rpg-connect-mj.js?v=51');
  const refinement=index.indexOf('encounter-refinements.js?v=1');
  assert.ok(rpg>=0&&refinement>rpg,'refinement JS must wrap the final RPG Connect functions');
  assert.match(index,/encounter-refinements\.css\?v=1/);
  assert.doesNotMatch(index,/id="deviceProfile"/);
  for(const asset of ['encounter-refinements.css?v=1','encounter-refinements.js?v=1','assets/refinement/actions-sprite.b64','assets/refinement/classes-sprite.b64','assets/refinement/condition-icons.json'])assert.ok(worker.includes(asset),asset+' missing from offline cache');
});

test('supplied icon bundles and local condition registry are valid',()=>{
  for(const file of ['actions-sprite.b64','classes-sprite.b64']){
    const raw=readFileSync(new URL('./assets/refinement/'+file,import.meta.url),'utf8').trim();
    const data=Buffer.from(raw,'base64');
    assert.equal(data.subarray(0,4).toString(),'RIFF');
    assert.equal(data.subarray(8,12).toString(),'WEBP');
    assert.ok(data.length>10000,file+' unexpectedly small');
  }
  const registry=JSON.parse(readFileSync(new URL('./assets/refinement/condition-icons.json',import.meta.url),'utf8'));
  const icons=registry.icons||registry;
  for(const key of ['conditions/aveugle','conditions/charme','conditions/assourdi','conditions/effraye','conditions/agrippe','conditions/incapacite','conditions/invisible','conditions/paralyse','conditions/petrifie','conditions/empoisonne','conditions/a_terre','conditions/entrave','conditions/etourdi','conditions/inconscient'])assert.ok(icons[key],key+' missing');
});

function makeDom(){
  const dom=new JSDOM(`<!doctype html><body>
    <button id="btnModePrep">Préparer</button>
    <aside id="libraryDrawer">
      <div class="library-filters"></div>
      <div class="drawer-toolbar"><input id="monsterSearch"><button id="btnCreateMonster"></button></div>
      <div class="premium-library-toolbar"><button id="btnFavoriteFilter"></button><select id="libraryTagFilter"></select></div>
      <div id="monsterLibrary"></div><p class="srd-credit-short"></p>
    </aside>
    <main id="combatView"><section class="participant-panel"><div class="participant-head-actions"></div><div id="combatList"></div></section></main>
    <div id="prepParticipants"></div>
    <div id="activeDetail"></div>
    <form id="monsterForm"><input name="monsterId"><label><select name="category"><option value="enemy">enemy</option><option value="character">character</option><option value="companion">companion</option><option value="npc">npc</option></select></label></form>
    <form id="participantEditorForm"><input name="participantId"><label><select name="kind"><option value="enemy">enemy</option><option value="player">player</option><option value="ally">ally</option></select></label></form>
  </body>`,{url:'https://encounter.test/',runScripts:'outside-only'});
  dom.window.fetch=async()=>{throw Error('offline fixture')};
  dom.window.eval(`
    window.CONDITIONS=['Aveuglé','Charmé','Entravé'];
    window.SKILLS=[{key:'acro',name:'Acrobaties',ability:'DEX'}];
    window.ui={drawer:'library',favoritesOnly:false,conditionName:'Aveuglé',conditionTargetIds:[],checkDc:15,detailTab:'actions',multiSelection:new Set(),multiMode:false};
    window.state={ui:{mode:'prep',deviceProfile:'samsung-s7fe'},monsters:[
      {id:'gob',name:'Gobelin',category:'enemy',type:'Humanoïde',cr:'1/4',source:'test',subtitle:'',ac:15,hp:7,initiative:12,actions:[],reactions:[],resources:[],legendaryActions:[],lairActions:[]},
      {id:'hero',name:'Héros test',category:'character',type:'Humanoïde',subtitle:'Guerrier / Magicien',ac:18,hp:40,initiative:15,actions:[],reactions:[],resources:[],legendaryActions:[],lairActions:[]}
    ],encounter:{participants:[],selectedId:null,currentTurn:0,round:1,log:[]}};
    let seq=0;window.uid=p=>(p||'id')+'-'+(++seq);
    window.rollDie=()=>3;window.isLocked=()=>false;window.structuralGuard=()=>false;
    window.isLair=p=>!!p?.isLair;window.modelFor=p=>state.monsters.find(m=>m.id===p?.modelId)||null;
    window.effectiveAc=p=>p.ac||10;window.hpPct=p=>100;window.currentPhase=()=>null;window.hpClass=()=>'';window.hpBandClass=()=>'';window.targetClassFor=()=>'';window.flashClassFor=()=>'';window.roleLabel=()=>'';window.isBossParticipant=()=>false;
    window.attacksPerAction=()=>1;window.effectiveLegendaryMax=()=>0;window.abilityEconomy=()=> 'action';window.abilityCard=()=>'<article></article>';
    window.conditionDurationLabel=c=>c.durationType==='rounds'?String(c.remaining)+' tour(s)':'Indéfinie';window.conditionShort=()=>'';window.signed=n=>(n>=0?'+':'')+n;
    window.skillData=()=>({mod:4,note:''});window.rollD20=()=>({roll:12,detail:'12'});window.actionLog=()=>{};window.renderLog=()=>{};
    window.saveState=()=>{};window.toast=()=>{};window.closeDrawers=()=>{ui.drawer=null};
    window.renderLibrary=()=>{};window.renderPrep=()=>{};window.renderDetail=()=>{};window.render=()=>{};window.renderActionsTab=()=>'';window.renderStateTab=()=>'';window.characterChecks=()=>'<div class="skill-grid"></div>';window.economyStrip=()=>'';window.renderConditionModal=()=>{};
    window.openMonsterEditor=()=>{};window.saveMonsterFromForm=()=>{};window.openParticipantEditor=()=>{};window.saveParticipantInstance=()=>{};
    window.openConditionDialog=()=>{};window.requestConditionSync=()=>{};
    window.makeParticipant=(m,i,initiative,groupId,ownerId)=>({id:uid('p'),name:m.name,baseName:m.name,kind:m.category==='enemy'?'enemy':m.category==='npc'?'ally':'player',modelId:m.id,hp:m.hp,maxHp:m.hp,tempHp:0,ac:m.ac,initiative,groupId,conditions:[],resources:{},resourceState:{},actionUsed:false,bonusActionUsed:false,reactionUsed:false,attackProgress:0,ownerId});
    window.makeLairParticipant=(owner,m)=>({id:uid('lair'),name:m.name+' · Repaire',kind:'enemy',modelId:m.id,hp:1,maxHp:1,tempHp:0,ac:0,initiative:20,isLair:true,conditions:[]});
    window.sortedParticipants=()=>[...state.encounter.participants].sort((a,b)=>b.initiative-a.initiative);
    window.selectedParticipant=()=>state.encounter.participants.find(p=>p.id===state.encounter.selectedId)||null;
    window.activeParticipant=()=>sortedParticipants()[state.encounter.currentTurn]||null;
    window.mutate=(fn)=>{fn();saveState();render()};
    window.__damage=[];window.__heal=[];window.__conditions=[];
    window.applyDamageMany=(ids,amount,type)=>__damage.push({ids:[...ids],amount,type});
    window.applyHealMany=(ids,amount)=>__heal.push({ids:[...ids],amount});
    window.addConditionMany=(ids,data)=>{__conditions.push({ids:[...ids],data});return true};
  `);
  dom.window.eval(source);
  return dom;
}

test('preparation selection, staged library, HP keypad and states use existing core mutation entry points',()=>{
  const dom=makeDom();
  try{
    const w=dom.window,d=w.document;
    assert.equal(d.getElementById('btnModePrep').textContent,'Préparation');
    assert.equal(w.state.ui.deviceProfile,'ipad');

    w.EncounterRefinements.renderLibrary();
    const add=d.querySelector('[data-add-monster="gob"]');assert.ok(add);
    add.click();
    assert.match(d.getElementById('refLibraryPreview').textContent,/Gobelin/);
    assert.equal(w.state.encounter.participants.length,0,'staging must not mutate encounter before Terminer');
    d.getElementById('refStageFinish').click();
    assert.equal(w.state.encounter.participants.length,1);
    const pid=w.state.encounter.participants[0].id;

    d.getElementById('prepParticipants').innerHTML=`<article class="prep-row" data-select="${pid}"><span>Gobelin</span></article>`;
    w.state.encounter.selectedId=null;
    d.querySelector('.prep-row').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
    assert.equal(w.state.encounter.selectedId,pid,'prep row click must update preview selection state');

    w.EncounterRefinements.openHp();
    d.querySelector('[data-ref-key="5"]').click();
    d.getElementById('refApplyHp').click();
    assert.deepEqual(w.__damage,[{ids:[pid],amount:5,type:''}],'HP panel must route through applyDamageMany');

    w.EncounterRefinements.openStates();
    d.getElementById('refApplyState').click();
    assert.equal(w.__conditions.length,1);
    assert.deepEqual(w.__conditions[0].ids,[pid]);
    assert.equal(w.__conditions[0].data.name,'Aveuglé');
  }finally{dom.window.close()}
});

test('refinement source preserves RPG Connect wrappers instead of replacing network contracts',()=>{
  assert.match(source,/applyDamageMany\(ids,amount,''\)/);
  assert.match(source,/applyHealMany\(ids,amount\)/);
  assert.match(source,/addConditionMany\(\[\.\.\.statesTargets\],data\)/);
  assert.match(source,/RPGConnectMJ\?\.send\?\.\(cid,'tempHp:set'/);
  assert.doesNotMatch(source,/WebSocket\s*=/);
  assert.doesNotMatch(source,/rpg-connect-mj\.js/);
});
