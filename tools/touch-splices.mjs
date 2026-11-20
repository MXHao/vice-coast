// Insertion-only original-coordinate recipe. Strict against native function/element anchors.
import assert from 'node:assert/strict';
import {moduleBody,slice,query,unique,ident} from './ast.mjs';
export function touchSplices(app,inspected,layoutSource,hudSource){
  const {tree,inner,method}=inspected,T='__vcR14Touch';
  const hit=(scope,pred,label)=>unique(query(scope,pred),label);
  const exact=(scope,type,src)=>hit(scope,n=>n.type===type&&slice(app,n)===src,src).node;
  const decl=id=>hit(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,id),id).node;
  assert.equal(query(tree,n=>ident(n,T)).length,0);
  const edits=[],put=(id,at,text)=>edits.push({id:'touch-'+id,at,text});
  put('private',inner.start+1,'\nconst '+T+'=(()=>{\n'+moduleBody(layoutSource,'createTouchLayout',true)+'\n'+moduleBody(hudSource,'createTouchHUD',true)+'\nreturn createTouchHUD(createTouchLayout());\n})();\n');
  const panel=decl('XA'),hud=decl('Hs'),close=decl('wi');
  assert.match(slice(app,close),/^function wi\(A=!1\)\{if\(!\(IA===/);
  assert.match(slice(app,hud),/^function Hs\(A\)\{let t=A\.mission,/);
  exact(hud,'AssignmentExpression','Wt("touchDeck").dataset.mode=A.car?"drive":"walk"');
  put('mode',hud.body.start+1,T+'.mode(A.car?"drive":"walk",A.combat.armed);');
  const markup=exact(panel,'AssignmentExpression','e.innerHTML=n');
  const last=panel.body.body.at(-1);assert.equal(last.type,'ExpressionStatement');assert.equal(last.expression.expressions[0],markup);
  put('render',markup.start,'n='+T+'.markup(A,n),');put('entered',last.end,';'+T+'.entered(A);');
  put('leave',close.body.start+1,T+'.leave();');
  const on=id=>hit(inner,n=>n.type==='AssignmentExpression'&&slice(app,n.left)==='Wt("'+id+'").onclick',id+' onclick');
  const click=exact(on('panel').node.right,'VariableDeclaration','let e=t.dataset.action;');
  put('action',click.end,'if('+T+'.action(e))return;');
  const guide=on('guide');assert.equal(guide.parent.type,'ExpressionStatement');
  put('mount',guide.parent.start,T+'.mount(Wt,XA,wi,Y0);');
  const keyboard=hit(inner,n=>n.type==='CallExpression'&&ident(n.callee,'addEventListener')&&n.arguments[0]?.value==='keydown','native keydown').node.arguments[1];
  assert.match(slice(app,keyboard),/^A=>\{if\(IA\)/);
  put('keyboard',keyboard.body.start+1,'if('+T+'.keydown(A))return;');
  assert.match(slice(app,decl('Xw')),/return\{axes:s,keys:n,reset:h,bindTap:f\}/);
  assert.match(slice(app,method('clearInput')),/this\.touch\.reset\(\)/);
  return edits.sort((a,b)=>a.at-b.at);
}
