// Audits the exact deployed v8 bytes and candidate, only using a synthetic save store.
// The v8 read/save entrypoints come from the deployed compiled script, not a
// handwritten reimplementation. The R13 side runs its actual native constructor.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {classNames,ident,parse,query,sha,slice,splitHtml,unique,PIN} from './ast.mjs';
import {R13_ARTIFACT} from './versions.mjs';
import {loadWorld} from './fixture.mjs';
import {SAVE} from './scenarios.mjs';

const LIVE_V8='1bec06f4ba649f9379fddfdcd5212e7871713cbeb0e28a3f682d743afbf06943';
const [v8File,candidateFile,legacyTrace]=process.argv.slice(2);
assert.ok(v8File&&candidateFile&&legacyTrace,'Pass exact deployed v8 HTML, R13 HTML and the CPU-only R11 campaign trace');
const [v8,candidate,trace]=await Promise.all([readFile(v8File),readFile(candidateFile),readFile(legacyTrace,'utf8').then(JSON.parse)]);
assert.equal(sha(v8),LIVE_V8);
assert.equal(sha(candidate),R13_ARTIFACT.sha256);
assert.equal(trace.sha256,PIN.html);
assert.equal(trace.scenario,'campaign');
assert.equal(trace.saveTrace.length,35);

