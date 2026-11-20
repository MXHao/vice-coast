import assert from 'node:assert/strict';
import test from 'node:test';
import {BATCH3_IDS,BATCH4_IDS,BATCH6_IDS,BATCH7_IDS,BATCH9_IDS} from '../src/batch-profile.mjs';
import {groupedHeldPose,hasGroupedPose,sidearmHeldPose,hasSidearmPose} from '../src/batch-poses.mjs';
test('grouped artist contacts are whitelisted and corrupt or extreme geometry fails closed',()=>{
 const b={min:{x:-.08,y:-.2,z:-.35},max:{x:.08,y:.2,z:.33}};
 for(const id of [...BATCH3_IDS,...BATCH4_IDS.filter(hasGroupedPose),...BATCH6_IDS.filter(hasGroupedPose),...BATCH7_IDS,...BATCH9_IDS]){
  assert.ok(hasGroupedPose(id));const pose=groupedHeldPose(id,b);assert.ok(pose,id);
  assert.ok(pose.support[2]<pose.grip[2]&&pose.grip[2]<pose.shoulder[2]);
  assert.ok(pose.scale*(b.max.z-b.min.z)<=.574);
  assert.equal(groupedHeldPose(id,{...b,max:{...b.max,z:8}}),null);
  assert.equal(groupedHeldPose(id,{...b,min:{...b.min,y:NaN}}),null);
 }
 assert.equal(groupedHeldPose('notATitle',b),null);assert.equal(groupedHeldPose('p92',b),null);
 assert.equal(groupedHeldPose('toString',b),null);
});

test('all nine native-slot cosmetic poses are authored-only and never take the peer hand',()=>{
 const good={min:{x:-.04,y:-.10,z:-.2},max:{x:.04,y:.08,z:.1}};
 const cohort=[...BATCH4_IDS,...BATCH6_IDS],set=cohort.filter(hasSidearmPose);
 assert.equal(set.length,9);assert.equal(set.length+cohort.filter(hasGroupedPose).length,cohort.length);
 for(const id of set){
  const p=sidearmHeldPose(id,good);assert.ok(p,id);
  assert.ok(p.scale*(good.max.z-good.min.z)<=.263);assert.equal(Object.hasOwn(p,'support'),false);
  assert.equal(sidearmHeldPose(id,{...good,max:{...good.max,x:10}}),null);
  assert.equal(sidearmHeldPose(id,{...good,min:{...good.min,z:NaN}}),null);
 }
 assert.equal(sidearmHeldPose('p92',good),null);
 assert.equal(sidearmHeldPose('mausera',good),null);
});
