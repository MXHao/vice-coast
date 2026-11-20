// Composition on the shared exact R14 app, not an edit to either frozen HTML.
// One shared desktop declaration contains two AST-rebound optional-armory
// predicates. Independent reverse variants keep their own controller bytes.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {compile} from './build-replacement.mjs';
import {sha,splitHtml,parse,inspectProgram,query,slice,unique,ident} from '../../../tools/ast.mjs';
import {R14_CORE_ARTIFACT} from '../../../tools/r14-core-lock.mjs';
import {TITLE_ORIGINAL_IDS} from '../src/batch-profile.mjs';
import {buildOriginalCueBank} from './title-cue-bank.mjs';
import {R14_STOCK_TRIPLE} from './stock-r14-lock.mjs';
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const stamp=b=>({sha256:sha(b),bytes:b.length,app:sha(splitHtml(b).app)});
const EPOCH_ROLES=Object.freeze([
 'adapted-locked-scoped-state','adapted-locked-down-left','adapted-locked-down-right','adapted-locked-up'
]);
const isShared=x=>/^owned-desktop-[01]-(left|right)$/.test(x.id)||EPOCH_ROLES.includes(x.id);
const groupTag=probe=>'source-only'+(probe?'-probe':'');

export function weaveApp(app,edits){
 const ordered=edits.toSorted((a,b)=>a.at-b.at), ids=new Set(),ranges=[],pieces=[];
 let cursor=0,bytes=0;
 for(const x of ordered){
   assert.ok(!ids.has(x.id),'Duplicate edit id '+x.id);ids.add(x.id);
   const {at,end=at,text,oldSHA}=x;
   assert.ok(Number.isSafeInteger(at)&&Number.isSafeInteger(end)&&cursor<=at&&end>=at&&end<=app.length,'Edit component overlap '+x.id);
   assert.ok(typeof text==='string'&&text.length>0&&!/<\/script/i.test(text));
   const preimage=Buffer.from(app.slice(at,end));
   assert.equal(sha(preimage),oldSHA??sha(''),'Pinned preimage '+x.id);
   const lead=Buffer.from(app.slice(cursor,at)),add=Buffer.from(text);
   bytes+=lead.length;
   ranges.push({id:x.id,start:bytes,end:bytes+add.length,hash:sha(add),before:sha(preimage),preimage});
   pieces.push(lead,add);bytes+=add.length;cursor=end;
 }
 pieces.push(Buffer.from(app.slice(cursor)));
 return {script:Buffer.concat(pieces),ranges};
}

export function checkedRestore(script,ranges,retain){
 let data=script;
 for(const x of ranges.toReversed()){
  const replacement=retain(x);
  if(replacement===null)continue;
  assert.equal(sha(data.subarray(x.start,x.end)),x.hash,x.id);
  assert.equal(sha(x.preimage),x.before,'Replay original range '+x.id);
  data=Buffer.concat([data.subarray(0,x.start),replacement,data.subarray(x.end)]);
 }
 return data;
}

