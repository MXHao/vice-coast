import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadWorld} from '../tools/fixture.mjs';
import {CONSTS} from '../tools/ast.mjs';
const baseline=await readFile(new URL('../vendor/R11.html',import.meta.url));
const THREE=Object.freeze({...loadWorld(baseline).native,...CONSTS});
import {createArt} from '../src/skyline.mjs';
const {root}=createArt({THREE});
const lots=root.userData.scenicLots;
const array=(m,n)=>m.geometry.getAttribute(n).array;
test('distant construction is off-map, anchored, disjoint, and leaves both sightline corridors open',()=>{
 assert.equal(lots.length,29);
 const styles=new Set();
 for(const {id,min:a,max:b,style} of lots){
   styles.add(style);
   assert.ok(a[0] < -210&&b[0]<-210||b[2]< -290||a[2]>290,id+' outside old map');
   assert.ok(Math.abs(a[1]+.27)<1e-5&&b[1]>22&&b[1]<111,id+' height');
   assert.ok(b[0]<84,id+' inland of the exposed coastline');
   assert.ok(b[2]<-118||a[2]>118,id+' no new centre road silhouette in support band');
 }
 assert.deepEqual(styles,new Set(['court','needle','terrace','loggia','shed','silo']));
 for(let i=0;i<lots.length;i++)for(let j=i+1;j<lots.length;j++){
   const a=lots[i],b=lots[j];
   assert.ok(a.max[0]<b.min[0]||b.max[0]<a.min[0]||a.max[2]<b.min[2]||b.max[2]<a.min[2],a.id+' and '+b.id);
 }
});
test('native mesh buffers are finite, deterministically batched and never add shadow cost or gameplay',()=>{
 assert.equal(root.parent,null);
 assert.equal(root.children.length,2);
 const other=createArt({THREE}).root;
 for(const [i,o] of root.children.entries()){
   assert.equal(o.castShadow,false);assert.equal(o.receiveShadow,false);
   assert.ok(o.isMesh&&o.material.vertexColors&&o.material.fog);
   const p=array(o,'position'),c=array(o,'color'),n=array(o,'normal');
   assert.ok(p.length>900&&p.length%9===0&&p.length<=450000);
   assert.ok(p.every(Number.isFinite)&&n.every(Number.isFinite)&&c.every(v=>v>=0&&v<=1));
   assert.deepEqual(p,array(other.children[i],'position'));
   assert.deepEqual(c,array(other.children[i],'color'));
   const a=new THREE.Vector3(),b=new THREE.Vector3(),c0=new THREE.Vector3();
   for(let j=0;j<p.length;j+=9){
     a.fromArray(p,j);b.fromArray(p,j+3).sub(a);c0.fromArray(p,j+6).sub(a);
     assert.ok(b.cross(c0).lengthSq()>1e-11,'non-degenerate triangle');
   }
 }
});
test('subset of true silhouette peaks separate in distinct ordinary released route lenses',()=>{
 const descriptors=[
   {at:[92.762064,2.85,121.97688],look:[89.09736,.99,110.91829],fov:61.03,prefix:'north-'},
   {at:[59.28,2.84,-5.976],look:[47.34,.99,-5.289],fov:63.11,prefix:'upper-west-'},
   {at:[-174.00609,2.82698,59.19065],look:[-173.14034,.99,71.05437],fov:63.1061,prefix:'south-'}
 ];
 for(const s of descriptors){
   const cam=new THREE.PerspectiveCamera(s.fov,2560/1271,.15,1900);
   cam.position.fromArray(s.at);cam.lookAt(...s.look);cam.updateMatrixWorld();
   const inView=lots.filter(v=>v.id.startsWith(s.prefix)).map(lot=>{
      const {min,max}=lot;
      return new THREE.Vector3((min[0]+max[0])/2,max[1],(min[2]+max[2])/2).project(cam);
   }).filter(p=> Math.abs(p.x)<.99&&Math.abs(p.y)<.96&&Math.abs(p.z)<1);
   assert.ok(inView.length>=4,s.prefix+' has multiple viewable mass profiles');
   assert.ok(Math.max(...inView.map(v=>v.x))-Math.min(...inView.map(v=>v.x))>.095,s.prefix+' silhouette spread');
 }
});
test('stand-off shade geometry is above street activity and retained old roof/ground span',()=>{
 const skins=root.userData.externalUpperSkins;
 assert.equal(skins.length,8);
 assert.deepEqual(new Set(skins.map(s=>s.family)),new Set(['travertine','bronze','loading']));
 for(const {id,axis,wall,min,max} of skins){
   assert.ok(min[1]>=6.58&&max[1]<47,id);
   const k=axis==='x'?0:2,face=k===0?2:0;
   assert.ok(min[k]<wall&&max[k]>wall&&max[k]-min[k]<=1.09,id);
   assert.ok(max[face]-min[face]>14,id);
 }
});
