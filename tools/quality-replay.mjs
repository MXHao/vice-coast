// Re-run any R13 CPU scenario and require exact gameplay, serialized saves, art,
// HUD/audio/panel events and counters for the entire R14 graphics-only candidate.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha} from './ast.mjs';
import {R13_ARTIFACT} from './versions.mjs';
import {loadWorld} from './fixture.mjs';
import {runScenario} from './scenarios.mjs';
const [baseline,candidate,mode='high']=process.argv.slice(2);
assert.ok(['high','balanced','smooth'].includes(mode));
const a=JSON.parse(await readFile(baseline)),b=await readFile(candidate);
assert.equal(a.sha256,R13_ARTIFACT.sha256);
const store=new Map(mode==='high'?[]:[['vice-coast-graphics-v1',mode]]);
const replay=runScenario(loadWorld(b,{compact:a.profile==='compact',storage:store}),a.scenario);
for(const [key,data] of Object.entries(replay)) assert.equal(sha(JSON.stringify(data)),sha(JSON.stringify(a[key])),'R13 exact '+key);
console.log(JSON.stringify({sha256:sha(b),profile:a.profile,scenario:a.scenario,mode,saveWrites:a.saveTrace.length,match:true}));
