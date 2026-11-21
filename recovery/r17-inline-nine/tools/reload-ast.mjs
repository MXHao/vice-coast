import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

assert.equal(process.version, 'v24.22.3', 'Use the exact recorded Node runtime');
const acorn = createRequire(import.meta.url)('internal/deps/acorn/acorn/dist/acorn');
assert.equal(acorn.version, '8.18.0', 'Recorded Acorn parser is part of the pinned runtime');
export const PIN = Object.freeze({
  bytes: 7066619,
  html: '678c1bbda8fd63ef06263fe9cba76c53eb61116f6c642d8c9cda03dc0be1c2f9',
  app: '2335bd0b83ba1db179358cb8022607bfdd402c8513836a3045751960438df559'
});
export const BRIDGE = '__vcR12Extension_Bridge';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const parse = (s, sourceType='script') => acorn.parse(s, {ecmaVersion:2022,sourceType});
export function walk(n, visit, parent=null) {
  if (!n || typeof n.type !== 'string') return;
  visit(n,parent);
  for (const v of Object.values(n)) {
    if (Array.isArray(v)) for (const c of v) walk(c,visit,n);
    else if (v && typeof v === 'object') walk(v,visit,n);
  }
}
export function unique(list,what) {
  assert.equal(list.length,1,'Expected one ' + what + ', got ' + list.length);
  return list[0];
}
export function query(n,predicate) {
  const hits=[];
  walk(n,(k,p)=>{if(predicate(k,p)) hits.push({node:k,parent:p});});
  return hits;
}
export const self = (m,key) => m?.type==='MemberExpression'&&!m.computed &&
  m.object.type==='ThisExpression' && m.property.name===key;
