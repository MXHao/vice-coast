import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha,PIN} from './ast.mjs';
import {R12_ARTIFACT,R13_ARTIFACT} from './versions.mjs';
const [, , baseline,candidate]=process.argv;
assert.ok(baseline&&candidate,'Usage: node --expose-internals tools/audit.mjs <baseline replay> <candidate replay>');
const a=JSON.parse(await readFile(baseline,'utf8')),b=JSON.parse(await readFile(candidate,'utf8'));
assert.ok([PIN.html,R12_ARTIFACT.sha256].includes(a.sha256),'A pinned predecessor is required');
assert.notEqual(a.sha256,b.sha256);
assert.equal(a.profile,b.profile);assert.equal(a.scenario,b.scenario);
const r13=a.sha256===R12_ARTIFACT.sha256;
assert.equal(b.sha256,r13?R13_ARTIFACT.sha256:R12_ARTIFACT.sha256,'Exact frozen comparison output');
const oldArt=['VICE COAST R12 | skyline','VICE COAST R12 | activity'];
assert.deepEqual(a.art.groups.map(o=>o.name),r13?oldArt:[]);
assert.deepEqual(b.art.groups.map(o=>o.name),r13?[...oldArt,'VICE COAST R13 | warehouse']:oldArt);
if(r13)assert.deepEqual(b.art.groups[0],a.art.groups[0],'R12 distant skyline census unchanged');
const compare=['trace','saveTrace','notes','panels','sound','counters'];
const exact={};
for(const k of compare){
 const A=sha(JSON.stringify(a[k])),B=sha(JSON.stringify(b[k]));
 assert.equal(A,B,'Runtime parity failed: '+k);exact[k]=A;
}
const report={baseline:a.sha256,candidate:b.sha256,scenario:b.scenario,profile:b.profile,exact,
  saveWrites:b.saveTrace.length,presentation:b.art,
  note:'Actual engine source bundle under CPU no-WebGL renderer boundary, no native browser or rendering claim'};
if(b.scenario==='route'){
 report.route={gates:b.trace.route.goals,foot:b.trace.route.footMarks.length,driving:b.trace.route.driven,walking:b.trace.route.walked,impacts:b.trace.impacts};
}else{
 report.campaign={observed:b.trace.visited,endings:b.trace.endings.map(({id})=>id),fire:b.trace.fire};
}
console.log(JSON.stringify(report,null,2));
