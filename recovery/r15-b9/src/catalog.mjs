import { BATCH_PRICE } from './batch-profile.mjs';
export const CATEGORIES=Object.freeze([
  ['步枪','m416 scar groza ak47 m4a1s m16 m4a1 ak47a an94 xm8 aug sg552 famas qbz95 m14ebr 9a91'],
  ['冲锋枪','p90 mp5 ump vector mp7 thompson mk5s tmp'],
  ['霰弹枪','m870 xm1014 s686 s12k nova spas12 m37 jackhammer aa12'],
  ['手枪','deagle p92 r1895 usps glock18 usp deaglea anaconda mauser cop357'],
  ['狙击枪','barrett kar98 awm awma m700 dsr1 psg1'],
  ['精确射手步枪','mini14'],
  ['机枪','m249 m60 rpk mg3silver gatling'],
].map(Object.freeze));
export const STUDIES=Object.freeze(['p92','m416','p90','m870']);
const publicNames={m4a1s:'M4A1-S',mg3silver:'MG3 Silver',usps:'USP-S',ak47:'AK-47',ak47a:'AK-47A',m870:'M870',deagle:'Desert Eagle',deaglea:'Desert Eagle A'};
export const CATALOG=Object.freeze(CATEGORIES.flatMap(([category,keys])=>keys.split(' ').map(id=>Object.freeze({id,category,label:publicNames[id]??id.toUpperCase(),preview:STUDIES.includes(id),price:id==='p92'?160:Object.hasOwn(BATCH_PRICE,id)?BATCH_PRICE[id]:null}))));
export const ITEMS=Object.freeze(Object.fromEntries(CATALOG.map(item=>[item.id,item])));
