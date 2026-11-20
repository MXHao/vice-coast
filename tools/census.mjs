// Actual R11 scene from game boot. Not a live renderer.
import {readFile} from 'node:fs/promises';
import {loadWorld} from './fixture.mjs';
import {PIN,sha} from './ast.mjs';
import assert from 'node:assert/strict';
const p=await readFile(new URL('../vendor/R11.html',import.meta.url));
assert.equal(sha(p),PIN.html);
const f=loadWorld(p),{game:g}=f.newGame(),meshes=[];
g.scene.updateMatrixWorld(true);
g.scene.traverse(o=>{
  if(!o.isMesh||!o.geometry?.attributes?.position||!o.name)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
  const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
  meshes.push({name:o.name,material:o.material?.name,triangles:(o.geometry.index?.count??o.geometry.attributes.position.count)/3,
    instances:o.isInstancedMesh?o.count:1, min:b.min.toArray(),max:b.max.toArray()});
});
assert.ok(g.blocks.length>=274);
console.log(JSON.stringify({bundle:PIN.html,blocks:g.blocks,staticNamedMeshes:meshes,errors:f.errors},null,2));
