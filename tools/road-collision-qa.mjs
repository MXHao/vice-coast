// Actual G0.drive in exact pinned source. Setup positions/commands are
// synthetic and private. The huge-step tests override only proposed motion,
// not contact logic or rendering. No real browser/graphics or user saves.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadWorld} from './fixture.mjs';
import {sha} from './ast.mjs';
import {R13_ARTIFACT} from './versions.mjs';
import {ROAD_COLLISION_ARTIFACT} from './road-solids-splices.mjs';
import {R14_CORE_ARTIFACT} from './r14-core-lock.mjs';
import {SAVE} from './scenarios.mjs';

const [aFile,bFile,layout]=process.argv.slice(2);
assert.ok(aFile&&bFile&&['desktop','compact'].includes(layout));
const [a,b]=await Promise.all([readFile(aFile),readFile(bFile)]);
assert.equal(sha(a),R13_ARTIFACT.sha256);
assert.ok([ROAD_COLLISION_ARTIFACT.sha256,R14_CORE_ARTIFACT.sha256].includes(sha(b)));
const worlds=[a,b].map(bytes=>loadWorld(bytes,{compact:layout==='compact'}));
const [baseline,fix]=worlds.map(f=>f.newGame().game);
assert.equal(JSON.stringify(baseline.blocks),JSON.stringify(fix.blocks));
assert.equal(fix.blocks.length,275);
assert.equal(fix.walkers.length,25);
const impacts=new WeakMap();
for(const g of [baseline,fix]){
 const f=g.chassis.impact.bind(g.chassis), log=[];
 impacts.set(g,log);
 g.chassis.impact=(...args)=>{log.push(args);return f(...args);};
}
const dt=1/60;
const [E,W,N,S]=[-Math.PI/2,Math.PI/2,0,Math.PI];
const pos=g=>Array.from(g.car.mesh.position.toArray());
function place(g,x,z,yaw,speed,keys){
 g.car=g.hero;g.lastVehicle=g.car;g.car.mesh.position.set(x,.025,z);
 g.car.yaw=yaw;g.car.mesh.rotation.y=yaw;
 g.chassis.reset(yaw);
 g.speed=speed;g.steer=0;g.heat=0;g.cooldown=0;g.keys.clear();
 for(const k of keys)g.keys.add(k);
 impacts.get(g).length=0;
}
function play(g,setup,frames,stop){
 place(g,...setup);
 for(let n=0;n<frames;n++){
  g.drive(dt);
  if(stop&&stop(pos(g)))break;
 }
 return {pos:pos(g),speed:g.speed,impacts:impacts.get(g).length,heat:g.heat};
}
function huge(g,x,z,yaw,dx,dz){
 place(g,x,z,yaw,0,[]);
 const advance=g.chassis.advance;
 try{
  g.chassis.advance=()=>({x:x+dx,z:z+dz,speed:10});
  g.drive(dt);
 }finally{g.chassis.advance=advance;}
 return {pos:pos(g),speed:g.speed,impacts:impacts.get(g).length};
}
const results={layout,baseline:sha(a),fix:sha(b),cases:{}};
const failures=[];
const check=(assertions,label)=>{try{assertions()}catch(e){failures.push(label+': '+e.message);}};
for(const {id,init,frames,cross,hold} of [
 {id:'Ocean Drive masonry planter',init:[94,68.8,E,9,['KeyW']],frames:72,cross:p=>p[0]>103.3,hold:p=>p[0]<98.72},
 {id:'park masonry planter',init:[-143.1,176,S,9,['KeyW']],frames:75,cross:p=>p[2]>187.3,hold:p=>p[2]<183.1},
 {id:'park fountain basin',init:[-55,-42,E,12,['KeyW']],frames:74,cross:p=>p[0]>-40.7,hold:p=>p[0]<-48.29},
 {id:'thin bus shelter post head-on',init:[98.08,121.7,S,12,['KeyW']],frames:64,cross:p=>p[2]>130.25,hold:p=>p[2]<127.60},
 {id:'promenade timber guardrail',init:[107.5,50,E,11,['KeyW']],frames:64,cross:p=>p[0]>116.3,hold:p=>p[0]<112.84},
 {id:'reverse with steering toward rail',init:[112.05,50,W,-7.4,['KeyS','KeyA']],frames:48,cross:p=>p[0]>115.4,hold:p=>p[0]<113.15},
]){
 const old=play(baseline,init,frames,cross),next=play(fix,init,frames);
 results.cases[id]={old,next};
 check(()=>{
 assert.ok(cross(old.pos),id+' reproduces: '+JSON.stringify(old));
 assert.ok(hold(next.pos),id+' now blocks: '+JSON.stringify(next));
 assert.ok(next.impacts>=1&&old.impacts===0,id+' native impact feedback');
 assert.equal(next.heat,0,'static post does not trigger police');
 },id);
}
{
 const args=[106,52,0,26,8],old=huge(baseline,...args),next=huge(fix,...args);
 results.cases.fastDiagonalSlide={old,next};
 check(()=>{assert.ok(old.pos[0]>130&&next.pos[0]<114.15&&next.pos[2]>59.9);
 assert.equal(old.impacts,0);assert.equal(next.impacts,1);},'fastDiagonalSlide');
 const argsPole=[98.08,121.5,S,0,9.5],oldPole=huge(baseline,...argsPole),nextPole=huge(fix,...argsPole);
 results.cases.fastThinPost={oldPole,nextPole};
 check(()=>{assert.ok(oldPole.pos[2]>130.8&&nextPole.pos[2]<127.60,JSON.stringify({oldPole,nextPole}));
 assert.equal(nextPole.impacts,1);},'fastThinPost');
}
{
 const p=[91,36.93,E,12,['KeyW']];
 // Stop before a separate original blocker farther along the sidewalk.
 const pass=xyz=>xyz[0]>101.5;
 const old=play(baseline,p,64,pass),next=play(fix,p,64,pass);
 check(()=>{assert.ok(pass(old.pos)&&pass(next.pos)&&next.pos[2]<36.3,JSON.stringify({old,next}));
 assert.equal(old.impacts,0);assert.equal(next.impacts,1);},'grazingPost');
 results.cases.grazingPostDeflectsWithoutSnag={old,next};
}
for(const [id,p] of [
 ['clearance along guardrail from 25 mm', [114.10,43,N,7,['KeyW']]],
 ['real opening between rail segments',[107.5,0,E,8,['KeyW']]]
]){
 const old=play(baseline,p,70),next=play(fix,p,70);
 check(()=>{assert.deepEqual(next,old,id);
 assert.equal(next.impacts,0,id);
 if(id.includes('opening'))assert.ok(next.pos[0]>116.3,id);},id);
 results.cases[id]={old,next};
}
place(baseline,115.30,50,E,0,[]);
baseline.save();const saved=worlds[0].storage.get(SAVE);
worlds[1].storage.set(SAVE,saved);
const restored=worlds[1].newGame().game;
const before=pos(restored);assert.equal(before[0],115.30);assert.equal(before[2],50);
assert.equal(worlds[1].storage.get(SAVE),saved,'Loading never rewrites saved car');
restored.keys.add('KeyW');
let last=before,maxStep=0;
for(let i=0;i<125;i++){
 restored.drive(dt);
 const p=pos(restored);maxStep=Math.max(maxStep,Math.hypot(p[0]-last[0],p[2]-last[2]));last=p;
}
const after=pos(restored);
assert.ok(after[0]>118.0,'Invalid old overlapping car is allowed to drive out: '+JSON.stringify({before,after}));
assert.ok(maxStep<.55,'Escape only moves through normal per-step velocity');
restored.save();
assert.deepEqual(Object.keys(JSON.parse(worlds[1].storage.get(SAVE))),Object.keys(JSON.parse(saved)),'No new save metadata');
results.legacy={before,after,maxStep,noRewriteOnLoad:true,sameSaveKeys:true};
for(const f of worlds)assert.deepEqual(f.errors,[]);
console.log(JSON.stringify(results,null,2));
assert.deepEqual(failures,[],'Any driving regression fails this probe');
