import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ROAD_SOLIDS,createRoadSolids} from '../src/road-solids.mjs';
import {build,sourcesFor} from '../build.mjs';
import {sha,splitHtml,inspectProgram,slice} from '../tools/ast.mjs';
import {R13_ARTIFACT} from '../tools/versions.mjs';
import {ROAD_COLLISION_ARTIFACT} from '../tools/road-solids-splices.mjs';

const close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} not ${b}`);
const rect={minX:0,maxX:.10,minZ:-5,maxZ:5};
const pole={x:0,z:0,r:.077,minX:-.077,maxX:.077,minZ:-.077,maxZ:.077};
const r=()=>createRoadSolids([rect]);
const n=()=>createRoadSolids([pole]);
test('thin poles and rails are swept, not sampled only at the endpoint',()=>{
 const rail=r().pick(null,-30,0,60,0,0);
 close(-30+60*rail.at,-.84);assert.equal(rail.nx,-1);assert.equal(rail.nz,0);
 const h=n().pick(null,-60,0,120,0,0);
 close(-60+120*h.at,-.917);assert.equal(h.nx,-1);assert.equal(h.nz,0);
 // Reversing while yaw still points the other way uses the full car length.
 const tail=n().pick(null,-60,0,120,0,Math.PI/2);
 close(-60+120*tail.at,-(1.33+.917));
 const tiny=n().pick(null,-.91701,0,.00005,0,0);
 assert.ok(tiny.at>0&&tiny.at<1);
});
test('grazing or clear clearance is not a square-corner snag',()=>{
 const b=createRoadSolids([{minX:-1,maxX:1,minZ:-1,maxZ:1,corner:.31}]);
 // The last physical arc is clear by less than .09 m; an expanded square
 // would stop this front station while it traverses the old square's corner.
 assert.equal(b.pick(null,1.80,3.30,0,-.50,0),null);
 assert.equal(r().pick(null,-.841,-8,0,16,0),null);
 assert.equal(n().pick(null,-1.33-.91705,-6,0,12,Math.PI/2),null);
 const diagonal=n().pick(null,-6,-.66,12,0,0);
 assert.ok(diagonal&&diagonal.nx<0&&diagonal.nz<-.5);
 close(Math.hypot(diagonal.nx,diagonal.nz),1);
});
test('old wall precedes a new object at the same or earlier time',()=>{
 const a=r();
 const early={at:.10,nx:0,nz:-1},tie={at:(3-.84)/8,nx:0,nz:-1};
 for(const old of [early,tie])assert.equal(a.pick(old,-3,0,8,0,0),old);
 const late={at:.7,nx:0,nz:-1};
 assert.notEqual(a.pick(late,-3,0,8,0,0),late);
 assert.equal(a.pick(late,-200,0,8,0,0),late);
});
test('old overlapping position can un-wedge in place; the traffic push cannot bypass a thin object',()=>{
 const a=r();
 assert.equal(a.pick(null,.60,0,3,0,Math.PI/2),null);
 const hit=a.pick(null,.60,0,-4,0,Math.PI/2);
 assert.ok(hit?.at===0&&hit?.nx>0);
 assert.equal(a.blocksPush(-3,0,7,0,0),true);
 assert.equal(a.blocksPush(-3,0,-3,7,0),false);
 assert.equal(a.blocksPush(.60,0,4,0,Math.PI/2),false);
 // A centre-station and then the tail cross the old line. Exiting must
 // never reverse the allowed normal as the two contacts trade depth.
 for(let x=.26;x<2.9;x+=.017)assert.equal(a.pick(null,x,0,.017,0,Math.PI/2),null);
 for(let x=-.16;x>-2.9;x-=.017)assert.equal(a.pick(null,x,0,-.017,0,Math.PI/2),null);
 const basin=createRoadSolids([{x:0,z:0,r:4.17,minX:-4.17,maxX:4.17,minZ:-4.17,maxZ:4.17}]);
 for(let x=.1;x<7;x+=.09)assert.equal(basin.pick(null,x,0,.09,0,Math.PI/2),null);
});
test('explicit catalog retains real shoreline openings and excludes soft/pedestrian detail',()=>{
 assert.equal(ROAD_SOLIDS.length,42);
 const banks=ROAD_SOLIDS.filter(o=>o.id.startsWith('promenade'));
 for(let i=1;i<banks.length;i++)close(banks[i].minZ-banks[i-1].maxZ,22);
 const k=createRoadSolids();
 assert.equal(k.pick(null,108,0,23,0,Math.PI/2),null);
 assert.ok(k.pick(null,108,40,23,0,Math.PI/2));
 assert.ok(ROAD_SOLIDS.every(x=>!/foliage|cart|canopy|bench|lamp|awning/i.test(x.id)));
});
test('compile isolates all collision insertions and exactly restores full R13 and R11 bytes',async()=>{
 const vendor=await readFile(new URL('../vendor/R11.html',import.meta.url));
 const old=build(vendor,await sourcesFor('r13'));
 const patched=build(vendor,await sourcesFor('r14-collision'));
 assert.equal(sha(old.candidate),R13_ARTIFACT.sha256);
 assert.deepEqual(patched.metadata.candidate,ROAD_COLLISION_ARTIFACT);
 assert.equal(patched.metadata.insertions.length,7);
 const parts=splitHtml(patched.candidate);
 const placements=patched.metadata.insertions.filter(p=>p.id.startsWith('road-solids'));
 assert.equal(placements.length,4);
 let current=Buffer.from(parts.app);
 for(const p of placements.toReversed())current=Buffer.concat([current.subarray(0,p.startByte),current.subarray(p.endByte)]);
 assert.ok(Buffer.concat([Buffer.from(parts.before),current,Buffer.from(parts.after)]).equals(old.candidate));
 const pOld=splitHtml(old.candidate),a=inspectProgram(pOld.app,false),b=inspectProgram(parts.app,false);
 for(const name of ['blocked','walk','save','frame','setCamera','makeTraffic','constructor']){
  assert.equal(slice(pOld.app,a.method(name)),slice(parts.app,b.method(name)),name);
 }
});
