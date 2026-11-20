import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PIN,BRIDGE,ALIASES,CONSTS,sha,splitHtml,parse,inspectProgram,moduleBody,query,ident} from './tools/ast.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const file=n=>resolve(here,n);
const makeFactory=(source,name)=>{
  const content=moduleBody(source,name,name==='createBridge');
  return '(() => {\n'+content+'\nreturn '+name+';\n})()';
};
export function build(vendor, sources){
  assert.equal(vendor.byteLength,PIN.bytes,'Wrong vendor byte count');
  assert.equal(sha(vendor),PIN.html,'Wrong vendor SHA-256; no files written');
  const parts=splitHtml(vendor);
  const original=inspectProgram(parts.app);
  assert.equal(query(original.tree,n=>ident(n,BRIDGE)).length,0,'Fresh private binding required');
  const b=makeFactory(sources.bridge,'createBridge');
  const art=[sources.skyline,sources.activity].map(s=>makeFactory(s,'createArt'));
  const entries=Object.entries(ALIASES).map(([k,[v]])=>k+':'+v);
  for(const [k,v] of Object.entries(CONSTS))entries.push(k+':'+JSON.stringify(v));
  const native='{'+entries.join(',')+'}';
  // Only three insertions: isolated binding, mount just before the clock originates,
  // and visual tick just before the original renderer call. Never print the vendor AST.
  const insertions=[
    {id:'bridge-declaration',at:original.inner.start+1,text:'\nconst '+BRIDGE+' = '+b+'(['+art.join(',\n')+']);\n'},
    {id:'mount-before-clock',at:original.mount.node.start,text:BRIDGE+'.mount(this.scene,'+native+',Ms,hi),'},
    {id:'presentation-before-render',at:original.render.node.start,text:BRIDGE+'.update(this.scene,this.elapsed,this.camera.position.x,this.camera.position.y,this.camera.position.z),'}
  ];
  let formed='',taken=0;const undo=[];
  for(const patch of insertions){
    assert.ok(patch.at>=taken,'Anchor ordering');
    formed+=parts.app.slice(taken,patch.at);
    undo.push({start:formed.length,end:formed.length+patch.text.length,id:patch.id,sha256:sha(patch.text)});
    formed+=patch.text;taken=patch.at;
  }
  formed+=parts.app.slice(taken);
  const candidate=Buffer.from(parts.before+formed+parts.after);
  const candidateApp=splitHtml(candidate).app;
  const after=parse(candidateApp);
  assert.equal(query(after,k=>ident(k,BRIDGE)).length,3,'Only declaration + two calls allowed');
  const reverted=undo.toReversed().reduce((s,p)=>{
    assert.equal(sha(s.slice(p.start,p.end)),p.sha256);
    return s.slice(0,p.start)+s.slice(p.end);
  },candidateApp);
  assert.equal(sha(reverted),PIN.app);
  const restore=Buffer.from(parts.before+reverted+parts.after);
  assert.ok(restore.equals(vendor),'Exact original bytes must be recoverable from generated delta');
  return {candidate,metadata:{
    provenance:'Additive R12 overlay over exact shipped R11; not recovered source',
    vendor:PIN,candidate:{sha256:sha(candidate),bytes:candidate.length,app:sha(candidateApp)},
    source:{bridge:sha(sources.bridge),skyline:sha(sources.skyline),activity:sha(sources.activity)},
    reversible:true,insertions:undo
  }};
}
export const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  assert.equal(process.argv.length,2,'Run npm run build with the exact project sources');
  const readText=n=>readFile(file('src/'+n+'.mjs'),'utf8');
  const vendor=await readFile(file('vendor/R11.html'));
  const sources=Object.fromEntries(await Promise.all(['bridge','skyline','activity'].map(async n=>[n,await readText(n)])));
  const {candidate,metadata}=build(vendor,sources);
  await mkdir(file('out'),{recursive:true});
  await writeFile(file('out/index.html'),candidate);
  await writeFile(file('out/build.json'),JSON.stringify(metadata,null,2)+'\n');
  console.log(JSON.stringify(metadata.candidate));
}
