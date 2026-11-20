import assert from 'node:assert/strict';
import test from 'node:test';
import {CATALOG,ITEMS} from '../src/catalog.mjs';
import {LOADOUT_IDS,BATCH9_IDS,BATCH_FALLBACK,validateBatch} from '../src/batch-profile.mjs';
import {readOwnership,withOwnership,createSession,COUNTER} from '../src/session.mjs';
import {TITLE_ADAPTATION_NOTES,TITLE_LONG_TOTAL,createTitleDelayLedger,createTitleRotaryMeter} from '../src/adapted-title.mjs';
import {ORIGINAL_CUE_IDS} from '../src/title-foley.mjs';

const legacy={v:1,cash:3000,combat:{armed:false},armory:{schema:1,owned:['p92']}};
const dormant={...legacy,armory:{schema:2,format:'vc-title-items-r15',owned:['p92',...BATCH9_IDS],keep:'retain'}};
test('all 56 choices remain bounded, and the seven normalized descriptions are explicitly separated',()=>{
 const ids=['awma','barrett','kar98','awm','vector','mg3silver','gatling'];
 assert.deepEqual(BATCH9_IDS,ids);assert.deepEqual(Object.keys(TITLE_ADAPTATION_NOTES),ids);
 assert.equal(LOADOUT_IDS.length,56);assert.equal(CATALOG.length,56);assert.equal(ORIGINAL_CUE_IDS.length,12);
 for(const id of ids){const q=BATCH_FALLBACK[id];assert.equal(q.style,'whole');assert.ok(q.magazine<=128&&q.cadence>=.06&&q.cadence<=1.25);}
 assert.equal(BATCH_FALLBACK.vector.cadence,.06);
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,vector:{...BATCH_FALLBACK.vector,cadence:.059}}));
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,gatling:{...BATCH_FALLBACK.gatling,magazine:129}}));
 assert.throws(()=>validateBatch({...BATCH_FALLBACK,barrett:{...BATCH_FALLBACK.barrett,cadence:1.26}}));
 for(const [id,v] of Object.entries(TITLE_LONG_TOTAL))assert.ok(v>BATCH_FALLBACK[id].cadence&&v<=2.25);
});
test('the denial ledger persists privately across inactive selections and does not emit an action at expiry',()=>{
 const scope=createTitleDelayLedger();let applied=0;
 const request=id=>{if(scope.remaining(id)>0)return false;applied++;scope.noteAccepted(id);return true;};
 assert.equal(scope.pending(),false);assert.equal(scope.noteAccepted('p92'),false);
 for(const id of Object.keys(TITLE_LONG_TOTAL)){
  assert.ok(request(id));const count=applied,initial=scope.remaining(id);
  assert.equal(scope.noteAccepted(id),false);assert.equal(request(id),false);
  for(const dt of [NaN,Infinity,-3,0])scope.tick(dt,true);
  scope.tick(999,false);assert.equal(scope.remaining(id),initial);
  scope.tick(999,true);assert.ok(Math.abs(scope.remaining(id)-(initial-.12))<1e-8);
  // Paused/focus-invalid intervals do not drain time. An unrelated active
  // selection does not reset the remembered, item-specific delay.
  for(let i=0;i<6;i++)scope.tick(.07,i<2);
  assert.equal(request(id),false);assert.equal(applied,count);
  for(let t=scope.remaining(id);t>0;t-=.02)scope.tick(.02,true);
  assert.equal(scope.remaining(id),0);assert.equal(applied,count);
  assert.ok(request(id));assert.equal(applied,count+1);
 }
});
test('rotary readiness meter does not generate gameplay, cannot catch up and resets on explicit lifecycle transitions',()=>{
 const dial=createTitleRotaryMeter();assert.equal(dial.ready(),false);assert.equal(dial.progress(),0);
 dial.tick(Infinity,true);dial.tick(9,false);assert.equal(dial.progress(),0);
 dial.tick(99999,true);assert.ok(dial.progress()>0&&dial.progress()<.2);assert.equal(dial.ready(),false);
 const mid=dial.progress();dial.tick(111,false);assert.equal(dial.progress(),mid);
 for(let i=0;i<12;i++)dial.tick(.06,true);
 assert.equal(dial.ready(),true);assert.equal(dial.progress(),1);assert.equal(dial.remaining(),0);
 assert.equal(dial.fire,undefined);assert.equal(dial.queue,undefined);
 dial.reset();assert.equal(dial.ready(),false);assert.equal(dial.progress(),0);
});
test('historical dormant labels do not become owned, while an explicit normalized purchase records only that receipt',()=>{
 assert.deepEqual(withOwnership(legacy,readOwnership(legacy)),legacy);
 assert.deepEqual(readOwnership(dormant),new Set(['p92']));
 assert.deepEqual(withOwnership(dormant,readOwnership(dormant)),dormant);
 let cash=dormant.cash, writes=0, record=dormant;
 const s=createSession({readSave:()=>dormant,projectSave:()=>record,withProjectedCash:(p,next)=>({...p,cash:next}),
  commit({expectedCash,nextCash,body}){assert.equal(expectedCash,cash);cash=nextCash;record=body;writes++;return true;},
  enter:()=>true,leave:()=>true,canEnter:()=>true,position:()=>COUNTER,getCash:()=>cash});
 assert.ok(s.enter());assert.ok(s.open());assert.ok(s.select('kar98'));
 assert.equal(s.view().owns,false);assert.equal(s.ask(),'quote');assert.equal(s.confirm(),'purchased');assert.equal(s.confirm(),'stale');
 assert.equal(writes,1);assert.equal(cash,dormant.cash-ITEMS.kar98.price);
 assert.deepEqual(readOwnership(record),new Set(['p92','kar98']));
 assert.deepEqual(record.armory.titleAdapted,{format:'vc-title-balance-r15',owned:['kar98']});
 assert.ok(record.armory.owned.every(id=>dormant.armory.owned.includes(id)));assert.equal(record.armory.keep,'retain');
 assert.deepEqual(record.combat,legacy.combat);
});
