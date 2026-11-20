// Offline development reproducer only; root composite owns release build/publication.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,sourcesFor} from '../build.mjs';
import {R13_ARTIFACT} from './versions.mjs';
import {splitHtml,sha,inspectProgram,parse} from './ast.mjs';
import {qualitySplices} from './quality-splices.mjs';
export async function qualityCandidate() {
  const rfile=n=>readFile(new URL(n,import.meta.url));
  const vendor=await rfile('../vendor/R11.html');
  const {candidate:base,metadata}=build(vendor,await sourcesFor('r13'));
  assert.deepEqual(metadata.candidate,R13_ARTIFACT);
  const {before,app,after}=splitHtml(base);
  const sources=await Promise.all(['../src/graphics-quality.mjs','../src/walker-index.mjs'].map(async p=>(await rfile(p)).toString()));
  const patches=qualitySplices(app,inspectProgram(app,false),...sources);
  let out='',offset=0;const undo=[];
  for(const {at,text,id} of patches){assert.ok(at>=offset);out+=app.slice(offset,at);undo.push([out.length,text.length,id,sha(text)]);out+=text;offset=at;}
  out+=app.slice(offset);parse(out);
  const beforeEdits=undo.toReversed().reduce((s,[at,len,id,h])=>{assert.equal(sha(s.slice(at,at+len)),h,id);return s.slice(0,at)+s.slice(at+len);},out);
  assert.ok(Buffer.from(before+beforeEdits+after).equals(base));
  return Buffer.from(before+out+after);
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const html=await qualityCandidate();const dir=new URL('../out/quality/',import.meta.url);await mkdir(dir,{recursive:true});await writeFile(new URL('index.html',dir),html);
 console.log(html.length,sha(html));
}
