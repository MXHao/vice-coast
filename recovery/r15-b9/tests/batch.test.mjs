import assert from 'node:assert/strict';
import test from 'node:test';
import {CATALOG,ITEMS} from '../src/catalog.mjs';
import {BATCH_FALLBACK,BATCH_IDS,BASE_BATCH_IDS,BATCH2_IDS,BATCH3_IDS,BATCH4_IDS,BATCH6_IDS,BATCH7_IDS,BATCH9_IDS,BATCH7_PHASE_IDS,BATCH7_INTERVAL_ID,LOADOUT_IDS,validateBatch} from '../src/batch-profile.mjs';
import {createBatchLoadout} from '../src/batch-loadout.mjs';
import {readOwnership,withOwnership,createSession,COUNTER} from '../src/session.mjs';
const step=(ctl,sec)=>{for(let i=0;i<Math.ceil(sec/.025);i++)ctl.tick(.025);};
test('56 title-authored prices only; all 56 previews keep catalogue IDs',()=>{
 assert.equal(CATALOG.length,56);assert.equal(new Set(CATALOG.map(x=>x.id)).size,56);
 assert.deepEqual(CATALOG.filter(i=>i.price!==null).map(i=>i.id).sort(),[...LOADOUT_IDS].sort());
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,notATitle:BATCH_FALLBACK.m416}));
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,p90:{...BATCH_FALLBACK.p90,external:1}}));
});
for(const id of BATCH_IDS.filter(id=>!BATCH7_PHASE_IDS.includes(id)&&id!==BATCH7_INTERVAL_ID))test(id+' has bounded game-only reload, pauses, fresh activation and distinct supply',()=>{
 const p=BATCH_FALLBACK[id], a=createBatchLoadout(p),b=createBatchLoadout(p);
 assert.equal(a.toggle(true),'native');a.authorize();assert.equal(a.fire(),'native');assert.ok(a.applyOutside(true));
 assert.equal(a.fire(),'busy');assert.equal(a.state().loaded,p.magazine);step(a,p.equip+.02);
 assert.equal(a.fire(),'shot');assert.equal(a.fire(),'busy');step(a,p.cadence+.02);assert.equal(a.fire(),'shot');
 assert.equal(a.state().loaded,p.magazine-2);assert.equal(b.state().loaded,p.magazine);
 assert.ok(a.reloadNow());assert.equal(a.fire(),'busy');const initial=a.state().reserve;
 step(a,p.reload+.03);
 const got=id==='m870'?1:2;
 assert.equal(a.state().loaded,p.magazine-2+got);assert.equal(a.state().reserve,initial-got);
 if(id==='m870'){assert.ok(a.state().reload>0);step(a,p.reload+.03);}
 assert.equal(a.state().loaded,p.magazine);assert.equal(a.state().reserve,initial-2);
 for(let i=0;i<p.magazine;i++){step(a,p.cadence+.02);assert.equal(a.fire(),'shot');}
 assert.equal(a.fire(),'busy');step(a,p.cadence+.02);assert.equal(a.fire(),'empty');
 step(a,p.magazine*p.reload+.03);a.holster();assert.equal(a.fire(),'native');
 assert.equal(a.state().loaded+a.state().reserve,p.magazine*2-2);
});
test('old owned P92 schema stays byte-compatible; migrated store is additive and fenced on downgrade',()=>{
 const old={v:1,cash:1550,combat:{ammo:4,armed:false},armory:{schema:1,owned:['p92']}};
 assert.deepEqual([...readOwnership(old)],['p92']);assert.deepEqual(withOwnership(old,new Set(['p92'])),old);
 const next=withOwnership(old,new Set(['p92','m416','bogus']));
 assert.equal(next.armory.schema,2);assert.equal(next.armory.format,'vc-title-items-r15');
 assert.deepEqual([...readOwnership(next)],['p92','m416']);
 assert.deepEqual(next.combat,old.combat);assert.equal(next.cash,old.cash);
 const future={...old,armory:{schema:2,owned:['p92','m416']}};
 assert.deepEqual([...readOwnership(future)],[]);assert.throws(()=>withOwnership(future,new Set(['m416'])));
});
test('batch purchase needs exact quote, stays inert until explicit selection and never serializes active equipment',()=>{
 const old={v:1,cash:1600,story:{stage:4},combat:{arms:false},armory:{schema:1,owned:['p92']}};
 let rec=old,cash=old.cash,writes=0,deny=false;
 const h={readSave:()=>old,projectSave:()=>rec,withProjectedCash:(base,num)=>({...base,cash:num}),canEnter:()=>true,
   position:()=>COUNTER,getCash:()=>cash,enter:()=>true,leave:()=>true,commit({expectedCash,nextCash,body}){
     if(deny||cash!==expectedCash)return false;cash=nextCash;rec=body;writes++;return true;
   }};
 const s=createSession(h);assert.ok(s.enter());assert.ok(s.open());
 for(const id of BASE_BATCH_IDS){assert.ok(s.select(id));assert.equal(s.view().owns,false);assert.equal(s.ask(),'quote');
  if(id==='m416'){assert.ok(s.select('p90'));assert.equal(s.confirm(),'stale');assert.ok(s.select(id));assert.equal(s.ask(),'quote');}
  deny=true;const before=cash;assert.equal(s.confirm(),'write-failed');assert.equal(cash,before);deny=false;
  assert.equal(s.ask(),'quote');assert.equal(s.confirm(),'purchased');assert.equal(s.confirm(),'stale');assert.equal(s.view().owns,true);
 }
 assert.equal(writes,3);assert.equal(cash,1600-BASE_BATCH_IDS.reduce((n,id)=>n+ITEMS[id].price,0));
 assert.deepEqual([...readOwnership(rec)],['p92',...BASE_BATCH_IDS]);
 assert.deepEqual(Object.keys(rec.armory).sort(),['format','owned','schema']);
 assert.deepEqual(rec.story,old.story);assert.deepEqual(rec.combat,old.combat);
});

