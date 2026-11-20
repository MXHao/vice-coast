import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {qualityCandidate} from '../tools/quality-candidate.mjs';
import {panelProjection} from '../tools/quality-panel-fixture.mjs';
import {createWalkerIndex} from '../src/walker-index.mjs';
import {loadWorld} from '../tools/fixture.mjs';
const bytes=await qualityCandidate(), makeUI=panelProjection(bytes);
const key='vice-coast-graphics-v1',save='vice-coast-drive-v1';
const mem=(map,throws=false)=>({getItem:k=>{if(throws)throw Error('blocked');return map.get(k)??null;},setItem:(k,v)=>{if(throws)throw Error('blocked');map.set(k,v);}});
for(const compact of [false,true])test((compact?'phone':'desktop')+': actual compiled menu, tap/close, live targets, settings + prior save',()=>{
 const map=new Map([[save,'old-save-bytes']]),ui=makeUI(mem(map),{compact}),{ids,probe}=ui, prefs=probe.graphics;
 const panel=ids.get('panel'),close=ids.get('close'),title=ids.get('vcq-title');
 assert.equal(title.textContent,'画质');title.focus();title.onclick();
 assert.equal(probe.scene(),'graphics');assert.ok(panel.innerHTML.includes('aria-pressed="true"'));assert.ok(!map.has(key));
 ui.pick('vcq-balanced');assert.equal(map.get(key),'balanced');close.onclick();assert.equal(ui.doc.activeElement,title);
 const ratios=[],snaps=[],disposed=[];
 const renderer={setPixelRatio:v=>ratios.push(v),shadowMap:{},domElement:{focus(){}}};
 const s={mapSize:{x:0,y:0,set(x,y){this.x=x;this.y=y;}},dispose(){this.map?.dispose();this.mapPass?.dispose();}};
 assert.equal(prefs.bindRenderer(renderer,2.5),1.5);prefs.bindSun(renderer,{castShadow:true,shadow:s},4096,n=>snaps.push(n));s.mapSize.set(snaps.at(-1),snaps.at(-1));
 s.map={dispose:()=>disposed.push('map')};s.mapPass={dispose:()=>disposed.push('mapPass')};
 const pauses=[];ui.play({renderer,setPaused:p=>pauses.push(p),menuView:0,viewName:()=>''});
 ui.pause();assert.equal(probe.scene(),'pause');assert.equal(panel.buttons[0].dataset.action,'vcq-open');
 ui.pick('vcq-open');const clicks=pauses.length;const focus=ui.pick('vcq-smooth');ui.pick('vcq-smooth');
 assert.equal(focus.getAttribute('aria-pressed'),'true');assert.equal(ui.doc.activeElement,focus);assert.equal(pauses.length,clicks);
 assert.equal(s.map,null);assert.equal(s.mapPass,null);assert.deepEqual(disposed,['map','mapPass']);assert.equal(s.mapSize.x,1024);assert.equal(s.needsUpdate,true);
 assert.equal(renderer.shadowMap.needsUpdate,true);assert.deepEqual(ratios,[1]);assert.deepEqual(snaps,[2048,1024]);
 assert.equal(map.get(save),'old-save-bytes');assert.deepEqual([...map.keys()],[save,key]);
 const restart=makeUI(mem(map),{compact});assert.equal(restart.probe.graphics.ratio(2.5),1);
 ui.pick('vcq-high');assert.deepEqual(ratios,[1,2.5]);assert.deepEqual(snaps,[2048,1024,4096]);assert.equal(s.mapSize.y,4096);
 ui.pick('close');assert.equal(probe.scene(),'pause');ui.pick('resume');assert.equal(probe.scene(),'');assert.equal(ids.get('overlay').hidden,true);
});
test('invalid or inaccessible preference falls back to highest; blocked writes keep live render choice; lower settings remain meaningful on 1x displays',()=>{
 for(const fail of [false,true]){
 const m=new Map([[key,'unsupported'],[save,'x']]),u=makeUI(mem(m,fail)),p=u.probe.graphics;
 assert.equal(p.ratio(1),1);assert.equal(p.shadowSize(2048),2048);
 u.ids.get('vcq-title').onclick();u.pick('vcq-balanced');assert.equal(p.ratio(1),.84);assert.equal(p.shadowSize(2048),2048);
 u.pick('vcq-smooth');assert.equal(p.ratio(1),.68);assert.equal(p.shadowSize(512),512);assert.equal(p.shadowSize(4096),1024);
 if(fail)assert.ok(u.ids.get('panel').status.textContent.includes('本次有效'));
 }
});
test('native compiled exact save/scene criteria unaffected by persistent graphics choice',()=>{
 const store=new Map([[key,'smooth']]);
 const f=loadWorld(bytes,{storage:store,compact:true}),w=f.newGame(),g=w.game;
 const sun=g.scene.getObjectByName('Evening sun | northwest');
 assert.equal(sun.shadow.mapSize.x,1024);assert.equal(sun.castShadow,true);assert.equal(g.camera.far,1900);
 assert.equal(g.walkers.length,25);assert.equal(g.cars.length,17);assert.equal(g.blocks.length,275);
 assert.ok(g.scene.getObjectByName('VICE COAST R13 | warehouse'));
 g.money=317;g.save();const old=store.get(save);store.set(key,'high');
 const h=loadWorld(bytes,{storage:store,compact:true}).newGame().game;
 assert.equal(h.money,317);assert.equal(h.scene.getObjectByName('Evening sun | northwest').shadow.mapSize.x,4096);
 assert.equal(store.get(save),old);assert.deepEqual(f.errors,[]);
});
test('walker batch matches exact boundary and overlap tests on edges, mutations, pushes, reorder, and native extent fallbacks',()=>{
 const index=createWalkerIndex(),game={blocks:[],car:null,blocked(x,z,r){return x<-207+r||x>(this.car?136:141)-r||z<-288+r||z>288-r||this.blocks.some(b=>x+r>b.minX&&x-r<b.maxX&&z+r>b.minZ&&z-r<b.maxZ);}};
 let seed=24771;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<275;i++){let x=-205+random()*345,z=-286+random()*570;game.blocks.push({minX:x,minZ:z,maxX:x+4,maxZ:z+9});}
 const rounds=()=>{const q=index.batch(game);for(let i=0;i<2000;i++){let x=-210+random()*370,z=-310+random()*620,r=[.19,.22,.25,.4][i%4];assert.equal(q.blocked(x,z,r),game.blocked(x,z,r));}
 for(const x of [-207+.19,136-.19,141-.19,16-.19,-16+.19])for(const z of [-288+.19,288-.19,16]) assert.equal(q.blocked(x,z,.19),game.blocked(x,z,.19));};
 rounds();game.car={};game.blocks.reverse();rounds();Object.assign(game.blocks[13],{minX:15.8,maxX:16.2,minZ:16,maxZ:17});rounds();
 game.blocks.push({minX:100,minZ:100,maxX:103,maxZ:104});assert.equal(index.batch(game).blocked(102,101,.22),true);
 Object.assign(game.blocks.at(-1),{minX:33,maxX:34});rounds();game.blocks.splice(7,9);rounds();
 const before=game.blocks[4];delete game.blocks[4];assert.equal(index.batch(game),game);game.blocks[4]=before;rounds();
});
