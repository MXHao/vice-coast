import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build,sourcesFor} from '../build.mjs';
import {sha,splitHtml} from '../tools/ast.mjs';
import {R13_ARTIFACT} from '../tools/versions.mjs';
import {ROAD_COLLISION_ARTIFACT} from '../tools/road-solids-splices.mjs';
import {R14_CORE_ARTIFACT} from '../tools/r14-core-lock.mjs';
import {qualityCandidate} from '../tools/quality-candidate.mjs';
import {touchCandidate} from '../tools/touch-candidate.mjs';
import {touchProjection} from '../tools/touch-fixture.mjs';

const v=await readFile(new URL('../vendor/R11.html',import.meta.url));
const b=build(v,await sourcesFor('r14-core'));
const layers=['road-solids-','desktop-look-','quality-','touch-'];
const clearLayers=leave=>{
 const {before,app,after}=splitHtml(b.candidate);
 let js=Buffer.from(app);
 for(const p of b.metadata.insertions.toReversed()){
  if(!layers.some(x=>p.id.startsWith(x))||p.id.startsWith(leave))continue;
  assert.equal(sha(js.subarray(p.startByte,p.endByte)),p.sha256);
  js=Buffer.concat([js.subarray(0,p.startByte),js.subarray(p.endByte)]);
 }
 return Buffer.concat([Buffer.from(before),js,Buffer.from(after)]);
};

test('joined, byte-locked R14 core independently strips to each approved bundle and exact R13',async()=>{
 assert.deepEqual(b.metadata.candidate,R14_CORE_ARTIFACT);
 assert.equal(b.metadata.insertions.length,31);
 assert.equal(sha(clearLayers('none-')),R13_ARTIFACT.sha256);
 assert.equal(sha(clearLayers('road-solids-')),ROAD_COLLISION_ARTIFACT.sha256);
 assert.equal(sha(clearLayers('desktop-look-')),'7e5c4397c0324552287c2a4a93fb58ac051d99b9dbbf01e14d1c7b0da2445ac1');
 assert.ok(clearLayers('quality-').equals(await qualityCandidate()));
 assert.ok(clearLayers('touch-').equals(await touchCandidate()));
});

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,a+' vs '+b);
test('exact compiled desktop look applies a single bounded relative stream, cancels, and safely releases and reacquires',()=>{
 const f=touchProjection(b.candidate)({coarse:false}),game=f.probe.game;
 f.play({yaw:.7},false);
 const button=f.get('vc-desktop-look'),canvas=f.get('canvas');
 const request=()=>button.emit('click',{pointerType:'mouse'});
 const mouse=(x,y,extra={})=>f.docEvent.emit('mousemove',{target:canvas,pointerType:'mouse',movementX:x,movementY:y,...extra});
 assert.ok(button);assert.equal(f.world.lockRequests,0);
 mouse(40,40);close(game.orbit,0);
 request();assert.equal(f.world.lockRequests,1);assert.equal(f.doc.pointerLockElement,canvas);
 const gate=()=>f.probe.hold.call(game);
 assert.equal(gate(),true);
 mouse(1e11,1e11);close(game.orbit,-96*.0035);close(game.pitch,96*.0105);
 mouse(-1e11,-1e11);close(game.orbit,0);close(game.pitch,0);
 for(const [x,y] of [[19,-15],[-19,15],[4,3],[-4,-3],[1,-14],[-1,14]])mouse(x,y);
 close(game.orbit,0);close(game.pitch,0);
 // A burst with nonzero net rotation between camera ticks must be processed,
 // not discarded merely because its event directions kept reversing.
 for(const [x,y] of [[9,-4],[-6,3],[2,5]])mouse(x,y);
 close(game.orbit,-5*.0035);close(game.pitch,4*.0105);
 mouse(-5,-4);close(game.orbit,0);close(game.pitch,0);
 assert.equal(game.car.yaw,.7);
 canvas.emit('pointermove',{pointerType:'mouse',clientX:90,clientY:72});close(game.orbit,0);
 request();assert.equal(f.world.lockRequests,1,'Repeated button action cannot double acquire');
 const esc=f.win.emit('keydown',{code:'Escape',pointerType:'mouse'});
 assert.ok(esc.stopped);assert.equal(f.doc.pointerLockElement,null);
 assert.equal(f.probe.current(),'');assert.equal(game.paused,false);
 f.win.emit('keyup',{code:'Escape'});
 mouse(55,34);close(game.orbit,0);close(game.pitch,0);
 request();assert.equal(f.world.lockRequests,2);assert.equal(gate(),true);
 mouse(17,5);close(game.orbit,-17*.0035);close(game.pitch,5*.0105);
 f.world.focus=false;mouse(55,5);close(game.orbit,-17*.0035);
 f.win.emit('blur');assert.equal(f.doc.pointerLockElement,null);assert.equal(gate(),false);
 f.world.focus=true;mouse(-10,-10);close(game.orbit,-17*.0035);
 request();assert.equal(gate(),true);
 f.probe.open('pause');assert.equal(f.doc.pointerLockElement,null,'Actual compiled pause releases pointer lock');
 f.pick('action','vcq-open');assert.equal(f.probe.current(),'graphics');
 assert.equal(f.doc.pointerLockElement,null,'Settings cannot re-acquire pointer lock');
});

