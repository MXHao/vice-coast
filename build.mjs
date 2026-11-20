import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PIN,BRIDGE,ALIASES,CONSTS,sha,splitHtml,parse,inspectProgram,moduleBody,query,ident} from './tools/ast.mjs';
import {R12_ARTIFACT,R13_ARTIFACT} from './tools/versions.mjs';

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
  const artNames=sources.warehouse===undefined?['skyline','activity']:['skyline','activity','warehouse'];
  const art=artNames.map(n=>makeFactory(sources[n],'createArt'));
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
    const start=formed.length, startByte=Buffer.byteLength(formed);
    undo.push({start,end:start+patch.text.length,startByte,endByte:startByte+Buffer.byteLength(patch.text),id:patch.id,sha256:sha(patch.text)});
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
  const byteReversal=undo.toReversed().reduce((b,p)=>{
    assert.equal(sha(b.subarray(p.startByte,p.endByte)),p.sha256);
    return Buffer.concat([b.subarray(0,p.startByte),b.subarray(p.endByte)]);
  },Buffer.from(candidateApp));
  assert.ok(byteReversal.equals(Buffer.from(reverted)),'Exactly reversible by UTF-8 raw byte ranges');
  const restore=Buffer.concat([Buffer.from(parts.before),byteReversal,Buffer.from(parts.after)]);
  assert.ok(restore.equals(vendor),'Exact original bytes must be recoverable from generated delta');
  return {candidate,metadata:{
    provenance:'Additive '+(artNames.length===3?'R13':'R12')+' overlay over exact shipped R11; not recovered source',
    vendor:PIN,candidate:{sha256:sha(candidate),bytes:candidate.length,app:sha(candidateApp)},
    source:Object.fromEntries(['bridge',...artNames].map(n=>[n,sha(sources[n])])),
    reversible:true,insertions:undo
  }};
}
export async function sourcesFor(version) {
  assert.ok(['r12','r13'].includes(version),'Expected exact build revision r12 or r13');
  const r12=version==='r12',prefix=r12?'src/r12/':'src/';
  const paths={bridge:prefix+'bridge.mjs',skyline:'src/skyline.mjs',activity:prefix+'activity.mjs'};
  if(!r12)paths.warehouse='src/warehouse.mjs';
  const sources=Object.fromEntries(await Promise.all(Object.entries(paths).map(async([n,p])=>[n,await readFile(file(p),'utf8')])));
  const lock=JSON.parse(await readFile(file(r12?'src/r12/lock.json':'art-lock.json'),'utf8'));
  const expected=Object.keys(paths).sort();
  assert.deepEqual(Object.keys(lock).sort(),r12?expected:expected.filter(n=>n!=='bridge'));
  for(const [name,hash] of Object.entries(lock))assert.equal(sha(sources[name]),hash,'Locked author input: '+name);
  return sources;
}
export const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  assert.ok(process.argv.length<=3,'Use npm run build -- r12 or npm run build -- r13');
  const revision=process.argv[2]??'r12';
  const vendor=await readFile(file('vendor/R11.html'));
  const {candidate,metadata}=build(vendor,await sourcesFor(revision));
  assert.deepEqual(metadata.candidate,revision==='r12'?R12_ARTIFACT:R13_ARTIFACT,revision+' capsule must rebuild byte for byte');
  const dir=revision==='r12'?'out':'out/r13';
  await mkdir(file(dir),{recursive:true});
  await writeFile(file(dir+'/index.html'),candidate);
  await writeFile(file(dir+'/build.json'),JSON.stringify(metadata,null,2)+'\n');
  console.log(JSON.stringify(metadata.candidate));
}
