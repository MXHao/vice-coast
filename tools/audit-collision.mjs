import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha} from './ast.mjs';
import {R13_ARTIFACT} from './versions.mjs';
import {ROAD_COLLISION_ARTIFACT} from './road-solids-splices.mjs';
import {R14_CORE_ARTIFACT} from './r14-core-lock.mjs';

const [baseline,candidate]=process.argv.slice(2);
assert.ok(baseline&&candidate,'Pass the pinned R13 and collision-only R14 result from the same ordinary route or campaign');
const parse=f=>readFile(f,'utf8').then(JSON.parse);
const [{sha256:a,...left},{sha256:b,...right}]=await Promise.all([parse(baseline),parse(candidate)]);
assert.equal(a,R13_ARTIFACT.sha256);
assert.ok([ROAD_COLLISION_ARTIFACT.sha256,R14_CORE_ARTIFACT.sha256].includes(b));
assert.equal(left.profile,right.profile);assert.equal(left.scenario,right.scenario);
const sections={};
for(const key of Object.keys(left)){
 const before=sha(JSON.stringify(left[key])),after=sha(JSON.stringify(right[key]));
 assert.equal(before,after,'Changed comparison section: '+key);
 sections[key]=after;
}
assert.deepEqual(Object.keys(left),Object.keys(right));
const report={baseline:a,pinnedCollision:b,profile:left.profile,scenario:left.scenario,state:sections,saveWrites:right.saveTrace.length};
if(right.scenario==='route')report.route={drivingGates:right.trace.route.goals,walkingGates:right.trace.route.footMarks.length,impacts:right.trace.impacts};
if(right.scenario==='campaign')report.endings=right.trace.endings.map(x=>x.id);
console.log(JSON.stringify(report,null,2));
