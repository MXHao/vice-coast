import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ALIASES,sha,splitHtml,parse,inspectProgram,query,slice,unique,ident} from '../../../tools/ast.mjs';
import {R14_CORE_ARTIFACT} from '../../../tools/r14-core-lock.mjs';
import {ROOM_STYLE} from '../src/interface.mjs';
import {LOADOUT_IDS,TITLE_ORIGINAL_IDS} from '../src/batch-profile.mjs';
import {buildOriginalCueBank} from './title-cue-bank.mjs';
import {bundleStudio} from './bundle-studio.mjs';
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const modules=['adapted-title','phased-loadout','batch-profile','catalog','session','wave1-forms','room','audition','interface','loadout','batch-loadout','held','batch-poses','batch-held','field','runtime'];
const nativeModels='09dfc12d27740e402b2b7304dcdf2ad42487ce1c723f76594e1a3d772242ec9e';
const name='__vcR15ArmoryReplacement';
const localRead=p=>readFileSync(resolve(here,p),'utf8');
const any=(scope,predicate,label)=>unique(query(scope,predicate),label).node;
const exactly=(app,scope,type,want)=>any(scope,n=>n.type===type&&slice(app,n)===want,want);
const locks={Scene:['Da','isScene'],PerspectiveCamera:['tA','isPerspectiveCamera'],Box3:['ii','isBox3'],
  Raycaster:['$r','this.ray=new vr'],HemisphereLight:['ka','isHemisphereLight'],DirectionalLight:['Po','isDirectionalLight'],PointLight:['Wa','isPointLight']};

function importsAway(src) {
  assert.ok(!/<\/script/i.test(src));
  const allowed=new Set(modules.map(n=>'./'+n+'.mjs'));
  const changes=[];
  for(const v of parse(src,'module').body){
    if(v.type==='ImportDeclaration'){assert.ok(allowed.has(v.source.value));changes.push([v.start,v.end]);}
    if(v.type.startsWith('Export')){assert.equal(v.type,'ExportNamedDeclaration');assert.ok(v.declaration);changes.push([v.start,v.declaration.start]);}
  }
  return changes.toReversed().reduce((s,[a,b])=>s.slice(0,a)+s.slice(b),src);
}

