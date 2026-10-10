const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class El{constructor(){this.children=[];this.nodes=new Map();this.style={};this.attributes={};this.parentNode=null;this.open=false;this.hidden=false;this.textContent='';}
 append(...nodes){for(const n of nodes){n.parentNode=this;this.children.push(n)}}before(n){n.parentNode=this.parentNode||this}replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attributes[k]=v}addEventListener(k,fn){this['on'+k]=fn}querySelector(s){if(!this.nodes.has(s))this.nodes.set(s,new El());return this.nodes.get(s)}showModal(){this.open=true}close(){this.open=false}}
const form=new El(),editor=new El(),head=new El(),body=new El(),status=new El();status.parentNode=form;
form.elements={name:{value:'Gardien'},category:{value:'enemy'},ac:{value:'15'},hp:{value:'42'}};
form.querySelector=s=>s==='.modal-actions'?new El():null;
const map=new Map([['#monsterForm',form],['#monsterEditor',editor],['#mjCompatibility',status]]);
const document={body,head,createElement:()=>new El(),querySelector:s=>map.get(s)||null};
let rows=[{name:'Morsure',kind:'attack',bonus:5,damage:'2d6+3',damageType:'perforants'}];
const state={monsters:[]};
let deferred=false;
const ctx={document,state,console,window:null,collectRows:(selector)=>selector==='#actionsRows'?rows:[],openMonsterEditor:()=>editor.showModal(),saveMonsterFromForm:()=>{if(!deferred){state.monsters.splice(0,state.monsters.length,{id:'guardian',name:'Gardien',category:'enemy',ac:15,hp:42,actions:rows})}editor.close()}};ctx.window=ctx;
vm.runInNewContext(fs.readFileSync(__dirname+'/../monster-assistant.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync(__dirname+'/../mj-compatibility-ui.js','utf8'),ctx);
ctx.openMonsterEditor();assert.equal(editor.open,true);assert.ok(ctx.EncounterProfileCheck);
ctx.saveMonsterFromForm();const dialog=body.children[0];assert.equal(dialog.open,true);assert.equal(dialog.querySelector('[data-check-title]').textContent,'OUI — fiche conforme');
dialog.close();rows=[{name:'Morsure',kind:'attack',bonus:'',damage:'2d6+3',damageType:''}];ctx.saveMonsterFromForm();assert.equal(dialog.open,true);assert.equal(dialog.querySelector('[data-check-title]').textContent,'NON — fiche non conforme');assert.ok(dialog.querySelector('[data-check-reasons]').children[0].children.some(x=>x.textContent.includes('bonus de toucher')));
dialog.close();deferred=true;ctx.saveMonsterFromForm();assert.equal(dialog.open,false,'Aucun verdict pour une mise à jour reportée');
console.log('OK : verdict OUI / NON après création et modification ; aucun verdict prématuré si décision reportée.');
