import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync(new URL('./v5-manifest.json',import.meta.url)));
const parent=resolve(new URL('../../',import.meta.url).pathname);
function checkout(name,sha,target){if(!/^[A-Za-z-]+$/.test(name)||!/^[0-9a-f]{40}$/.test(sha))throw Error('Invalid immutable checkout');if(existsSync(target))throw Error('Refusing to overwrite '+target);execFileSync('git',['init',target],{stdio:'inherit'});execFileSync('git',['remote','add','origin','https://github.com/bryantoualy-del/'+name+'.git'],{cwd:target,stdio:'inherit'});execFileSync('git',['fetch','--depth','1','origin',sha],{cwd:target,stdio:'inherit'});execFileSync('git',['checkout','--detach','FETCH_HEAD'],{cwd:target,stdio:'inherit'});}
for(const [name,value]of Object.entries(manifest.repositories))checkout(name,value.sha,resolve(parent,name));
mkdirSync(resolve(parent,'baseline'),{recursive:true});
for(const [name,value]of Object.entries(manifest.repositories))if(name!=='RPG-Connect')checkout(name,value.baseline,resolve(parent,'baseline',name));
checkout('Encounter',manifest.encounterBaseline,resolve(parent,'baseline','Encounter'));
