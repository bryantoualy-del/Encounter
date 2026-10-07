/* Organization never substitutes the technical combat role. */
(function(root){'use strict';
 function cr(value){const s=String(value??'').trim();if(!s)return null;const f=s.match(/^(\d+)\s*\/\s*(\d+)$/);if(f)return Number(f[2])>0?Number(f[1])/Number(f[2]):null;const n=Number(s);return Number.isFinite(n)&&n>=0?n:null;}
 function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
 function inRange(v,min,max){if(min===''||min==null)min=null;if(max===''||max==null)max=null;if(min===null&&max===null)return true;return v!=null&&Number.isFinite(Number(v))&&(min===null||Number(v)>=Number(min))&&(max===null||Number(v)<=Number(max))}
 function matches(m,f={}){return (!f.role||m.category===f.role)&&(!f.category||(m.organizationIds||[]).includes(f.category))&&(!f.mainClass||normalize(m.mainClass)===normalize(f.mainClass))&&(!f.type||normalize(m.type)===normalize(f.type))&&inRange(m.missingData?.ac?null:m.ac,f.acMin,f.acMax)&&inRange(m.missingData?.hp?null:m.hp,f.hpMin,f.hpMax)&&inRange(cr(m.cr),f.crMin,f.crMax)&&(!f.boss||Boolean(m.isBoss||m.legendaryActions?.length)===(f.boss==='yes'))&&(!f.favorite||m.favorite)&&(!f.text||normalize([m.name,m.subtitle,m.type,m.source,...(m.tags||[])].join(' ')).includes(normalize(f.text)))}
 root.MJLibraryModel={cr,matches,inRange};
})(globalThis);
