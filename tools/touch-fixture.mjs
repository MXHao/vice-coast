// Project the actually COMPILED controls, pause/editor handoff, G0 canvas listeners,
// native capture/reset and keydown handlers. No browser, graphics or real storage.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {splitHtml,inspectProgram,query,slice,unique,ident} from './ast.mjs';
export function touchProjection(bytes){
 const {app}=splitHtml(bytes),g=inspectProgram(app,false);
 const f=id=>slice(app,unique(query(g.inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,id)),id).node);
 const def=id=>slice(app,unique(g.inner.body.filter(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>ident(d.id,id))),id));
 const lines=starts=>g.inner.body.filter(n=>n.type==='ExpressionStatement'&&slice(app,n).startsWith(starts)).map(n=>slice(app,n));
 const ctor=slice(app,g.ctor),a=ctor.indexOf('let a=this.renderer.domElement;'),end='a.addEventListener("lostpointercapture",l)',z=ctor.indexOf(end,a);
 assert.ok(a>0&&z>a);const cam=ctor.slice(a,z+end.length)+';';
 const mode=slice(app,unique(query(g.inner,n=>n.type==='CallExpression'&&slice(app,n).startsWith('__vcR14Touch.mode(')),'compiled mode sync').node);
 const desktop=app.includes('const __vcR14DesktopLook='),quality=app.includes('const __vcR14Graphics=');
 const desktopMount=desktop?slice(app,unique(query(g.ctor,n=>n.type==='CallExpression'&&slice(app,n)==='__vcR14DesktopLook.mount(this,document,window)'),'compiled desktop mount').node):'';
 const desktopHold=desktop?slice(app,unique(query(g.method('setCamera'),n=>n.type==='CallExpression'&&slice(app,n)==='__vcR14DesktopLook.hold(this)'),'compiled recenter hold').node):'false';
 const keys=lines('addEventListener("keydown",');assert.equal(keys.length,1);
 const resize=lines('addEventListener("resize",');assert.equal(resize.length,1);
 const script=[...(desktop?[def('__vcR14DesktopLook')]:[]),...(quality?[def('__vcR14Graphics')]:[]),def('__vcR14Touch'),f('XA'),f('wi'),f('Xw'),def('vi'),
  'var Wt=id=>document.getElementById(id),IA="",Zo="",md=null,ne=null,On={},Y0=s=>notes.push(s),Rn=(v,l,h)=>Math.max(l,Math.min(h,v));',
  'var Ri=Xw(Wt("moveStick"),A=>!!(ne&&!ne.paused&&!IA&&A==="drive"==!!ne.car));',
  'class Game{'+slice(app,g.method('clearInput'))+slice(app,g.method('setPaused'))+'}',
  ...lines('__vcR14Graphics.mountTitle('),...lines('__vcR14Touch.mount('),...lines('Wt("panel").onclick='),...lines('Wt("close").onclick='),...lines('Ri.bindTap('),
  ...keys,...resize,
  'globalThis.probe={current:()=>IA,keys:Ri.keys,axes:Ri.axes,game:new Game(),bind(g){ne=g},sync(A){'+mode +'},camera(){'+cam+desktopMount+'},hold(){return '+desktopHold+'},open:p=>XA(p),quality:'+(quality?'__vcR14Graphics':'null')+',close:wi,reset:()=>ne.clearInput()};'
 ].join('\n');
 return function run({coarse=true,storage=new Map(),w=844,h=390,safe={l:47,t:0,r:47,b:21},denied=false}={}){
  const ids=new Map(),doc={activeElement:null},world={w,h,safe,focus:true,now:100,lockRequests:0},notes=[],ops=[];
  const list=p=>new Set(p),slots=new Map();
  class E{
   constructor(tag='div'){this.tag=tag;this.parentElement=null;this.children=[];this.dataset={};this.attrs={};this.events=new Map();this.grabs=new Set();this.cl=new Set();this.hidden=false;this.value='';this.textContent='';
    this.style={setProperty:(k,v)=>this.style[k]=v,removeProperty:k=>delete this.style[k]};
    this.classList={contains:k=>this.cl.has(k),add:(...k)=>k.forEach(v=>this.cl.add(v)),remove:(...k)=>k.forEach(v=>this.cl.delete(v)),toggle:(k,v)=>{v??=!this.cl.has(k);v?this.cl.add(k):this.cl.delete(k);return v;}};
   }
   set className(v){this.cl=new Set(v.split(/\s+/));}get className(){return [...this.cl].join(' ');}
   get parentNode(){return this.parentElement;}
   get isConnected(){return !!this.parentElement||this===doc.body;}
   setAttribute(k,v){v=String(v);this.attrs[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;}
   toggleAttribute(k,v){if(v??!Object.hasOwn(this.attrs,k))this.setAttribute(k,'');else delete this.attrs[k];}
   getAttribute(k){return this.attrs[k]??null;}
   focus(){doc.activeElement=this;}
   setPointerCapture(id){this.grabs.add(id);}hasPointerCapture(id){return this.grabs.has(id);}releasePointerCapture(id){this.grabs.delete(id);}
   appendChild(el){return this.insertBefore(el,null);}
   append(...els){els.forEach(el=>this.appendChild(el));}
   insertBefore(el,ref){
    el.remove();el.parentElement=this;
    const i=ref===null?this.children.length:this.children.indexOf(ref);
    assert.ok(i>=0);this.children.splice(i,0,el);if(el.id)ids.set(el.id,el);return el;
   }
   remove(){if(this.parentElement){const a=this.parentElement.children,i=a.indexOf(this);if(i>=0)a.splice(i,1);this.parentElement=null;}}
   insertAdjacentElement(where,el){assert.equal(where,'afterend');this.parentElement.appendChild(el);}
   replaceChildren(...children){this.children=[];for(const c of children)this.appendChild(c);}
   cloneNode(){return new E(this.tag);}
   get offsetWidth(){return this.cl.has('stick-cap')?this.parentElement.getBoundingClientRect().width*.4:this.getBoundingClientRect().width;}
   getBoundingClientRect(){
    if(this.style.cssText?.includes('safe-area-inset-left')){const {w,h,safe:s}=world;return {left:s.l,top:s.t,width:w-s.l-s.r,height:h-s.t-s.b};}
    const num=(k,d,f)=>parseFloat(this.style[k]??this.style[d]??f);
    const left=num('--vx','left',0),top=num('--vy','top',0),width=num('--vw','width',44),height=num('--vh','height',44);
    return {left,top,width,height,right:left+width,bottom:top+height};
   }
   matches(s){if(s==='button,select')return ['button','select'].includes(this.tag);if(s==='[data-tool]')return !!this.dataset.tool;
    if(s.startsWith('.'))return this.cl.has(s.slice(1));if(s.startsWith('[data-key='))return this.dataset.key===s.slice(11,-2);return s===this.tag;}
   closest(s){for(let e=this;e;e=e.parentElement)if(e.matches(s))return e;return null;}
   querySelectorAll(s){let a=[];for(const ch of this.children){if(ch.matches(s))a.push(ch);a.push(...ch.querySelectorAll(s));}return a;}
   querySelector(s){return this.querySelectorAll(s)[0]||null;}
   addEventListener(key,fn,capture=false){let xs=this.events.get(key)||[];xs.push({fn,capture:!!capture});this.events.set(key,xs);}
   removeEventListener(key,fn,capture=false){this.events.set(key,(this.events.get(key)||[]).filter(a=>a.fn!==fn||a.capture!==!!capture));}
   emit(type,params={}){let e={target:this,type,detail:0,isTrusted:true,pointerType:'touch',pointerId:1,clientX:0,clientY:0,button:0,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...params};
    for(let p=this;p&&!e.stopped;p=p.parentElement){
     for(const {fn} of (p.events.get(type)||[]).toSorted((a,b)=>Number(b.capture)-Number(a.capture))){
      fn.call(p,e);if(e.stopped)break;
     }
     if(!e.stopped&&typeof p['on'+type]==='function')p['on'+type](e);
    }
    return e;
   }
   set innerHTML(v){
    this._html=v;this.children=[];const stack=[this];
    for(const m of v.matchAll(/<(\/?)([\w-]+)([^>]*)>/g)){
     if(m[1]){if(stack.length>1)stack.pop();continue;}
     const el=new E(m[2]);for(const k of m[3].matchAll(/([\w-]+)="([^"]*)"/g)){if(k[1]==='class')el.className=k[2];else if(['id','value'].includes(k[1]))el[k[1]]=k[2];else el.setAttribute(k[1],k[2]);}
     stack.at(-1).appendChild(el);stack.push(el);
    }
   }
   get innerHTML(){return this._html;}
  }
  doc.body=new E();doc.head=new E();doc.getElementById=id=>ids.get(id);doc.createElement=t=>new E(t);
  function add(id,tag='button',parent=doc.body){let e=new E(tag);e.id=id;parent.appendChild(e);return e;}
  for(const id of ['overlay','panel','panelTitle','close','touchDeck','moveStick','miniButton','pause','interact','taskBox','guide','touchCar','touchGun','touchReload','touchCrouch','touchFire','touchBrake','gasKey','brakeKey','actions','canvas'])add(id,['panel','panelTitle','overlay','touchDeck','moveStick','actions'].includes(id)?'div':'button');
  add('roam','button',ids.get('actions'));const cap=new E();cap.className='stick-cap';ids.get('moveStick').appendChild(cap);
  for(const [id,k] of [['left','KeyA'],['right','KeyD']])add(id,'button',ids.get('touchDeck')).dataset.key=k;
  for(const [id,k] of [['touchBrake','Space'],['gasKey','KeyW'],['brakeKey','KeyS']])ids.get(id).dataset.key=k;
  doc.querySelectorAll=s=>{assert.equal(s,'.touch [data-key]');return [...ids.values()].filter(e=>e.dataset.key);};
  const win=new E(),media=new E(),fine=new E();
  media.matches=coarse;fine.matches=!coarse;
  win.matchMedia=()=>fine;win.performance={now:()=>world.now};
  if(desktop||quality){
   const top=add('top','div'),bar=new E();bar.className='tools';top.appendChild(bar);
   for(const id of ['pause','guide'])bar.appendChild(ids.get(id));
  }
  const docEvent=new E();
  doc.addEventListener=docEvent.addEventListener.bind(docEvent);
  doc.removeEventListener=docEvent.removeEventListener.bind(docEvent);
  doc.hasFocus=()=>world.focus;doc.hidden=false;doc.pointerLockElement=null;
  doc.exitPointerLock=()=>{doc.pointerLockElement=null;docEvent.emit('pointerlockchange');};
  if(desktop){
   const canvas=ids.get('canvas');
   canvas.requestPointerLock=()=>{
    world.lockRequests++;doc.pointerLockElement=canvas;docEvent.emit('pointerlockchange');
   };
  }
  const getStorage=()=>({getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(denied)throw Error('quota');storage.set(k,v)}});
  const ctx=vm.createContext({document:doc,window:win,notes,matchMedia:()=>media,localStorage:getStorage(),performance:{now:()=>12},console,addEventListener:(...a)=>win.addEventListener(...a)});
  new vm.Script(script).runInContext(ctx);
  const probe=ctx.probe,g=probe.game;
  Object.assign(g,{live:true,paused:false,keys:new Set(),touch:{reset:()=>{ // real compiled touch state reset
   ctx.Ri.reset();
  }},renderer:{domElement:ids.get('canvas')},sound:{setPaused(){},drive(){}},save(){},lookDelay:0,walkAngle:0,orbit:0,pitch:0,story:{interact:()=>ops.push('interact')},encounter:{armed:true,equip(v){this.armed=v;ops.push('equip')},reload(){ops.push('reload')},shoot(){ops.push('shot')}},toggleVehicle(){ops.push('car')},viewName:()=>'',resize(){}});
  probe.camera.call(g);
  function sync(car,armed){g.car=car;g.encounter.armed=armed;probe.sync({car,combat:{armed}});}
  function play(car=null,armed=true){probe.bind(g);doc.body.classList.add('playing');sync(car,armed);}
  function tap(el,id=9){
   const r=el.getBoundingClientRect(),p={pointerId:id,clientX:r.left+r.width/2,clientY:r.top+r.height/2};
   el.emit('pointerdown',p);el.emit('pointerup',p);el.emit('click',{...p,detail:1});
  }
  const panel=ids.get('panel'),pick=(k,v)=>{const b=panel.querySelectorAll('button').find(b=>b.dataset[k]===v);assert.ok(b,'visible '+k+' '+v);b.emit('click');return b;};
  return {ids,doc,docEvent,win,probe,notes,ops,world,storage,get:id=>ids.get(id),panel,play,sync,tap,pick};
 };
}
