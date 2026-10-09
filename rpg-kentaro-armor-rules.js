/* Autorité Encounter : vérification stricte, commune au dé virtuel et au dé physique. */
(()=>{'use strict';
 const OPTION='kentaro-armor-of-hexes';
 function isValid(w,q){
  if(w?.context?.kind!==OPTION)return true;
  if(q?.optionId!==OPTION||w.status!=='granted')return false;
  if(q.declined===true||q.cancelled===true)return q.consumed===false&&q.hexArmorRoll==null&&q.success===false;
  return (q.hexArmorMode==='automatic'||q.hexArmorMode==='manual')&&
   Number.isInteger(q.hexArmorRoll)&&q.hexArmorRoll>=1&&q.hexArmorRoll<=6&&
   q.consumed===true&&q.success===(q.hexArmorRoll>=4)&&
   q.hexArmorOutcome===(q.hexArmorRoll>=4?'miss':'hit');
 }
 function interpret(q={}){const rolled=Number.isInteger(q.hexArmorRoll)&&q.hexArmorRoll>=1&&q.hexArmorRoll<=6&&q.consumed===true;return {rolled,spent:rolled,avoided:rolled&&q.hexArmorRoll>=4,mode:rolled?q.hexArmorMode:null,die:rolled?q.hexArmorRoll:null}}
 globalThis.RPGKentaroArmorRules={isValid,interpret,OPTION};
})();