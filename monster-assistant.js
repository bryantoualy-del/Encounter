/* Conservative proposals: source text is evidence, never an executable rule by itself. */
(()=>{'use strict';
 const abilities=['FOR','DEX','CON','INT','SAG','CHA'];
 const categories={attack:'Attaque',spell:'Vrai sort',save:'JdS direct',hitSave:'JdS sur touche',reaction:'Réaction',recharge:'Recharge',resource:'Ressource',legendary:'Action légendaire',text:'Effet descriptif'};
 const number=v=>v==null||v===''?null:Number(v);
 function propose(text,edition='unspecified'){
  const lines=String(text).split(/\n+/).map(s=>s.trim()).filter(Boolean),name=lines.shift()||'Nouvelle créature';
  const ac=String(text).match(/(?:classe d.armure|\bCA)\s*[:：]?\s*(\d+)/i),hp=String(text).match(/(?:points de vie|\bPV)\s*[:：]?\s*(\d+)/i);
  const candidates=lines.filter(s=>! /^(classe d.armure|points de vie|CA\b|PV\b|FOR\b|DEX\b|CON\b|INT\b|SAG\b|CHA\b|actions?|réactions?)\s*[:：]?/i.test(s));
  const actions=candidates.map((detail,i)=>{
   const attack=/attaque.*(?:corps|distance)|[+]\d+.*toucher/i.test(detail),save=detail.match(/(?:sauvegarde|JdS|JS)\s*(?:de\s*)?(Force|Dextérité|Constitution|Intelligence|Sagesse|Charisme|FOR|DEX|CON|INT|SAG|CHA)/i),dc=detail.match(/DD\s*(\d+)/i),bonus=detail.match(/([+]\d+)\s*(?:au|pour|à)?\s*toucher/i),damage=detail.match(/\b(\d+d\d+(?:\s*[+]\s*\d+)?)\b/i),level=detail.match(/(?:sort.*niveau|niveau.*sort)\s*(\d)/i);
   const names={force:'FOR','dextérité':'DEX',constitution:'CON',intelligence:'INT',sagesse:'SAG',charisme:'CHA'},ab=save?(names[save[1].toLowerCase()]||save[1].toUpperCase()):'';
   const type=attack&&save?'hitSave':attack?'attack':level?'spell':save?'save':/recharge/i.test(detail)?'recharge':/réaction/i.test(detail)?'reaction':/légendaire/i.test(detail)?'legendary':'text';
   const dtype=detail.match(/dégâts?\s+(?:de\s+)?(feu|froid|force|poison|psychiques|nécrotiques|radiants|perforants|tranchants|contondants|acide|foudre|tonnerre)/i)?.[1]||'';
   return {name:detail.split(/[.:]/)[0].slice(0,80)||'Capacité '+(i+1),detail,kind:attack?'attack':save?'save':'text',isSpell:!!level,spellLevel:level?Number(level[1]):null,bonus:bonus?Number(bonus[1]):null,damage:damage?damage[1].replace(/\s/g,''):'',damageType:dtype,save:attack?'':ab,dc:attack?null:dc?Number(dc[1]):null,onHitSave:attack&&save&&dc?{ability:ab,dc:Number(dc[1]),conditionOnFailure:/à terre/i.test(detail)?'À terre':''}:null,assistantMeta:{type,reviewed:false,trigger:'',targets:'',condition:/à terre|étourdi|paralysé|empoisonné|entravé|effrayé|aveuglé|charmé/i.exec(detail)?.[0]||'',duration:/\d+\s*(?:rounds?|tours?|minutes?|heures?)/i.exec(detail)?.[0]||'',end:'',manual:'Vérifier le texte source, les valeurs et les effets.'}};
  });
  return {name,ac:ac?Number(ac[1]):null,hp:hp?Number(hp[1]):null,rulesEdition:edition,actions,source:'Texte fourni par le MJ',assistant:{version:1,sourceText:text,reviewed:false}};
 }
 function classify(a){return a.assistantMeta?.type||(a.isSpell?'spell':a.onHitSave?'hitSave':a.kind==='attack'?'attack':a.kind==='save'?'save':a.kind==='recharge'?'recharge':'text')}
 function assess(a){
  const meta=a.assistantMeta||{},type=classify(a),missing=[],manual=[];
  if(!a.name)missing.push('nom');if(!meta.reviewed)missing.push('validation MJ');
  if(type==='spell'&&(!a.isSpell||!Number.isInteger(number(a.spellLevel))||number(a.spellLevel)<0||number(a.spellLevel)>9))missing.push('vrai sort et niveau 0–9');
  if(['attack','hitSave'].includes(type)&&!Number.isFinite(number(a.bonus)))missing.push('bonus de toucher');
  if(['save','hitSave'].includes(type)||a.kind==='save'){
   const q=type==='hitSave'?a.onHitSave:a;if(!abilities.includes(q?.ability||q?.save)||!Number.isInteger(number(q?.dc))||number(q.dc)<1)missing.push('JdS structuré et DD');
  }
  if(a.damage&&!/^\d+d\d+(?:[+-]\d+)?$|^\d+$/.test(a.damage.replace(/\s/g,'')))missing.push('formule de dégâts');
  if(a.damage&&!a.damageType)missing.push('type de dégâts');
  if(/sauvegarde|\bJdS\b|\bJS\b/i.test(a.detail||'')&&!a.onHitSave&&!(abilities.includes(a.save)&&number(a.dc)>0))missing.push('JdS en texte seulement : non connecté');
  if(a.isSpell&&type!=='spell')manual.push('Classification magique à corriger');
  if(['text','reaction','resource','legendary','recharge'].includes(type))manual.push('Déclenchement, coût ou effet à vérifier à la table');
  if(!meta.trigger)manual.push('Déclencheur à confirmer');if(!meta.targets)manual.push('Cibles / portée à choisir par le MJ');
  if(meta.condition&&type!=='hitSave')manual.push('État décrit : application manuelle');
  if(a.onHitSave?.conditionOnFailure)manual.push('État appliqué automatiquement ; retrait / fin à confirmer par le MJ');
  if(meta.duration||meta.end)manual.push('Durée et fin : suivi manuel');if(meta.manual)manual.push(meta.manual);
  if(type==='spell'&&a.kind==='text')manual.push('Sort descriptif : Contresort possible, résolution manuelle');
  return {type,status:missing.length?'information manquante':manual.length?'décision MJ nécessaire':'automatisée',missing,manual,connectedSave:!!a.onHitSave||(abilities.includes(a.save)&&number(a.dc)>0&&['save','recharge'].includes(a.kind))};
 }
 globalThis.MonsterAssistant={propose,assess,classify,categories};
})();
