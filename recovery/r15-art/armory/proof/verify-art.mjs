// Offline CPU validation. geometry mode uses a caller-provided local Three.js
// module. Native mode uses an independently retained, byte-pinned R14 and the
// compatible no-render fixture. No browser, game startup UI, or file mutation.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {catalog,createArmoryProp,finishes} from '../forms.mjs';
import {presentation,createPropDisplay} from '../display.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const rel=(p)=>new URL('../../'+p,import.meta.url);
const pin=JSON.parse(readFileSync(new URL('./geometry-pins.json',import.meta.url)));
for (const [name,expected] of Object.entries(pin.sourcePins))assert.equal(hash(readFileSync(rel(name))),expected,name);
const [mode,module,html]=process.argv.slice(2);assert(mode&&module);
const inject=await import(pathToFileURL(resolve(module)));
let T=inject,f;
if(mode==='native'){
 assert(html);const bytes=readFileSync(html);
 assert.equal(hash(bytes),pin.r14Standalone,'exact R14 HTML');
 f=inject.loadWorld(bytes);T=f.native;
}else assert.equal(mode,'geometry');
const ids=catalog.map(o=>o.id);
assert.equal(ids.length,28);assert.equal(new Set(ids).size,28);
assert.deepEqual(ids,Object.keys(pin.models));
assert.deepEqual(Object.keys(presentation),catalog.map(x=>x.id));
const restored={};
for(const {id} of catalog){
 const prop=createArmoryProp(T,id),geo=[],colors=new Set();
 assert(prop.isGroup&&!prop.parent);assert.equal(prop.children.length,3,id);
 let count=0;
 for(const {geometry:g,material:m} of prop.children){
  const p=g.attributes.position,c=g.attributes.color;
  assert(m.isMeshStandardMaterial&&!m.transparent&&!m.map&&m.vertexColors);
  const fn=finishes[m.name.split(' / ').at(-1)];
  assert.equal(m.roughness,fn.roughness);assert.equal(m.metalness,fn.metalness);
  for(const a of [p,c,g.attributes.normal])assert(a.array.every(Number.isFinite),id);
  for(let i=0;i<p.count;i+=3){
   const a=new T.Vector3().fromBufferAttribute(p,i),d=new T.Vector3().fromBufferAttribute(p,i+1).sub(a),e=new T.Vector3().fromBufferAttribute(p,i+2).sub(a);
   assert(d.cross(e).length()>1e-13,id+' triangle');colors.add([c.getX(i),c.getY(i),c.getZ(i)].join(','));
  }
  geo.push(Buffer.from(p.array.buffer));count+=p.count/3;
  g.dispose();m.dispose();
 }
 const shape=hash(Buffer.concat(geo));assert.deepEqual([count,colors.size,shape],pin.models[id].slice(0,3),id+' restored position bytes');
 restored[id]={count,swatches:colors.size,shape};
}
const parent=new T.Group(),other=new T.Group(),sibling=new T.Group();
parent.add(sibling);
const slot=createPropDisplay(T,parent),independent=createPropDisplay(T,other);let released=0;
const independentlyShown=independent.show('p92').group;
for(const {id} of catalog){
 const obj=slot.show(id);assert(obj.available&&obj.group.parent===parent);assert.equal(slot.show(id).group,obj.group);
 assert.equal(parent.children.length,2);assert.equal(parent.children[0],sibling);
 assert(!slot.show('draft-unsupported').available);
 assert.equal(independent.show('p92').group,independentlyShown);
 for(const o of obj.group.children)for(const r of [o.geometry,o.material])r.addEventListener('dispose',()=>released++);
}
slot.clear();slot.dispose();slot.dispose();assert.equal(released,catalog.length*6);
assert.equal(parent.children.length,1);assert.equal(parent.children[0],sibling);
assert.throws(()=>slot.show('p92'));assert.equal(other.children.length,1);independent.dispose();assert.equal(other.children.length,0);
console.log(JSON.stringify({mode,nativeRevision:T.REVISION??null,verifiedHistoricalMeshPositions:Object.keys(restored).length,sourcePins:Object.keys(pin.sourcePins).length,released,uniqueIDs:ids.length,restored},null,2));
