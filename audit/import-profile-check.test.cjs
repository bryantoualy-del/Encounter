const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class El{constructor(){this.children=[];this.nodes=new Map();this.open=false;this.textContent='';this.attributes={};this.style={}}
 append(...nodes){this.children.push(...nodes)}replaceChildren(){this.children=[]}setAttribute(k,v){this.attributes[k]=v}addEventListener(k,f){this['on'+k]=f}querySelector(k){if(!this.nodes.has(k))this.nodes.set(k,new El());return this.nodes.get(k)}showModal(){this.open=true}close(){this.open=false}}
const body=new El(),head=new El(),tasks=[],memory=new Map();let saved=0;
const ctx={document:{body,head,createElement:()=>new El()},console,setTimeout:f=>tasks.push(f),sessionStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},EncounterPersistence:{migrate:x=>({data:x})},importData:()=>{saved++}};ctx.window=ctx;
vm.runInNewContext(fs.readFileSync(__dirname+'/../encounter-typed-damage.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync(__dirname+'/../monster-assistant.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync(__dirname+'/../mj-import-compatibility.js','utf8'),ctx);
const enemy={name:'Loup',ac:13,hp:27,actions:[{name:'Morsure',kind:'attack',bonus:5,damage:'2d6+3',damageType:'perforants'}]};
ctx.importData(JSON.stringify([enemy,{name:'Elya',category:'character',ac:15,hp:32,actions:[]}]));assert.equal(saved,1);tasks.shift()();
const dialog=body.children[0],results=dialog.querySelector('[data-results]');assert.equal(dialog.open,true);assert.match(results.children[0].children[0].textContent,/OUI — conforme : Loup/);assert.match(results.children[1].children[0].textContent,/NON — non conforme : Elya/);
dialog.close();ctx.importData(JSON.stringify({app:'ENCOUNTER',monsters:[enemy],encounter:{participants:[]}}));assert.equal(saved,2);assert.equal(dialog.open,false);assert.ok(memory.size>0,'Le bilan est conservé pendant le rechargement de la sauvegarde');
assert.throws(()=>ctx.importData('{'),/JSON/);assert.equal(saved,2);
console.log('OK : import adversaire et fiche perso, raisons, sauvegarde complète, JSON invalide.');
