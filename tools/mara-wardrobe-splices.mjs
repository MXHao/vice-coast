import assert from 'node:assert/strict';
import {PIN,sha,query,slice,self,ident,unique,moduleBody,ALIASES} from './ast.mjs';
export const MARA_WARDROBE='__vcMaraWardrobeCorrection';
export function maraWardrobeSplices(app,original,source){
 assert.equal(sha(app),PIN.app,'Mara rig hook requires exact original vendor');
 assert.equal(query(original.tree,n=>ident(n,MARA_WARDROBE)).length,0);
 const add=unique(query(original.ctor,n=>n.type==='CallExpression'&&
   self(n.callee?.object,'scene')&&ident(n.callee.property,'add')&&n.arguments.length===1&&
   self(n.arguments[0],'player')),'native player-add call').node;
 assert.equal(slice(app,add),'this.scene.add(this.player)');
 const create=unique(query(original.ctor,n=>n.type==='AssignmentExpression'&&self(n.left,'player')&&
   n.right.type==='CallExpression'&&ident(n.right.callee,'Ms')&&n.right.arguments[0].value===0),'native Mara create').node;
 assert.equal(slice(app,create),'this.player=Ms(0)');assert.equal(app.slice(create.end,add.start),',');
 const code=moduleBody(source,'createMaraWardrobe');
 return [
   {id:'mara-wardrobe-declaration',at:original.inner.start+1,text:'\nconst '+MARA_WARDROBE+
    ' = (()=>{\n'+code+'\nreturn createMaraWardrobe();\n})();\n'},
   {id:'mara-wardrobe-attach-at-construction',at:add.start,text:
    MARA_WARDROBE+'.apply(this.player,'+ALIASES.BufferGeometry[0]+','+ALIASES.BufferAttribute[0]+'),'}
 ];
}
