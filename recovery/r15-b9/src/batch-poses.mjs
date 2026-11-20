// Fictional, actor-local carry styles. Contact marks are copied from
// our own original illustration layers; no physical part dimensions are used.
const POSE_CLASSES=Object.freeze({
 shoulder:Object.freeze({base:[.184,.549,.020],bend:.165,roll:.028,contactSpan:.341,lengthCap:.534,low:.60,high:.88}),
 compact:Object.freeze({base:[.181,.541,.013],bend:.130,roll:.048,contactSpan:.332,lengthCap:.457,low:.66,high:1.08}),
 precision:Object.freeze({base:[.181,.566,.018],bend:.178,roll:.019,contactSpan:.335,lengthCap:.573,low:.49,high:.78}),
 heavy:Object.freeze({base:[.191,.545,.038],bend:.168,roll:-.037,contactSpan:.338,lengthCap:.564,low:.52,high:.72})
});
const CONTACT_STUDIES=Object.freeze({
 scar:['shoulder',[-8,-14],[101,3,6],[-107,5]],
 m16:['shoulder',[-7,-17],[94,2,6],[-118,4]],
 m4a1:['shoulder',[-13,-22],[115,4,7],[-101,3]],
 an94:['shoulder',[-11,-17],[112,3,7],[-109,4]],
 sg552:['shoulder',[-12,-19],[94,2,8],[-92,3]],
 groza:['compact',[-6,-16],[62,3,8],[-69,2]],
 aug:['compact',[-10,-15],[52,1,7],[-88,4]],
 mp5:['compact',[-9,-16],[72,3,6],[-74,5]],
 mp7:['compact',[-16,-22],[52,6,7],[-68,3]],
 m60:['heavy',[-14,-18],[124,3,8],[-122,4]],
 qbz95:['compact',[-7,-17],[102,3,8],[-88,3]],
 thompson:['compact',[-14,-19],[76,3,6],[-106,3]],
 tmp:['compact',[-13,-25],[61,5,6],[-42,3]],
 jackhammer:['heavy',[-18,-26],[134,2,8],[-113,4]],
 dsr1:['precision',[-15,-25],[125,3,8],[-137,3]],
 psg1:['precision',[-14,-24],[127,3,8],[-138,4]],
 rpk:['heavy',[-10,-24],[109,1,7],[-117,2]],
 ak47:['shoulder',[-7,-17],[89,2,6],[-103,3]],
 ak47a:['shoulder',[-14,-18],[92,2,7],[-110,4]],
 mk5s:['compact',[-16,-23],[67,5,8],[-80,3]],
 s686:['shoulder',[-15,-10],[100,-1,6],[-108,3]],
 s12k:['shoulder',[-8,-15],[113,0,7],[-104,4]],
 m4a1s:['shoulder',[-10,-17],[97,2,6],[-97,4]],
 xm8:['shoulder',[-14,-18],[109,2,8],[-103,4]],
 famas:['shoulder',[-3,-19],[110,3,7],[-99,3]],
 '9a91':['compact',[-13,-20],[71,3,7],[-85,4]],
 aa12:['shoulder',[-15,-21],[129,3,8],[-109,4]],
 spas12:['shoulder',[-10,-17],[103,0,8],[-115,4]],
 xm1014:['shoulder',[-12,-14],[101,2,7],[-111,4]],
 nova:['shoulder',[-12,-19],[120,1,8],[-120,4]],
 m37:['precision',[-24,-12],[100,1,7],[-123,4]],
 m14ebr:['precision',[-13,-25],[141,3,8],[-123,4]],
 awma:['precision',[-12,-27],[143,3,8],[-137,4]],
 barrett:['precision',[-12,-23],[110,2,8],[-132,3]],
 kar98:['precision',[-20,-12],[102,4,6],[-126,3]],
 awm:['precision',[-8,-20],[98,3,6],[-123,4]],
 vector:['compact',[-17,-16],[52,12,8],[-78,5]],
 mg3silver:['heavy',[-13,-24],[132,2,8],[-123,3]],
 gatling:['heavy',[-17,-26],[143,2,9],[-116,3]]
});
const assetPoint=([u,v,w=0])=>[w*.00235,v*.00235,-u*.00235];
export const hasGroupedPose=id=>Object.hasOwn(CONTACT_STUDIES,id);
export function groupedHeldPose(id,bounds){
 if(!hasGroupedPose(id)||!bounds)return null;
 const {min,max}=bounds,axes=['x','y','z'];
 if(!axes.every(a=>Number.isFinite(min?.[a])&&Number.isFinite(max?.[a])&&max[a]>min[a]))return null;
 const [key,...marks]=CONTACT_STUDIES[id],p=POSE_CLASSES[key];
 const [grip,support,shoulder]=marks.map(assetPoint),span=shoulder[2]-support[2],length=max.z-min.z;
 const scale=Math.min(p.high,p.contactSpan/span,p.lengthCap/length);
 if(!(support[2]<grip[2]&&grip[2]<shoulder[2])||!Number.isFinite(scale)||scale<p.low)return null;
 if(![grip,support,shoulder].every(m=>axes.every((a,i)=>m[i]>=min[a]-.015&&m[i]<=max[a]+.015)))return null;
 return {grip,support,shoulder,base:p.base,scale,bend:p.bend,roll:p.roll};
}

const STUDIO_SIDE=Object.freeze({
 deagle:[-14,-19],glock18:[-19,-21],usp:[-21,-23],
 anaconda:[-27,-23],mauser:[-27,-25],cop357:[-24,-26],
 r1895:[-20,-19],deaglea:[-23,-23],usps:[-18,-18]
});
const SIDE_SOCKET=Object.freeze([0,-.031,.0015]);
export const hasSidearmPose=id=>Object.hasOwn(STUDIO_SIDE,id);
export function sidearmHeldPose(id,bounds){
 if(!hasSidearmPose(id)||!bounds)return null;
 const {min,max}=bounds,axes=['x','y','z'],grip=assetPoint(STUDIO_SIDE[id]);
 if(!axes.every((a,i)=>Number.isFinite(min?.[a])&&Number.isFinite(max?.[a])&&max[a]>min[a]&&grip[i]>=min[a]-.012&&grip[i]<=max[a]+.012))return null;
 const s=Math.min(1.02,.263/(max.z-min.z),.088/(max.x-min.x),.154/(max.y-min.y));
 if(!Number.isFinite(s)||s<.60)return null;
 return {grip,scale:s,socket:SIDE_SOCKET};
}
