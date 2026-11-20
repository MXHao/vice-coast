// Read-only discovery of four insertion coordinates in the exact original
// app, intentionally independent of art, road geometry and Graphics UI.
import assert from 'node:assert/strict';
import {PIN,sha,moduleBody,query,ident,self,slice,unique,parse} from './ast.mjs';
export const DESKTOP_LOOK='__vcR14DesktopLook';
export function desktopLookPatches({app,original,source}){
 assert.equal(sha(app),PIN.app,'Desktop look requires exact original application coordinates');
 assert.equal(query(original.tree,n=>ident(n,DESKTOP_LOOK)).length,0,'Fresh desktop input binding');
 const method=name=>unique(original.game.node.body.body.filter(n=>n.key.name===name),name+' exact method');
 const matches=(m,predicate,expected,label)=>{
  const n=unique(query(m,predicate),label).node;
  assert.equal(slice(app,n),expected,label+' source identity');
  return n;
 };
 const clock=original.mount.node;
 assert.equal(slice(app,clock),'this.last=performance.now()');
 const dragListener=unique(query(original.ctor,n=>n.type==='CallExpression'&&
   n.callee?.property?.name==='addEventListener'&&n.arguments[0]?.value==='lostpointercapture'),'native end of input wiring').node;
 assert.match(slice(app,dragListener),/^a\.addEventListener\("lostpointercapture",l\)$/);
 assert.ok(dragListener.end<clock.start,'Desktop input mounts after native drag/shot wiring');
 const paused=method('setPaused');
 assert.equal(paused.value.params.length,1);assert.equal(paused.value.params[0].name,'t');
 const clear=matches(paused,n=>n.type==='CallExpression'&&self(n.callee,'clearInput'),'this.clearInput()','pause input reset');
 assert.equal(app.slice(paused.value.body.start+1,clear.start),'this.paused=t,','Pause state is assigned before hook');
 const recenter=matches(method('setCamera'),n=>n.type==='LogicalExpression'&&n.operator==='&&'&&
   n.left.type==='UnaryExpression'&&n.left.operator==='!'&&self(n.left.argument,'drag')&&
   n.right.type==='BinaryExpression'&&n.right.operator==='<='&&self(n.right.left,'lookDelay')&&
   n.right.right.value===0,'!this.drag&&this.lookDelay<=0','native camera recenter gate');
 // Unlike a decorative art module, this controller intentionally uses the
 // clock/timer of its provided window. Deny ambient globals and allow those
 // two keys only as members of the explicit browser capability.
 const unsafe=new Set(['window','document','globalThis','global','localStorage','sessionStorage',
   'indexedDB','navigator','history','fetch','XMLHttpRequest','WebSocket','Worker',
   'eval','Function','process','require','Date','requestAnimationFrame','importScripts']);
 const timer=new Set(['performance','setTimeout','clearTimeout']);
 const allow=({node,parent})=>!unsafe.has(node.name)&&(!timer.has(node.name)||
   (parent?.type==='MemberExpression'&&parent.property===node&&ident(parent.object,'win')));
 const browserAST=parse(source,'module');
 assert.ok(query(browserAST,n=>n.type==='Identifier').every(allow),'Desktop layer uses only injected browser capabilities');
 const code=moduleBody(source,'createDesktopLook',true);
 return [
  {id:'desktop-look-declaration',at:original.inner.start+1,text:'\nconst '+DESKTOP_LOOK+'=(()=>{\n'+code+'\nreturn createDesktopLook();\n})();\n'},
  {id:'desktop-look-mount-after-native-input',at:clock.start,text:DESKTOP_LOOK+'.mount(this,document,window),'},
  {id:'desktop-look-recenter-gate',at:recenter.start,text:'!'+DESKTOP_LOOK+'.hold(this)&&'},
  {id:'desktop-look-release-on-pause',at:clear.start,text:'t&&'+DESKTOP_LOOK+'.release(this),'}
 ];
}
