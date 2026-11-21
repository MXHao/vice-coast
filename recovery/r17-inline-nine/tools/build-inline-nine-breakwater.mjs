// Exact inline eight with shop queue status, plus a single independently proved
// cosmetic cartridge. Derived art/observer fragments are never new native I/O.
import assert from 'node:assert/strict';
import {existsSync as exists,readFileSync as read,writeFileSync as write} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parse,query,unique,ident,slice,sha,splitHtml,moduleBody} from './reload-ast.mjs';

export const prefix='__vcPrivateSharedFirstView';
export const BASE=Object.freeze({html:'df0b2db73e01dc2f5239e4740752e3156932d500eebabdff3773d6cdb871f864',app:'eb7ecc5ddc2642ac6942227492b84b87ffe650dbeefd3cc4d93d66e2deb78203',bytes:14809024});
export const EIGHT=Object.freeze({html:'ae596506bcd296ce53ca3dcc194c65d143177568df54ce5ad32678343fc6f5ba',app:'2717207dbaefb7ca862d9a96ba71384edccb903b87f343f2eb0681860ab27b44',bytes:30229699});
export const COHORT=Object.freeze(['p92','m416','m700','nova','ump','usp','glock18','mini14','spas12']);
export const pinned=Object.freeze({base:BASE});
export const REBASED=Object.freeze({html:'87caa135670470900e8bc9b20f1f3fd21141b960f237db7240e07c17f1cd2843',app:'96ce1bd39db0b8e0de927012caa586490d3c82ed1dc9c25598e9204ecab22584',bytes:32122756});
const DONOR=Object.freeze({
 html:'7b8214688e38fd3ea8b6962d81066d10bcfdc96a237b7256337dddc94af876d2',
 app:'433eccd5871192b6aa5e8a01179e85f8e529895071dc84d8729be1c41bb5fc84',bytes:16718480,
 namespace:'__vcPrivateSPAS12Breakwater',
 compiler:'fc9367667fa120236c330435bcfd4d79572e5cd092422e39f1b9c241ded010de',
 transport:'1d8904b6ac53c634c054f5e0e8ccd066c1af2a3ea52ca589ed9226c47604589c',
 art:'b1237e7e79b55c93109c4ffff86bb3a9577fdf8107ab32b9c7d1a2c856549e2a',
 runtime:'7d59fb55294f7cea4e4cbf8a7cd6ed81a366f68313f89c7df4e51146f8e799ed',
 witness:'e0111f0617593e3568b4113931baf2ecf809ff268cf7942d5abe7d896e73aebd',
 pack:'d7ed62192b6d764603ffc5f33bc615697a47443d9b65962740a23cc4eb73e72e',
 authored:'a3c182897ba6c1ec5d932267f7ac77c4f458e581d6b948b2ac788b6e23c62b4f',
 compileReceipt:'f4740036d43e4f190c7b6fd3410367c321e124f64d854ccb95b1c6fa439d45a9',
 nativeReceipt:'836eff2f826a9c51fdeb6ad43d585cd2505006d054d347c41c150c826b9e56c5',
 ast:'6a3251bd2149395941c01702ea9fa9ac4e224bdb18b9f82d8a9ec005a305d084',
 scope:'07b81344e6d7cc3a4b87deb93ab90ec75f6ddf6ddeee3662ab556b18eacc36d5'
});
const LOCK=Object.freeze({
 host:'8279c39650675b0e0b3482de12ca76f504b10de078bc0261fc3ad59fb9f6452e',
 director:'816d03aa8f5a58abfaa2d348d51cee7c76c0b77c7193f74ee16ff433df18c95c',
 barrier:'96c4232decab6f33b84be84b5eb005c72992748eaa596ad49fd6f90feb67bfa0',
 sharedReticle:'74a38da6837f3805c13a09bb90adcf6550063706d2e59bdaef47e10a36aa0ec7'
});
const one=(s,f,k)=>unique(query(s,f),k).node;
const fun=(s,k)=>one(s,n=>n.type==='FunctionDeclaration'&&ident(n.id,k),k);
const variable=(s,k)=>one(s,n=>n.type==='VariableDeclarator'&&ident(n.id,k),k);
const exact=(b,{html,app,bytes})=>{
 const p=splitHtml(b);assert.deepEqual({html:sha(b),app:sha(p.app),bytes:b.length},{html,app,bytes});return p;
};
const guard=(p,h)=>{const b=read(p);assert.equal(sha(b),h,'exact '+p);return b;};
function swap(s,a,b,k){
 const i=s.indexOf(a);assert.ok(i>=0&&i===s.lastIndexOf(a),k);
 return s.slice(0,i)+b+s.slice(i+a.length);
}
const slots=n=>variable(n,'cartridges').init.arguments[0];
const cohort=values=>'const COHORT=new Set(['+values.map(x=>"'"+x+"'").join(',')+']);';
const turnRule=/pos\.y\+=\.039;pos\.addScaledVector\(forward,\.10\);/;
const opticalRule=/new T\.PerspectiveCamera\(row\.lens,l\.aspect,\.10,l\.far\)/;
const inBody=(f,k)=>unique(f.body.body.filter(n=>n.type==='FunctionDeclaration'&&ident(n.id,k)),k+' exact local body');

