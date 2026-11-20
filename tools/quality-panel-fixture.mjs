// Project native menu renderer, touch/pause bindings and delegated click handler from
// the compiled game into a tiny DOM double; no browser, CSS engine or WebGL context.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {splitHtml,inspectProgram,query,slice,unique,ident} from './ast.mjs';
export function panelProjection(bytes) {
 const {app}=splitHtml(bytes), g=inspectProgram(app,false);
 const f=id=>slice(app,unique(query(g.inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,id)),id).node);
 const def=id=>slice(app,unique(query(g.inner,n=>n.type==='VariableDeclaration'&&ident(n.declarations[0]?.id,id)),id).node);
 const line=s=>slice(app,unique(g.inner.body.filter(n=>n.type==='ExpressionStatement'&&s(slice(app,n))),String(s)));
 const panelClick=line(s=>s.startsWith('Wt("panel").onclick='));
 const mountTitle=line(s=>s==='__vcR14Graphics.mountTitle(Wt,XA);');
 const nativePause=line(s=>s.startsWith('Ri.bindTap(Wt("pause"),'));
 const nativeClose=line(s=>s==='Wt("close").onclick=()=>wi();');
 const script=[def('__vcR14Graphics'),f('XA'),f('wi'),f('Xw'),def('vi'),
  'var IA="",Zo="",md=null,ne=null,On={enabled:false},Wt=id=>document.getElementById(id),Ri=Xw(Wt("moveStick"),()=>true);',
  mountTitle,panelClick,nativePause,nativeClose,
  'globalThis.probe={graphics:__vcR14Graphics,setGame(g){ne=g},scene:()=>IA};'].join('\n');
 return (storage,{compact=false}={})=>{
  let playing=false;const ids=new Map();
  const doc={activeElement:null,querySelectorAll:()=>[],getElementById:k=>ids.get(k)};
  class E{
   constructor(){this.hidden=false;this.events=new Map();this.attrs=new Map();this.attached=[];this.dataset={};this.textContent='';this.isConnected=true;
    this.classList={contains:x=>x==='playing'&&playing,add(){},remove(){},toggle(){}};
    this.style={setProperty(){}};}
   setAttribute(k,v){this.attrs.set(k,String(v));}
   getAttribute(k){return this.attrs.get(k);}
   focus(){doc.activeElement=this;} closest(){return this;}
   setPointerCapture(){} hasPointerCapture(){return false;}
   getBoundingClientRect(){return {left:0,right:44,top:0,bottom:44};}
   addEventListener(type,fn){const list=this.events.get(type)||[];list.push(fn);this.events.set(type,list);}
   dispatch(type,p={}){for(const f of this.events.get(type)||[])f({type,...p});}
   appendChild(b){this.attached.push(b);b.parentElement=this;}
   insertBefore(b,x){assert.equal(x,this.attached[0]);this.attached.unshift(b);b.parentElement=this;ids.set(b.id,b);}
   set innerHTML(html){this._html=html;this.buttons=[];
    for(const [,action,sel] of html.matchAll(/<button\b[^>]*?data-action="([^"]+)"([^>]*)>/g)){
     const b=new E();b.dataset.action=action; let m=sel.match(/aria-pressed="([^"]+)"/);if(m)b.setAttribute('aria-pressed',m[1]);this.buttons.push(b);
    }
    this.status=null;if(html.includes('class="vcq-status"')){this.status=new E();this.status.textContent=html.match(/class="vcq-status" role="status">([^<]+)</)[1];}}
   get innerHTML(){return this._html;}
   querySelectorAll(s){return s==='.vcq-mode'?this.buttons.filter(b=>b.attrs.has('aria-pressed')):[];}
   querySelector(s){return s==='.stick-cap'?new E():s==='.vcq-status'?this.status:this.buttons?.[0];}
  }
  doc.body=new E();doc.head=new E();doc.createElement=()=>new E();
  for(const id of ['pause','close','guide','overlay','panel','panelTitle','moveStick'])ids.set(id,new E());
  new E().appendChild(ids.get('guide'));ids.get('overlay').hidden=true;
  const ctx=vm.createContext({document:doc,localStorage:storage,performance:{now:()=>300},console});
  new vm.Script(script).runInContext(ctx);
  const play=g=>{ctx.probe.setGame(g);playing=true};
  const pause=()=>{let b=ids.get('pause');b.focus();
   if(compact){const p={pointerType:'touch',pointerId:4,clientX:20,clientY:20};b.dispatch('pointerdown',p);b.dispatch('pointerup',p);b.dispatch('click',{pointerType:'touch',detail:1});}
   else b.dispatch('click',{pointerType:'mouse',detail:1});};
  const pick=action=>{const panel=ids.get('panel'),button=panel.buttons.find(b=>b.dataset.action===action);assert.ok(button,'visible button: '+action);button.focus();panel.onclick({target:button});return button;};
  return {ids,doc,play,pause,pick,probe:ctx.probe};
 };
}