export function compile(base,{probe=false,privateAudio=false}={}){
  assert.equal(base.byteLength,R14_CORE_ARTIFACT.bytes);assert.equal(sha(base),R14_CORE_ARTIFACT.sha256);
  const {before,app,after}=splitHtml(base);assert.equal(sha(app),R14_CORE_ARTIFACT.app);
  const p=inspectProgram(app,false),{tree,inner,ctor,mount,frame,method,declarations,game,render}=p;
  assert.equal(query(tree,n=>ident(n,name)).length,0);
  const map={...ALIASES,...locks};
  for(const [k,[symbol,signature]] of Object.entries(locks)){
    const v=unique(declarations.get(symbol),k);
    assert.equal(v.init.type,'ClassExpression');assert.ok(slice(app,v.init).includes(signature));
  }
  assert.equal(sha(localRead('src/wave1-forms.mjs')),nativeModels);
  const original=buildOriginalCueBank(TITLE_ORIGINAL_IDS);
  assert.ok(!privateAudio,'Owner sounds are not included in this source build');
  let table={},profile,batch;
  assert.ok(Object.keys(original).every(id=>!Object.hasOwn(table,id)));
  table={...table,...original};
  const studio=bundleStudio();
  const sources=modules.map(n=>[n,localRead('src/'+n+'.mjs')]);
  const shim=sources.map(([k,v])=>'\n// armory '+k+'\n'+importsAway(v)).join('\n');
  const bound='{'+Object.entries(map).map(([k,[v]])=>k+':'+v).join(',')+'}';
  const edit=[],add=(id,at,text)=>edit.push({id,at,text}),around=(id,node,open,close)=>{add(id+'-left',node.start,open);add(id+'-right',node.end,close);};
  add('detached-armory',inner.start+1,'\nconst '+name+'=(()=>{'+shim+'\nreturn createArmoryRuntime('+JSON.stringify(table)+','+(profile?JSON.stringify(profile):'TITLE_PROFILE')+','+studio.source+','+(batch?JSON.stringify(batch):'BATCH_FALLBACK')+');\n})();\n');
  exactly(app,ctor,'VariableDeclaration','let c=pd();');
  const nativeArm=any(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'Lr'),'native hand pose solver');
  assert.equal(nativeArm.params.length,10);
  assert.match(slice(app,nativeArm),/^function Lr\(A,t,e,n,i,r,s,o,c,a=!1\)/);
  add('native-bind',mount.node.start,name+'.bind(this,c,{THREE:'+bound+',doc:document,storage:localStorage,playing:()=>typeof IA!=="undefined"&&!IA&&!!document.body?.classList.contains("playing"),floor:(x,z)=>vs(x,z)??.025,openMenu:k=>XA(k),rig:v=>Q0.get(v),pose:hi,solveArm:(arm,side,p,pitch,yaw,roll,mix)=>Lr(arm,side,p.x,p.y,p.z,pitch,yaw,roll,mix)}),');
  const sav=exactly(app,method('save'),'CallExpression','localStorage.setItem(Rw,JSON.stringify(n))');
  const originalTry=any(method('save'),n=>n.type==='TryStatement'&&n.start<sav.start&&n.end>sav.end,'native storage commit');
  add('native-save-boundary',originalTry.start,';if('+name+'.onSave(this,n))return;');
  const live=exactly(app,frame,'IfStatement','if(!this.live)return;');
  add('exclusive-room-frame',live.end,'if('+name+'.frame(this,t)){this.last=t;requestAnimationFrame(this.frame);return;}');
  const sceneAction=any(inner,n=>n.type==='CallExpression'&&slice(app,n)==='ne.story.interact()','native story keyboard priority');
  const touchAction=any(inner,n=>n.type==='ChainExpression'&&slice(app,n)==='ne?.story.interact()','native story touch priority');
  for(const [label,n] of [['native-E',sceneAction],['native-touch-interact',touchAction]])around(label,n,'(','||'+name+'.act(ne))');
  const route=exactly(app,inner,'IfStatement','if(__vcR14Touch.keydown(A))return;');
  add('native-keydown-after-touch-editor',route.end,'if('+name+'.onKey(ne,A))return;');
  const up=any(inner,n=>n.type==='CallExpression'&&n.arguments?.[0]?.value==='keyup'&&slice(app,n).startsWith('addEventListener("keyup",A=>'),'global native keyup');
  add('native-keyup',up.arguments[1].body.start+1,name+'.onKey(ne,A,true);');
  const blurCall=exactly(app,inner,'CallExpression','addEventListener("blur",()=>ne?.clearInput())');
  const blur=blurCall.arguments[1].body;assert.equal(blur.type,'ChainExpression');
  around('native-blur',blur,'('+name+'.onBlur(ne),',')');
  const menu=any(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'XA'),'native pause and editors');
  add('native-menu-priority',menu.body.start+1,name+'.leaveForMenu(ne);');
  assert.ok(slice(app,menu).includes('e.innerHTML=n'));
  add('owned-switch-only-in-native-pause',menu.body.end-1,name+'.inventory(ne,A,e,()=>wi(),()=>IA==="pause");');
  // Qualified optional loadout only. Every release handler routes toward the
  // same guarded SDK-local S0 entrypoint; no changes in encounter saves or gait data.
  const encounter=any(inner,n=>n.type==='VariableDeclarator'&&ident(n.id,'S0'),'stock encounter');
  const shoot=any(encounter.init.body,n=>n.type==='MethodDefinition'&&n.key.name==='shoot','stock encounter action');
  assert.equal(slice(app,shoot.value.params[0]),'t');assert.equal(slice(app,shoot.value.params[1]),'e');
  const shootVar=exactly(app,shoot,'VariableDeclaration','let i=this.g;');
  add('owned-virtual-action',shootVar.end,'if('+name+'.fire(i,t,e))return;');
  const step=method('step');assert.equal(slice(app,step.value.params[0]),'t');
  add('owned-simulation-tick',step.value.body.start+1,name+'.tick(this,t);');
  assert.equal(render.parent.type,'SequenceExpression');
  add('owned-post-story-art-priority',render.node.start,name+'.presentWorld(this),');
  const pause=exactly(app,method('setPaused'),'AssignmentExpression','this.paused=t');
  add('owned-native-pause',pause.end,','+name+'.onPause(this,t)');
  const walk=method('walk');
  const armedArms=query(walk,n=>n.type==='MemberExpression'&&slice(app,n)==='l.armed');
  assert.equal(armedArms.length,6);
  for(const [i,{node}] of armedArms.entries())around('owned-walk-'+i,node,'('+name+'.holding(this)||',')');
  const yaw=exactly(app,walk,'ConditionalExpression','l.fireYaw!==null&&l.quiet<.75?l.fireYaw:this.walkAngle');
  around('owned-walk-yaw',yaw,name+'.yaw(this,',')');
  const pose=any(walk,n=>n.type==='CallExpression'&&n.callee.name==='hi'&&slice(app,n.arguments[0])==='this.player','native player pose');
  around('owned-walk-pose',pose.arguments[3],name+'.pose(this,',')');
  const cameraArmed=exactly(app,method('setCamera'),'ChainExpression','this.encounter?.armed');
  around('owned-camera-shoulder',cameraArmed,'('+name+'.holding(this)||',')');
  const state=any(method('state'),n=>n.type==='Property'&&n.key.name==='combat','native HUD combat projection');
  around('owned-hud-projection',state.value,name+'.combat(this,',')');
  const hud=any(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'Hs'),'native HUD renderer');
  const label=any(hud,n=>n.type==='AssignmentExpression'&&slice(app,n.left)==='Wt("ammoState").textContent','native ammo label');
  around('owned-hud-label',label.right,'(o.drawing>0?"装备中":o.normalizedWait>0?"恢复中":o.loadoutId&&!o.reload?'+name+'.hudName(o.loadoutId):(', '))');
  for(const [label,condition] of [['native-unlocked',exactly(app,ctor,'MemberExpression','this.encounter.armed')]])around('owned-'+label,condition,'('+name+'.holding(this)||',')');
  const desktop=query(inner,n=>n.type==='ChainExpression'&&slice(app,n)==='game.encounter?.armed');
  assert.equal(desktop.length,2); // original locked reticle and original completed mouse press
  for(const [i,{node}] of desktop.entries())around('owned-desktop-'+i,node,'('+name+'.holding(game)||',')');
  // Preserve legacy input behavior (undefined stamp); a scoped normalized
  // action must be eligible at both the start and end of the same gesture.
  const mouse=any(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'mouseButton'),'exact locked mouse handler');
  add('adapted-locked-scoped-state',mouse.start,'let vcArmoryMouseStamp;');
  const press=exactly(app,mouse,'AssignmentExpression','shotPressed=true');
  around('adapted-locked-down',press.right,'(vcArmoryMouseStamp='+name+'.pressStamp(game),vcArmoryMouseStamp!==null&&',')');
  const release=exactly(app,mouse,'IfStatement','if(shoot&&!game.car&&game.encounter?.armed)game.encounter.shoot();');
  add('adapted-locked-up',release.test.start,name+'.pressStamp(game)===vcArmoryMouseStamp&&');
  const drag=any(ctor,n=>n.type==='AssignmentExpression'&&slice(app,n.left)==='this.drag'&&n.right.type==='ObjectExpression','native canvas drag press');
  add('adapted-canvas-down',drag.right.end-1,',vcTitleStamp:'+name+'.pressStamp(this)');
  const cleanDrag=exactly(app,ctor,'LogicalExpression','!this.drag.moved&&this.drag.button===0');
  around('adapted-canvas-up',cleanDrag,'(this.drag.vcTitleStamp!==null&&this.drag.vcTitleStamp==='+name+'.pressStamp(this)&&',')');
  const touchRoot=any(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'Xw'),'exact touch gesture family');
  const tap=any(touchRoot,n=>n.type==='FunctionDeclaration'&&ident(n.id,'f')&&n.params.length===2&&slice(app,n.params[0])==='u'&&slice(app,n.params[1])==='d','native bindTap');
  add('adapted-compact-optional-arg',tap.params[1].end,',vcStamp');
  add('adapted-compact-stamp',tap.body.start+1,'let vcDown,vcStart=false;function vcEligible(detail){if(!vcStamp)return true;const now=vcStamp();return now===undefined&&vcDown===undefined||now!==null&&(!detail||vcStart&&now===vcDown);}');
  const listener=e=>any(tap,n=>n.type==='CallExpression'&&n.arguments?.[0]?.value===e&&n.callee.property?.name==='addEventListener','native bindTap '+e);
  add('adapted-compact-down',listener('pointerdown').arguments[1].body.start+1,'if(vcStamp&&!r.has(u)){vcDown=vcStamp();vcStart=true;}');
  const finish=any(tap,n=>n.type==='FunctionDeclaration'&&ident(n.id,'g'),'native bindTap release');
  const invokeTap=exactly(app,finish,'CallExpression','d()');
  around('adapted-compact-up',invokeTap,'(vcEligible(true)&&',')');
  add('adapted-compact-click',listener('click').arguments[1].body.start+1,'if(vcStamp){const allowed=vcEligible(!!p.detail);vcDown=undefined;vcStart=false;if(!allowed)return;}');
  const fireTap=exactly(app,inner,'CallExpression','Ri.bindTap(Wt("touchFire"),()=>ne?.encounter.shoot(null,null,!0))');
  add('adapted-only-fire-tap',fireTap.end-1,',()=>'+name+'.pressStamp(ne)');
  for(const [label,player,probe] of [
    ['equip','ne.encounter.equip(!ne.encounter.armed)','CallExpression'],
    ['equip','ne?.encounter.equip(!ne.encounter.armed)','ChainExpression'],
    ['reload','ne.encounter.reload()','CallExpression'],
    ['reload','ne?.encounter.reload()','ChainExpression']
  ])around('owned-'+label+'-'+probe,exactly(app,inner,probe,player),'('+name+'.'+label+'(ne)||',')');
  if(probe)add('offline-probe',game.node.body.end-1,'__vcArmoryProbe(){return {...'+name+'.probe(this),mountDesktop:(d,w)=>__vcR14DesktopLook.mount(this,d,w),fieldEquip:()=>'+name+'.equip(this),fieldReload:()=>'+name+'.reload(this),fieldPressStamp:()=>'+name+'.pressStamp(this),inventoryForFixture:(menu,panel,close,ready)=>'+name+'.inventory(this,menu,panel,close,ready)}}');
  edit.sort((a,b)=>a.at-b.at);
  let cursor=0,formed='';const undo=[];
  for(const a of edit){assert.ok(a.at>=cursor);formed+=app.slice(cursor,a.at);const start=formed.length;formed+=a.text;undo.push({id:a.id,start,end:formed.length,sha256:sha(a.text)});cursor=a.at;}
  formed+=app.slice(cursor);
  parse(formed);
  const restored=undo.toReversed().reduce((s,v)=>{assert.equal(sha(s.slice(v.start,v.end)),v.sha256);return s.slice(0,v.start)+s.slice(v.end);},formed);
  assert.equal(restored,app);
  const style='<style id="vc-armory-replacement-style">'+ROOM_STYLE+'</style>';
  const split=before.indexOf('</head>');assert.ok(split>0);assert.equal(before.lastIndexOf('</head>'),split);
  const changedHead=before.slice(0,split)+style+before.slice(split);
  assert.ok(Buffer.from(changedHead.slice(0,split)+changedHead.slice(split+style.length)+restored+after).equals(base));
  return {html:Buffer.from(changedHead+formed+after),splicePlan:{app:edit,head:{at:split,text:style}},manifest:{basis:R14_CORE_ARTIFACT,kind:'private R15 56 authored previews, 56 narrow game loadouts',scoped:undo.map(o=>o.id),probe,privateAudio,studio:studio.pin,modules:Object.fromEntries(sources.map(([n,c])=>[n,sha(c)]))}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const flags=new Set(process.argv.slice(2));assert.ok([...flags].every(k=>k==='--probe'||k==='--private-audio'));
  const base=readFileSync(resolve(here,'../vice_r14_restore_19025bd/out/r14-core/index.html'));
  const out=compile(base,{probe:flags.has('--probe'),privateAudio:flags.has('--private-audio')});
  const tag=(out.manifest.privateAudio?'private-synth':'source-only')+(out.manifest.probe?'-probe':'');
  mkdirSync(resolve(here,'out'),{recursive:true});
  writeFileSync(resolve(here,'out',tag+'.html'),out.html,{mode:0o600});
  const meta={...out.manifest,artifactSHA256:sha(out.html),bytes:out.html.length};
  writeFileSync(resolve(here,'out',tag+'.json'),JSON.stringify(meta,null,2)+'\n',{mode:0o600});
  console.log(tag,meta.artifactSHA256,meta.scoped.length);
}
