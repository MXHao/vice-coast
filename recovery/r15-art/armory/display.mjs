import {catalog,createArmoryProp} from './forms.mjs';
import {toAssetPoint} from './renderkit.mjs';
// Cosmetic anchors in arbitrary asset-local illustration units. These are
// proposed display/pose contacts, NOT runtime sockets or physical dimensions.
function pose(family,grip,support,shoulder,inspect) {
 const p=a=>a?Object.freeze(toAssetPoint(...a)):null;
 return Object.freeze({family,grip:p(grip),support:p(support),shoulder:p(shoulder),inspectionFocus:p(inspect)});
}
export const presentation=Object.freeze({
 p92:pose('sidearm',[-9,-13],null,null,[28,0]),
 m416:pose('shoulder',[-12,-15],[101,1,7],[-94,5],[43,-3]),
 p90:pose('compact',[-9,-12],[47,-9,7],[-58,5],[16,8]),
 m870:pose('shoulder',[-18,-10],[102,1,6],[-98,2],[68,0]),
 m700:pose('precision',[-9,-16],[89,2,8],[-115,5],[69,9]),
 mini14:pose('shoulder',[-17,-10],[97,1,6],[-102,4],[49,4]),
 m249:pose('heavy',[-14,-17],[119,3,8],[-111,5],[54,2]),
 r1895:pose('sidearm',[-20,-19],null,null,[24,-1]),
 ak47:pose('shoulder',[-7,-17],[89,2,6],[-103,3],[45,1]),
 vector:pose('compact',[-17,-16],[52,12,8],[-78,5],[0,1]),
 s686:pose('shoulder',[-15,-10],[100,-1,6],[-108,3],[65,1]),
 scar:pose('shoulder',[-8,-14],[101,3,6],[-107,5],[43,2]),
 mp5:pose('compact',[-9,-16],[72,3,6],[-74,5],[15,3]),
 deagle:pose('sidearm',[-14,-19],null,null,[34,3]),
 awm:pose('precision',[-8,-20],[98,3,6],[-123,4],[63,11]),
 m60:pose('heavy',[-14,-18],[124,3,8],[-122,4],[56,1]),
 groza:pose('compact',[-6,-16],[62,3,8],[-69,2],[16,5]),
 m16:pose('shoulder',[-7,-17],[94,2,6],[-118,4],[65,7]),
 ump:pose('compact',[-14,-18],[72,4,6],[-88,3],[5,1]),
 s12k:pose('shoulder',[-8,-15],[113,0,7],[-104,4],[51,1]),
 barrett:pose('precision',[-12,-23],[110,2,8],[-132,3],[69,11]),
 rpk:pose('heavy',[-10,-24],[109,1,7],[-117,2],[64,2]),
 m4a1s:pose('shoulder',[-10,-17],[97,2,6],[-97,4],[57,5]),
 ak47a:pose('shoulder',[-14,-18],[92,2,7],[-110,4],[47,4]),
 usps:pose('sidearm',[-18,-18],null,null,[38,3]),
 xm1014:pose('shoulder',[-12,-14],[101,2,7],[-111,4],[61,4]),
 kar98:pose('precision',[-20,-12],[102,4,6],[-126,3],[68,7]),
 mg3silver:pose('heavy',[-13,-24],[132,2,8],[-123,3],[68,7])
});
const ids=new Set(catalog.map(p=>p.id));
const destroy = node => {
 node.parent?.remove(node);
 node.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
};
// One owner-created cosmetic container per display slot. Not global and never
// scans or deletes sibling objects. A replace peaks at two owned items during
// construction; only the chosen item persists. No listeners, timers or pooling.
export function createPropDisplay(native,container) {
 if(!container?.isGroup||typeof container.add!=='function')throw TypeError('Expected owned cosmetic parent group');
 let active=null,activeId=null,closed=false;
 const clear=()=>{const old=active;active=activeId=null;if(old)destroy(old);};
 return Object.freeze({
  show(id){
   if(closed)throw Error('Cosmetic display is disposed');
   if(!ids.has(id))return Object.freeze({available:false,id}); // Keep old selection; caller owns fallback.
   if(activeId!==id){
    const candidate=createArmoryProp(native,id);
    clear();active=candidate;activeId=id;container.add(candidate);
   }
   return Object.freeze({available:true,id,group:active,pose:presentation[id]});
  },
  clear,
  dispose(){if(!closed){closed=true;clear();}}
 });
}
