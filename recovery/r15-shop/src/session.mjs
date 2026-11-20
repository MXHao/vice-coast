import { ITEMS } from './catalog.mjs';
export const STORAGE_KEY='vice-coast-drive-v1';
export const DOOR=Object.freeze({x:-61,z:12.38,range:1.1,exitX:-61,exitZ:11.68});
export const COUNTER=Object.freeze({x:0.2,z:-1.34,range:1.5});
const EARLIEST_OWNERSHIP=1;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function readOwnership(save) {
  const a=save?.armory;
  if(!object(a)||a.schema!==EARLIEST_OWNERSHIP||!Array.isArray(a.owned))return new Set();
  return new Set(a.owned.filter(id=>id==='p92'));
}
export function withOwnership(save, owned) {
  if(!object(save))throw Error('Original save projection unavailable');
  if(save.armory!=null&&(!object(save.armory)||save.armory.schema!==EARLIEST_OWNERSHIP))throw Error('Unrecognized existing inventory schema');
  return {...save,armory:Object.assign({},save.armory,{schema:EARLIEST_OWNERSHIP,owned:[...owned].filter(id=>id==='p92')})};
}
export function inDoor(x,z){return Number.isFinite(x+z)&&Math.hypot(x-DOOR.x,z-DOOR.z)<=DOOR.range;}
export function inCounter(x,z){return Number.isFinite(x+z)&&Math.hypot(x-COUNTER.x,z-COUNTER.z)<=COUNTER.range;}
const along=(x,z,blocks)=>blocks.some(b=>x>b[0]&&x<b[1]&&z>b[2]&&z<b[3]);
const BLOCKS=[[-3.65,4.3,-3.72,-1.89],[-5.2,-3.9,-4.3,-1.5],[3,5.3,.78,3.82]];
export function moveShop(from,dx,dz) {
  if(!Number.isFinite(from.x+from.z+dx+dz))return from;
  const nx=Math.min(4.76,Math.max(-4.76,from.x+Math.min(.26,Math.max(-.26,dx))));
  const nz=Math.min(5.45,Math.max(-5.45,from.z+Math.min(.26,Math.max(-.26,dz))));
  const x=along(nx,from.z,BLOCKS)?from.x:nx;
  return {x,z:along(x,nz,BLOCKS)?from.z:nz};
}
export function createSession(host) {
  const load=host.readSave(), foreign=load?.armory?.schema!==EARLIEST_OWNERSHIP?load?.armory:null;
  let active=false,panel=false,selected='p92',quote=null,owned=readOwnership(load);
  const position=()=>host.position();
  const mayTrade=()=>active&&panel&&inCounter(position().x,position().z);
  function cancel(){if(!quote)return false;quote=null;return true;}
  function view(){return {active,panel,selected,quote:quote?{...quote}:null,owns:owned.has(selected),cash:host.getCash()};}
  return Object.freeze({
    view,
    recordOwnership(native){
      return owned.size?withOwnership(native,owned):foreign==null?native:{...native,armory:foreign};
    },
    enter() {
      if(active||!host.canEnter())return false;
      if(host.enter()===false)return false;
      active=true; panel=false; selected='p92'; cancel();
      return true;
    },
    open(){
      if(!active||!inCounter(position().x,position().z))return false;
      panel=true; return true;
    },
    close(){panel=false;cancel();},
    leave(){
      if(!active)return false;
      panel=false;cancel();active=false;
      host.leave();return true;
    },
    select(id){
      if(!mayTrade()||!Object.hasOwn(ITEMS,id))return false;
      selected=id;cancel();return true;
    },
    ask(){
      const item=ITEMS[selected], cash=host.getCash();
      if(!mayTrade()||!item||item.price==null||owned.has(selected))return 'unavailable';
      if(foreign!=null)return 'write-failed';
      if(!Number.isSafeInteger(cash)||cash<item.price)return 'insufficient';
      quote={id:item.id,price:item.price,baseline:cash};return 'quote';
    },
    cancel,
    confirm(){
      const offer=quote;cancel();
      if(!offer||!mayTrade()||offer.id!==selected||owned.has(offer.id))return 'stale';
      const cash=host.getCash();
      if(!Number.isSafeInteger(cash)||cash!==offer.baseline||cash<offer.price)return 'stale';
      const next=new Set(owned).add(offer.id);
      try{
        const projected=host.projectSave();
        const body=withOwnership(host.withProjectedCash(projected,cash-offer.price),next);
        // Native storage writes once. Complete that before the primitive in-memory assignment.
        if(host.commit({expectedCash:cash,nextCash:cash-offer.price,body})!==true)return 'write-failed';
      }catch{return 'write-failed';}
      owned=next;return 'purchased';
    },
  });
}