test('batch one v2 remains readable; new held IDs never serialize when inactive or not explicitly bought',()=>{
 const prior={v:1,cash:2500,combat:{armed:false},armory:{schema:2,format:'vc-title-items-r15',owned:['p92',...BASE_BATCH_IDS]}};
 assert.deepEqual([...readOwnership(prior)],['p92',...BASE_BATCH_IDS]);
 assert.deepEqual(withOwnership(prior,readOwnership(prior)),prior);
 const joined=withOwnership(prior,new Set(['p92',...BASE_BATCH_IDS,...BATCH2_IDS,'bogus']));
 assert.equal(joined.armory.schema,2);assert.equal(joined.armory.format,prior.armory.format);
 assert.deepEqual([...readOwnership(joined)],['p92',...BASE_BATCH_IDS,...BATCH2_IDS]);
 assert.deepEqual(Object.keys(joined.armory).sort(),['format','owned','schema']);assert.equal(joined.combat.armed,false);
});

test('a complete 49-entry save survives the title-normalized cohort without activating any item',()=>{
 const prior={v:1,cash:2500,combat:{armed:false},armory:{schema:2,format:'vc-title-items-r15',owned:['p92',...BASE_BATCH_IDS,...BATCH2_IDS,...BATCH3_IDS,...BATCH4_IDS,...BATCH6_IDS,...BATCH7_IDS],keep:'kept'}};
 assert.deepEqual(withOwnership(prior,readOwnership(prior)),prior);
 const next=withOwnership(prior,new Set([...readOwnership(prior),...BATCH9_IDS]));
 assert.equal(next.armory.schema,2);assert.equal(next.armory.keep,'kept');
 assert.deepEqual(next.armory.owned,LOADOUT_IDS);assert.deepEqual(next.combat,prior.combat);
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,m60:{...BATCH_FALLBACK.m60,magazine:131}}));
 for(const id of BATCH9_IDS){const s=createBatchLoadout(BATCH_FALLBACK[id]);assert.equal(s.active(),false);assert.equal(s.fire(),'native');}
});
