// Private candidate: add the pinned stock denim-only repair to the exact
// engine/desktop-look composition, without ever changing the bare vendor.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha,splitHtml,inspectProgram,parse,query,ident,slice,PIN} from './ast.mjs';
import {prepareDriveView,reconcileApp,reverseDriveView} from './r14-drive-view.mjs';
import {R14_CORE_ARTIFACT} from './r14-core-lock.mjs';
import {R14_DRIVE_VIEW_ARTIFACT} from './r14-drive-view-lock.mjs';
import {MARA_WARDROBE,maraWardrobeSplices} from './mara-wardrobe-splices.mjs';
import {MARA_STOCK_SOURCE,R14_STOCK_WARDROBE_ONLY,R14_DRIVE_VIEW_WARDROBE_ARTIFACT} from './r14-drive-view-wardrobe-lock.mjs';

const root=file=>new URL('../'+file,import.meta.url);
const stamp=bytes=>({sha256:sha(bytes),bytes:bytes.length,app:sha(splitHtml(bytes).app)});

export function liftVendorInsertions(app,original,insertions,delta){
 // Undo the UTF-16 positions of the already qualified R14 edits to recover
 // their original anchor coordinates. Keep their original order for ties,
 // with the new stock declaration intentionally following the R14 layers.
 let prior=0;
 const old=insertions.map(({id,start,end,sha256})=>{
  const text=app.slice(start,end);
  assert.equal(sha(text),sha256,id);
  const at=start-prior;
  prior+=text.length;
  return {at,len:text.length};
 });
 assert.ok(old.every((x,i)=>i===0||x.at>=old[i-1].at));
 let restored=app;
 for(const {start,end} of insertions.toReversed()){
  restored=restored.slice(0,start)+restored.slice(end);
 }
 assert.equal(restored,original,'Offsets must describe only the exact original application');
 return delta.map(o=>({
  ...o,feature:'wardrobe',
  at:o.at+old.reduce((len,r)=>len+(r.at<=o.at?r.len:0),0)
 }));
}

export async function buildDriveViewWardrobe(){
 const [{vendor,base,edits}, source]=await Promise.all([
  prepareDriveView(),readFile(root('src/mara-wardrobe.mjs'),'utf8')
 ]);
 assert.equal(sha(source),MARA_STOCK_SOURCE,'Pinned qualified ordinary stock denim source');
 const old=splitHtml(vendor);
 const {before,app,after}=splitHtml(base.candidate);
 assert.equal(sha(vendor),PIN.html);
 const delta=maraWardrobeSplices(old.app,inspectProgram(old.app),source);
 assert.deepEqual(delta.map(o=>o.id),['mara-wardrobe-declaration','mara-wardrobe-attach-at-construction']);
 const amendments=liftVendorInsertions(app,old.app,base.metadata.insertions,delta);
 const stockAnchor=amendments[1].at;
 assert.ok(app.startsWith('this.scene.add(this.player)',stockAnchor));
 assert.equal(app.slice(stockAnchor-18,stockAnchor),'this.player=Ms(0),');
 const out=reconcileApp(app,[...edits,...amendments]);
 const edited=out.app.toString(),j=inspectProgram(edited,false);
 assert.equal(query(j.tree,n=>ident(n,MARA_WARDROBE)).length,2,'One trusted definition and one constructor call only');
 const call=query(j.ctor,n=>n.type==='CallExpression'&&slice(edited,n).startsWith(MARA_WARDROBE+'.apply('));
 assert.equal(call.length,1);
 assert.equal(slice(edited,call[0].node),MARA_WARDROBE+'.apply(this.player,oe,me)');
 const wrap=bytes=>Buffer.concat([Buffer.from(before),bytes,Buffer.from(after)]);
 const unwind=(...features)=>wrap(reverseDriveView(out.app,out.ranges,out.prior,features));
 const noWardrobe=stamp(unwind('wardrobe')),stockOnly=stamp(unwind('engine','desktop'));
 assert.deepEqual(noWardrobe,R14_DRIVE_VIEW_ARTIFACT,'Rollback of stock denim restores exact two-feature build');
 assert.deepEqual({sha256:stockOnly.sha256,bytes:stockOnly.bytes},R14_STOCK_WARDROBE_ONLY,'Undo engine and look restores the independently qualified stock-only build');
 const orig=unwind('engine','desktop','wardrobe');
 assert.ok(orig.equals(base.candidate),'Undo all three restores exact R14');
 const html=wrap(out.app),candidate=stamp(html);
 assert.deepEqual(candidate,R14_DRIVE_VIEW_WARDROBE_ARTIFACT,'Frozen private three-feature candidate');
 return {html,original:orig,meta:{
  vendor:PIN, baseline:R14_CORE_ARTIFACT, noWardrobe, stockOnly, candidate, wardrobeSHA:sha(source), ranges:out.ranges, reversible:true
 }};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {html,meta}=await buildDriveViewWardrobe(),dir=root('out/r14-drive-view-wardrobe/');
 await mkdir(dir,{recursive:true});
 await writeFile(new URL('index.html',dir),html);
 await writeFile(new URL('build.json',dir),JSON.stringify(meta,null,2)+'\n');
 console.log(JSON.stringify(meta));
}
