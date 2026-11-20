// Offline source geometry witness for the collision-only catalog. Boots the
// byte-exact R13 scene under the native CPU fixture; never displays it.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadWorld} from './fixture.mjs';
import {R13_ARTIFACT} from './versions.mjs';
import {sha} from './ast.mjs';
import {ROAD_SOLIDS} from '../src/road-solids.mjs';

const [artifact,profile]=process.argv.slice(2);
assert.ok(artifact&&['desktop','compact'].includes(profile));
const bytes=await readFile(artifact);
assert.equal(sha(bytes),R13_ARTIFACT.sha256);
const f=loadWorld(bytes,{compact:profile==='compact'}),g=f.newGame().game,T=f.native;
const root=g.scene.getObjectByName('Vice Coast streets and architecture');
assert.ok(root);
const matrix=new T.Matrix4(),p=new T.Vector3(),s=new T.Vector3(),q=new T.Quaternion(),color=new T.Color();
const stamps=[],flats=[];
root.updateMatrixWorld(true);
root.traverse(o=>{
 if(o.isInstancedMesh){
  let baseR=0;
  if(o.geometry.type==='LatheGeometry'){
   const a=o.geometry.attributes.position.array;
   for(let i=0;i<a.length;i+=3)baseR=Math.max(baseR,Math.hypot(a[i],a[i+2]));
  }
  for(let i=0;i<o.count;i++){
   o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld).decompose(p,q,s);
   if(o.instanceColor)o.getColorAt(i,color);else color.set(0xffffff);
   stamps.push({tint:color.getHex(),type:o.geometry.type,x:p.x,y:p.y,z:p.z,dx:s.x,dy:s.y,dz:s.z,baseR});
  }
 }else if(o.isMesh&&o.geometry.attributes.color&&o.geometry.attributes.position){
  const C=o.geometry.attributes.color,P=o.geometry.attributes.position;
  const expected=new T.Color(0xdfc9ac);
  for(let i=0;i<P.count;i++){
   if(Math.abs(C.getX(i)-expected.r)+Math.abs(C.getY(i)-expected.g)+Math.abs(C.getZ(i)-expected.b)>.001)continue;
   p.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);
   if(p.y>.58&&p.y<.681)flats.push(p.toArray());
  }
 }
});
const near=(a,b,tolerance=.002)=>Math.abs(a-b)<tolerance;
const insideOld=(x,z)=>g.blocks.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);
const witnessed=[];
for(const b of ROAD_SOLIDS){
 let tint,type,isPlanter=false;
 if(b.id.includes('planter')){tint=0x777a57;type='BoxGeometry';isPlanter=true;}
 else if(b.id.includes('fountain')){tint=0xd8cbb4;type='LatheGeometry';}
 else if(b.id.includes('guardrail')){tint=0xb6a18b;type='BoxGeometry';}
 else if(b.id.endsWith('post')){tint=0x596d70;type='CylinderGeometry';}
 else if(b.id.endsWith('back panel')){tint=0x8c9c92;type='BoxGeometry';}
 else if(b.id.endsWith('schedule case')){tint=0x606b69;type='BoxGeometry';}
 else if(b.id.endsWith('end panel')){tint=0x59655e;type='BoxGeometry';}
 else assert.fail('Catalog record requires a native witness');
 const seen=stamps.filter(a=>a.tint===tint&&a.type===type&&near(a.x,b.x)&&near(a.z,b.z));
 assert.equal(seen.length,1,b.id+' can only match one actual object');
 const a=seen[0];
 if(isPlanter){
  assert.ok(near(a.y,.63)&&near(a.dy,.055));
  assert.ok(near(b.maxX-b.minX,a.dx+.33)&&near(b.maxZ-b.minZ,a.dz+.33));
  const cap=flats.filter(([x,,z])=>x>b.minX-.012&&x<b.maxX+.012&&z>b.minZ-.012&&z<b.maxZ+.012);
  assert.ok(cap.length>24,b.id+' actual colored stone perimeter');
  for(const [idx,lo,hi] of [[0,b.minX,b.maxX],[2,b.minZ,b.maxZ]]){
   const extrema=cap.map(v=>v[idx]);
   assert.ok(near(Math.min(...extrema),lo,.012)&&near(Math.max(...extrema),hi,.012),b.id+' exact outer cap width');
  }
 }else if(type==='LatheGeometry'){
  assert.ok(near(a.baseR,b.r));
 }else if(b.r!==undefined){
  assert.ok(near(a.dx,b.r)&&near(a.dz,b.r));
 }else{
  assert.ok(near(a.dx,b.maxX-b.minX)&&near(a.dz,b.maxZ-b.minZ));
 }
 witnessed.push({id:b.id,oldCenterBlocked:insideOld(b.x,b.z),position:[b.x,b.z],type,tint:tint.toString(16)});
}
const streetlamps=stamps.filter(a=>a.type==='LatheGeometry'&&[0x4d6a62,0x787f7b].includes(a.tint)&&near(a.y,.15));
const signals=stamps.filter(a=>a.type==='CylinderGeometry'&&a.tint===0x676b6b&&near(a.y,.52));
assert.equal(streetlamps.length,40);assert.equal(signals.length,38);
assert.ok([...streetlamps,...signals].every(a=>insideOld(a.x,a.z)),'Existing native blockers, no duplicates');
assert.equal(g.blocks.length,275);
assert.deepEqual(f.errors,[]);
console.log(JSON.stringify({profile,artifact:R13_ARTIFACT.sha256,retainedOriginal:g.blocks.length,alreadySolidLamps:streetlamps.length,alreadySolidSignals:signals.length,witnessed},null,2));
