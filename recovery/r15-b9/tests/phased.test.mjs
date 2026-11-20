import assert from 'node:assert/strict';
import test from 'node:test';
import {createPhasedLoadout,validatePhaseProfile,createBoundedIncrementalLoadout} from '../src/phased-loadout.mjs';
import {SPAS_STAGE_ID,SPAS_PHASE_STUDY as p} from '../src/deferred-spas.mjs';
import {CATALOG,ITEMS} from '../src/catalog.mjs';
import {LOADOUT_IDS,BATCH_FALLBACK,BATCH7_PHASE_IDS,BATCH7_INTERVAL_ID,validateBatch} from '../src/batch-profile.mjs';
const step=(x,t,dt=.027)=>{while(t>1e-10){const n=Math.min(dt,t);x.tick(n);t-=n;}};
const active=()=>{const c=createPhasedLoadout(p);c.authorize();assert.ok(c.applyOutside(true));step(c,p.equip);return c;};
function take(x,n){for(let j=0;j<n;j++){assert.equal(x.fire(),'shot');step(x,p.cadence);}}
test('the existing four staged or interval titles retain their exact paths in the 56-entry roster',()=>{
 assert.equal(CATALOG.length,56);assert.equal(LOADOUT_IDS.length,56);
 assert.ok(LOADOUT_IDS.includes(SPAS_STAGE_ID));assert.equal(BATCH_FALLBACK[SPAS_STAGE_ID].style,'phased');
 assert.deepEqual(BATCH7_PHASE_IDS,['spas12','xm1014','m37']);assert.equal(BATCH7_INTERVAL_ID,'nova');
 for(const id of ['awma','vector','barrett','mg3silver','gatling','kar98','awm']){
  assert.ok(LOADOUT_IDS.includes(id));assert.equal(BATCH_FALLBACK[id].style,'whole');
 }
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,nova:{...BATCH_FALLBACK.nova,reload:.2}}));
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,xm1014:{...BATCH_FALLBACK.xm1014,style:'incremental'}}));
});
test('lead and settle never transfer virtual units or admit a new action; interval commits precisely one',()=>{
 const x=active();take(x,2);const start=x.state();
 assert.ok(x.reloadNow());assert.equal(x.state().phase,'lead');
 step(x,p.start-.006);assert.equal(x.state().loaded,start.loaded);assert.equal(x.fire(),'busy');
 step(x,.006);assert.equal(x.state().phase,'refill');assert.equal(x.state().loaded,start.loaded);assert.equal(x.reloadNow(),false);
 step(x,p.reload-.006);
 assert.equal(x.state().loaded,start.loaded);step(x,.006);
 assert.equal(x.state().loaded,start.loaded+1);assert.equal(x.state().reserve,start.reserve-1);
 step(x,p.reload);assert.equal(x.state().phase,'settle');assert.equal(x.state().loaded,p.magazine);
 assert.equal(x.state().reserve,start.reserve-2);assert.equal(x.fire(),'busy');
 step(x,p.end);assert.equal(x.state().phase,null);assert.equal(x.fire(),'shot');
});
test('frame overflow is invariant and cosmetic motion remains finite and continuous',()=>{
 const a=active(),b=active();take(a,3);take(b,3);a.reloadNow();b.reloadNow();
 const total=p.start+p.reload*3+p.end;
 for(let n=1;n<=Math.ceil(total/.016);n++){a.tick(.016);const s=a.state();assert.ok(s.reloadPose>=0&&s.reloadPose<=.85);}
 step(b,Math.ceil(total/.016)*.016,.119);
 assert.deepEqual(a.state(),b.state());
 const c=active();take(c,1);c.reloadNow();step(c,p.start-.001);
 const near=c.state().reloadPose;c.tick(.002);assert.ok(Math.abs(c.state().reloadPose-near)<.015);
});
test('interruption before or after a virtual commit neither duplicates nor refills on switch',()=>{
 const a=active();take(a,2);const before=a.state();
 a.reloadNow();step(a,p.start+p.reload-.005);a.holster();assert.equal(a.state().loaded,before.loaded);
 assert.equal(a.toggle(true),'draw');step(a,p.equip);a.reloadNow();
 step(a,p.start+p.reload+.005);a.holster();
 assert.equal(a.state().loaded,before.loaded+1);assert.equal(a.state().reserve,before.reserve-1);
 assert.equal(a.toggle(true),'draw');step(a,p.equip);assert.equal(a.state().loaded,before.loaded+1);
 assert.equal(a.state().phase,null);assert.equal(a.state().pending,false);
});
test('invalid configs and untrusted clock input fail closed without widening previous caps',()=>{
 for(const q of [{reload:.1},{cadence:1.6},{magazine:129},{equip:.1},{start:0},{end:Infinity},{foo:0}])
   assert.throws(()=>validatePhaseProfile({...p,...q}));
 const a=active();take(a,1);a.reloadNow();const x=a.state();
 a.tick(NaN);a.tick(Infinity);a.tick(-5);assert.deepEqual(a.state(),x);
 a.tick(100000);assert.equal(a.state().loaded,x.loaded);assert.equal(a.state().phase,'lead');
});
test('draining virtual reserve stops permanently and cannot conjure supply',()=>{
 const a=active();
 for(let i=0;i<3;i++){
  take(a,p.magazine);
  if(i<2){assert.ok(a.reloadNow());step(a,p.start+p.magazine*p.reload+p.end);}
 }
 assert.equal(a.state().loaded,0);assert.equal(a.state().reserve,0);
 assert.equal(a.reloadNow(),false);assert.equal(a.fire(),'empty');
 step(a,10);assert.equal(a.state().phase,null);assert.equal(a.state().loaded,0);
});

