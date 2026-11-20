import assert from 'node:assert/strict';
import test from 'node:test';
import {createTouchLayout} from '../src/touch-layout.mjs';
const l=createTouchLayout();
const samples=[[568,320,0,0],[667,375,0,0],[844,390,47,21],[932,430,50,21],[1024,768,0,20],[320,568,0,20],[390,844,0,34],[428,926,0,34],[768,1024,0,20]];
function usable(rects,b){
 const arr=Object.entries(rects);
 for(const [id,r] of arr){
  assert.ok(r.x-r.w/2>=5.99&&r.y-r.h/2>=5.99&&r.x+r.w/2<=b.w-5.99&&r.y+r.h/2<=b.h-5.99,id);
  assert.ok(r.w>=44&&r.h>=44,id);
  for(const [other,o] of arr)if(id!==other)assert.ok(!l.clashes(r,o,4.999),id+' vs '+other);
 }
}
for(const [w,h,cut,home] of samples)test('safe thumb arcs, line of sight, nonoverlap '+w+'×'+h,()=>{
 const b=l.box(w,h,{left:cut,right:cut,bottom:home}),wide=l.aspect(b)==='wide';
 for(const mode of ['walk','drive']){
  const r=l.solve(mode,b,l.empty());usable(r,b);
  const main=r[mode==='walk'?'touchFire':'gasKey'],left=r[mode==='walk'?'moveStick':'left'];
  assert.ok(b.w-main.x-main.w/2 >= (wide?39:26));assert.ok(b.h-main.y-main.h/2>=30);
  assert.ok(left.x-left.w/2 >=(wide?36:25));assert.ok(b.h-left.y-left.h/2 >=28);
  const clear={x:b.w*.72,y:b.h*.38,w:b.w*(wide?.35:.38),h:b.h*(wide?.20:.24)};
  for(const [id,p] of Object.entries(r))assert.ok(!l.clashes(p,clear,0),'free look crossed by '+id);
  if(mode==='drive')assert.ok(main.x-main.w/2-(r.brakeKey.x+r.brakeKey.w/2)>=8);
 }
 const armed=l.solve('walk',b,l.empty()),unarmed=l.solve('walk',b,l.empty(),false);
 assert.equal(armed.touchFire.x,unarmed.touchGun.x);assert.equal(armed.touchFire.y,unarmed.touchGun.y);
 assert.equal(unarmed.touchFire,undefined);
});
test('each orientation and mode isolated; corrupt, max-size and out-of-bounds values cannot hide controls',()=>{
 for(const [w,h] of [[320,568],[667,375],[844,390],[390,844]]){
  const b=l.box(w,h),aspect=l.aspect(b),p=l.empty();
  for(const m of ['walk','drive'])for(const id of l.ids[m])p[m][aspect][id]={x:-322,y:122,s:499};
  const v=l.clean(p);for(const m of ['walk','drive'])usable(l.solve(m,b,v),b);
  assert.ok(!Object.keys(v.walk[aspect==='wide'?'tall':'wide']).length);
 }
 const raw=l.empty();raw.walk.wide.touchFire={x:NaN,y:0,s:'2'};
 raw.walk.wide.inject={x:3};assert.deepEqual(l.clean(raw),l.empty());
 assert.deepEqual(l.read(()=>{throw Error('denied')}),l.empty());
 assert.equal(l.write(()=>{throw Error('quota')},raw),false);
 const mem=new Map(),s=()=>({getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v)});
 raw.drive.wide.gasKey={x:.6,y:.73,s:1.2};assert.ok(l.write(s,raw));
 assert.deepEqual(l.read(s).drive.wide.gasKey,raw.drive.wide.gasKey);
 assert.deepEqual([...mem.keys()],[l.key]);mem.set(l.key,'{bad');assert.deepEqual(l.read(s),l.empty());
});
