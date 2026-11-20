// Reproducible development-only combination; never edits the original capsule
// or replaces the established R14 / standalone follow-up build commands.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,sourcesFor} from '../build.mjs';
import {sha,splitHtml,inspectProgram,parse,query,ident} from './ast.mjs';
import {R14_CORE_ARTIFACT} from './r14-core-lock.mjs';
import {ENGINE_AUDIO_SOURCE,R14_ENGINE_AUDIO_ARTIFACT} from './engine-audio-lock.mjs';
import {engineAudioSplices,ENGINE_AUDIO} from './engine-audio-splices.mjs';
import {autoLookEdits} from './desktop-look-auto-build.mjs';
import {DESKTOP_LOOK} from './desktop-look-patches.mjs';
import {DESKTOP_AUTO_LOOK_SOURCE,R14_AUTO_LOOK_ARTIFACT,R14_DRIVE_VIEW_ARTIFACT} from './r14-drive-view-lock.mjs';

const root=file=>new URL('../'+file,import.meta.url);
const stamp=file=>({sha256:sha(file),app:sha(splitHtml(file).app),bytes:file.length});
const validFeature=feature=>['engine','desktop','wardrobe'].includes(feature);

export function reconcileApp(app,features) {
 const commands=features.toSorted((a,b)=>a.at-b.at);
 const ids=new Set(), ranges=[], prior=new Map();
 let from=0,offset=0;
 const sections=[];
 for (const {id,feature,at,end=at,text,oldSHA} of commands) {
  assert.ok(validFeature(feature)&&!ids.has(id),'Unique supported edit feature: '+id);
  assert.ok(Number.isSafeInteger(at)&&Number.isSafeInteger(end)&&from<=at&&end>=at&&end<=app.length,'Overlapping or out-of-bounds ranges: '+id);
  assert.ok(typeof text==='string'&&text.length&&!/<\/script/i.test(text),'Safe nonempty replacement: '+id);
  ids.add(id);
  // Map Acorn's UTF-16 spans to real UTF-8 byte spans for rollback.
  const lead=Buffer.from(app.slice(from,at)), removed=Buffer.from(app.slice(at,end)), added=Buffer.from(text);
  assert.equal(sha(removed),oldSHA??sha(Buffer.alloc(0)),'Pinned input range: '+id);
  offset+=lead.length;
  ranges.push({id,feature,start:offset,end:offset+added.length,beforeSHA:sha(removed),afterSHA:sha(added)});
  prior.set(id,removed);
  sections.push(lead,added);
  offset+=added.length;from=end;
 }
 sections.push(Buffer.from(app.slice(from)));
 return {app:Buffer.concat(sections),ranges,prior};
}

export function reverseDriveView(app,ranges,prior,features){
 const selected=new Set(features);
 assert.ok([...selected].every(validFeature),'Known rollback features only');
 for (const r of ranges.toReversed()) {
  if (!selected.has(r.feature)) continue;
  assert.equal(sha(app.subarray(r.start,r.end)),r.afterSHA,'Verified compiled range: '+r.id);
  const old=prior.get(r.id);
  assert.equal(sha(old),r.beforeSHA,'Verified preimage range: '+r.id);
  app=Buffer.concat([app.subarray(0,r.start),old,app.subarray(r.end)]);
 }
 return app;
}

export async function prepareDriveView(){
 const [vendor,engine,look,inputs]=await Promise.all([
  readFile(root('vendor/R11.html')),
  readFile(root('src/engine-audio.mjs'),'utf8'),
  readFile(root('src/desktop-look-auto.mjs'),'utf8'),
  sourcesFor('r14-core')
 ]);
 assert.equal(sha(engine),ENGINE_AUDIO_SOURCE,'Frozen engine source');
 assert.equal(sha(look),DESKTOP_AUTO_LOOK_SOURCE,'Frozen default desktop-look controller');
 const base=build(vendor,inputs);
 assert.deepEqual(base.metadata.candidate,R14_CORE_ARTIFACT,'Exact R14 parent');
 const {app}=splitHtml(base.candidate);
 const engineEdits=engineAudioSplices(app,inspectProgram(app,false),engine).map(o=>({...o,feature:'engine'}));
 const desktopEdits=autoLookEdits(vendor,base,look).map(o=>({...o,feature:'desktop'}));
 assert.equal(engineEdits.length,7);
 assert.equal(desktopEdits.length,2);
 return {vendor,base,edits:[...engineEdits,...desktopEdits],engineSHA:sha(engine),lookSHA:sha(look)};
}

export async function buildDriveView(){
 const {base,edits,engineSHA,lookSHA}=await prepareDriveView();
 const {before,app,after}=splitHtml(base.candidate);
 const baked=reconcileApp(app,edits);
 const tree=parse(baked.app.toString());
 assert.equal(query(tree,n=>ident(n,ENGINE_AUDIO)).length,4,'Compiled engine hooks retained');
 assert.equal(query(tree,n=>ident(n,DESKTOP_LOOK)).length,5,'Compiled desktop hooks retained');
 const wrap=script=>Buffer.concat([Buffer.from(before),script,Buffer.from(after)]);
 const unwind=(...which)=>wrap(reverseDriveView(baked.app,baked.ranges,baked.prior,which));
 const standaloneEngine=stamp(unwind('desktop')), standaloneLook=stamp(unwind('engine'));
 assert.deepEqual(standaloneEngine,R14_ENGINE_AUDIO_ARTIFACT,'Removing desktop restores engine-only artifact exactly');
 assert.deepEqual(standaloneLook,R14_AUTO_LOOK_ARTIFACT,'Removing engine restores desktop-only artifact exactly');
 const original=unwind('engine','desktop');
 assert.ok(original.equals(base.candidate),'Removing all edits restores the complete exact R14 artifact');
 const html=wrap(baked.app), candidate=stamp(html);
 assert.deepEqual(candidate,R14_DRIVE_VIEW_ARTIFACT,'Frozen private combined artifact');
 return {html, candidate, original,meta:{
  baseline:R14_CORE_ARTIFACT,
  components:{engine:{source:engineSHA,standalone:standaloneEngine},desktop:{source:lookSHA,standalone:standaloneLook}},
  candidate, ranges:baked.ranges, reversible:true
 }};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {html,meta}=await buildDriveView(),dir=root('out/r14-drive-view/');
 await mkdir(dir,{recursive:true});
 await writeFile(new URL('index.html',dir),html);
 await writeFile(new URL('build.json',dir),JSON.stringify(meta,null,2)+'\n');
 console.log(JSON.stringify(meta));
}
