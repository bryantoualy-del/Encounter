const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/demo.html','utf8'),script=fs.readFileSync(__dirname+'/demo-script.js','utf8');
const map=new Map(),handlers={};
class Element{constructor(id){this.id=id;this.hidden=false;this.disabled=false;this.style={};this.textContent='';this.innerHTML='';}scrollIntoView(){}getBoundingClientRect(){return{top:70,left:20,width:300,height:80}}focus(){document.activeElement=this}contains(el){return this===el||(this.id==='guide'&&['back','forward','quit'].includes(el.id))}querySelectorAll(){return['quit','back','forward'].map(id=>map.get(id)).filter(el=>!el.disabled)}}
for(const id of html.matchAll(/\bid="([\w-]+)"/g))map.set(id[1],new Element(id[1]));map.set('enemy',new Element('enemy'));
const classes=new Set();const document={getElementById:id=>map.get(id),activeElement:map.get('launch'),body:{classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)}},addEventListener:(name,fn)=>handlers[name]=fn};
const window={scrollBy(){},scrollTo(){},visualViewport:{height:900,width:1200,addEventListener(){}}};const context={document,window,innerWidth:1200,innerHeight:900,requestAnimationFrame:fn=>{fn();return 1},cancelAnimationFrame(){},addEventListener(){}};vm.runInNewContext(script,context);
assert.equal(window.EncounterDemo.count,17);assert.equal(window.EncounterDemo.step,1);assert(classes.has('touring'));assert.equal(map.get('back').disabled,true);
for(let i=1;i<17;i++){assert(map.get('title').textContent.startsWith(i+' ·'));map.get('forward').onclick();assert.equal(window.EncounterDemo.step,i+1)}
assert.equal(map.get('forward').textContent,'Terminer ✓');map.get('back').onclick();assert.equal(window.EncounterDemo.step,16);map.get('forward').onclick();map.get('forward').onclick();assert.equal(map.get('end').hidden,false);assert.equal(map.get('guide').hidden,true);assert.equal(classes.has('touring'),false);
map.get('restart').onclick();for(let i=1;i<14;i++)map.get('forward').onclick();let cancelled=0;handlers.click({target:map.get('decision'),preventDefault(){cancelled++},stopImmediatePropagation(){cancelled++}});assert.equal(window.EncounterDemo.step,15);assert.equal(cancelled,2);
handlers.keydown({key:'Escape',preventDefault(){}});assert(map.get('guide').hidden);assert(!map.get('prepview').hidden);assert.equal(document.activeElement.id,'restart');
map.get('launch').onclick();handlers.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(window.EncounterDemo.step,1);handlers.keydown({key:'Tab',shiftKey:false,preventDefault(){}});assert.equal(document.activeElement.id,'quit');
assert(!/\b(fetch|WebSocket|localStorage|sessionStorage)\s*[.(]/.test(script));
const moduleText=fs.readFileSync(__dirname+'/encounter-guide.js','utf8');assert(moduleText.includes("setAttribute('sandbox','allow-scripts')"));assert(!moduleText.includes('allow-same-origin'));assert(moduleText.includes('frame.srcdoc=DEMO'));assert(moduleText.includes("dialog.addEventListener('close',cleanup,{once:true})"));
console.log('OK : 17 étapes, précédent, terminer, relancer, cible active, quitter, clavier, confinement sans réseau ni stockage.');
