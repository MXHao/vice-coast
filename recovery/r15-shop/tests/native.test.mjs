import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {loadWorld} from '../../../tools/fixture.mjs';
import {runScenario} from '../../../tools/scenarios.mjs';
import {sha} from '../../../tools/ast.mjs';
import {DOOR} from '../src/session.mjs';
const base=readFileSync(new URL('../../../out/r14-core/index.html',import.meta.url));
const tag='source-only';
const prod=readFileSync(new URL('../out/'+tag+'.html',import.meta.url)), tested=readFileSync(new URL('../out/'+tag+'-probe.html',import.meta.url));
const SAVE='vice-coast-drive-v1';
const snapshot=(g)=>JSON.parse(JSON.stringify({v:1,x:g.pos.x,z:g.pos.z,cash:g.money,armed:g.encounter.armed,ammo:g.encounter.ammo,story:g.story.snapshot(),mission:g.mission}));
const plain=v=>JSON.parse(JSON.stringify(v));
function ui(){
  const nodes=[];
  class Node{
    constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.handlers={};nodes.push(this);}
    append(...items){for(const item of items){item.parent=this;this.children.push(item);}}
    remove(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}}
    addEventListener(event,fn){(this.handlers[event]??=[]).push(fn);}
    emit(event,detail={}){for(const fn of this.handlers[event]??[])fn({preventDefault(){},...detail});}
    setAttribute(k,v){this.attrs[k]=String(v);}
    removeAttribute(k){delete this.attrs[k];}
    focus(){doc.focused=this;}
  }
  const doc={createElement:tag=>new Node(tag),addEventListener(){},removeEventListener(){},body:new Node('body')};
  const find=id=>nodes.find(o=>o.dataset.armory===id&&o.parent);
  return {doc,find,node:(fn)=>nodes.find(fn)};
}
const save=(cash=120)=>({v:1,x:DOOR.x,z:DOOR.z,yaw:0,foot:true,vehicleId:0,carX:86,carZ:115,carYaw:0,cash,cam:0,heat:0,combat:{hp:100,armed:false,ammo:4,reserve:15},story:{active:false,stage:1}});
function seed(cash){return new Map([[SAVE,JSON.stringify(save(cash))],['vice-coast-graphics-v1','smooth'],['vc-touch-layout-v1','fixture-custom-position-bytes']]);}
function openFixture(cash=120,store=seed(cash)){
  const f=loadWorld(tested,{compact:false,storage:store}),w=f.newGame(),g=w.game,p=g.__vcArmoryProbe(),dom=ui();
  const observed={};
  const nativeRender=g.renderer.render.bind(g.renderer);
  g.renderer.render=(s,c)=>{if(s!==g.scene)observed.latest=[s,c];return nativeRender(s,c);};
  p.configureForFixture({doc:dom.doc,playing:()=>true,openMenu(){throw Error('not called in this fixture')}});
  return {...w,p,dom,f,store,observed};
}
function press(p,code){return p.key({code,preventDefault(){}});}
function advanceToCounter(w){
  press(w.p,'KeyW');
  for(let t=0;t<128;t++)w.delta(1000/60);
  w.p.key({code:'KeyW'},true);
  assert.ok(w.p.position().z<-.8&&w.p.position().z>-1.6,w.p.position().z);
  press(w.p,'KeyE');
  assert.ok(w.p.view().panel);
  w.delta(16);
}
test('exact game engine, doorway approach, native pause, in-room keyboard/controls, safe leave, and persistent one-buy save', ()=>{
  const w=openFixture(),{game:g,p,dom,store}=w;
  assert.notEqual(sha(prod),sha(tested));assert.equal(prod.includes(Buffer.from('__vcArmoryProbe(){')),false);
  assert.equal(g.car,null);
  assert.equal(g.blocked(DOOR.x,DOOR.z,.29),false);
  assert.equal(g.blocked(DOOR.exitX,DOOR.exitZ,.29),false);
  assert.deepEqual(plain(p.devices()),{shelf:0,selected:0});
  assert.equal(p.audition(),undefined);
  const x0=g.player.position.x,z0=g.player.position.z;
  g.player.position.x-=7;assert.equal(p.action(),false);g.player.position.set(x0,g.player.position.y,z0);
  g.encounter.armed=true;assert.equal(p.action(),false);g.encounter.armed=false;
  g.heat=1;assert.equal(p.action(),false);g.heat=0;
  g.mission={id:0};assert.equal(p.action(),false);g.mission=null;
  g.story.active=true;g.story.stage=4;assert.equal(p.action(),false);g.story.active=false;g.story.stage=1;
  const before=snapshot(g);
  w.delta(16);assert.ok(dom.find('enter'));
  assert.equal(g.paused,false);g.keys.add('KeyW');g.drag={id:8};dom.find('enter').emit('click');
  assert.equal(g.paused,true);assert.equal(g.drag,null);assert.equal(g.keys.size,0);
  assert.deepEqual(plain(p.devices()),{shelf:3,selected:0});assert.equal(p.audition().decoded,0);
  assert.equal(p.action(),true,'E inside without reaching counter is handled but no panel');assert.equal(p.view().panel,false);
  w.delta(16);
  advanceToCounter(w);
  assert.deepEqual(plain(p.devices()),{shelf:3,selected:1});
  dom.find('quote').emit('click');assert.equal(g.money,120);assert.equal(p.view().quote,null);
  g.money=220;dom.find('quote').emit('click');assert.equal(p.view().quote.price,160);assert.equal(g.money,220);
  dom.find('cancel').emit('click');assert.equal(p.view().quote,null);
  const select=dom.node(n=>n.tag==='select');
  select.value='m416';select.emit('change');assert.equal(p.view().selected,'m416');assert.deepEqual(plain(p.devices()),{shelf:3,selected:1});assert.ok(dom.find('quote').hidden);assert.equal(p.audition().decoded,0);
  select.value='p92';select.emit('change');dom.find('quote').emit('click');
  dom.find('confirm').emit('click');assert.equal(g.money,60);assert.equal(p.view().owns,true);
  const completed=w.f.trace.length;dom.find('confirm').emit('click');assert.equal(w.f.trace.length,completed);assert.equal(g.money,60);
  const stored=JSON.parse(store.get(SAVE));assert.equal(stored.v,1);assert.equal(stored.cash,60);assert.deepEqual(stored.armory,{schema:1,owned:['p92']});
  assert.equal(stored.combat.armed,false);assert.equal(stored.combat.ammo,before.ammo);assert.deepEqual(stored.story,before.story);
  dom.find('close').emit('click');assert.deepEqual(plain(p.devices()),{shelf:3,selected:0});
  dom.find('leave').emit('click');assert.equal(g.paused,false);assert.equal(g.player.position.z,DOOR.exitZ);assert.equal(g.player.position.x,DOOR.exitX);
  assert.deepEqual(plain(p.devices()),{shelf:0,selected:0});assert.equal(p.audition(),undefined);
  assert.equal(store.get('vice-coast-graphics-v1'),'smooth');assert.equal(store.get('vc-touch-layout-v1'),'fixture-custom-position-bytes');
  const second=openFixture(0,store);
  assert.equal(second.game.money,60);assert.equal(second.game.encounter.armed,false);assert.ok(second.p.view().owns);
  second.game.save();assert.deepEqual(JSON.parse(store.get(SAVE)).armory,stored.armory);
});
const scenario=process.env.R15_SCENARIO==='campaign'?'campaign':'route';
for(const compact of [false,true])test('exact native '+scenario+' and serialization while unopened ('+(compact?'compact':'desktop')+')', ()=>{
  const a=runScenario(loadWorld(base,{compact}),scenario),b=runScenario(loadWorld(prod,{compact}),scenario);
  assert.equal(sha(JSON.stringify(a)),sha(JSON.stringify(b)));
});
