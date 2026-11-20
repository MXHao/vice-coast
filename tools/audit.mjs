import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha,PIN} from './ast.mjs';
const [, , baseline,candidate]=process.argv;
assert.ok(baseline&&candidate,'Usage: node --expose-internals tools/audit.mjs <baseline replay> <candidate replay>');
const a=JSON.parse(await readFile(baseline,'utf8')),b=JSON.parse(await readFile(candidate,'utf8'));
assert.equal(a.sha256,PIN.html,'Verified R11 baseline required');
assert.notEqual(a.sha256,b.sha256);
assert.equal(a.profile,b.profile);assert.equal(a.scenario,b.scenario);
assert.equal(a.art.groups.length,0);assert.equal(b.art.groups.length,2,'Both art layers mount');
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
