// Default connected-mode policy contract for isolated legacy client unit tests.
// The actual policy, Free mode and transport are exercised in the browser suite.
import {JSDOM as BaseDOM} from 'jsdom';
export class JSDOM extends BaseDOM {
 constructor(...args) {
  super(...args);
  const w=this.window;
  w.RPGResolution={controlled:()=>true,free:()=>false,mountRibbon(){},resetActions:()=>false,register(){},archive(){},shadow(){},receive:()=>false,outbound:()=>true,bind(){},resume(){},rememberResult(){},isDetached:()=>false,filterPending:x=>x||[],getState:()=>({mode:'encounter',generation:0})};
  let legacyState;Object.defineProperty(w,'state',{configurable:true,get:()=>legacyState,set:value=>{legacyState=value;if(value?.encounter&&!value.encounter.rpgSessionMode)value.encounter.rpgSessionMode='guided';}});
  let transport;
  Object.defineProperty(w,'RPGConnect',{configurable:true,get:()=>transport,set:value=>{
   transport=value;
   if(value?.getStatus){const status=value.getStatus.bind(value);value.getStatus=()=>{const s=status();return {...s,controlled:s.controlled??s.connected};};}
  }});
 }
}

export {VirtualConsole} from 'jsdom';