function extractSave(bytes){
 const {app,before,after}=splitHtml(bytes), tree=parse(app);
 const saveKey=unique(query(tree,n=>n.type==='VariableDeclarator'&&n.init?.type==='Literal'&&n.init.value===SAVE),'same-origin storage key');
 const id=saveKey.node.id.name;
 const calls=query(tree,n=>n.type==='CallExpression'&&ident(n.callee?.object,'localStorage'));
 const game=unique(query(tree,n=>n.type==='ClassExpression'&&classNames.every(k=>n.body.body.some(m=>m.key.name===k))),'engine class');
 const save=unique(game.node.body.body.filter(n=>n.key.name==='save'),'actual save method');
 const read=unique(query(tree,n=>n.type==='FunctionDeclaration'&&calls.some(x=>x.node.start>n.start&&x.node.end<n.end&&
   x.node.callee.property.name==='getItem'&&ident(x.node.arguments[0],id))),'actual read method');
 const menu=unique(query(tree,n=>n.type==='FunctionDeclaration'&&['继续剧情','进入剧情'].every(label=>query(n,x=>x.type==='Literal'&&x.value===label).length===1)),'title save continuation');
 assert.equal(query(menu.node,n=>n.type==='Literal'&&n.value==='重温剧情').length,1);
 assert.match(before,/id="startText"/);
 assert.deepEqual(calls.map(({node:n})=>[n.callee.property.name,n.arguments[0].type==='Literal'?n.arguments[0].value:n.arguments[0].name]),[
  ['getItem',id],['setItem',id],['getItem','vc-audio'],['setItem','vc-audio']
 ]);
 const src=`const ${id}=${JSON.stringify(SAVE)}; ${slice(app,read.node)}
 globalThis.api = {read:${read.node.id.name},write:({${slice(app,save)}}).save};`;
 const raw=Buffer.from(bytes);
 const notices=after.match(/<script type="text\/plain" id="third-party-notices">[\s\S]+?<\/script>/g);
 assert.equal(notices.length,1);
 // Deliberately reject external HTML assets and executable network endpoints.
 const markup=before+after.replace(notices[0],'');
 assert.doesNotMatch(markup,/(?:src|href|action)\s*=\s*["'](https?:|\/\/)/i);
 assert.doesNotMatch(markup,/@import\s*(?:url|["'])/i);
 const knownNetwork=['fetch','sendBeacon','WebSocket','EventSource','XMLHttpRequest','RTCPeerConnection'];
 assert.equal(query(tree,n=>['CallExpression','NewExpression'].includes(n.type)&&knownNetwork.includes(n.callee?.name??n.callee?.property?.name)).length,0);
 const patterns=[
   /\b(?:sk-(?:proj-|svcacct-)?)[a-zA-Z0-9_-]{20,}/,
   /\b(?:gh[pousr]_[a-zA-Z0-9]{30,}|github_pat_[a-zA-Z0-9_]{35,}|AKIA[A-Z0-9]{16})\b/,
   /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
   /\b(?:libfile_|sediment:\/\/|appgprj_|\/workspace\/|\/home\/agent\/\.codex\/)/
 ];
 for(const pattern of patterns)assert.doesNotMatch(String(raw),pattern);
 return {src,notices:notices[0]};
}
const old=extractSave(v8),latest=extractSave(candidate);
assert.equal(latest.notices,old.notices,'Public third-party notices byte-identical from v8');
const storage=new Map();
const {api}=(()=>{const context=vm.createContext({localStorage:{
 getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))
}},{codeGeneration:{strings:false,wasm:false}});
 new vm.Script(old.src,{filename:'compiled-v8-storage-fixture.js'}).runInContext(context,{timeout:2000});return context;})();
const v8Resume=(oldSave)=>{
 const {carX:x,carZ:z,carYaw:yaw,type,color}=oldSave;
 const car={type,color,yaw,mesh:{position:{x,z}}};
 const cars=Array.from({length:17},()=>({}));cars[oldSave.vehicleId]=car;
 const fake={
  car:oldSave.foot?null:car,lastVehicle:car,hero:car,cars,pos:{x:oldSave.x,z:oldSave.z},
  yaw:oldSave.yaw,money:oldSave.cash,done:oldSave.done,camMode:oldSave.cam,
  mission:oldSave.job,waypoint:oldSave.pin,heat:oldSave.heat,
  lead:{mesh:{position:{x:oldSave.lead.x,z:oldSave.lead.z}},index:oldSave.lead.index},
  player:{rotation:{y:oldSave.bodyYaw}},story:{snapshot:()=>oldSave.story},encounter:{save:()=>oldSave.combat}
 };
 api.write.call(fake);
 const bytes=storage.get(SAVE);
 const saved=JSON.parse(bytes);
 assert.equal(JSON.stringify(api.read()),bytes,'v8 reads its own exact serialized save');
 assert.equal(saved.v,1);
 assert.equal(saved.story.stage,oldSave.story.stage);
 return bytes;
};
assert.equal(api.read(),null);
storage.set(SAVE,'{"v":2}');
assert.equal(api.read(),null);
const samples=[1,6,8,11,20,29,32,34];
const compactStore=new Map([['vc-audio','0']]),desktopStore=new Map([['vc-audio','0']]);
const profiles=[loadWorld(candidate,{storage:desktopStore}),loadWorld(candidate,{storage:compactStore,compact:true})];
const outcomes=[];
for(const [index,row] of samples.entries()){
 const [ordinal,key,bytes]=trace.saveTrace[row-1];
 assert.equal(ordinal,row);assert.equal(key,SAVE);
 const expected=JSON.parse(bytes), legacy=v8Resume(expected);
 const f=profiles[index%2];
 f.storage.set(SAVE,legacy);
 const {game}=f.newGame();
 assert.equal(game.pos.x,expected.x);assert.equal(game.pos.z,expected.z);
 assert.equal(!game.car,expected.foot);
 assert.equal(game.money,expected.cash);
 assert.deepEqual(Array.from(game.done),expected.done);
 assert.equal(game.story.stage,expected.story.stage);
 assert.equal(game.story.ending,expected.story.ending);
 assert.equal(f.storage.get(SAVE),legacy,'Loading old bytes does not rewrite storage');
 assert.equal(f.storage.get('vc-audio'),'0');
 assert.equal(game.blocks.length,275);
 assert.equal(game.walkers.length,25);
 game.save();
 const saved=JSON.parse(f.storage.get(SAVE));
 assert.equal(saved.v,1);assert.equal(saved.story.stage,expected.story.stage);
 assert.equal(saved.story.ending,expected.story.ending);
 assert.equal(saved.cash,expected.cash);
 assert.deepEqual(f.errors,[]);
 outcomes.push({slot:row,profile:index%2?'compact':'desktop',foot:expected.foot,stage:expected.story.stage,ending:expected.story.ending});
}
console.log(JSON.stringify({v8:LIVE_V8,r13:R13_ARTIFACT.sha256,noticeSHA:sha(old.notices),sameOriginKey:SAVE,slots:outcomes,
 note:'Synthetic saved states from a historical CPU replay; exact v8 serializer and R13 native restore. No real browser storage or rendering.'},null,2));
