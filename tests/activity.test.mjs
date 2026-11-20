import test from 'node:test';
import assert from 'node:assert/strict';
import {crew,sites,sampleActivity,sampleCargo,handlerState} from '../src/activity.mjs';
const at=(t,a)=>a.id==='handler'?handlerState(sampleActivity(t,a)):sampleActivity(t,a);
const radius=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
const angled=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
test('small independent non-mission cast, complete paths and two geographically distinct scenes',()=>{
 assert.deepEqual(Object.keys(sites),['market','port']);
 assert.equal(crew.length,6);assert.equal(new Set(crew.map(a=>a.variant)).size,6);
 assert.ok(crew.every(a=>a.variant>0&&Object.hasOwn(sites,a.site)));
 for(const a of crew) {
  assert.equal(a.path[0][0],0);assert.equal(a.path.at(-1)[0],a.period);
  if(a.id!=='handler')assert.deepEqual(a.path[0].slice(1),a.path.at(-1).slice(1));
  assert.ok(a.path.every((p,i)=>p.length===5&&(!i||p[0]>a.path[i-1][0])));
  const values=Array.from({length:Math.ceil(a.period*80)},(_,i)=>at(i/80,a));
  const x=values.map(p=>p.x),z=values.map(p=>p.z),v=values.map(p=>p.pace);
  assert.ok(Math.max(...x)-Math.min(...x)>.15||Math.max(...z)-Math.min(...z)>.15);
  assert.ok(Math.max(...v)>.3&&Math.max(...v)<1.94);
  assert.ok(v.some(p=>p===0));
  assert.ok(values.every(p=>Object.values(p).filter(x=>typeof x==='number').every(Number.isFinite)));
 }
});
test('analytic input-time motion with no boundary snaps or motion at rest',()=>{
 for(const a of crew){
  let p=at(-61,a);
  for(let i=1;i<=19600;i++){
   const q=at(-61+i/100,a);
   assert.ok(radius(p,q)<.020,'root velocity bound '+a.id);
   assert.ok(angled(p.yaw,q.yaw)<.056,'yaw wrap or snap '+a.id);
   assert.ok(angled(p.phase,q.phase)<.17,'gait cycles must not pop '+a.id);
   if(q.pace===0&&p.pace===0)assert.ok(angled(p.phase,q.phase)<1e-5,'stationary phase');
   p=q;
  }
 }
});
test('ordinary foot paths remain separated across independent phases, not just one beauty shot',()=>{
 let min=Infinity;
 for(let i=0;i<40000;i++){
  const t=i*.061;
  const poses=crew.map(a=>at(t,a));
  for(let p=0;p<crew.length;p++)for(let q=p+1;q<crew.length;q++){
   if(crew[p].site!==crew[q].site)continue;
   min=Math.min(min,radius(poses[p],poses[q]));
  }
 }
 assert.ok(min>1.12,String(min));
});
test('crate is lifted, held and set on both legs with no snap at either periodic seam',()=>{
 const driver=crew.find(a=>a.id==='handler'),sample=t=>sampleCargo(sampleActivity(t,driver));
 let row=sample(-50),lift=false,deliver=false;
 for(let i=1;i<16000;i++) {
  const t=-50+i*.0125,next=sample(t);
  assert.ok(radius(row,next)<.025,'crate continuity at '+t);
  assert.ok(next.y>=1.74&&next.y<1.875,'no cut into workbench');
  assert.ok(next.z>194.15&&next.z<198.55,'keep crate on platform');
  if(next.grip>.99){lift|=next.y>1.83;assert.ok(next.w===.52);}
  if(next.grip<.01&&next.z>198)deliver=true;
  row=next;
 }
 assert.ok(lift&&deliver);
 const held=sample(5),pickedAgain=sample(25),left=sample(13),returned=sample(33);
 assert.ok(held.grip>.99&&pickedAgain.grip>.99);
 assert.equal(left.z,198.12);assert.ok(Math.abs(returned.z-194.57)<1e-9);
});
test('visible work timing is staggered; no crowd switches gestures synchronously',()=>{
 const fish=crew.find(a=>a.id==='fish-tender'),buyer=crew.find(a=>a.id==='fish-customer'),worker=crew.find(a=>a.id==='handler');
 const rows=Array.from({length:12000},(_,i)=>[at(i/36,fish),at(i/36,buyer),at(i/36,worker)]);
 assert.ok(rows.some(([f,b,w])=>f.gesture>.45&&b.gesture<.01&&w.carry>.2));
 assert.ok(rows.some(([f,b,w])=>f.gesture<.01&&b.gesture>.43&&w.carry<.01));
});
