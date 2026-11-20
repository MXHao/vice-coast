// Title-authored game credits and offline fallback timing. The private game
// build optionally substitutes allowlisted game timing through its build input.
import {validatePhaseProfile} from './phased-loadout.mjs';
export const BASE_BATCH_IDS=Object.freeze(['m416','p90','m870']);
export const BATCH2_IDS=Object.freeze(['mini14','m249','m700','ump']);
export const BATCH3_IDS=Object.freeze(['scar','m16','m4a1','an94','sg552','groza','aug','mp5','mp7','m60']);
export const BATCH4_IDS=Object.freeze(['qbz95','thompson','tmp','jackhammer','deagle','glock18','usp','anaconda','mauser','cop357','dsr1','psg1','rpk']);
export const BATCH6_IDS=Object.freeze(['ak47','ak47a','mk5s','s686','s12k','r1895','deaglea','m4a1s','xm8','famas','9a91','aa12','usps']);
export const BATCH7_IDS=Object.freeze(['spas12','xm1014','nova','m37','m14ebr']);
export const BATCH7_PHASE_IDS=Object.freeze(['spas12','xm1014','m37']);
export const BATCH7_INTERVAL_ID='nova';
export const BATCH9_IDS=Object.freeze(['awma','barrett','kar98','awm','vector','mg3silver','gatling']);
export const TITLE_ORIGINAL_IDS=Object.freeze([...BATCH7_IDS,...BATCH9_IDS]);
export const EXTENDED_IDS=Object.freeze([...BATCH2_IDS,...BATCH3_IDS,...BATCH4_IDS,...BATCH6_IDS,...BATCH7_IDS,...BATCH9_IDS]);
export const BATCH_IDS=Object.freeze([...BASE_BATCH_IDS,...EXTENDED_IDS]);
export const LOADOUT_IDS=Object.freeze(['p92',...BATCH_IDS]);
export const BATCH_PRICE=Object.freeze({m416:620,p90:430,m870:510,mini14:720,m249:980,m700:840,ump:470,scar:705,m16:665,m4a1:690,an94:745,sg552:675,groza:735,aug:725,mp5:465,mp7:540,m60:1050,qbz95:760,thompson:495,tmp:420,jackhammer:860,deagle:360,glock18:280,usp:255,anaconda:395,mauser:330,cop357:310,dsr1:990,psg1:900,rpk:940,ak47:690,ak47a:740,mk5s:540,s686:490,s12k:705,r1895:295,deaglea:420,m4a1s:720,xm8:715,famas:650,"9a91":610,aa12:895,usps:270,spas12:840,xm1014:770,nova:570,m37:620,m14ebr:960,awma:1120,barrett:1400,kar98:735,awm:1090,vector:635,mg3silver:1230,gatling:1450});
export const BATCH_FALLBACK=Object.freeze({
  m416:Object.freeze({magazine:24,cadence:.19,reload:1.7,equip:.7,style:'whole'}),
  p90:Object.freeze({magazine:32,cadence:.16,reload:1.55,equip:.62,style:'whole'}),
  m870:Object.freeze({magazine:5,cadence:.66,reload:.48,equip:.78,style:'incremental'}),
  mini14:Object.freeze({magazine:14,cadence:.25,reload:1.9,equip:.71,style:'whole'}),
  m249:Object.freeze({magazine:64,cadence:.17,reload:3.1,equip:.93,style:'whole'}),
  m700:Object.freeze({magazine:6,cadence:.98,reload:1.85,equip:.71,style:'whole'}),
  ump:Object.freeze({magazine:18,cadence:.18,reload:1.4,equip:.68,style:'whole'}),
  scar:Object.freeze({magazine:24,cadence:.21,reload:1.85,equip:.72,style:'whole'}),
  m16:Object.freeze({magazine:24,cadence:.24,reload:2.05,equip:.78,style:'whole'}),
  m4a1:Object.freeze({magazine:24,cadence:.20,reload:1.75,equip:.68,style:'whole'}),
  an94:Object.freeze({magazine:24,cadence:.22,reload:1.95,equip:.75,style:'whole'}),
  sg552:Object.freeze({magazine:22,cadence:.22,reload:1.85,equip:.71,style:'whole'}),
  groza:Object.freeze({magazine:20,cadence:.19,reload:1.65,equip:.64,style:'whole'}),
  aug:Object.freeze({magazine:24,cadence:.23,reload:1.9,equip:.73,style:'whole'}),
  mp5:Object.freeze({magazine:24,cadence:.17,reload:1.55,equip:.59,style:'whole'}),
  mp7:Object.freeze({magazine:26,cadence:.16,reload:1.5,equip:.61,style:'whole'}),
  m60:Object.freeze({magazine:60,cadence:.24,reload:3.15,equip:1.0,style:'whole'}),
  qbz95:Object.freeze({magazine:23,cadence:.22,reload:1.83,equip:.73,style:'whole'}),
  thompson:Object.freeze({magazine:25,cadence:.19,reload:1.61,equip:.63,style:'whole'}),
  tmp:Object.freeze({magazine:21,cadence:.16,reload:1.48,equip:.57,style:'whole'}),
  jackhammer:Object.freeze({magazine:8,cadence:.44,reload:2.1,equip:.82,style:'whole'}),
  deagle:Object.freeze({magazine:8,cadence:.34,reload:1.29,equip:.56,style:'whole'}),
  glock18:Object.freeze({magazine:16,cadence:.21,reload:1.21,equip:.49,style:'whole'}),
  usp:Object.freeze({magazine:11,cadence:.29,reload:1.16,equip:.46,style:'whole'}),
  anaconda:Object.freeze({magazine:6,cadence:.47,reload:1.72,equip:.68,style:'whole'}),
  mauser:Object.freeze({magazine:10,cadence:.37,reload:1.52,equip:.64,style:'whole'}),
  cop357:Object.freeze({magazine:4,cadence:.4,reload:1.42,equip:.53,style:'whole'}),
  dsr1:Object.freeze({magazine:6,cadence:1.11,reload:2.2,equip:.91,style:'whole'}),
  psg1:Object.freeze({magazine:8,cadence:.54,reload:2.25,equip:.88,style:'whole'}),
  rpk:Object.freeze({magazine:44,cadence:.20,reload:2.82,equip:.85,style:'whole'}),
  ak47:Object.freeze({magazine:23,cadence:.24,reload:1.91,equip:.74,style:'whole'}),
  ak47a:Object.freeze({magazine:25,cadence:.22,reload:1.83,equip:.78,style:'whole'}),
  mk5s:Object.freeze({magazine:21,cadence:.20,reload:1.49,equip:.61,style:'whole'}),
  s686:Object.freeze({magazine:2,cadence:.51,reload:1.68,equip:.61,style:'whole'}),
  s12k:Object.freeze({magazine:7,cadence:.43,reload:1.99,equip:.84,style:'whole'}),
  r1895:Object.freeze({magazine:5,cadence:.48,reload:1.41,equip:.61,style:'whole'}),
  deaglea:Object.freeze({magazine:7,cadence:.34,reload:1.34,equip:.63,style:'whole'}),
  m4a1s:Object.freeze({magazine:23,cadence:.21,reload:1.85,equip:.71,style:'whole'}),
  xm8:Object.freeze({magazine:25,cadence:.19,reload:1.91,equip:.72,style:'whole'}),
  famas:Object.freeze({magazine:22,cadence:.22,reload:1.78,equip:.71,style:'whole'}),
  '9a91':Object.freeze({magazine:19,cadence:.23,reload:1.57,equip:.64,style:'whole'}),
  aa12:Object.freeze({magazine:12,cadence:.32,reload:2.40,equip:.84,style:'whole'}),
  usps:Object.freeze({magazine:9,cadence:.28,reload:1.18,equip:.49,style:'whole'}),
  spas12:Object.freeze({magazine:7,cadence:.56,equip:.83,reload:.57,start:.23,end:.31,style:'phased'}),
  xm1014:Object.freeze({magazine:6,cadence:.49,equip:.75,reload:.58,start:.21,end:.29,style:'phased'}),
  nova:Object.freeze({magazine:5,cadence:.66,equip:.76,reload:.58,style:'incremental'}),
  m37:Object.freeze({magazine:5,cadence:.72,equip:.81,reload:.57,start:.22,end:.32,style:'phased'}),
  m14ebr:Object.freeze({magazine:12,cadence:.33,equip:.89,reload:2.3,style:'whole'}),
  awma:Object.freeze({magazine:5,cadence:1.20,reload:2.66,equip:.89,style:'whole'}),
  barrett:Object.freeze({magazine:4,cadence:1.25,reload:3.04,equip:1.17,style:'whole'}),
  kar98:Object.freeze({magazine:6,cadence:.98,reload:2.03,equip:.80,style:'whole'}),
  awm:Object.freeze({magazine:4,cadence:1.16,reload:2.55,equip:.95,style:'whole'}),
  vector:Object.freeze({magazine:18,cadence:.06,reload:1.58,equip:.52,style:'whole'}),
  mg3silver:Object.freeze({magazine:76,cadence:.14,reload:3.55,equip:1.00,style:'whole'}),
  gatling:Object.freeze({magazine:64,cadence:.18,reload:4.1,equip:1.18,style:'whole'})
});
export function validateBatch(rows=BATCH_FALLBACK){
 if(!rows||Object.keys(rows).sort().join('/')!==[...BATCH_IDS].sort().join('/'))throw Error('Unexpected game profile IDs');
 const profiles={};
 for(const id of BATCH_IDS){
  const p=rows[id];
  if(BATCH7_PHASE_IDS.includes(id)){profiles[id]=validatePhaseProfile(p);continue;}
  if(!p||Object.keys(p).sort().join('/')!=='cadence/equip/magazine/reload/style'
   ||p.style!==((id==='m870'||id===BATCH7_INTERVAL_ID)?'incremental':'whole')
   ||!Number.isInteger(p.magazine)||p.magazine<1||p.magazine>128
   ||![p.cadence,p.equip,p.reload].every(Number.isFinite)
   ||p.cadence<.06||p.cadence>1.25||p.equip<.2||p.equip>1.65||p.reload<.25||p.reload>6)
   throw Error('Invalid virtual loadout profile: '+id);
  profiles[id]=Object.freeze({...p});
 }
 return Object.freeze(profiles);
}
