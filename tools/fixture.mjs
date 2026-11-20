// A separate, deliberately non-rendering test projection of actual delivered code.
// Does not execute menus or the candidate in a real browser. No game assets are replaced.
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {ALIASES,PIN,inspectProgram,splitHtml,sha,query,unique,self,ident,slice} from './ast.mjs';

const req=createRequire(import.meta.url), bCanvas=req('@napi-rs/canvas');
assert.equal(req('@napi-rs/canvas/package.json').version,'0.1.100','fixture Canvas pin');
const forApp= (bytes)=> {
  const p=splitHtml(bytes);
  const original=sha(bytes)===PIN.html, g=inspectProgram(p.app,original);
  const ctor=g.ctor, app=p.app;
  const renderFactory=unique(query(ctor,n=>n.type==='NewExpression'&&n.arguments.length===1&&
    n.arguments[0].type==='ObjectExpression'&&n.arguments[0].properties.some(p=>
       p.key.name==='powerPreference'&&p.value.value==='high-performance')),'native renderer constructor');
  assert.equal(slice(app,renderFactory.node.arguments[0]),'{antialias:!0,powerPreference:"high-performance"}');
  const probe=unique(query(ctor,n=>n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&
    n.callee.property.name==='update'&&n.arguments.length===2&&self(n.arguments[0],'renderer')&&self(n.arguments[1],'scene')),'native initial cube capture');
  assert.match(slice(app,probe.node),/^s\.update\(this\.renderer,this\.scene\)$/);
  const pmrem=unique(query(ctor,n=>n.type==='NewExpression'&&ident(n.callee,'To')&&n.arguments.length===1&&self(n.arguments[0],'renderer')),'native reflection filter');
  const containing=unique(g.inner.body.filter(n=>n.type==='VariableDeclaration'&&n.declarations.includes(g.game.parent)),'declaration statement containing G0');
  const boundary=containing.end;
  // Close the IIFE after its engine definition. This tests actual game code without
  // evaluating the vendor app's DOM startup. Inputs/actions call the same G0 entrypoints.
  const replacements=[
    [renderFactory.node,'new globalThis.__fixture.Renderer()'],
    [probe.node,'void 0'],
    [pmrem.node,'globalThis.__fixture.reflections(() => new Yn())']
  ].sort((a,b)=>b[0].start-a[0].start);
  let run=app.slice(0,boundary);
  for(const [n,replacement] of replacements){
    assert.ok(n.end<=boundary);
    run=run.slice(0,n.start)+replacement+run.slice(n.end);
  }
  const native='{' + Object.entries(ALIASES).map(([k,[v]])=>k+':'+v).join(',')+'}';
  run+=';globalThis.__gameFixture={Game:G0,native:'+native+'};})();';
  return run;
};
export function loadWorld(bytes, {compact=false, storage=new Map(), seed=14723}={}) {
  let perf=0, renderCalls=0, rafCalls=0, ioClock=0;
  const trace=[], errors=[], imageURLs=new Set(), notes=[], soundCalls=[], panels=[], hud=[];
  const sound = new Proxy({}, {get:(_,k)=>(...v)=>{if(k==='fx'||k==='setPaused')soundCalls.push([String(k),...v]);}});
  const document = {
    createElement(tag) {
      assert.equal(tag.toLowerCase(),'canvas','No browser UI startup is permitted in CPU fixture');
      return makeCanvas(32,32);
    },
    createElementNS(ns,tag) {
      assert.ok(ns==='http://www.w3.org/1999/xhtml','Only HTML canvas/img fixtures');
      if(tag==='canvas')return makeCanvas(32,32);
      assert.equal(tag,'img');
      return {
        addEventListener(){}, removeEventListener(){},
        set src(uri){
          assert.ok(/^data:image\//.test(uri),'No network image in CPU fixture');
          imageURLs.add(uri);this.uri=uri;
        },
        get src(){ return this.uri; }
      };
    }
  };
  function makeCanvas(w,h){
    const c=bCanvas.createCanvas(w,h), getContext=c.getContext.bind(c);
    c.getContext=(kind,...a)=>{
      assert.equal(kind,'2d','No WebGL/3D code path is permitted');
      return getContext(kind,...a);
    };
    c.style={};c.dataset={};c.addEventListener=()=>{};
    c.setPointerCapture=()=>{};c.hasPointerCapture=()=>false;
    c.releasePointerCapture=()=>{}; c.getBoundingClientRect=()=>({left:0,top:0,width:1200,height:720});
    return c;
  }
  class Renderer {
    constructor() {
      this.domElement=makeCanvas(96,96);this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>8};
      this.info={render:{calls:0,triangles:0},memory:{}};
    }
    setSize(){} setPixelRatio(){} getPixelRatio(){return 1;}
    render(scene,camera) {
      renderCalls++;
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
    }
  }
  const random=Object.create(Math);
  random.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const window={devicePixelRatio:1, matchMedia:()=>({matches:compact})};
  const localStorage={
    getItem:k=>storage.get(k)??null,
    setItem(k,v){v=String(v);storage.set(k,v);trace.push([++ioClock,k,v]);}
  };
  const context=vm.createContext({
    window, document, localStorage, Math:random, matchMedia:window.matchMedia,
    innerWidth:compact?640:1200,innerHeight:compact?360:720,
    performance:{now:()=>perf},requestAnimationFrame:()=>++rafCalls,
    TextDecoder,TextEncoder,AbortController,AbortSignal,URL,URLSearchParams,Blob,atob,btoa,
    console:{log(){},warn(...v){errors.push(['warn',v.map(String)]);},error(...v){errors.push(['error',v.map(String)]);}},
    __fixture:{Renderer,reflections:makeTexture=>({fromCubemap:()=>({texture:makeTexture(),dispose(){}}),dispose(){}})}
  },{name:'No-graphics Vice Coast exact bundle',codeGeneration:{strings:false,wasm:false}});
  new vm.Script(forApp(bytes),{filename:'verified-R11-fixture.js'}).runInContext(context,{timeout:12000});
  const {Game,native}=context.__gameFixture;
  function newGame(sensor={}) {
    const game=new Game({replaceChildren(){}},sound,
      {note:x=>notes.push(x),hud:x=>{hud.push(x);sensor.hud?.(x);},panel:x=>panels.push(x)});
    return {
      game,
      delta(ms){perf+=ms;game.frame(perf);},
      elapsed(){return perf;},
    };
  }
  return {newGame,native,trace,errors,storage,notes,hud,panels,soundCalls,imageURLs,
    counters:()=>({renderCalls,rafCalls})};
}
