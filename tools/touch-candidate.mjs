import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,sourcesFor} from '../build.mjs';
import {R13_ARTIFACT} from './versions.mjs';
import {sha,splitHtml,inspectProgram,parse} from './ast.mjs';
import {touchSplices} from './touch-splices.mjs';
export async function touchCandidate(){
 const rf=n=>readFile(new URL(n,import.meta.url)),vendor=await rf('../vendor/R11.html');
 const {candidate,metadata}=build(vendor,await sourcesFor('r13'));assert.deepEqual(metadata.candidate,R13_ARTIFACT);
 const {before,app,after}=splitHtml(candidate);
 const mods=await Promise.all(['../src/touch-layout.mjs','../src/touch-hud.mjs'].map(async p=>(await rf(p)).toString()));
 const edits=touchSplices(app,inspectProgram(app,false),...mods),marks=[];
 let s='',last=0;
 for(const e of edits){assert.ok(e.at>=last);s+=app.slice(last,e.at);marks.push([s.length,e.text]);s+=e.text;last=e.at;}
 s+=app.slice(last);parse(s);
 const reversed=marks.toReversed().reduce((acc,[idx,txt])=>{assert.equal(acc.slice(idx,idx+txt.length),txt);return acc.slice(0,idx)+acc.slice(idx+txt.length);},s);
 assert.equal(reversed,app);return Buffer.from(before+s+after);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const b=await touchCandidate(),dir=new URL('../out/touch/',import.meta.url);await mkdir(dir,{recursive:true});await writeFile(new URL('index.html',dir),b);console.log(b.length,sha(b));
}
