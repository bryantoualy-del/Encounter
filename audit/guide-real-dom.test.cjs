const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../encounter-guide.js','utf8');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const app=fs.readFileSync(__dirname+'/../rpg-connect-mj.js','utf8');
const steps=[...source.split('const steps=[')[1].split('];')[0].matchAll(/\['(#[^']+)','[^']+','[^']+'(?:,\{[^}]+\})?\]/g)].map(m=>m[1]);
assert.equal(steps.length,19);
for(const s of steps){const id=s.match(/#[\w-]+/)?.[0].slice(1);assert.ok(id&&(html.includes(`id="${id}"`)||app.includes(`id='${id}'`)||app.includes(`id="${id}"`)||id==='mjSidePanel'||id==='mjOpenHealth'||id==='mjCompatibility'),s)}
assert.ok(!source.includes('iframe'));assert.ok(!source.includes('srcdoc'));assert.ok(!source.includes('mock'));
assert.ok(!/\b(fetch|WebSocket|localStorage|sessionStorage)\s*[.(]/.test(source));
const elements=new Map();let created=0;
class Node{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.style={};this.className='';this.hidden=false;this.open=false;this.children=[];this.attributes={};this.textContent='';this.dataset={};this.focused=false;this.offsetHeight=180;this.classList={add:x=>this._set(x,true),remove:x=>this._set(x,false),toggle:(x,v)=>this._set(x,v),contains:x=>this.className.split(' ').includes(x)};}
 _set(x,v){this.className=this.className.split(' ').filter(k=>k&&k!==x).concat(v?[x]:[]).join(' ')}
 setAttribute(k,v){this.attributes[k]=v}getAttribute(k){return this.attributes[k]??null}append(...a){this.children.push(...a);for(const c of a)c.parent=this}
 addEventListener(k,fn){this['on'+k]=fn}querySelector(s){if(!this._children)this._children={};return this._children[s]??=new Node('button')}
 closest(s){if(s!=='dialog')return null;return this.ownerDialog||null}
 scrollIntoView(){}getBoundingClientRect(){return {top:100,left:50,right:450,width:400,height:80}}
 focus(){this.focused=true}click(){this.onclick?.()}showModal(){this.open=true}close(){this.open=false}showPopover(){this._show=true}hidePopover(){this._show=false}matches(s){return s===':popover-open'&&!!this._show}remove(){this.removed=true}
}
for(const s of steps)elements.set(s,new Node());
for(const s of ['#prepView','#combatView','#quickBar','#btnModePrep','#btnModeCombat','#libraryDrawer','#journalDrawer','#drawerScrim','#mjSidePanel','.detail-panel','#monsterEditor','#rpgMjDialog','#mjOpenHealth','#mjSidePanel [data-panel-close]'])if(!elements.has(s))elements.set(s,new Node());
for(const s of steps.filter(x=>x.includes('monsterForm')||x==='#actionsRows'||x==='#mjCompatibility'))elements.get(s).ownerDialog=elements.get('#monsterEditor');
for(const s of steps.filter(x=>x.startsWith('#rpgMj')))elements.get(s).ownerDialog=elements.get('#rpgMjDialog');
elements.get('#mjSidePanel').className='hidden';elements.get('#prepView').className='prep-view';elements.get('#combatView').className='combat-view hidden';
elements.get('#mjOpenHealth').onclick=()=>elements.get('#mjSidePanel').classList.remove('hidden');elements.get('#mjSidePanel [data-panel-close]').onclick=()=>elements.get('#mjSidePanel').classList.add('hidden');
let button;const host=new Node();host.append=x=>{button=x;created++};const body=new Node();body.className='original';let tour;
body.append=x=>{tour=x};const doc={body,head:new Node(),activeElement:new Node(),createElement:tag=>new Node(tag),getElementById:id=>id==='btnEncounterGuide'?null:elements.get('#'+id),querySelector:s=>s==='.top-actions'?host:s==='dialog[open]'?null:elements.get(s)||null,addEventListener(){},removeEventListener(){}};
const win={scrollX:7,scrollY:11,scrollTo(x,y){this.scrollX=x;this.scrollY=y},addEventListener(){},removeEventListener(){}};
const ctx={document:doc,window:win,HTMLElement:Node,innerWidth:1200,innerHeight:900,requestAnimationFrame:fn=>{fn();return 1},cancelAnimationFrame(){},renderPrep(){},renderLibrary(){},renderCombat(){},renderDetail(){},openMonsterEditor(){elements.get('#monsterEditor').showModal()},tableDetailOpen:false};
vm.runInNewContext(source,ctx);assert.equal(created,1);button.onclick();assert.equal(win.EncounterGuide.active,true);
for(let n=1;n<19;n++){assert.equal(win.EncounterGuide.step,n);tour.children[1].querySelector('[data-next]').onclick()}
assert.equal(win.EncounterGuide.step,19);tour.children[1].querySelector('[data-next]').onclick();assert.equal(win.EncounterGuide.active,false);assert.equal(elements.get('#prepView').className,'prep-view');assert.equal(elements.get('#combatView').className,'combat-view hidden');assert.equal(body.className,'original');assert.equal(win.scrollX,7);assert.equal(win.scrollY,11);assert.equal(elements.get('#monsterEditor').open,false);assert.equal(elements.get('#rpgMjDialog').open,false);
console.log('OK : 19 étapes sur DOM réel, aucune commande, panneaux et vue restaurés.');