export const ident = (m,key) => m?.type==='Identifier' && m.name===key;
export const slice = (s,n) => s.slice(n.start,n.end);
export function splitHtml(bytes) {
  const html=bytes.toString('utf8'); assert.ok(Buffer.from(html).equals(bytes),'UTF-8 must round trip');
  const tags=[...html.matchAll(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g)];
  assert.equal(tags.length,2,'R11 app + legal notices');
  assert.ok(tags[0][0].startsWith('<script>'));
  assert.ok(tags[1][0].startsWith('<script type="text/plain" id="third-party-notices">'));
  const from=tags[0].index+'<script>'.length, to=tags[0].index+tags[0][0].length-'</script>'.length;
  return {app:html.slice(from,to), before:html.slice(0,from),after:html.slice(to)};
}
export const classNames=['constructor','addVehicle','makeTraffic','toggleVehicle','walk','setCamera','save','step','frame'];
export const ALIASES=Object.freeze({
  Group:['Qe','this.isGroup=!0'],Mesh:['ae','this.isMesh=!0'],
  BufferGeometry:['oe','this.isBufferGeometry=!0'],BufferAttribute:['me','this.isBufferAttribute=!0'],
  Float32BufferAttribute:['Yt','super(new Float32Array(t),e,n)'],
  InstancedMesh:['xi','this.isInstancedMesh=!0'],Object3D:['bn','this.isObject3D=!0'],
  Vector2:['Gt','isVector2=!0'],Vector3:['pt','isVector3=!0'],
  Matrix4:['Fe','isMatrix4=!0'],Quaternion:['rn','this.isQuaternion=!0'],Color:['jt','this.isColor=!0'],
  MeshStandardMaterial:['te','this.isMeshStandardMaterial=!0'],
  MeshLambertMaterial:['nA','this.isMeshLambertMaterial=!0'],
  MeshBasicMaterial:['Ie','this.isMeshBasicMaterial=!0'],
  BoxGeometry:['Jn','this.type="BoxGeometry"'],PlaneGeometry:['zn','this.type="PlaneGeometry"'],
  CylinderGeometry:['eA','this.type="CylinderGeometry"'],SphereGeometry:['HA','this.type="SphereGeometry"'],
  LOD:['kn','this.isLOD=!0'],DataTexture:['Ke','this.isDataTexture=!0']
});
export const CONSTS=Object.freeze({
  DoubleSide:2,FrontSide:0,BackSide:1,RepeatWrapping:1000,ClampToEdgeWrapping:1001,
  LinearFilter:1006,LinearMipmapLinearFilter:1008,RGBAFormat:1023,
  SRGBColorSpace:'srgb',NoColorSpace:''
});
export function inspectProgram(app, requireOriginal=true) {
  if (requireOriginal) assert.equal(sha(app),PIN.app,'Byte-exact app pin');
  const tree=parse(app);
  const inner=tree.body[0]?.expression?.callee?.body;
  assert.equal(tree.body.length,1,'Expected vendor IIFE only');
  assert.equal(inner?.type,'BlockStatement');
  const game=unique(query(inner,n=>n.type==='ClassExpression'&&classNames.every(k=>n.body.body.some(m=>m.key.name===k))),'game class');
  assert.equal(game.parent.id?.name,'G0');
  const method=name=>unique(game.node.body.body.filter(m=>m.key.name===name),name+' method');
  const ctor=method('constructor'), frame=method('frame');
  const mount=unique(query(ctor,n=>n.type==='AssignmentExpression'&&n.operator==='='&&self(n.left,'last')&&
    n.right.type==='CallExpression'&&slice(app,n.right)==='performance.now()'),'constructor clock assignment');
  const first=unique(query(ctor,n=>n.type==='CallExpression'&&self(n.callee,'frame')&&n.arguments.length===1&&
    self(n.arguments[0],'last')),'constructor first frame');
  assert.equal(mount.parent,first.parent,'Initialize before clock in original startup sequence');
  assert.equal(mount.parent.type,'SequenceExpression');
  assert.equal(slice(app,mount.node),'this.last=performance.now()');
  assert.ok(mount.node.end<first.node.start);
  // Check that this is the final sequence after save/encounter initialization.
  assert.ok(slice(app,ctor).includes('this.encounter=new S0'));
  assert.ok(slice(app,ctor).includes('this.story=new W0'));
  const render=unique(query(frame,n=>n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&
    self(n.callee.object,'renderer')&&n.callee.property.name==='render'&&n.arguments.length===2&&
    self(n.arguments[0],'scene')&&self(n.arguments[1],'camera')),'frame renderer call');
  assert.equal(render.parent.type,'SequenceExpression');
  assert.equal(slice(app,render.node),'this.renderer.render(this.scene,this.camera)');
  const make=unique(query(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'Ms')),'native person factory');
  assert.match(slice(app,make.node),/^function Ms\(A=0\)/);
  const pose=unique(query(method('walk'),n=>n.type==='CallExpression'&&ident(n.callee,'hi')&&
    n.arguments.length===4&&self(n.arguments[0],'player')),'player pose call');
  assert.ok(pose.node.start>ctor.end);
  const bootstrap=unique(query(inner,n=>n.type==='NewExpression'&&ident(n.callee,'G0')),'real game app bootstrap');
  assert.match(slice(app,bootstrap.node),/^new G0\(Wt\("viewport"\),On,/);
  const declarations=new Map();
  for(const n of inner.body) if(n.type==='VariableDeclaration') {
    for(const d of n.declarations) {
      if (d.id.type!=='Identifier') continue;
      if (!declarations.has(d.id.name)) declarations.set(d.id.name,[]);
      declarations.get(d.id.name).push(d);
    }
  }
  for(const [exportName,[id,marker]] of Object.entries(ALIASES)){
    const n=unique(declarations.get(id)??[],exportName+' binding');
    assert.equal(n.init?.type,'ClassExpression');
    assert.ok(slice(app,n.init).includes(marker),exportName+' class signature');
  }
  return {tree,inner,game,method,ctor,frame,mount,render,bootstrap,declarations};
}
const forbidden=new Set([
  'window','document','globalThis','global','localStorage','sessionStorage','indexedDB','navigator','history',
  'fetch','XMLHttpRequest','WebSocket','EventSource','Worker','SharedWorker','Audio','Image','requestAnimationFrame',
  'performance','Date','process','require','eval','Function','setTimeout','setInterval','importScripts'
]);
export function moduleBody(source, exportName, trustedBridge=false) {
  assert.ok(!/<\/script/i.test(source),'Module cannot close its inline script');
  const ast=parse(source,'module');
  const exports=ast.body.filter(n=>n.type.startsWith('Export'));
  assert.ok(exports.length>0);
  for (const n of exports) {
    assert.equal(n.type,'ExportNamedDeclaration','Use local named declarations only');
    assert.ok(n.declaration && n.source==null && n.specifiers.length===0,'No re-export syntax');
    assert.ok(['FunctionDeclaration','VariableDeclaration','ClassDeclaration'].includes(n.declaration.type));
  }
  const ex=unique(exports.filter(n=>n.declaration?.type==='FunctionDeclaration'&&n.declaration.id.name===exportName),'named export '+exportName);
  assert.ok(!ex.declaration.async&&!ex.declaration.generator,exportName+' is deliberately synchronous');
  const imports=query(ast,n=>n.type==='ImportDeclaration'||n.type==='ImportExpression'||n.type==='MetaProperty');
  assert.equal(imports.length,0,'No imports, dynamic loading, or bundler runtime in a module');
  if(!trustedBridge) {
    walk(ast,(n,p)=>{
      if(n.type==='Identifier') assert.ok(!forbidden.has(n.name),'Art module cannot access '+n.name);
      if (n.type==='MemberExpression' && ident(n.object,'Math')) {
        assert.ok(!n.computed && n.property.name!=='random','Use a module-local deterministic generator');
      }
    });
  }
  return exports.toReversed().reduce((s,n)=>s.slice(0,n.start)+s.slice(n.declaration.start),source);
}
