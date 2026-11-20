// Only the four original cosmetic samples carried by this public source subset.
export const CATEGORIES=Object.freeze([
  ['步枪','m416'],['冲锋枪','p90'],['霰弹枪','m870'],['手枪','p92'],
].map(Object.freeze));
export const STUDIES=Object.freeze(['p92','m416','p90','m870']);
export const CATALOG=Object.freeze(CATEGORIES.flatMap(([category,keys])=>keys.split(' ').map(id=>Object.freeze({id,category,label:id.toUpperCase(),preview:STUDIES.includes(id),price:id==='p92'?160:null}))));
export const ITEMS=Object.freeze(Object.fromEntries(CATALOG.map(item=>[item.id,item])));
