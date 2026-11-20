// Internal regression fixture, not a release build, not a replacement for the authors' art.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {build} from '../build.mjs';

const rel=name=>new URL('../'+name,import.meta.url);
const vendor=await readFile(rel('vendor/R11.html'));
const bridge=await readFile(rel('src/bridge.mjs'),'utf8');
const skyline=`export function createArt({THREE}){
 const root=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(8,41,8),new THREE.MeshLambertMaterial({color:0x667581}));
 mesh.position.set(-302,30,-155);root.add(mesh);return {root};
}`;
const activity=`export function createArt({THREE,actors}){
 const root=new THREE.Group(),person=actors.create(1);
 person.position.set(-21,.17,22);root.add(person);
 return {root,update({elapsed}){actors.pose(person,elapsed*.42,.15,{time:elapsed,lookYaw:.16});}};
}`;
const {candidate,metadata}=build(vendor,{bridge,skyline,activity});
await mkdir(rel('local'),{recursive:true});
await writeFile(rel('local/framework-qa.html'),candidate);
await writeFile(rel('local/framework-qa-build.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify(metadata.candidate));
