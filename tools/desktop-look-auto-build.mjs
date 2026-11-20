// Derive a CPU-testable candidate from the exactly restored R14, keeping that
// capsule immutable. Replace only the separately pinned, originally inserted
// desktop controller declaration, and insert one exact native resume hook.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,sourcesFor} from '../build.mjs';
import {inspectProgram,sha,splitHtml,parse,query,unique,slice} from './ast.mjs';
import {R14_CORE_ARTIFACT} from './r14-core-lock.mjs';
import {DESKTOP_LOOK,desktopLookPatches} from './desktop-look-patches.mjs';
export function autoLookEdits(vendor,base,src) {
 assert.deepEqual(base.metadata.candidate,R14_CORE_ARTIFACT);
 const {app}=splitHtml(base.candidate);
 const legacy=unique(base.metadata.insertions.filter(p=>p.id==='desktop-look-declaration'),'R14 qualified controller declaration');
 assert.equal(sha(app.slice(legacy.start,legacy.end)),legacy.sha256);
 const vendorApp=splitHtml(vendor).app;
 const patches=desktopLookPatches({app:vendorApp,original:inspectProgram(vendorApp),source:src});
 const decl=unique(patches.filter(p=>p.id===legacy.id),'new controller declaration');
 const r14=inspectProgram(app,false);
 const panel=unique(query(r14.inner,n=>n.type==='AssignmentExpression'&&n.right.type==='ArrowFunctionExpression'&&slice(app,n.left)==='Wt("panel").onclick'),'native panel click handler').node;
 const resume=unique(query(panel.right,n=>n.type==='IfStatement'&&slice(app,n)==='if(e==="resume"){wi(!0);return}'),'native explicit Resume action').node;
 assert.equal(panel.right.params[0].name,'A');
 assert.equal(resume.consequent.body[1].type,'ReturnStatement');
 const at=resume.consequent.body[1].start;
 assert.ok(at>legacy.end);
 const added=DESKTOP_LOOK+'.resume(ne,A);';
 return [
  {id:'desktop-look-controller-replace',at:legacy.start,end:legacy.end,text:decl.text,oldSHA:legacy.sha256},
  {id:'desktop-look-trusted-resume',at,end:at,text:added}
 ];
}
export async function buildAutoLook() {
 const read=(p)=>readFile(new URL(p,import.meta.url));
 const [vendor,src,sources]=await Promise.all([read('../vendor/R11.html'),read('../src/desktop-look-auto.mjs').then(String),sourcesFor('r14-core')]);
 const base=build(vendor,sources);
 const {before,app,after}=splitHtml(base.candidate);
 const [decl,resume]=autoLookEdits(vendor,base,src), at=resume.at, added=resume.text;
 const legacy={start:decl.at,end:decl.end};
 const edited=app.slice(0,legacy.start)+decl.text+app.slice(legacy.end,at)+added+app.slice(at);
 parse(edited);
 const resumeAt=at+decl.text.length-(legacy.end-legacy.start);
 const rollback=edited.slice(0,resumeAt)+edited.slice(resumeAt+added.length);
 const original=rollback.slice(0,legacy.start)+app.slice(legacy.start,legacy.end)+rollback.slice(legacy.start+decl.text.length);
 assert.equal(original,app);
 const html=Buffer.from(before+edited+after);
 return {html,meta:{base:R14_CORE_ARTIFACT,variant:{sha256:sha(html),app:sha(edited),bytes:html.length},controller:sha(src),reversible:true}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {html,meta}=await buildAutoLook(), dir=new URL('../out/r14-auto-look/',import.meta.url);
 await mkdir(dir,{recursive:true});await writeFile(new URL('index.html',dir),html);
 await writeFile(new URL('build.json',dir),JSON.stringify(meta,null,2)+'\n');
 console.log(JSON.stringify(meta));
}