async function cartridge(base,root,current,sharedHost,sharedDirector){
 const p=join(root,'standalone-breakwater'),compiler=join(p,'tools/compile-breakwater.mjs');
 const refPath=join(p,'out/breakwater-private-v2.html');
 const ref=exists(refPath)?guard(refPath,DONOR.html):null;
 const receipt=JSON.parse(guard(join(p,'out/compile-v2.json'),DONOR.compileReceipt));
 const native=JSON.parse(guard(join(p,'qa/frozen-breakwater-v2-receipt.json'),DONOR.nativeReceipt));
 const aperture=JSON.parse(guard(join(p,'art/breakwater-cue2-horizon-audit.json'),'9cbce9763ff8048649d62d29d851c7d1e17c1407914b647cc5737705b413bacf'));
 assert.equal(native.id,'spas12');assert.equal(native.compiledNativeCases,9);
 assert.equal(native.artifact.sha256,receipt.sha256);assert.equal(native.artifact.correctedBase,BASE.html);
 assert.equal(native.independentSampledAppearance.disposition,'PASS');
 assert.equal(native.cue2ExactScope.actualCorrectedSourceSHA,DONOR.authored);
 assert.equal(native.cue2ExactScope.exactNonCueFrameReferences,202);
 assert.equal(native.cue2ExactScope.optionalFrameReferences,24);
 assert.equal(native.cue2ExactScope.exactRigidShapesAndBaseSkinIndexColors,true);
 for(const [k,v] of Object.entries({mainFirstDraws:1138,mainAcceptedFirst:13,observedOriginalHeldActCount:1,horizonDrawsInAimLoop:308,actualMeshSamples:12}))
  assert.equal(native.actual[k],v,k);
 assert.deepEqual(native.actual.phasedRuntime.map(x=>x.realUnits),[2,1,7]);
 assert.ok(native.actual.phasedRuntime.every(x=>x.visiblePalmSeats.every(y=>y.visibleSeated>y.precedingAccepted)));
 assert.equal(aperture.revision,'cue2');assert.equal(aperture.actualHeldPoseNoRework,true);
 assert.equal(aperture.testedAimCueSamples,12);
 assert.deepEqual(aperture.samples.map(x=>x.clearInsetRays),Array(12).fill(9));
 guard(compiler,DONOR.compiler);guard(join(p,'tools/breakwater-transport.mjs'),DONOR.transport);
 guard(join(root,'previous-parser/tools/reload-ast.mjs'),DONOR.ast);
 guard(join(root,'scope-barrier/src/first-view-scope.mjs'),DONOR.scope);
 guard(join(p,'src/breakwater-art.mjs'),DONOR.art);guard(join(p,'src/breakwater-runtime.mjs'),DONOR.runtime);
 guard(join(p,'src/phased-witness.mjs'),DONOR.witness);
 const tool=await import(pathToFileURL(compiler).href),rebuilt=tool.compilePilot(base);
 if(ref)assert.ok(rebuilt.html.equals(ref));
 assert.deepEqual(rebuilt.receipt,receipt);
 const {app}=exact(rebuilt.html,DONOR);
 assert.equal(rebuilt.undo.length,19);assert.equal(tool.undoApp(app,rebuilt.undo),splitHtml(base).app);
 const d=variable(parse(app),DONOR.namespace),rt=fun(d,'createBreakwaterRuntime'),embedded=slice(app,d);
 const c=one(d,n=>n.type==='CallExpression'&&ident(n.callee,'createBreakwaterRuntime'),'exact isolated native art constructor');
 assert.deepEqual(c.arguments.map((x,i)=>i===1?x.type:slice(app,x)),
  ['nodes','ObjectExpression','inflate','createBreakwaterArt','createFirstViewScopeBarrier','g=>__vcR16FootJump.air(g)']);
 const rd=moduleBody(guard(join(p,'src/breakwater-art.mjs'),DONOR.art).toString('utf8'),'createBreakwaterArt');
 const wt=moduleBody(guard(join(p,'src/phased-witness.mjs'),DONOR.witness).toString('utf8'),'observeBreakwaterPhase');
 const originalRuntime=moduleBody(guard(join(p,'src/breakwater-runtime.mjs'),DONOR.runtime).toString('utf8'),'createBreakwaterRuntime');
 for(const proof of [rd,wt,originalRuntime])assert.ok(embedded.includes(proof));
 const packed=JSON.parse(guard(join(p,'art/breakwater-delta-carrier.json'),DONOR.pack));
 guard(join(p,'art/breakwater-projected.json'),DONOR.authored);
 const packet=slice(app,c.arguments[1]);
 assert.equal(packet,JSON.stringify(packed));
 assert.equal(packed.internalSHA256,DONOR.authored);
 // This particular decorative marking has its own real open-window branch;
 // keep all eight existing basic reticles and the M700 mask exactly as-is.
 const reticle=slice(current,fun(sharedHost,'scopedReticle'));
 const standReticle=slice(app,fun(d,'scopedReticle'));
 const nativeDraw=slice(app,inBody(rt,'draw'));
 const scenicReticle=swap(standReticle,'function scopedReticle(doc,canvas)','function breakwaterScenicReticle(doc,canvas)','private scenic helper namespace only');
 assert.equal(sha(reticle),LOCK.sharedReticle);
 assert.ok(standReticle.includes(".dataset.vcViewReticle='spas12'"));
 assert.ok(standReticle.includes("token.horizonMark?'open':'off'"));
 assert.ok(nativeDraw.includes('horizonMark:!!p.ads&&s.sample.horizonEligible&&!s.episode&&!s.end'));
 const exactClip=slice(app,variable(d,'clip'));
 assert.equal(exactClip,'clip=(v,a,b)=>Math.max(a,Math.min(v,b))');
 assert.equal(slice(current,variable(sharedHost,'truth')),slice(app,variable(d,'truth')));
 const donorChoose=slice(app,inBody(rt,'choose')),sharedChoose=slice(current,inBody(sharedDirector,'choose'));
 for(const source of [donorChoose,sharedChoose]){
   assert.match(source,turnRule);assert.match(source,opticalRule);
   assert.ok(source.includes("head=g.player?.getObjectByName('head')"));
   assert.ok(source.includes("c.near=.10;c.far=l.far;c.updateProjectionMatrix();c.updateMatrixWorld(true);"));
 }
 const motion=slice(app,inBody(rt,'goal')),clearance=slice(app,inBody(rt,'sweep'));
 let motionSource=swap(swap(motion,'function goal(s,intent,dt,now){','function goal(s,intent,dt,now,recordsAsset){',
   'explicit passive art context'),'truth(s.field)','truth(()=>s.field?.ownerRead?.()?.state())','read the exact existing native owner snapshot including phase');
 assert.equal(motionSource.split('s.bodyCue').length,5);
 motionSource=motionSource.replaceAll('s.bodyCue','s.breakwaterBodyCue');
 motionSource=swap(motionSource,'const a=intent?1:0','if(s.breakwaterPendingNativeCut)return null;\n   const a=intent?1:0','retire before next chosen world lens, not retroactive');
 const measure=fun(d,'makeMeshes'),meshSource=slice(app,measure);
 const returns=unique(measure.body.body.filter(n=>n.type==='ReturnStatement'&&n.argument?.type==='ObjectExpression'),'one staged layer method table');
 const at=returns.argument.end-measure.start-1;
 assert.ok(meshSource.slice(0,at).endsWith(',\n '));
 const mesh=meshSource.slice(0,at)+'show(){layer.visible=true;},'+meshSource.slice(at);
 assert.equal(swap(mesh,'show(){layer.visible=true;},','','visibility-only adapter'),meshSource);
 const oldRecord=inBody(rt,'nativeRecord');
 const from=unique(oldRecord.body.body.filter(n=>n.type==='VariableDeclaration'&&n.declarations.some(v=>ident(v.id,'now'))),'donor native read-only observer');
 let body=app.slice(from.start,oldRecord.body.end-1);
 body=swap(body,'const now=g.elapsed,edge=','const edge=','already shared game clock');
 body=swap(body,'s.lastAccepted=','s.breakwaterLastAccepted=','scoped diagnostics only');
 assert.equal(body.split('s.bodyCue').length,4);
 body=body.replaceAll('s.bodyCue','s.breakwaterBodyCue');
 body=swap(body,'s.pendingNativeCut=true','s.breakwaterPendingNativeCut=true','scoped deferred visual retirement');
 const observer='(s,g,event,now,recordsAsset,samePrepared,cut)=>{\n'+body+'}';
 const decode=slice(app,variable(d,'decode')),donorInflate=slice(app,variable(d,'inflate'));
 assert.equal(packed.rawBytes,7067460);
 const inflate=swap(donorInflate,'p.rawBytes>7200000','p.rawBytes!==7067460','strict SPAS12-only exact decoded byte bound');
 const code=['(()=>{',rd,wt,mesh,scenicReticle,'const '+exactClip+';','const '+decode+';','const '+inflate+';','const pack='+packet+';',
   'return Object.freeze({ownSample:true,preStage:true,visualAnchor:"pulse",makeMeshes,clearance:'+clearance+',',
   'scenicHUD:breakwaterScenicReticle,afterRight:s=>{s.breakwaterBodyCue=null;},motion:recordsAsset=>{const pick='+motionSource+';return (s,intent,dt,now)=>pick(s,intent,dt,now,recordsAsset);},record:'+observer+',',
   'load:()=>inflate(pack).then(x=>createBreakwaterArt(x.data,x.decode))});','})()'].join('\n');
 parse('const row='+code);
 return {code,proof:{html:DONOR.html,compileReceipt:DONOR.compileReceipt,nativeReceipt:DONOR.nativeReceipt,
   artifact:DONOR.pack,authored:DONOR.authored,mesh:sha(meshSource),motion:sha(motion),optic:sha(donorChoose),wholeObserver:sha(wt),
   clearance:sha(clearance),recordAdapter:sha(observer),physicalPayloadVerbatim:true,donorInverseExact:true,independentScenicReticle:sha(standReticle),decodedBytes:7067460,onlyThisLoaderBoundTightened:true}};
}
export function reverseNine(candidate,{from,until,before,after}){
 const p=splitHtml(candidate);
 assert.equal(sha(p.app.slice(from,until)),after);
 assert.equal(sha(before),LOCK.host);
 const restored=Buffer.from(p.before+p.app.slice(0,from)+before+p.app.slice(until)+p.after);
 exact(restored,EIGHT);return restored;
}
export async function buildNine(eight,base,{workspace}){
 const s=exact(eight,EIGHT);exact(base,BASE);
 const tree=parse(s.app),host=variable(tree,prefix),current=slice(s.app,host);
 const director=fun(host,'createSharedFirstView'),barrier=fun(host,'createFirstViewScopeBarrier'),registry=slots(host);
 const directorText=slice(s.app,director),barrierText=slice(s.app,barrier),registryText=slice(s.app,registry);
 assert.deepEqual([sha(current),sha(directorText),sha(barrierText)],[LOCK.host,LOCK.director,LOCK.barrier]);
 assert.deepEqual(registry.properties.map(x=>x.key.name),COHORT.slice(0,8));
 const {code,proof}=await cartridge(base,workspace,s.app,host,director);
 const changes=[
  ["id==='mini14')?cartridges[id]:null;","id==='mini14'||id==='spas12')?cartridges[id]:null;",'one literal item entry'],
  ["   try{dropHelp(s);}catch{}s.helpStamp=null;","   if(s.mount?.id==='spas12'){\n      s.breakwaterLastAccepted=null;s.breakwaterLastCut={why,seq:s.lastSerial};s.breakwaterBodyCue=null;s.breakwaterPendingNativeCut=false;s.lastCustomDiagnostic='spas12';\n   }\n   try{dropHelp(s);}catch{}s.helpStamp=null;",'phased intent and epoch retire only for literal SPAS12'],
  ["   if(q.f.id==='mini14'){s.cypressLastAccepted=s.cypressLastCut=s.cypressBodyCue=null;}","   if(q.f.id==='mini14'){s.cypressLastAccepted=s.cypressLastCut=s.cypressBodyCue=null;}\n   if(q.f.id==='spas12'){s.breakwaterLastAccepted=s.breakwaterLastCut=s.breakwaterBodyCue=null;s.breakwaterPendingNativeCut=false;}",'no stale phases on fresh SPAS12'],
  ["result===false&&(mount.id==='usp'||mount.id==='glock18'||mount.id==='mini14')","result===false&&(mount.id==='usp'||mount.id==='glock18'||mount.id==='mini14'||mount.id==='spas12')",'failed draw retires matching optional ticket'],
  ["(layout||mount.id==='usp'||mount.id==='glock18'||mount.id==='mini14')&&s.mount===mount","(layout||mount.id==='usp'||mount.id==='glock18'||mount.id==='mini14'||mount.id==='spas12')&&s.mount===mount",'native exception preserved while retiring selected ticket'],
  ["if(mount.id==='mini14')token.openingMark=!!p.ads&&s.sample.windowEligible&&!s.episode&&!s.end;","if(mount.id==='mini14')token.openingMark=!!p.ads&&s.sample.windowEligible&&!s.episode&&!s.end;\n            if(mount.id==='spas12')token.horizonMark=!!p.ads&&s.sample.horizonEligible&&!s.episode&&!s.end;",'same projected lens event and pinned SPAS12 scenic cue, never a separate direction'],
  [":d==='mini14'?{lastAccepted:s.cypressLastAccepted,lastCut:s.cypressLastCut,bodyCue:s.cypressBodyCue?{...s.cypressBodyCue}:null}:{}),reload:",":d==='mini14'?{lastAccepted:s.cypressLastAccepted,lastCut:s.cypressLastCut,bodyCue:s.cypressBodyCue?{...s.cypressBodyCue}:null}:d==='spas12'?{lastAccepted:s.breakwaterLastAccepted,lastCut:s.breakwaterLastCut,pendingNativeCut:s.breakwaterPendingNativeCut,bodyCue:s.breakwaterBodyCue?{...s.breakwaterBodyCue}:null}:{}),reload:",'scoped phased diagnostics only']
 ];
 let nextDirector=directorText;
 for(const [a,b,k] of changes)nextDirector=swap(nextDirector,a,b,k);
 let inv=nextDirector;
 for(const [a,b,k] of changes.toReversed())inv=swap(inv,b,a,k+' inverse');
 assert.equal(inv,directorText);
 const scope=variable(host,'COHORT');
 assert.equal('const '+slice(s.app,scope)+';',cohort(COHORT.slice(0,8)));
 const nextRows=registryText.slice(0,-1)+',spas12:'+code+'}';
 assert.equal(nextRows.slice(0,nextRows.indexOf(',spas12:'+code))+'}',registryText);
 let formed=swap(current,directorText,nextDirector,'one shared director instance');
 formed=swap(formed,cohort(COHORT.slice(0,8)),cohort(COHORT),'one shared scope allowlist');
 formed=swap(formed,registryText,nextRows,'one new cabinet slot');
 const app=s.app.slice(0,host.start)+formed+s.app.slice(host.end),tree2=parse(app),h2=variable(tree2,prefix);
 const after=slots(h2).properties,d2=fun(h2,'createSharedFirstView');
 assert.deepEqual(after.map(x=>x.key.name),COHORT);
 assert.equal(slice(app,fun(h2,'createFirstViewScopeBarrier')),barrierText);
 assert.equal(sha(slice(app,fun(h2,'scopedReticle'))),LOCK.sharedReticle);
 assert.deepEqual(after.slice(0,8).map(x=>slice(app,x)),registry.properties.map(x=>slice(s.app,x)),'previous all eight cartridges byte-exact');
 assert.equal(app.slice(0,h2.start),s.app.slice(0,host.start));assert.equal(app.slice(h2.end),s.app.slice(host.end));
 assert.equal(query(tree2,n=>ident(n,DONOR.namespace)).length,0);
 assert.equal(query(h2,n=>n.type==='CallExpression'&&slice(app,n)==='g.renderer.render(g.scene,p.camera)').length,1);
 for(const name of ['bindField','bindLook','seed','determine','contextMenu','right','choose','prepare','samePrepared',
   'worldLensForNative','visualNativeCue','nativeRecord','needsNativeTick','displayLens','helpBounds','failedHelpDraw']){
   assert.equal(slice(app,inBody(d2,name)),slice(s.app,inBody(director,name)),name+' original authority');
 }
 const fixed=t=>t.body[0].expression.callee.body,old=fixed(tree),fresh=fixed(tree2);
 for(const name of ['Hs','XA','wi','createFieldDriver','createShowroomUI','createArmoryRuntime','createSession']){
   assert.equal(slice(app,fun(fresh,name)),slice(s.app,fun(old,name)),name+' original bytes');
 }
 for(const name of ['G0','__vcR17FullOwnerReload','__vcR14DesktopLook','__vcR15ArmoryReplacement','__vcR15ShopMap']){
   assert.equal(slice(app,variable(fresh,name)),slice(s.app,variable(old,name)),name+' original bytes');
 }
 const field=fun(fresh,'createFieldDriver');
 const fieldBinding=one(field,n=>n.type==='CallExpression'&&slice(app,n)==='__vcPrivateSharedFirstView.bindField(g,()=>{const q=s.state();return {id,active:q.active,allowed:holding()&&focused(),ready:q.draw<=1e-8,reload:q.reload}},()=>s)','native field pointer and public readiness projection');
 assert.equal(fieldBinding.arguments.length,3);
 const nativePhaseSnapshot='state(){return {active:mode,preferred,pending:queued,loaded,reserve,draw,reload:remaining,phase,cycle,recoil,yaw:aimTime>0?aimYaw:null,pitch:aimTime>0?aimPitch:0,aim:mode?(1-draw/p.equip):0,reloadPose:reloadPose()};}';
 const phasedState=one(fresh,n=>n.type==='Property'&&n.method&&ident(n.key,'state')&&slice(app,n)===nativePhaseSnapshot,'native phase read-only snapshot');
 assert.equal(phasedState.value.body.body[0].type,'ReturnStatement');
 for(const w of ['s.reloadNow()','s.tick(dt)','s.fire()','audition.play(id)','fx.ray.setFromCamera(fx.ndc,vcNativeViewLens)'])
   assert.equal(query(field,n=>n.type==='CallExpression'&&slice(app,n)===w).length,1,w);
 const html=Buffer.from(s.before+app+s.after),undo={from:h2.start,until:h2.end,before:current,after:sha(formed)};
 assert.ok(reverseNine(html,undo).equals(eight));
 exact(html,REBASED);
 return {html,undo,receipt:{schema:'vc-r17-private-inline-nine-breakwater-v1',base:BASE,eight:EIGHT,scope:COHORT,nativeThirdTitles:47,
   sha256:sha(html),app:sha(app),bytes:html.length,authored:DONOR.authored,breakwater:proof,
   oldEightByteExact:true,oneSharedHostOneExistingFieldOwner:true,exactInverseToEight:true,inline:true,
   shopQueueNativeOutsideHostExact:true,edits:changes.map(x=>x[2])}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [eight,base,workspace,out,receipt]=process.argv.slice(2);assert.ok(eight&&base&&workspace&&out&&receipt);
 const x=await buildNine(read(eight),read(base),{workspace:resolve(workspace)});
 write(out,x.html,{mode:0o600,flag:'wx'});write(receipt,JSON.stringify(x.receipt,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(x.receipt.sha256,x.receipt.app,x.receipt.bytes);
}
