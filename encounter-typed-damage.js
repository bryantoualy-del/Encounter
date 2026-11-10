/* Per-capacity typed damage. Pure helpers; no combat state. */
(()=>{'use strict';
 const types=['acide','contondants','feu','force','foudre','froid','nécrotiques','perforants','poison','psychiques','radiants','tonnerre','tranchants'];
 const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
 const semanticColors=Object.freeze({feu:'#FF6538',froid:'#65D9F5',foudre:'#F6D44B',tonnerre:'#568BEB',acide:'#A4D64F',poison:'#39B87B','nécrotiques':'#9461BC',radiants:'#FFE19A',psychiques:'#E577D6',force:'#B18BFF',contondants:'#B49B7B',perforants:'#A9BAC8',tranchants:'#E17A80',soins:'#34D399',temporaires:'#38BDF8',regeneration:'#86EFAC',bloques:'#94A3B8',attaque:'#E5B963'});
 const aliases=Object.freeze({fire:'feu',cold:'froid',lightning:'foudre',thunder:'tonnerre',acid:'acide',necrotic:'nécrotiques',radiant:'radiants',psychic:'psychiques',bludgeoning:'contondants',piercing:'perforants',slashing:'tranchants',healing:'soins',temporary:'temporaires',regeneration:'regeneration',blocked:'bloques'});
 const semanticType=v=>{
   const s=norm(v);
   if(s in aliases)return aliases[s];
   if(s in semanticColors)return s;
   const singular=s.replace(/s$/,'');
   return types.find(x=>norm(x).replace(/s$/,'')===singular)||null;
 };

 const type=v=>types.find(x=>norm(x)===norm(v))||'';
 const formula=v=>/^(?:[+-]?(?:\d*d\d+|\d+))+$/i.test(String(v||'').replace(/\s/g,''));
 function parse(text){const parts=[],errors=[];String(text||'').split(/\n|;/).map(x=>x.trim()).filter(Boolean).forEach((line,i)=>{const fields=line.split('|').map(x=>x.trim());if(fields.length!==2||!formula(fields[0])||!type(fields[1]))errors.push('Ligne '+(i+1)+' : saisir « 1d6 | feu » avec une formule et un type reconnus.');else parts.push({formula:fields[0],type:type(fields[1])})});return{parts,errors}}
 function forAbility(a={}){if(Object.hasOwn(a,'damagePartsText')){if(String(a.damagePartsText||'').trim())return parse(a.damagePartsText);return a.damage?{parts:formula(a.damage)&&type(a.damageType)?[{formula:String(a.damage),type:type(a.damageType)}]:[],errors:[]}:{parts:[],errors:[]}}if(Array.isArray(a.damageParts)&&a.damageParts.length){const parts=[],errors=[];a.damageParts.forEach((p,i)=>{if(!formula(p?.formula)||!type(p?.type))errors.push('Composante '+(i+1)+' : formule ou type invalide.');else parts.push({formula:String(p.formula),type:type(p.type)})});return{parts,errors}}if(a.damage)return{parts:formula(a.damage)&&type(a.damageType)?[{formula:String(a.damage),type:type(a.damageType)}]:[],errors:[]};return{parts:[],errors:[]}}
 // A reaction can reduce an entire hit. Preserve the sum and distribute the
 // reduction over typed components without losing any component's damage type.
 function scale(components,total){const raw=components.reduce((n,c)=>n+c.amount,0);if(!raw)return components.map(c=>({...c,amount:0}));const capped=Math.max(0,Math.min(raw,Math.trunc(Number(total)||0)));let assigned=0;return components.map((c,i)=>{const amount=i===components.length-1?capped-assigned:Math.floor(capped*c.amount/raw);assigned+=amount;return{...c,amount}})}
 globalThis.EncounterTypedDamage={types,type,formula,parse,forAbility,scale,semanticColors,semanticType};
})();
