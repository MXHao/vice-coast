import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridge} from '../src/bridge.mjs';
class Group {
 constructor(){this.children=[];this.parent=null;this.name='';this.visible=true;}
 add(n){ assert.equal(n.parent,null);n.parent=this;this.children.push(n); }
}
test('separate art groups, private owner actors, clock and viewport values without map/game objects',()=>{
 const scene=new Group(), nativeObject=new Group();
 scene.add(nativeObject);nativeObject.name='original city';const orig=new Group();let writes=[];
 const config={Group}, bridge=createBridge([
  ({THREE,actors})=>{
   assert.throws(()=>actors.create(1),/no actor permission/);
   return {root:new THREE.Group()};
  },
  ({THREE,actors})=>{
   assert.ok(Object.isFrozen(THREE)&&Object.isFrozen(actors));
   assert.throws(()=>actors.create(0),/1 to 9/);
   const actor=actors.create(1),root=new THREE.Group();root.add(actor);
   assert.throws(()=>actors.pose(orig,2,1),/Not an actor/);
   return {root,update(input){
    assert.ok(Object.isFrozen(input)&&Object.isFrozen(input.eye));
    assert.deepEqual(Object.keys(input),['elapsed','eye']);
    assert.equal(input.eye.x,4);
    actors.pose(actor,2,1.8,{time:input.elapsed,untouched:'not passed',backpedal:true});
   }};
  }
 ]);
 const add=()=>new Group(),pose=(actor,p,g,w)=>writes.push([actor,p,g,w]);
 bridge.mount(scene,config,add,pose);bridge.mount(scene,config,add,pose);
 assert.equal(scene.children.length,3,'Only one mount per scene');
 assert.equal(scene.children[0],nativeObject);
 assert.equal(scene.children[1].name,'VICE COAST R12 | skyline');
 assert.equal(scene.children[2].name,'VICE COAST R12 | activity');
 bridge.update(scene,15,4,5,6);
 assert.equal(writes.length,1);assert.equal(writes[0][0].parent,scene.children[2].children[0]);
 assert.deepEqual(writes[0].slice(1),[2,1.4,{time:15,backpedal:true}]);
 assert.ok(nativeObject.visible);
});
test('bad owned art is isolated; a render update exception hides only the faulty additive layer',()=>{
 const scene=new Group(),o=new Group();scene.add(o);const errors=[],record=console.error;
 try {
  console.error=(...v)=>errors.push(v);
  const x=createBridge([
   ({THREE})=>({root:new THREE.Group(),update(){throw Error('synthetic') }}),
   ()=>({root:o})
  ]);
  x.mount(scene,{Group},()=>null,()=>{});
  x.update(scene,2,0,0,0);x.update(scene,3,0,0,0);
 } finally {console.error=record;}
 assert.equal(scene.children.length,2);assert.ok(o.visible);assert.equal(scene.children[1].visible,false);
 assert.equal(errors.length,2);
 assert.deepEqual(errors.map(x=>x[0]),['R12 mount failed: activity','R12 update failed: skyline']);
});

test('third detached warehouse is static art without actor capability and cannot duplicate on remount',()=>{
 const scene=new Group();
 const b=createBridge([({THREE})=>({root:new THREE.Group()}),({THREE})=>({root:new THREE.Group()}),
  ({THREE,actors})=>{
   assert.throws(()=>actors.create(2),/no actor permission/);
   assert.throws(()=>actors.pose(new Group(),1,.4),/Not an actor/);
   return {root:new THREE.Group()};
  }
 ]);
 const unused=()=>assert.fail('Warehouse cannot access owned actor factory');
 b.mount(scene,{Group},unused,unused);b.mount(scene,{Group},unused,unused);
 assert.deepEqual(scene.children.map(o=>o.name),['VICE COAST R12 | skyline','VICE COAST R12 | activity','VICE COAST R13 | warehouse']);
 b.update(scene,1,0,0,0);
});
