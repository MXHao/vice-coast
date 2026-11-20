import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {desktopLookPatches} from '../tools/desktop-look-patches.mjs';
import {createDesktopLook} from '../src/desktop-look.mjs';
import {inspectProgram,parse,PIN,sha,splitHtml} from '../tools/ast.mjs';

class Endpoint {
 constructor(){this.listeners=[];this.attrs={};this.hidden=false;this.style={};this.isConnected=true;}
 addEventListener(type,fn,capture=false){this.listeners.push({type,fn,capture});}
 removeEventListener(type,fn,capture=false){
  this.listeners=this.listeners.filter(x=>!(x.type===type&&x.fn===fn&&x.capture===capture));
 }
 emit(type,data={}){
  const e={type,target:this,isTrusted:true,stopped:false,prevented:false,
   stopImmediatePropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...data};
  for(const h of this.listeners.filter(h=>h.type===type).toSorted((a,b)=>Number(b.capture)-Number(a.capture))){
   h.fn(e);if(e.stopped)break;
  }
  return e;
 }
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k];}
 remove(){this.removed=true;}
}
function simulator({fine=true,supported=true,playing=true,mode='accept',driving=true}={}){
 const win=new Endpoint(),doc=new Endpoint(),canvas=new Endpoint(),media=new Endpoint();
 const toolbar=new Endpoint(),pause=new Endpoint();pause.parentNode=toolbar;
 let now=1000,focus=true,livePlaying=playing,steps=0,exits=0,focuses=0,nativeEsc=0,nativeMap=0,nativeSpace=0;
 const timers=new Map(),controls={},shots=[];
 toolbar.insertBefore=(node,ref)=>{assert.equal(ref,pause);controls.button=node;};
 doc.body={classList:{contains:key=>key==='playing'&&livePlaying},append:node=>{controls.reticle=node;}};
 doc.getElementById=k=>k==='top'?{querySelector:s=>s==='.tools'?toolbar:null}:k==='pause'?pause:null;
 doc.createElement=()=>new Endpoint();doc.hasFocus=()=>focus;doc.pointerLockElement=null;doc.hidden=false;
 const change=(owner)=>{doc.pointerLockElement=owner;doc.emit('pointerlockchange');};
 doc.exitPointerLock=()=>{exits++;change(null);};
 win.matchMedia=q=>{assert.equal(q,'(pointer: fine) and (hover: hover)');return media;};
 media.matches=fine;win.performance={now:()=>now};
 win.setTimeout=(fn)=>{let token=Symbol();timers.set(token,fn);return token;};
 win.clearTimeout=id=>{timers.delete(id);};
 let call;
 if(supported)canvas.requestPointerLock=()=>{
  steps++;
  if(mode==='throw')throw Error('API blocked');
  if(mode==='promise-denial')return Promise.reject(Error('Embed denied'));
  if(mode==='error'){doc.emit('pointerlockerror');return;}
  if(mode==='accept')change(canvas);
  if(mode==='delay')return new Promise(r=>{call=()=>{change(canvas);r();};});
 };
 canvas.focus=()=>{focuses++;};
 let captures=0;
 canvas.hasPointerCapture=id=>captures===id;
 canvas.releasePointerCapture=id=>{assert.equal(id,captures);captures=0;canvas.emit('lostpointercapture',{pointerType:'mouse',pointerId:id});};
 const game={renderer:{domElement:canvas},live:true,paused:false,drag:null,orbit:0,pitch:0,walkAngle:0,lookDelay:0,
  car:driving?{yaw:.5}:null,encounter:{armed:!driving,shoot:(...args)=>shots.push(args)},keys:new Set()};
 // Simulate the target-phase behavior of the native handlers, at their same
 // relative ordering, to expose duplicate drag/fire/key dispatch.
 const mouseButton=(type,opts={})=>doc.emit(type,{target:canvas,button:0,...opts});
 const point=(type,opts={})=>{
  const e=canvas.emit(type,{pointerType:'mouse',pointerId:7,button:0,clientX:78,clientY:99,...opts});
  if(!e.prevented&&e.pointerType==='mouse'&&(type==='pointerdown'||type==='pointerup'))
   mouseButton(type==='pointerdown'?'mousedown':'mouseup',{button:e.button,isTrusted:e.isTrusted});
  return e;
 };
 canvas.addEventListener('pointerdown',e=>{if(!game.paused){game.drag={id:e.pointerId};captures=e.pointerId;}});
 canvas.addEventListener('pointermove',()=>{if(game.drag){game.pitch+=.013;}});
 canvas.addEventListener('pointerup',e=>{
   if(game.drag?.id!==e.pointerId)return;
   game.drag=null;
   if(!game.paused&&!game.car&&game.encounter.armed)shots.push([e.clientX,e.clientY]);
 });
 const layer=createDesktopLook();
 const setPaused=(t)=>{
  game.paused=t;if(t)layer.release(game);game.drag=null;game.keys.clear();
 };
 win.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&!e.repeat){nativeEsc++;setPaused(!game.paused);}
  if(['KeyJ','KeyM'].includes(e.code)){nativeMap++;setPaused(true);}
  if(e.code==='Space')nativeSpace++;
  if(e.code==='KeyW')game.keys.add('KeyW');
 });
 layer.mount(game,doc,win);
 return {win,doc,canvas,game,layer,media,point,mouseButton,change,setPaused,shots,controls,timers,
  counts:()=>({steps,exits,focuses,nativeEsc,nativeMap,nativeSpace}),advance:n=>{now+=n;},
  match:flag=>{media.matches=flag;media.emit('change');}, focus:flag=>{focus=flag;},
  playing:flag=>{livePlaying=flag;layer.hold(game);}, resolve:()=>call(),
  request:(opts={})=>controls.button.emit('click',{pointerType:'mouse',button:0,detail:1,...opts}),
  motion:(x,y,opts={})=>doc.emit('mousemove',{movementX:x,movementY:y,...opts})};
}
test('no automatic capture; only the explicit trusted desktop button requests, then driving moves camera not inputs',()=>{
 const f=simulator();
 assert.equal(f.counts().steps,0);
 f.win.emit('keydown',{code:'KeyW'});f.point('pointerdown');f.point('pointermove');f.point('pointerup');
 f.request({isTrusted:false});assert.equal(f.counts().steps,0);
 assert.equal(f.game.orbit,0);assert.ok(f.game.keys.has('KeyW'));
 f.request();
 assert.equal(f.counts().steps,1);assert.equal(f.counts().focuses,1);
 assert.equal(f.layer.hold(f.game),true);assert.equal(f.controls.button.textContent,'Esc 释放');
 assert.equal(f.controls.reticle.hidden,true);assert.equal(f.game.drag,null);
 const oldPitch=f.game.pitch;
 assert.ok(f.point('pointerdown').stopped);assert.ok(f.point('pointermove').stopped);
 f.motion(18,-9);assert.ok(Math.abs(f.game.orbit-(-.063))<1e-12);
 assert.ok(Math.abs(f.game.pitch-(oldPitch-.0945))<1e-12);
 assert.equal(f.game.car.yaw,.5);assert.equal(f.game.walkAngle,0);assert.equal(f.game.lookDelay,2);
 f.win.emit('keydown',{code:'Space',target:f.canvas});
 assert.equal(f.counts().nativeSpace,1,'space handbrake/firing remains native when canvas has focus');
 for(let k=0;k<100;k++)f.motion(-1e9,1e9);
 assert.equal(f.game.pitch,4);assert.ok(Math.abs(f.game.orbit)<=Math.PI);
 for(let k=0;k<100;k++)f.motion(0,-1e9);
 assert.equal(f.game.pitch,-1.35);
 f.motion(Infinity,0);f.motion(0,1,{isTrusted:false});f.motion(50,50,{sourceCapabilities:{firesTouchEvents:true}});
 assert.equal(f.game.pitch,-1.35);
});
test('walk orientation and native centre aim, original relative drag aim only when unlocked',()=>{
 const f=simulator({driving:false});
 f.point('pointerdown');f.point('pointerup');assert.deepEqual(f.shots,[[78,99]]);
 f.request();f.motion(40,15);
 assert.ok(Math.abs(f.game.walkAngle+.14)<1e-12);
 assert.equal(f.game.orbit,0);f.layer.hold(f.game);assert.equal(f.controls.reticle.hidden,false);
 f.point('pointerup');f.point('pointerdown',{button:2});f.point('pointerup',{button:2});
 f.mouseButton('mousedown',{sourceCapabilities:{firesTouchEvents:true}});
 f.mouseButton('mouseup',{sourceCapabilities:{firesTouchEvents:true}});
 assert.equal(f.shots.length,1);
 f.point('pointerdown');f.motion(3,1);f.point('pointerup');
 assert.deepEqual(f.shots,[[78,99],[]]);
 f.point('pointerdown');f.point('pointercancel');f.point('pointerup');
 assert.equal(f.shots.length,2);
 f.mouseButton('mousedown');f.mouseButton('mouseup');
 assert.deepEqual(f.shots,[[78,99],[],[]],'mouse-only Pointer Lock host still aims once');
 f.game.encounter.armed=false;f.layer.hold(f.game);assert.equal(f.controls.reticle.hidden,true);
});
test('Escape releases without menu or ghost input; a second normal Escape and native M/J still open panels',()=>{
 const f=simulator({driving:false});
 f.request();f.point('pointerdown');f.win.emit('keydown',{code:'KeyW'});
 assert.ok(f.win.emit('keydown',{code:'Escape'}).stopped);
 assert.equal(f.doc.pointerLockElement,null);assert.equal(f.game.keys.size,0);assert.equal(f.counts().nativeEsc,0);
 assert.equal(f.layer.hold(f.game),false);
 f.win.emit('keydown',{code:'Escape',repeat:true});
 assert.equal(f.counts().nativeEsc,0);
 f.win.emit('keyup',{code:'Escape'});
 f.win.emit('keydown',{code:'Escape'});assert.equal(f.counts().nativeEsc,1);assert.equal(f.game.paused,true);
 f.request();assert.equal(f.counts().steps,1,'native menu cannot capture cursor');
 f.setPaused(false);f.request();f.point('pointerup');assert.equal(f.shots.length,0,'stale primary press does not fire after capture resumes');
 f.win.emit('keydown',{code:'KeyM'});assert.equal(f.counts().nativeMap,1);assert.equal(f.doc.pointerLockElement,null);
 f.setPaused(false);f.request();
 f.win.emit('keydown',{code:'KeyJ'});assert.equal(f.counts().nativeMap,2);assert.equal(f.doc.pointerLockElement,null);
});
test('when the browser releases before the keydown, same Escape is consumed, not the next normal press',()=>{
 const f=simulator();f.request();
 f.win.emit('keydown',{code:'KeyW'});f.change(null);
 assert.equal(f.game.keys.size,0);assert.ok(f.win.emit('keydown',{code:'Escape'}).stopped);
 f.advance(160);f.win.emit('keydown',{code:'Escape'});assert.equal(f.counts().nativeEsc,1);
});
test('pending grant invalidation on pause, blur, hidden, page exit or touch',async()=>{
 for(const action of [
  f=>f.setPaused(true),f=>{f.focus(false);f.win.emit('blur');},f=>{f.doc.hidden=true;f.doc.emit('visibilitychange');},
  f=>f.win.emit('pagehide'),f=>f.point('pointerdown',{pointerType:'touch'}),
  f=>f.match(false),f=>f.playing(false)
 ]){
   const f=simulator({mode:'delay'});f.request();assert.equal(f.timers.size,1);
   action(f);assert.equal(f.timers.size,0);
   f.resolve();await Promise.resolve();
   assert.equal(f.doc.pointerLockElement,null);assert.equal(f.layer.hold(f.game),false);
   f.motion(150,100);assert.equal(f.game.orbit,0);assert.equal(f.game.pitch,0);
 }
});
test('unsupported, coarse/touch and denied/timeout hosts retain native drag and left cursor clicks',async()=>{
 const ua=simulator({supported:false});assert.equal(ua.controls.button,undefined);
 ua.point('pointerdown');ua.point('pointermove');assert.equal(ua.game.pitch,.013);
 const coarse=simulator({fine:false});assert.equal(coarse.controls.button.hidden,true);coarse.request();
 assert.equal(coarse.counts().steps,0);
 const touch=simulator();
 touch.controls.button.emit('pointerdown',{pointerType:'touch'});touch.request({pointerType:'touch'});
 assert.equal(touch.counts().steps,0);touch.point('pointerdown',{pointerType:'touch'});touch.point('pointermove',{pointerType:'touch'});
 assert.equal(touch.game.pitch,.013);
 for(const mode of ['throw','promise-denial','error','legacy-silence']){
   const f=simulator({mode,driving:false});f.request();await Promise.resolve();
   if(mode==='legacy-silence')for(const fn of f.timers.values())fn();
   assert.equal(f.layer.hold(f.game),false);assert.equal(f.controls.button.textContent,'拖动可用');
   assert.equal(f.counts().focuses,1);f.point('pointerdown');f.point('pointerup');
   assert.deepEqual(f.shots,[[78,99]]);
 }
 const k=simulator();
 k.win.emit('keydown',{code:'Enter',target:k.controls.button});
 assert.equal(k.doc.pointerLockElement,k.canvas);
});
test('pin exact source anchors and verify no native bytes are removed, even with other same-position hooks',()=>{
 const src=readFileSync(new URL('../src/desktop-look.mjs',import.meta.url),'utf8');
 const vendor=readFileSync(new URL('../vendor/R11.html',import.meta.url));
 const {app,before,after}=splitHtml(vendor);
 assert.equal(sha(vendor),PIN.html);
 const original=inspectProgram(app),ps=desktopLookPatches({app,original,source:src});
 assert.equal(ps.length,4);
 let at=0,formed='';const undo=[];
 for(const p of ps.toSorted((a,b)=>a.at-b.at)){
   formed+=app.slice(at,p.at);at=p.at;
   undo.push([formed.length,p.text.length]);formed+=p.text;
 }
 formed+=app.slice(at);parse(formed);
 for(const [a,b] of undo.toReversed())formed=formed.slice(0,a)+formed.slice(a+b);
 assert.ok(Buffer.from(before+formed+after).equals(vendor));
 assert.throws(()=>desktopLookPatches({app:app+' ',original,source:src}),/exact original/);
 assert.throws(()=>desktopLookPatches({app,original,source:src.replace('const states=','globalThis.x=0;const states=')}),/injected browser/);
});
