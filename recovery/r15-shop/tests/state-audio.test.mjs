import assert from 'node:assert/strict';
import test from 'node:test';
import {CATALOG,STUDIES} from '../src/catalog.mjs';
import {COUNTER,DOOR,inDoor,inCounter,createSession,readOwnership,moveShop} from '../src/session.mjs';
import {createAudition} from '../src/audition.mjs';
function host({cash=200,save,valid=true,write=true}={}) {
  let at={x:DOOR.x,z:DOOR.z}, record=save??{v:1,x:DOOR.x,z:DOOR.z,yaw:0,cash,job:null,combat:{armed:false},story:{stage:3}}, commits=0;
  return {
    getCash:()=>cash, readSave:()=>record, projectSave:()=>({...record}),
    withProjectedCash:(save,newCash)=>({...save,cash:newCash}),
    commit({expectedCash,nextCash,body}){if(!write)throw Error('quota');if(expectedCash!==cash)return false;record=JSON.parse(JSON.stringify(body));cash=nextCash;commits++;return true;},
    canEnter:()=>valid&&inDoor(at.x,at.z),position:()=>at,enter:()=>{at={x:0,z:4};return true;},leave:()=>{at={x:DOOR.exitX,z:DOOR.exitZ};},
    counter:()=>{at={x:COUNTER.x,z:COUNTER.z};},outside:()=>{at={x:70,z:70};},
    editWallet:n=>{cash=n;},writes:()=>commits
  };
}
test('four original cosmetic studies / one inventory-only SKU',()=>{
  assert.equal(CATALOG.length,4);assert.equal(new Set(CATALOG.map(a=>a.id)).size,4);
  assert.deepEqual(CATALOG.filter(a=>a.preview).map(a=>a.id).sort(),[...STUDIES].sort());
  assert.deepEqual(CATALOG.filter(a=>a.price!==null).map(a=>a.id),['p92']);
});
test('door, walk, physical service reach, leave, and save without owned items',()=>{
  const h=host();const s=createSession(h);const save=h.readSave();assert.equal(s.recordOwnership(save),save);
  h.outside();assert.equal(s.enter(),false);assert.equal(createSession(host({valid:false})).enter(),false);
  const h2=host(),a=createSession(h2);assert.equal(a.enter(),true);assert.equal(a.open(),false);h2.counter();assert.ok(a.open());
  assert.ok(a.select('m870'));assert.equal(a.ask(),'unavailable');assert.equal(h2.writes(),0);
  assert.equal(a.leave(),true);assert.ok(inDoor(h2.position().x,h2.position().z));assert.notEqual(inCounter(0,4),true);
  let p={x:.2,z:-1.32};for(let i=0;i<100;i++)p=moveShop(p,0,-.3);assert.ok(p.z>=-1.91&&p.z<-1.6);
});
test('explicit quote, stale change/cancel and duplicate protection, immediate durable ownership',()=>{
  const h=host();const s=createSession(h);s.enter();h.counter();s.open();
  assert.equal(s.ask(),'quote');assert.equal(h.writes(),0);h.editWallet(210);assert.equal(s.confirm(),'stale');
  assert.equal(s.ask(),'quote');s.select('p90');s.select('p92');assert.equal(s.confirm(),'stale');
  assert.equal(s.ask(),'quote');assert.equal(s.confirm(),'purchased');assert.equal(s.confirm(),'stale');assert.equal(h.writes(),1);assert.equal(h.getCash(),50);
  const old=h.readSave(),loaded=host({cash:old.cash,save:old});const s2=createSession(loaded);
  assert.deepEqual([...readOwnership(old)],['p92']);assert.equal(old.combat.armed,false);assert.equal(old.story.stage,3);
  assert.equal(s2.view().owns,true);s2.enter();loaded.counter();s2.open();assert.equal(s2.ask(),'unavailable');
});
test('denied storage, insufficient cash and incompatible future inventory do not debit or overwrite',()=>{
  for(const h of [host({write:false}),host({cash:100}),host({save:{v:1,cash:200,armory:{schema:2,owned:['future']}}})]){
    const s=createSession(h),base=h.getCash(),initial=h.readSave();s.enter();h.counter();s.open();
    const quote=s.ask(); if(base<160)assert.equal(quote,'insufficient');else if(initial.armory?.schema===2){assert.equal(quote,'write-failed');assert.deepEqual(s.recordOwnership({v:1}).armory,initial.armory);}else {assert.equal(quote,'quote');assert.equal(s.confirm(),'write-failed');}
    assert.equal(h.getCash(),base);assert.equal(h.readSave(),initial);assert.equal(s.view().owns,false);
  }
});
// Synthetic zero buffers exercise the queue in a stub; no audio payload is included.
const table=Object.fromEntries(STUDIES.map(id=>[id,{rate:22050,frames:16,f32le:Buffer.alloc(64).toString('base64')} ]));
test('synthetic zero-frame fixture is lazy, bounded, respects mute and tears down',async()=>{
  const live=new Set(), a={enabled:true,master:{},ctx:{
    state:'running',createBuffer(ch,length,rate){assert.equal(ch,1);const pcm=new Float32Array(length);return {length,rate,getChannelData:()=>pcm};},
    createBufferSource(){return {start(){live.add(this)},connect(){},stop(){live.delete(this)},disconnect(){live.delete(this)}}}
  }};
  const o=createAudition({table,audio:()=>a,decode:s=>Buffer.from(s,'base64')});
  assert.equal(o.stats().bytes,0);assert.equal(await o.play('awm'),false);a.enabled=false;assert.equal(await o.play('p92'),false);assert.equal(o.stats().decoded,0);
  a.enabled=true;for(let i=0;i<3;i++)for(const id of STUDIES){assert.equal(await o.play(id),true);assert.equal(live.size,1);assert.ok(o.stats().bytes<=360000&&o.stats().retained<=2);}
  o.stop(true);assert.equal(live.size,0);assert.equal(o.stats().bytes,0);
});
test('cancel while sound context is starting does not retain or start audio',async()=>{
  let resume;
  const a={enabled:true,master:{},ctx:{state:'suspended',resume:()=>new Promise(r=>{resume=r;})}};
  const o=createAudition({table,audio:()=>a,decode:()=>assert.fail('no decode')});const p=o.play('p92');
  o.stop(true);a.ctx.state='running';resume();assert.equal(await p,false);assert.deepEqual(o.stats(),{retained:0,bytes:0,live:0,decoded:0,played:0});
});
