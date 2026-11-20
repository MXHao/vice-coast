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
 s686:pose('shoulder',[-15,-10],[100,-1,6],[-108,3],[65,1])
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
