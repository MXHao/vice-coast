import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {CONSTS,PIN,sha} from '../tools/ast.mjs';
import {loadWorld} from '../tools/fixture.mjs';
import {createArt} from '../src/warehouse.mjs';

const vendor = readFileSync(new URL('../vendor/R11.html',import.meta.url));
assert.equal(sha(vendor), PIN.html);
const fixture=loadWorld(vendor);
const api=Object.freeze({...fixture.native,...CONSTS});
const actors=new Proxy({}, {get(){assert.fail('Warehouse module must not access ambient actors')}});
test('native static warehouse creates deterministic finite three-material geometry',()=>{
 const n=fixture.errors.length;
 const first=createArt({THREE:api,actors}),second=createArt({THREE:api,actors});
 assert.equal(fixture.errors.length,n);
 assert.equal(first.update,undefined);
 assert.equal(first.root.parent,null);
 assert.ok(first.root instanceof api.Group);
 assert.equal(first.root.children.length,3);
 let triangles=0;
 for(const [i,o] of first.root.children.entries()){
  assert.ok(o.isMesh&&o.material.fog&&o.material.vertexColors);
  assert.ok(!o.castShadow&&!o.receiveShadow);
  const get=(n)=>o.geometry.getAttribute(n).array;
  const p=get('position'),c=get('color');
  assert.equal(p.length,c.length);
  assert.equal(p.length%9,0);
  assert.ok(p.every(Number.isFinite)&&c.every(v=>v>=0&&v<=1)&&get('normal').every(Number.isFinite));
  triangles+=p.length/9;
  assert.deepEqual(p,second.root.children[i].geometry.getAttribute('position').array);
  assert.deepEqual(c,second.root.children[i].geometry.getAttribute('color').array);
  const a=new api.Vector3(),x=new api.Vector3(),y=new api.Vector3();
  for(let j=0;j<p.length;j+=9){
   a.fromArray(p,j);x.fromArray(p,j+3).sub(a);y.fromArray(p,j+6).sub(a);
   assert.ok(x.cross(y).lengthSq()>1e-10,'no degenerate triangles');
  }
 }
 assert.ok(triangles>2000&&triangles<10500,triangles+' tri budget keeps art focused');
});
test('heritage warehouse coordinates and permit levels preserve exact first-side curb and narrow driving turn',()=>{
 const {game}=fixture.newGame();
 assert.equal(game.blocks.length,275);
 const known=JSON.stringify(game.blocks);
 const roots=game.scene.children.length;
 const {root}=createArt({THREE:api,actors});
 const items=root.userData.warehouseFrontages;
 assert.equal(items.length,5);
 const style=new Set(),distinct=new Set();
 const before=structuredClone(fixture.trace);
 for(const item of items){
   const {id,lot,axis,wall,low,high,overheadFloor,lowProjection}=item;
   style.add(item.style);distinct.add(lot.join(','));
   const same=game.blocks.filter(b=>Math.abs((b.minX+b.maxX)/2-lot[0])<.01&&Math.abs((b.minZ+b.maxZ)/2-lot[1])<.01);
   assert.equal(same.length,1,id);
   const b=same[0], along=axis==='x'?2:0,k=axis==='x'?0:2;
   const minAlong=axis==='x'?b.minZ:b.minX,maxAlong=axis==='x'?b.maxZ:b.maxX;
   const minFacing=axis==='x'?b.minX:b.minZ,maxFacing=axis==='x'?b.maxX:b.maxZ;
   assert.ok(Math.min(Math.abs(wall-minFacing),Math.abs(wall-maxFacing))<.018,id+' attaches to native perimeter');
   assert.ok(low[along]>minAlong&&high[along]<maxAlong,id);
   assert.ok(low[k]>minFacing-1.68&&high[k]<maxFacing+1.68,id);
   assert.ok(lowProjection<=.317&&overheadFloor>=3.75,id+' no near-ground sidewalk or road body');
   assert.ok(low[1]>=.073&&high[1]<7.44,id+' civil facade only');
   // The nearest public driving-centre line along the full frontage, including the turn.
   if(axis==='x')assert.ok(low[0]>-162||high[0]<-180,id+' stays clear of Dock Road lanes');
   else if(lot[1]===194)assert.ok(low[2]>179.5,id+' stays clear of turn lanes');
 }
 assert.equal(style.size,4);assert.equal(distinct.size,4);
 game.scene.add(root);
 assert.equal(game.scene.children.length,roots+1);
 assert.equal(JSON.stringify(game.blocks),known);
 assert.deepEqual(fixture.trace,before);
 assert.deepEqual(fixture.errors,[]);
});
