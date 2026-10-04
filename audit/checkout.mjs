import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync(new URL('./staging-manifest.json',import.meta.url)));
const parent=resolve(new URL('../../',import.meta.url).pathname);
for(const [name,value]of Object.entries(manifest.repositories)){
 if(name==='Encounter')continue;
 if(!/^[A-Za-z-]+$/.test(name)||!/^[0-9a-f]{40}$/.test(value.sha))throw Error('Invalid immutable repository reference');
 const cwd=resolve(parent,name);if(existsSync(cwd))throw Error('Checkout already exists: '+cwd);
 execFileSync('git',['init',cwd],{stdio:'inherit'});
 execFileSync('git',['remote','add','origin','https://github.com/bryantoualy-del/'+name+'.git'],{cwd,stdio:'inherit'});
 execFileSync('git',['fetch','--depth','1','origin',value.sha],{cwd,stdio:'inherit'});
 execFileSync('git',['checkout','--detach','FETCH_HEAD'],{cwd,stdio:'inherit'});
}
