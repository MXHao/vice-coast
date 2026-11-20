// Guarded zero-width edits to the exact engine-exclusive positions.
import assert from 'node:assert/strict';
import {ident,moduleBody,query,slice,unique} from './ast.mjs';
export const ENGINE_AUDIO='__vcR14EngineAudio';
export function engineAudioInspected(app,original){
 const fn=id=>unique(query(original.inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,id)),id).node;
 const obj=unique(original.declarations.get('j0')??[],'original audio provider');
 assert.equal(obj.init.type,'ClassExpression');
 const get=k=>unique(obj.init.body.body.filter(m=>m.key.name===k),'audio method '+k);
 assert.deepEqual(obj.init.body.body.map(n=>n.key.name),['constructor','radio','radio','open','set','updateMix','setDucking','setPaused','tone','noiseHit','setScene','syncScene','sequence','drive','fx']);
 const open=get('open'),drive=get('drive');
 const exact=(scope,s)=>unique(query(scope,n=>slice(app,n)===s),s).node;
 const periodic=exact(open,'e.createPeriodicWave(d,v)');
 const first=unique(query(drive,n=>n.type==='CallExpression'&&slice(app,n)==='ln(this.engine.frequency,p,i,h?.025:.048)'),'first engine automation');
 const last=unique(query(drive,n=>n.type==='CallExpression'&&slice(app,n)==='ln(this.motor.gain,e?(.084+a*.122+c*.039)*u:0,i,h?.022:.065)'),'last engine automation');
 assert.equal(first.parent,last.parent);assert.equal(first.parent.type,'SequenceExpression');
 const list=first.parent.expressions,i=list.indexOf(first.node),j=list.indexOf(last.node);
 assert.equal(slice(app,list[i+1]),'ln(this.sub.frequency,p*.5,i,.053)','Pinned sub oscillator target signature');
 assert.deepEqual(list.slice(i,j+1).map(n=>n.arguments[0]&&slice(app,n.arguments[0])),[
   'this.engine.frequency','this.sub.frequency','this.engineFilter.frequency','this.exhaustFilter.frequency',
   'this.exhaust.gain','this.intakeFilter.frequency','this.intake.gain','this.motor.gain'
 ]);
 assert.match(slice(app,list[j+1]),/^ln\(this\.roadSource\.playbackRate,/);
 const tick=unique(query(drive,n=>n.type==='LogicalExpression'&&/^h&&this\.enabled&&!this\.paused&&\(this\.tone\(.+?,this\.noiseHit\(.+?\)\)$/.test(slice(app,n))),'unique stock shift pop');

 assert.equal(tick.parent.type,'SequenceExpression');
 const pop=unique(query(tick.node,n=>n.type==='SequenceExpression'&&
   n.expressions.map(n=>n.callee?.property?.name).join(',')==='tone,noiseHit'),'shift-only transient sequence').node;
 assert.match(slice(app,pop),/^this\.tone\(s>this\.gear\?108:86,.+?this\.noiseHit\(i\+\.009,.+?,this\.street\)$/);
 assert.equal(slice(app,tick.parent.expressions.at(-1)),'this.gear=e?s:null');
 assert.match(slice(app,fn('ln')),/cancelScheduledValues\(e\),A\.setTargetAtTime\(t,e,n\)/);
 return {obj,get,open,drive,periodic,first:first.node,last:last.node,tick:tick.node,pop};
}
export function engineAudioSplices(app,original,source){
 assert.equal(query(original.tree,n=>ident(n,ENGINE_AUDIO)).length,0);
 const {periodic,first,last,pop}=engineAudioInspected(app,original);
 return [
  {id:'engine-audio-declaration',at:original.inner.start+1,text:'\nconst '+ENGINE_AUDIO+'=(()=>{\n'+moduleBody(source,'createEngineAudio')+'\nreturn createEngineAudio();\n})();\n'},
  // The exact original call remains compiled as fallback for strict legality /
  // reversal. A healthy Web Audio context creates only one custom table.
  {id:'engine-audio-wave-open',at:periodic.start,text:'('+ENGINE_AUDIO+'.periodic(this,e,d)||'},
  {id:'engine-audio-wave-end',at:periodic.end,text:')'},
  {id:'engine-audio-envelope-open',at:first.start,text:'('+ENGINE_AUDIO+'.drive(this,i,e,c,a,h,n,ln)||('},
  {id:'engine-audio-envelope-end',at:last.end,text:'))'},
  // The old noise burst consumed one random draw. Keep its advancement
  // so removing a shift pop cannot change subsequent non-engine randomness.
  {id:'engine-audio-shift-click-open',at:pop.start,text:ENGINE_AUDIO+'.owns(this)?void Math.random():('},
  {id:'engine-audio-shift-click-end',at:pop.end,text:')'}
 ].sort((a,b)=>a.at-b.at);
}
