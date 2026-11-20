import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {crew,sampleActivity,threshold as c,sampleThreshold as sample} from '../src/activity.mjs';
import {loadWorld} from '../tools/fixture.mjs';
import {build} from '../build.mjs';

const close=(a,b,tol=.000002)=>assert.ok(Math.abs(a-b)<=tol,a+' versus '+b);
const arc=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
test('threshold makes a 3.01m push and pull with a prolonged inspect stop and no cycle snaps',()=>{
 let row=sample(-3*c.period),fwd=false,rev=false,stock=false;
 for(let i=1;i<=20000;i++){
  const s=sample(-3*c.period+i*.011);
  assert.ok(s.x>=c.xWest&&s.x<=c.xEast);
  assert.ok(Math.abs(s.x-row.x)<.013&&arc(s.phase,row.phase)<.17);
  close(s.bodyX-s.x,c.back);close(s.bodyZ,c.z);
  if(s.pace>.02){assert.ok(s.grip>.99);fwd|=!s.backpedal;rev|=s.backpedal;}
  if(s.stock>.9){stock=true;close(s.pace,0);close(s.grip,0);}
  if(s.pace===0&&row.pace===0)assert.ok(arc(s.phase,row.phase)<.000001);
  close((s.wheel-row.wheel)*c.wheel,s.x-row.x);
  row=s;
 }
 assert.ok(fwd&&rev&&stock);
 for(const a of [0,1.1,6.1,10.9,13.7,15.9,17.2,19.78,22.77]){
  const x=sample(a),y=sample(a+4*c.period);for(const k of Object.keys(x))if(typeof x[k]==='number')close(x[k],y[k]);else assert.equal(x[k],y[k]);
 }
});
test('operator and contact hull keep the original street/sidewalk lane and other vignette paths clear',()=>{
 const cast=crew.filter(a=>a.site==='market');
 let personMin=Infinity,hullMin=Infinity;
 for(let i=0;i<=20000;i++){
  const t=i*.066,s=sample(t);
  const halfX=.65,halfZ=c.width*.5+.035;
  assert.ok(s.z-halfZ>12.13&&s.z+halfZ<13.0);
  assert.ok(s.bodyZ-.255>12.24);
  assert.ok(s.bodyX+.29<49.0);
  for(const a of cast){
   const v=sampleActivity(t,a);personMin=Math.min(personMin,Math.hypot(v.x-s.bodyX,v.z-s.bodyZ));
   hullMin=Math.min(hullMin,Math.hypot(Math.max(0,Math.abs(v.x-s.x)-halfX),Math.max(0,Math.abs(v.z-s.z)-halfZ)));
  }
 }
 assert.ok(personMin>1.90,'native-root distance '+personMin);
 assert.ok(hullMin>.51,'native-root to cart hull '+hullMin);
});
test('detached native clone follows same stock-cart body/wheel/handle positions at repeated real authored phases',async()=>{
 const p=name=>new URL('../'+name,import.meta.url);
 const vendor=await readFile(p('vendor/R11.html'));
 const sources=Object.fromEntries(await Promise.all(['bridge','skyline','activity'].map(async a=>[a,await readFile(p('src/'+a+'.mjs'),'utf8')])));
 const {candidate}=build(vendor,sources),f=loadWorld(candidate),{game:g}=f.newGame(),T=f.native;
 const actor=g.scene.getObjectByName('Ambient vignette: market stock mover');
 const cart=g.scene.getObjectByName('Las Olas produce cart');
 assert.ok(actor&&cart);assert.equal(g.walkers.length,25);assert.equal(g.blocks.length,275);
 g.camera.position.set(41.75,2.2,9.42);g.live=true;g.paused=false;g.last=0;
 const wheels=cart.children.filter(a=>a.name==='Grounded produce cart wheel');
 assert.equal(wheels.length,4);
 const wrist=[],stock=[];
 for(const t of [5.5,6.77,7.47,8.82,9.03,10.92,11.43,13.7,14.9,16.2166666667,16.8166666667,19.16,20.4,24.69999,24.70001,32.41,41.23,66.2]){
  g.elapsed=t;g.frame(0);
  const s=sample(t);close(cart.position.x,s.x);close(cart.position.z,s.z);
  close(actor.position.x,s.bodyX);close(actor.position.z,s.bodyZ);
  for(const w of wheels){close(w.rotation.x,s.wheel);close(w.position.y-c.wheel,0);}
  if(s.stock>.96){
   const hand=actor.getObjectByName('handR').getWorldPosition(new T.Vector3());
   const target=new T.Vector3(c.stockX,c.stockY,c.stockZ);
   stock.push(hand.distanceTo(cart.localToWorld(target)));
  }
  for(const side of [-1,1]){
   if(s.grip<.99)continue;
   const hand=actor.getObjectByName(side<0?'handL':'handR').getWorldPosition(new T.Vector3());
   const grip=new T.Vector3(side*c.handleHalf,c.handleY,c.handle);
   cart.localToWorld(grip);wrist.push(hand.distanceTo(grip));
  }
 }
 assert.ok(wrist.length>20);assert.ok(Math.max(...wrist)<.09,'max actual posed grip error '+Math.max(...wrist));
 assert.ok(stock.length>=4);assert.ok(Math.max(...stock)<.075,'raised produce grip distance '+Math.max(...stock));
 assert.deepEqual(f.errors,[]);
});
