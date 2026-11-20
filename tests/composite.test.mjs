import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {R12_ARTIFACT,R13_ARTIFACT} from '../tools/versions.mjs';
import {sha,splitHtml} from '../tools/ast.mjs';
import {build,sourcesFor} from '../build.mjs';
import {loadWorld} from '../tools/fixture.mjs';
import {geometry} from '../tools/scenarios.mjs';
import {threshold,sampleThreshold} from '../src/activity.mjs';

const vendor=await readFile(new URL('../vendor/R11.html',import.meta.url));

test('the exact R12 capsule and R13 build differ only within the reversible art declaration',async()=>{
 const a=build(vendor,await sourcesFor('r12'));
 const b=build(vendor,await sourcesFor('r13'));
 assert.deepEqual(a.metadata.candidate,R12_ARTIFACT);
 assert.deepEqual(b.metadata.candidate,R13_ARTIFACT);
 const removeArtDeclaration=({candidate,metadata})=>{
  const p=splitHtml(candidate);
  const [{id,startByte,endByte}, ...sameHooks]=metadata.insertions;
  assert.equal(id,'bridge-declaration');
  assert.deepEqual(sameHooks.map(p=>p.id),['mount-before-clock','presentation-before-render']);
  const js=Buffer.from(p.app);
  return Buffer.concat([Buffer.from(p.before),js.subarray(0,startByte),js.subarray(endByte),Buffer.from(p.after)]);
 };
 assert.ok(removeArtDeclaration(a).equals(removeArtDeclaration(b)));
 assert.equal(a.metadata.source.skyline,b.metadata.source.skyline);
});

test('exact combined composition preserves old placements and keeps warehouse and threshold footprints disjoint',async()=>{
 const a=build(vendor,await sourcesFor('r12'));
 const b=build(vendor,await sourcesFor('r13'));
 const A=loadWorld(a.candidate),B=loadWorld(b.candidate);
 const left=A.newGame(),right=B.newGame();
 const old=left.game,g=right.game;
 const warehouse=g.scene.getObjectByName('VICE COAST R13 | warehouse');
 const {warehouseFrontages}=warehouse.children[0].userData;
 assert.equal(warehouseFrontages.length,5);
 assert.equal(g.blocks.length,275);assert.equal(g.walkers.length,25);
 assert.equal(JSON.stringify(g.blocks),JSON.stringify(old.blocks));
 assert.deepEqual(geometry(g).groups.slice(0,1),geometry(old).groups.slice(0,1));
 const sigGeometry=o=>{
  const bits=[];
  o.traverse(x=>{
   bits.push([x.name,x.visible,x.position.toArray(),x.quaternion.toArray(),x.scale.toArray(),
      x.material?.name, x.geometry?.attributes.position.count]);
   if(x.geometry?.attributes.position){
    const v=x.geometry.attributes.position.array;
    bits.push(sha(Buffer.from(v.buffer,v.byteOffset,v.byteLength)));
   }
  });
  return sha(JSON.stringify(bits));
 };
 const oldSky=old.scene.getObjectByName('VICE COAST R12 | skyline');
 const newSky=g.scene.getObjectByName('VICE COAST R12 | skyline');
 assert.equal(sigGeometry(newSky),sigGeometry(oldSky));
 const portName='South Wharf • dock manifest and freight';
 const oldPort=old.scene.getObjectByName(portName),newPort=g.scene.getObjectByName(portName);
 for(const k of [3.2,6.6,16.21,19.68,63.90,84.6]){
  for(const world of [old,g]){
   world.elapsed=k;
   world.camera.position.set(-80.68,2.04,188.15);
   world.live=true;
   world.paused=false;
   world.last=0;
   world.frame(0);
  }
  assert.ok(newPort.visible&&oldPort.visible);
  assert.equal(sigGeometry(newPort),sigGeometry(oldPort),'Existing quay work remains unchanged');
 }
 assert.equal(g.scene.getObjectByName('Ambient vignette: market stock mover').parent.name,'Mercado Las Olas • produce packets');
 assert.equal(g.scene.getObjectByName('Las Olas produce cart').parent.name,'Mercado Las Olas • produce packets');
 for(let i=0;i<500;i++){
  const s=sampleThreshold(i*threshold.period/500);
  for(const a of warehouseFrontages){
   const absAlong=Math.max(0,a.low[0]-s.x,s.x-a.high[0]);
   const across=Math.max(0,a.low[2]-s.z,s.z-a.high[2]);
   assert.ok(Math.hypot(absAlong,across)>90);
  }
 }
 assert.deepEqual(A.errors,[]);
 assert.deepEqual(B.errors,[]);
});
