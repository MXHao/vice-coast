import assert from 'node:assert/strict';
import test from 'node:test';
import {createP92Loadout, validateProfile} from '../src/loadout.mjs';
const T={magazine:3,cadence:.2,reload:.7,equip:.5};
const settle=(d,s)=>{for(let i=0;i<Math.ceil(s/.025);i++)d.tick(.025);};
test('permission is explicit and per game; menu and scope changes cannot auto-equip or emit a round',()=>{
  const a=createP92Loadout(T);
  assert.equal(a.fire(),'native');assert.equal(a.toggle(true),'native');
  a.authorize();assert.ok(a.pending());assert.equal(a.fire(),'native');assert.equal(a.state().loaded,3);
  assert.equal(a.applyOutside(false),false);assert.equal(a.pending(),false);assert.equal(a.applyOutside(true),false);
  assert.equal(a.toggle(true),'draw');assert.equal(a.fire(),'busy');assert.equal(a.state().loaded,3);
  settle(a,.6);assert.equal(a.fire(),'shot');assert.equal(a.fire(),'busy');assert.equal(a.state().loaded,2);
  assert.equal(a.toggle(true),'holster');assert.equal(a.fire(),'native');
  const reloaded=createP92Loadout(T);assert.equal(reloaded.toggle(true),'native');
});
test('optional rounds, recoil and reload are bounded and never materialize external state',()=>{
  const a=createP92Loadout(T);a.authorize();assert.equal(a.applyOutside(true),true);settle(a,.6);
  for(let i=0;i<3;i++){assert.equal(a.fire(),'shot');assert.equal(a.fire(),'busy');settle(a,.23);}
  assert.equal(a.state().loaded,0);assert.equal(a.fire(),'empty');assert.equal(a.fire(),'busy');
  settle(a,.8);assert.equal(a.state().loaded,3);assert.equal(a.state().reserve,3);
  assert.equal(a.reloadNow(),false);
  assert.equal(a.fire(),'shot');assert.ok(a.reloadNow());a.holster();
  settle(a,1);assert.equal(a.state().loaded,2);assert.equal(a.state().reserve,3);assert.equal(a.state().active,false);
  assert.throws(()=>validateProfile({...T,speed:1}));
});
