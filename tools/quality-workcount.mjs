// Offline operation count on the actual native startup walker positions. Not a timer.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha} from './ast.mjs';
import {loadWorld} from './fixture.mjs';
import {R13_ARTIFACT} from './versions.mjs';
const [prev,next]=process.argv.slice(2);
// Hash ordered native object transforms, visibility, local material assignments and
// actual geometry data once per shared geometry; UUIDs are not rendering state.
function sceneDigest(g){
 const objects=[],geometries=[],materials=[],geos=new Map(),mats=new Map();
 const attr=a=>{if(!a)return null;const v=a.array??a.data?.array;return [a.itemSize,a.count,a.normalized,v?.constructor.name,v&&sha(Buffer.from(v.buffer,v.byteOffset,v.byteLength))];};
 function geometry(x){if(!x)return null;if(!geos.has(x)){geos.set(x,geos.size);geometries.push([x.name,x.type,attr(x.index),Object.keys(x.attributes).sort().map(k=>[k,attr(x.attributes[k])]),x.groups]);}return geos.get(x);}
 function material(m){if(!m)return null;if(Array.isArray(m))return m.map(material);if(!mats.has(m)){mats.set(m,mats.size);materials.push([m.name,m.type,m.color?.getHex(),m.emissive?.getHex(),m.roughness,m.metalness,m.opacity,m.transparent,m.side,m.alphaTest,m.depthWrite,m.blending,!!m.map,!!m.normalMap,!!m.roughnessMap,!!m.envMap]);}return mats.get(m);}
 const visit=o=>{objects.push([o.type,o.name,o.children.length,o.visible,o.position.toArray(),o.quaternion.toArray(),o.scale.toArray(),o.castShadow,o.receiveShadow,o.renderOrder,o.frustumCulled,geometry(o.geometry),material(o.material),o.count,attr(o.instanceMatrix),attr(o.instanceColor)]);};
 g.scene.traverse(visit);
 const sun=g.scene.getObjectByName('Evening sun | northwest');
 return {objects:objects.length,geometries:geos.size,materials:mats.size,sha:sha(JSON.stringify([objects,geometries,materials,sun.shadow.mapSize.toArray(),sun.shadow.bias,sun.shadow.radius,g.camera.position.toArray(),g.camera.projectionMatrix.toArray(),g.renderer.shadowMap.enabled,g.renderer.shadowMap.autoUpdate,g.renderer.toneMapping,g.renderer.toneMappingExposure]))};
}
let baseline,rows=[];
for(const file of [prev,next]){
 const bytes=await readFile(file);
 if(!rows.length)assert.equal(sha(bytes),R13_ARTIFACT.sha256);
 const f=loadWorld(bytes,{compact:true}),g=f.newGame().game;
 let gets=0;
 for(const b of g.blocks)for(const k of ['minX','maxX','minZ','maxZ']){
   const v=b[k];Object.defineProperty(b,k,{enumerable:true,get(){gets++;return v;}});
 }
 for(let i=0;i<45;i++)g.step(1/60,true);
 const walkers=g.walkers.map(({phase,dir,pace,mesh})=>[phase,dir,pace,mesh.position.toArray()]);
 if(baseline)assert.equal(JSON.stringify(walkers),baseline);else baseline=JSON.stringify(walkers);
 rows.push({sha:sha(bytes),steps:45,walkers:g.walkers.length,allObstacleBoundReads:gets,scene:sceneDigest(g)});assert.deepEqual(f.errors,[]);
}
assert.deepEqual(rows[0].scene,rows[1].scene);
assert.ok(rows[1].allObstacleBoundReads<rows[0].allObstacleBoundReads*.75);
console.log(JSON.stringify(rows));
