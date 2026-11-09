const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/encounter-v13-free-actions.js','utf8');
function setup(mode='table-free'){
 const enemy={id:'enemy',kind:'enemy',name:'Mage',conditions:[],hp:25,abilityState:{burst:{ready:true}},resourceState:{slot:2},actionUsed:false,bonusActionUsed:false,reactionUsed:false,attackProgress:0,legendaryRemaining:3};
 const player={id:'player',kind:'player',name:'Kobe',hp:83,conditions:[],tempHp:0,resourceState:{slot:5}};
 const actions=[{id:'fire',name:'Trait de feu',kind:'attack',bonus:6,damage:'2d10',damageType:'feu'},
 {id:'blast',name:'Boule de feu',kind:'save',save:'DEX',dc:15,damage:'8d6',damageType:'feu',isSpell:true,spellLevel:3},
 {id:'multi',name:'Multiattaque',kind:'multiattack',sequence:'Trait de feu x2'},
 {id:'burst',name:'Souffle',kind:'recharge',save:'DEX',dc:16,damage:'5d6',damageType:'feu'},
 {id:'bite',name:'Morsure',kind:'attack',bonus:4,damage:'1d8',damageType:'perforants',onHitSave:{ability:'FOR',dc:14}},
 {id:'heal',name:'Soins',kind:'heal',damage:'2d8'}];
 const model={actions,reactions:[],legendaryActions:[],lairActions:[],traits:[]},reports=[],legacy=[],dialog={open:true,closed:false,close(){this.closed=true}};
 const s={state:{encounter:{rpgSessionMode:mode,participants:[enemy,player]}},ui:{targeting:null},document:{getElementById:()=>dialog},
 useAbility:(...a)=>legacy.push(a),abilityCard:()=>'<button>Cibler</button>',modelFor:()=>model,participantLabel:p=>p.name,
 rollD20:()=>({roll:12,detail:'12'}),rollDie:()=>4,signed:n=>'+'+n,
 rollAbilityDamage:()=>({total:11,detail:'2d10'}),rollDamageCrit:()=>({total:11,detail:'11'}),
 parseMultiSequence:v=>v.split(';').map(k=>{let m=k.trim().match(/(.+) x(\d+)/);return{name:m?m[1]:k,count:m?+m[2]:1}}),
 EncounterConditionRolls:{penalty:()=>({amount:0,detail:''})},EncounterTypedDamage:{forAbility:a=>({errors:[],parts:a.damage?[{formula:a.damage,type:a.damageType}]:[]})},
 abilityEconomy:()=> 'action',attacksPerAction:()=>1,
 consumeEconomyAfterResolution:(p,a,section)=>{if(section==='legendary')p.legendaryRemaining-=a.cost||1;else if(section==='reaction')p.reactionUsed=true;else p.actionUsed=true;if(a.isSpell)p.resourceState.slot--;},
 MJSpellSlots:{available:p=>p.resourceState.slot>0},
 EncounterJournal:{run:(_,fn)=>fn()},checkpoint:()=>{},log:()=>{},saveState:()=>{},render:()=>{},activeParticipant:()=>enemy,eligibleLegendaryBosses:()=>[],actualAdvanceTurn:()=>{},renderLegendaryDialog:()=>{},
 showActionPopup:r=>reports.push(r),toast:r=>reports.push({warning:r}),rollExpression:()=>({total:11,detail:'11'})};
 s.globalThis=s;vm.createContext(s);vm.runInContext(source,s);return{s,enemy,player,reports,legacy,actions,model,dialog};
}
test('attacks without target are raw rolls, not hits or player damage',()=>{const h=setup();h.s.useAbility('enemy','fire','action');assert.equal(h.player.hp,83);assert.equal(h.s.ui.targeting,null);assert.equal(h.legacy.length,0);assert.equal(h.reports[0].rolls[0].total,18);assert.doesNotMatch(h.reports[0].text,/TOUCHÉ|RATÉ|vs CA/);});
test('AoE save is presented, not resolved, and consumes enemy slot',()=>{const h=setup();h.s.useAbility('enemy','blast','action');assert.equal(h.reports[0].save.dc,15);assert.equal(h.reports[0].effect.total,11);assert.equal(h.enemy.resourceState.slot,1);assert.equal(h.player.hp,83);});
test('multiattack rolls twice with no targets',()=>{const h=setup();h.s.useAbility('enemy','multi','action');assert.equal(h.reports[0].rolls.length,2);assert.equal(h.player.hp,83);});
test('recharge cannot be reused until ready',()=>{const h=setup();h.s.useAbility('enemy','burst','action');assert.equal(h.enemy.abilityState.burst.ready,false);h.enemy.actionUsed=false;h.s.useAbility('enemy','burst','action');assert.match(h.reports.at(-1).warning,/Recharge/);});
test('no on-hit save or healing is applied automatically',()=>{const h=setup();h.s.useAbility('enemy','bite','action');assert.equal(h.player.conditions.length,0);assert.match(h.reports[0].note,/Sur touche/);h.enemy.actionUsed=false;h.s.useAbility('enemy','heal','action');assert.equal(h.enemy.hp,25);});
test('exhausted spell slot prevents casting',()=>{const h=setup();h.enemy.resourceState.slot=0;h.s.useAbility('enemy','blast','action');assert.match(h.reports[0].warning,/épuisé/);});
test('guided mode and companion-owned actions use old behavior',()=>{const h=setup('guided');h.s.useAbility('enemy','fire','action');assert.equal(h.legacy.length,1);const j=setup();j.s.useAbility('player','fire','action');assert.equal(j.legacy.length,1);});
test('enemy action card shows launch instead of targeting',()=>{const h=setup();assert.match(h.s.abilityCard(h.enemy,h.actions[0],'action'),/Lancer le jet/);});

test('legendary action spends only enemy resource and closes empty choice dialog',()=>{
 const h=setup();
 h.model.legendaryActions.push({id:'legend',name:'Frappe légendaire',kind:'attack',bonus:8,damage:'1d8',damageType:'force',cost:1});
 h.s.useAbility('enemy','legend','legendary');
 assert.equal(h.dialog.closed,true);
 assert.equal(h.enemy.legendaryRemaining,2);
 assert.equal(h.player.hp,83);
 assert.equal(h.reports.length,1);
});
test('failed economy check preserves enemy state and does not emit a result',()=>{
 const h=setup();h.enemy.actionUsed=true;
 h.s.useAbility('enemy','fire','action');
 assert.equal(h.enemy.actionUsed,true);
 assert.equal(h.player.hp,83);
 assert.match(h.reports[0].warning,/Action déjà utilisée/);
});
