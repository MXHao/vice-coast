import assert from 'node:assert/strict';
import {angle,footInput,pilot} from './pilot.mjs';
export const SAVE='vice-coast-drive-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const hypot=(a,x,z)=>Math.hypot(a.x-x,a.z-z);
const vehicle=c=>[c.type,c.color,c.mesh.position.toArray(),c.yaw,c.index,c.roadSpeed??null,c.wait,c.mesh.visible];
function pose(g){
 return {pos:g.pos.toArray(),yaw:g.yaw,bodyYaw:g.player.rotation.y,camera:g.camera.position.toArray(),
  cameraMode:g.camMode,car:g.cars.indexOf(g.car),money:g.money,story:g.story.snapshot(),
  heat:g.heat,cars:g.cars.map(vehicle),walkers:g.walkers.map(w=>[w.mesh.position.toArray(),w.dir,w.pace,w.mesh.visible])};
}
function setKeys(g,keys){
 g.keys.clear();
 if(keys[0]==='!KeyF')g.toggleVehicle();
 else if(keys[0]==='!KeyC')g.view();
 else for(const k of keys)g.keys.add(k);
}
function artObject(o){
 for(let p=o;p;p=p.parent)if(p.name.startsWith('VICE COAST R12 | '))return true;
 return false;
}
export function geometry(g){
 const result={groups:[],meshes:0,triangles:0};
 for(const group of g.scene.children.filter(x=>x.name.startsWith('VICE COAST R12 | '))){
  const d={name:group.name,rootChildren:group.children.length,meshes:0,triangles:0};
  group.traverse(o=>{
   if(!o.isMesh)return;
   const a=o.geometry?.attributes?.position;if(!a)return;
   assert.ok(a.array.every(Number.isFinite),'Nonfinite geometry in '+group.name);
   assert.ok(o.position.toArray().every(Number.isFinite),'Nonfinite art transform');
   const tris=(o.geometry.index?.count??a.count)/3*(o.count??1);
   d.meshes++;d.triangles+=tris;
  });
  assert.ok(group.visible);
  result.groups.push(d);result.meshes+=d.meshes;result.triangles+=d.triangles;
 }
 return result;
}
export function cityFixture(f){
 const p=pilot(), snapshots=[];let w,lastTime=-Infinity,keySignature='';
 w=f.newGame({hud:()=>{
  const g=w?.game;if(!g)return;
  const s={x:g.pos.x,z:g.pos.z,yaw:g.yaw,t:w.elapsed()/1000,
    v:Math.round(Math.abs(g.speed)*3.6)/3.6*(g.speed<-.2?-1:1),foot:!g.car,heat:g.heat};
  if(s.t-lastTime>.45){snapshots.push(pose(g));lastTime=s.t;}
  const keys=p.update(s),sig=keys.join(',');
  if(sig!==keySignature){keySignature=sig;setKeys(g,keys);}
 }});
 const g=w.game;const blocks=clone(g.blocks);assert.equal(blocks.length,275);
 assert.equal(g.cars.length,17);
 let impacts=0;const original=g.chassis.impact.bind(g.chassis);
 g.chassis.impact=(...a)=>{impacts++;return original(...a);};
 g.story.suspend();g.save();g.setPaused(false);
 for(let i=0;i<8700&&p.snap().mode!=='done';i++)w.delta(1000/60);
 const route=p.snap();
 assert.equal(route.mode,'done');assert.equal(route.goals,25);
 assert.equal(route.marks.length,13);assert.equal(route.footMarks.length,5);
 assert.equal(impacts,0);assert.ok(route.driven>790&&route.driven<860);assert.ok(route.walked>85);
 g.save();
 return {trace:{route,snapshots,final:pose(g),blocks,impacts},art:geometry(g)};
}
export function campaignFixture(f){
 const w=f.newGame(),g=w.game,markers=[],visited=new Set(),dt=1000/60;
 const point=()=>[g.pos.x,g.pos.z];
 function step(keys=[]){setKeys(g,keys);w.delta(dt);visited.add(g.story.stage);if(g.story.failed)throw Error('Failed chapter '+g.story.stage+' at '+point());}
 function stop(){for(let k=0;k<240&&Math.abs(g.speed)>.01;k++)step(['Space','KeyS']);for(let k=0;k<12;k++)step(['Space']);}
 function drive(points){
  assert.ok(g.car);
  for(const [x,z,r=3] of points){
   let k=0;
   for(;k<2500;k++){
    const d=hypot(g.pos,x,z);if(d<=r)break;
    const a=angle(Math.atan2(g.pos.x-x,g.pos.z-z)-g.yaw);
    const v=Math.min(12,Math.max(3.5,d*.68),Math.max(3.6,12-Math.abs(a)*12));
    const err=a-.31*g.chassis.yawRate,keys=[];
    if(err>.05)keys.push('KeyA');else if(err<-.05)keys.push('KeyD');
    if(g.speed<v-.5)keys.push('KeyW');else if(g.speed>v+.65)keys.push('KeyS');
    step(keys);
   }
   assert.ok(k<2500,'No drive route to '+[x,z]+' from '+point()+' at '+g.story.stage);
  }
 }
 function walk(points){
  assert.ok(!g.car);
  for(const [x,z,r=.85] of points){
   let k=0;
   for(;k<1900;k++){
    const p=g.pos,d=hypot(p,x,z);if(d<=r)break;
    step(footInput({x:p.x,z:p.z,yaw:g.walkAngle},[x,z],d>3));
   }
   assert.ok(k<1900,'No foot route to '+[x,z]+' from '+point()+' at '+g.story.stage);
   for(let j=0;j<16;j++)step();
  }
 }
 function mark(n){
  const entry=[n,point(),g.story.stage,g.money,pose(g)];markers.push(entry);
  if(process.env.R12_QA_VERBOSE)console.error(JSON.stringify(entry.slice(0,4)));
 }
 function nearDoor(){
  const c=g.lastVehicle,p=c.mesh.position;
  const cs=Math.cos(c.yaw),sn=Math.sin(c.yaw),side=g.pos.x>=p.x?1:-1;
  const x=p.x+side*cs*1.85,z=p.z-side*sn*1.85;
  if(hypot(g.pos,x,z)>3.5)walk([[x,z,1.08]]);
  g.toggleVehicle();assert.equal(g.car,c);
 }
 g.story.resume();mark('start');
 drive([[90.45,65,4],[90.45,59,2.7]]);stop();assert.equal(g.story.stage,1);
 g.toggleVehicle();assert.ok(!g.car);walk([[g.pos.x,Math.min(g.pos.z-4,56)],[102.8,56],[102.8,58.8,1.65]]);
 assert.ok(g.story.interact());assert.equal(g.story.stage,2);assert.equal(g.money,350);
 mark('met Lola');g.save();const conversation=f.storage.get(SAVE);
 // Reload the actual earned first-chapter save without synthesizing one.
 const r=f.newGame().game;assert.equal(r.story.stage,2);assert.equal(r.money,350);
 assert.equal(r.pos.x,g.pos.x);assert.equal(r.pos.z,g.pos.z);
 f.storage.set(SAVE,conversation);
 const lolaCar=g.lastVehicle.mesh.position;
 const lolaBypass=Math.min(lolaCar.z-4.0,55);
 walk([[g.pos.x,lolaBypass],[lolaCar.x-1.9,lolaBypass],[lolaCar.x-1.9,lolaCar.z,1.15]]);
 nearDoor();drive([[90.4,10],[90.4,-18],[90.4,-41,2.9]]);stop();
 g.toggleVehicle();assert.ok(!g.car);walk([[g.pos.x,g.pos.z-4.1],[97.5,g.pos.z-4.1],[101,-44,1.28]]);
 assert.equal(g.story.stage,3);mark('north seawall');
 g.encounter.equip(true);
 let fire=0;
 for(let k=0;k<2250&&g.story.stage===3;k++){
  const ts=g.encounter.visibleTargets();
  if(ts.length&&g.encounter.cooldown<=0&&!g.encounter.reloading){
   const ammo=g.encounter.ammo;g.encounter.shoot(ts[0].x,ts[0].y);if(g.encounter.ammo<ammo)fire++;
  }
  step(ts.length?[]:k%240<120?['TurnLeft']:['TurnRight']);
 }
 assert.equal(g.story.stage,4,'all three legitimate UI targets hit');
 assert.ok(fire>=3);mark('wharf cleared');
 walk([[104.5,-48],[105.8,-55.6,1.6]]);
 assert.ok(g.story.interact());assert.equal(g.story.stage,5);assert.equal(g.money,1100);mark('retrieved tape');
 const park=g.lastVehicle.mesh.position;
 walk([[95.8,g.pos.z],[95.8,park.z,1.2]]);nearDoor();
 drive([[90.4,-72],[90.4,-78,2],[86,-84,2.1],[80,-88,2],[72,-88.35],[40,-88.35],[8,-88.35],[-21,-88.35,2.8]]);
 stop();assert.equal(g.story.stage,6);assert.ok(g.story.remaining>0);
 g.toggleVehicle();
 // The player exits on the road side; go around the west bumper, not through the car.
 walk([[-25.4,g.pos.z,1],[-25.4,-92.4,1],[-24.4,-93.7,1.15]]);
 assert.ok(g.story.interact());assert.ok(f.panels.includes('broadcast'));mark('broadcast choice');g.save();
 const endgame=f.storage.get(SAVE);
 const endings=[];
 for(const n of ['voices','names']){
  // The 'finish' call is exactly the UI ending action on an actually played save.
  f.storage.set(SAVE,endgame);
  const finish=f.newGame().game;
  assert.equal(finish.story.stage,6);assert.ok(finish.story.interact());
  finish.story.finish(n);assert.equal(finish.story.stage,7);assert.equal(finish.money,2500);
  finish.story.finish(n==='voices'?'names':'voices');
  assert.equal(finish.money,2500);assert.equal(finish.story.ending,n);finish.save();
  const completed=f.newGame().game;
  assert.equal(completed.money,2500);assert.equal(completed.story.ending,n);
  endings.push({id:n,bytes:f.storage.get(SAVE),final:pose(completed)});
 }
 return {trace:{markers,visited:[...visited],fire,endings},art:geometry(g)};
}
export function runScenario(f,scenario){
 const r=(scenario==='route'?cityFixture:campaignFixture)(f);
 assert.deepEqual(f.errors,[],'No art failure or prohibited graphics access');
 return {scenario,trace:r.trace,art:r.art,saveTrace:f.trace,notes:f.notes,panels:f.panels,
  sound:f.soundCalls,counters:f.counters(),dataImages:f.imageURLs.size};
}
