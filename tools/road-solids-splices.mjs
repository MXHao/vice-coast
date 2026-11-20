import assert from 'node:assert/strict';
import {ident,moduleBody,query,sha,slice,unique} from './ast.mjs';

export const SOLIDS='__vcR14RoadSolids';
export const ROAD_COLLISION_SOURCE='fd60bf98d6d3cb138c4efa455e3aba13640f7c4598a4e71fbcf6a924c4ea7dba';
export const ROAD_COLLISION_ARTIFACT=Object.freeze({
 sha256:'c93c94a6ac67ddb2e9b9a02359653805856cad82810edbc0391fb3d07ad98f5a',
 bytes:7135483,
 app:'a2890d645b2235b3de294c839d7afaeb767a3a8b40f0354f8bf685b784b0c393'
});
export function roadSolidsSplices(app,original,source){
 assert.equal(sha(source),ROAD_COLLISION_SOURCE,'Exact collision author input');
 assert.equal(query(original.tree,n=>ident(n,SOLIDS)).length,0);
 const drive=original.method('drive');
 const wall=unique(query(drive,n=>n.type==='CallExpression'&&ident(n.callee,'aw')),'only player wall solver').node;
 assert.equal(slice(app,wall),'aw(n.x,n.z,l-n.x,f-n.z,e.yaw,this.blocks)');
 const resolver=unique(query(original.inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'aw')),'original swept player hull').node;
 assert.equal(query(original.tree,n=>ident(n,'aw')).length,2,'Other consumers cannot be modified by this splice');
 const queryContact=unique(query(resolver,n=>n.type==='CallExpression'&&ident(n.callee,'ox')),'earliest contact inside original slide loop').node;
 assert.equal(slice(app,queryContact),'ox(A,t,c,a,i,r)');
 const nativeContact=unique(query(original.inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'ox')),'native earliest query').node;
 assert.match(slice(app,nativeContact),/for\(let g of ix\).*sx\(.+z0\)/);
 assert.equal(query(original.tree,n=>ident(n,'ox')).length,2,'Shared earliest resolver cannot be affected');
 const nativeRadius=unique(original.declarations.get('z0')??[],'pinned native chassis radius');
 const nativeStations=unique(original.declarations.get('ix')??[],'pinned native chassis stations');
 assert.equal(Number(slice(app,nativeRadius.init)),.84);
 assert.equal(slice(app,nativeStations.init),'[-1.33,0,1.33]');
 const push=unique(query(drive,n=>n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='blocked'),'native traffic de-overlap check').node;
 assert.equal(slice(app,push),'this.blocked(P,x,.84)');
 return [
   {id:'road-solids-declaration',at:original.inner.start+1,text:'\nconst '+SOLIDS+' = (() => {\n'+moduleBody(source,'createRoadSolids')+'\nreturn createRoadSolids();\n})();\n'},
   {id:'road-solids-earliest-open',at:queryContact.start,text:SOLIDS+'.pick('},
   {id:'road-solids-earliest-close',at:queryContact.end,text:',A,t,c,a,i)'},
   {id:'road-solids-traffic-push',at:push.end,text:'||'+SOLIDS+'.blocksPush(n.x,n.z,P,x,e.yaw)'}
 ];
}