function composeDesktop(baseApp,stock,existing){
 const old=baseApp.slice(stock.at,stock.end),next=stock.text;
 assert.equal(sha(old),stock.oldSHA);
 assert.equal(existing.length,8);
 const arm='__vcR15ArmoryReplacement';
 function armSites(script){
  const tree=parse(script);
  return query(tree,n=>n.type==='ChainExpression'&&slice(script,n)==='game.encounter?.armed').map(({node,parent})=>({node,parent}));
 }
 const a=armSites(old),b=armSites(next);
 assert.equal(a.length,2);assert.equal(b.length,2);
 assert.equal(b[0].parent.type,'LogicalExpression');
 assert.equal(b[1].parent.type,'LogicalExpression');
 assert.match(next,/const hideAim=!\(active&&!game\.car&&game\.encounter\?\.armed\)/);
 assert.match(next,/if\(shoot&&!game\.car&&game\.encounter\?\.armed\)game\.encounter\.shoot\(\)/);
 const oldArmory=[],newArmory=[];
 for(let k=0;k<2;k++){
  for(const side of ['left','right']){
   const id='owned-desktop-'+k+'-'+side, p=unique(existing.filter(x=>x.id===id),id);
   const edge=side==='left'?'start':'end';
   assert.equal(p.at,stock.at+a[k].node[edge],id+' origin');
   assert.equal(p.text,side==='left'?'('+arm+'.holding(game)||':')',id+' exact word');
   oldArmory.push({id,at:a[k].node[edge],text:p.text});
   newArmory.push({id,at:b[k].node[edge],text:p.text});
  }
 }
 // Rebind the independently pinned B9 gesture epoch, preserving the prior
 // stock ownership and trusted-acquisition checks before the stamped down.
 // Scope the declaration beside mouseButton inside mount. The old boolean
 // remains the teardown/release authority; a leftover stamp alone can't act.
 function epochSites(script){
  const parent=unique(query(parse(script),n=>n.type==='FunctionDeclaration'&&ident(n.id,'mouseButton')),'locked mouse handler');
  const mouse=parent.node;
  assert.equal(parent.parent.type,'BlockStatement');
  const press=unique(query(mouse,n=>n.type==='AssignmentExpression'&&slice(script,n)==='shotPressed=true'),'locked press eligibility').node;
  assert.equal(press.right.type,'Literal');assert.equal(press.right.value,true);
  const release=unique(query(mouse,n=>n.type==='IfStatement'&&slice(script,n)==='if(shoot&&!game.car&&game.encounter?.armed)game.encounter.shoot();'),'exact locked release').node;
  const i=mouse.body.body.indexOf(release);
  assert.ok(i>1);
  assert.equal(slice(script,mouse.body.body[i-1]),'shotPressed=false;');
  assert.equal(slice(script,mouse.body.body[i-2]),'const shoot=shotPressed;');
  return [mouse.start,press.right.start,press.right.end,release.test.start];
 }
 const aEpoch=epochSites(old),bEpoch=epochSites(next);
 const expected=['let vcArmoryMouseStamp;','(vcArmoryMouseStamp='+arm+'.pressStamp(game),vcArmoryMouseStamp!==null&&',')',arm+'.pressStamp(game)===vcArmoryMouseStamp&&'];
 for(const [i,id] of EPOCH_ROLES.entries()){
  const edit=unique(existing.filter(x=>x.id===id),id);
  assert.equal(edit.at,stock.at+aEpoch[i],id+' origin');
  assert.equal(edit.text,expected[i],id+' exact word');
  oldArmory.push({id,at:aEpoch[i],text:edit.text});
  newArmory.push({id,at:bEpoch[i],text:edit.text});
 }
 const armsOld=weaveApp(old,oldArmory).script, armsNew=weaveApp(next,newArmory).script;
 parse(armsOld.toString());parse(armsNew.toString());
 assert.equal(query(parse(armsNew.toString()),n=>ident(n,arm)).length,4,'Two exact ownership wrappers and two press epoch reads');
 return {edit:{...stock,id:'shared-desktop-controller',text:armsNew.toString()}, stockOnly:Buffer.from(next),r15Only:armsOld};
}