for(const id of [...BATCH7_PHASE_IDS,BATCH7_INTERVAL_ID])test(id+' opted-in virtual refill guard orders exact first commit, recorded stages and deliberate interrupts',()=>{
 const q=BATCH_FALLBACK[id], phased=q.style==='phased',delay=q.start??0,tail=q.end??0;
 const boot=()=>{const c=phased?createPhasedLoadout(q,{allowInterrupt:true}):createBoundedIncrementalLoadout(q);
  c.authorize();assert.ok(c.applyOutside(true));step(c,q.equip);return c;};
 const use=(c,n)=>{for(let j=0;j<n;j++){assert.equal(c.fire(),'shot');step(c,q.cadence);}};
 const a=boot();assert.equal(a.fire(),'shot');assert.ok(a.reloadNow());
 const timing=a.state();assert.equal(timing.phase,phased?'lead':'refill');
 assert.equal(a.fire(),'busy');assert.deepEqual(a.state(),timing);
 const b=boot();use(b,1);assert.ok(b.reloadNow());const lead=b.state();
 assert.equal(b.fire(),'shot');assert.equal(b.state().phase,null);
 assert.equal(b.state().loaded,lead.loaded-1);assert.equal(b.state().reserve,lead.reserve);
 const c=boot();use(c,q.magazine);assert.ok(c.reloadNow());const empty=c.state();
 assert.equal(c.fire(),'busy');assert.deepEqual(c.state(),empty);
 step(c,delay+q.reload-.003);assert.equal(c.state().loaded,0);assert.equal(c.fire(),'busy');
 step(c,.003);assert.equal(c.state().loaded,1);assert.equal(c.state().reserve,empty.reserve-1);
 assert.equal(c.fire(),'shot');assert.equal(c.state().phase,null);assert.equal(c.state().loaded,0);
 const d=boot();use(d,1);d.reloadNow();step(d,delay+q.reload);
 assert.equal(d.state().phase,phased?'settle':null);assert.equal(d.state().loaded,q.magazine);
 const settle=d.state().reserve;if(phased){assert.equal(d.fire(),'shot');assert.equal(d.state().phase,null);}
 step(d,tail+.03);assert.equal(d.state().reserve,settle);
 const e=boot();use(e,2);e.reloadNow();step(e,delay+q.reload+.01);e.holster();
 assert.equal(e.state().phase,null);assert.equal(e.state().loaded,q.magazine-1);assert.equal(e.state().reserve,2*q.magazine-1);
});