test('actual combined compact pause, graphics selector and thumb-layout editor coexist without save drift or trapping input',()=>{
 const store=new Map([['vice-coast-drive-v1','untouched synthetic progress']]);
 const f=touchProjection(b.candidate)({coarse:true,storage:store}),game=f.probe.game;
 f.play({yaw:0},false);
 const ratio=[],maps=[],shadow={mapSize:{x:4096,y:4096,set(x,y){this.x=x;this.y=y;maps.push([x,y]);}},
  dispose(){},map:{},mapPass:null};
 const renderer={setPixelRatio:x=>ratio.push(x),shadowMap:{}};
 const g=f.probe.quality;
 assert.equal(g.bindRenderer(renderer,2.5),2.5);
 let snap=4096;g.bindSun(renderer,{castShadow:true,shadow},4096,x=>{snap=x});
 f.tap(f.get('pause'));assert.equal(f.probe.current(),'pause');
 assert.ok(f.panel.innerHTML.includes('vcq-open')&&f.panel.innerHTML.includes('vc-hud-open'));
 f.pick('action','vcq-open');assert.equal(f.probe.current(),'graphics');
 f.pick('action','vcq-smooth');
 assert.deepEqual(ratio,[1]);assert.deepEqual(maps,[[1024,1024]]);assert.equal(snap,1024);
 assert.equal(store.get('vice-coast-graphics-v1'),'smooth');
 f.pick('action','vcq-high');assert.deepEqual(ratio,[1,2.5]);assert.deepEqual(maps.at(-1),[4096,4096]);
 f.pick('action','close');assert.equal(f.probe.current(),'pause');
 f.pick('action','vc-hud-open');assert.equal(f.probe.current(),'vc-hud');
 assert.equal(f.doc.pointerLockElement,null);assert.equal(f.world.lockRequests,0);
 f.probe.close();assert.equal(f.probe.current(),'pause');
 assert.ok(f.panel.innerHTML.includes('vcq-open')&&f.panel.innerHTML.includes('vc-hud-open'));
 f.pick('action','resume');assert.equal(f.probe.current(),'');assert.equal(game.paused,false);
 const gas=f.get('gasKey');gas.emit('pointerdown',{pointerId:91,clientX:5,clientY:5});
 assert.ok(f.probe.keys.has('KeyW'));gas.emit('pointerup',{pointerId:91});assert.ok(!f.probe.keys.has('KeyW'));
 assert.equal(store.get('vice-coast-drive-v1'),'untouched synthetic progress');
 assert.equal(store.get('vc-touch-layout-v1'),undefined,'Opening settings does not rewrite a layout');
});