export async function buildStockCore({privateAudio=false,probe=false,stockSource=null,privateAudioPath=null}={}){
 assert.ok(!privateAudio&&privateAudioPath===null,'Original owner synth is outside this stock composition scope');
 const stockPath=resolve(stockSource??process.env.VICE_R14_STOCK_SOURCE??resolve(here,'../..'));
 const module=file=>import(pathToFileURL(resolve(stockPath,'tools',file)).href);
 const [{prepareDriveView},{liftVendorInsertions},{maraWardrobeSplices},{MARA_STOCK_SOURCE}]=await Promise.all([
   module('r14-drive-view.mjs'),module('r14-drive-view-wardrobe.mjs'),
   module('mara-wardrobe-splices.mjs'),module('r14-drive-view-wardrobe-lock.mjs')
 ]);
 const {base,vendor,edits}=await prepareDriveView();
 const author=await readFile(resolve(stockPath,'src/mara-wardrobe.mjs'),'utf8');
 assert.equal(sha(author),MARA_STOCK_SOURCE);
 const frozen=splitHtml(vendor).app;
 const stock=[...edits,...liftVendorInsertions(splitHtml(base.candidate).app,frozen,base.metadata.insertions,
   maraWardrobeSplices(frozen,inspectProgram(frozen),author))];
 assert.deepEqual(stamp(base.candidate),R14_CORE_ARTIFACT);
 assert.equal(stock.length,11);
 const {before,app,after}=splitHtml(base.candidate);
 const tag=groupTag(probe), independent=compile(base.candidate,{probe});
 const r15=independent.splicePlan.app;
 const replace=unique(stock.filter(x=>x.id==='desktop-look-controller-replace'),'stock desktop replacement');
 const shared=composeDesktop(app,replace,r15.filter(isShared));
 const stockUnique=stock.filter(x=>x!==replace);
 const r15Unique=r15.filter(x=>!isShared(x));
 const stockIDs=new Set(stockUnique.map(x=>x.id));
 const r15IDs=new Set(r15Unique.map(x=>x.id));
 const out=weaveApp(app,[...stockUnique,...r15Unique,shared.edit]);
 const {at,text}=independent.splicePlan.head;
 assert.equal(before.slice(at,at+'</head>'.length),'</head>');
 assert.ok(text.startsWith('<style id="vc-armory-replacement-style">')&&text.endsWith('</style>'));
 const head=before.slice(0,at)+text+before.slice(at);
 const wrap=(b,h)=>Buffer.concat([Buffer.from(h),b,Buffer.from(after)]);
 const reverse=(replacement,other)=>checkedRestore(out.script,out.ranges,x=>
   x.id===shared.edit.id?replacement:other.has(x.id)?x.preimage:null);
 const r15Only=wrap(reverse(shared.r15Only,stockIDs),head);
 const stockOnly=wrap(reverse(shared.stockOnly,r15IDs),before);
 const original=wrap(checkedRestore(out.script,out.ranges,x=>x.preimage),before);
 assert.ok(r15Only.equals(independent.html),'Removing stock edits recovers exact independent R15');
 assert.deepEqual(stamp(stockOnly),R14_STOCK_TRIPLE,'Removing R15 recovers exact original-Mara fixes');
 assert.ok(original.equals(base.candidate),'Removing both recovers exact R14');
 const source=out.script.toString();
 const tree=parse(source);
 assert.ok(!source.includes('reference-sculpt-1')&&!source.includes('fitMara('));
 assert.equal(source.includes('__vcArmoryProbe(){'),probe);
 const call=unique(query(tree,n=>n.type==='CallExpression'&&ident(n.callee,'createArmoryRuntime')),'clean title factory call').node;
 assert.equal(call.arguments.length,4);
 assert.equal(TITLE_ORIGINAL_IDS.length,12,'Exactly 12 title-original cue IDs');
 const audio=JSON.stringify(buildOriginalCueBank(TITLE_ORIGINAL_IDS));
 assert.equal(slice(source,call.arguments[0]),audio,'Only separately regenerated original title cues; no prior private owner table');
 assert.equal(slice(source,call.arguments[1]),'TITLE_PROFILE','Only authored baseline game profile');
 assert.equal(slice(source,call.arguments[3]),'BATCH_FALLBACK','Only authored game fallback profiles');
 assert.ok(!source.includes('data:audio/'),'No external audio URL or donor attachment');
 const html=wrap(out.script,head),candidate=stamp(html);
 return {html,stockOnly,r15Only,meta:{tag,candidate,basis:R14_CORE_ARTIFACT,stock:R14_STOCK_TRIPLE,
  standaloneR15:sha(independent.html),originalMara:true,probe,privateAudio:false,reversible:true,
  audio:{kind:'title-original',cues:TITLE_ORIGINAL_IDS.length,sha256:sha(audio)},
  sharedController:{oldArmory:sha(shared.r15Only),newStock:sha(shared.stockOnly),merged:sha(shared.edit.text),epochEdits:EPOCH_ROLES},
  edits:out.ranges.map(({preimage,...other})=>other),head:{at,bytes:Buffer.byteLength(text),sha256:sha(text)}}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const opts=new Set(process.argv.slice(2));
 assert.ok([...opts].every(x=>x==='--probe'),'Only the clean title-original build or its private test probe is in scope');
 const probe=opts.has('--probe');
 const {html,meta}=await buildStockCore({probe});
 const dest=resolve(here,'out');
 await mkdir(dest,{recursive:true});
 await writeFile(resolve(dest,'stock-core-'+meta.tag+'.html'),html,{mode:0o600});
 await writeFile(resolve(dest,'stock-core-'+meta.tag+'.json'),JSON.stringify(meta,null,2)+'\n',{mode:0o600});
 console.log(meta.tag,JSON.stringify(meta.candidate));
}
