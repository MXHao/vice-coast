// Deterministic ordinary keyboard/joystick-equivalent route. Steering reacts to
// the same public movement fields in both compiled engines. No teleports.
export const road=[
 [90,82,'Ocean Drive'],[90,16,'Ocean Boulevard'],[89.4,3.9],[87.1,-1.2],[83.8,-4],[77,-5],
 [47,-5,'Ordinary street'],[-1,-5,'Civic crossroads'],[-29,-5,'Palma Court'],[-120,-5,'Inland ordinary blocks'],
 [-165,-5,'Dock Road'],[-169.5,-3.3],[-172,1],[-173,6],[-173,72,'Freight sheds'],[-173,146,'Shipyard'],
 [-173,165],[-171,169],[-167,172],[-161,173],[-127,173,'Port southern works'],[-83,173,'Inland transition'],
 [65,173,'Coastal approach'],[89,175.1],[100,173,'Shore arrival']
];
export const foot=[
 [109,171.5,'Coast promenade'],[123.5,170,'Dry sand'],[133,170,'Tide line'],
 [117.70,176.55],[117.76,180.00],[128,180.12,'Tide-line walk'],[117,180.12,'Beach return']
];
export const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const norm=(x,z)=>Math.hypot(x,z);
const dist=(p,[x,z])=>norm(p.x-x,p.z-z);
const pointLine=(p,a,b)=>{
 const vx=b[0]-a[0],vz=b[1]-a[1],t=Math.min(1,Math.max(0,((p.x-a[0])*vx+(p.z-a[1])*vz)/(vx*vx+vz*vz||1)));
 return norm(p.x-a[0]-t*vx,p.z-a[1]-t*vz);
};
export function footInput(p,q,run){
 const dx=q[0]-p.x,dz=q[1]-p.z,cs=Math.cos(p.yaw),sn=Math.sin(p.yaw);
 const side=dx*cs-dz*sn,f=-dx*sn-dz*cs,m=Math.max(Math.abs(side),Math.abs(f)),ks=[];
 if(Math.abs(f)>.43*m)ks.push(f>0?'KeyW':'KeyS');
 if(Math.abs(side)>.43*m)ks.push(side>0?'KeyD':'KeyA');
 if(run)ks.push('ShiftLeft');
 return ks;
}
export function pilot(){
 let mode='drive',i=0,fi=0,last=null,best=Infinity,progress=0,gateStart=0,walked=0,driven=0,crossed=0;
 let stopSamples=[],out=null,held=null,released=null,end=null,shuttle=0,portrait=0;
 const marks=[],footMarks=[],starter=[90.45,115];
 const snap=()=>({mode,goals:i,driven,walked,crossed,marks,footMarks,out,held,released,end});
 const fail=(reason,p)=>{throw Error(JSON.stringify({reason,mode,i,fi,t:p.t,x:p.x,z:p.z,heat:p.heat}));};
 function update(p){
  if(mode==='done')return [];
  if(![p.x,p.z,p.yaw,p.v,p.t].every(Number.isFinite)||p.heat) return fail('invalid observed state or heat',p);
  const dt=last?p.t-last.t:0,dy=dt>0?angle(p.yaw-last.yaw)/dt:0;
  const moved=last&&last.foot===p.foot?norm(p.x-last.x,p.z-last.z):0;
  if(last&&moved>Math.max(.75,dt*(p.foot?8:25)+.4))return fail('discontinuous travel',p);
  if(mode==='drive')driven+=moved;
  if(['walk','tour','portrait'].includes(mode))walked+=moved;
  last=p;
  if(mode==='drive'){
   let q=road[i],gap=dist(p,q),cross=pointLine(p,i?road[i-1]:starter,q);
   crossed=Math.max(crossed,cross);
   if(p.foot||cross>7) return fail('left registered driver corridor',p);
   let approach=i===22&&released===null&&p.x>=-44&&p.x<0;
   if(approach&&p.x>=-24){
    held??=p.t;
    if(p.t-held>24)return fail('signal hold timeout',p);
    const signal=(p.t+32.6)%22;
    if(signal>=1.5&&signal<=4.5&&p.v<1){released=p.t;approach=false;}
    if(approach&&p.x>-16)return fail('overran red light line',p);
    if(approach&&p.x>=-22)progress=p.t;
   }
   if(gap<best-.45){best=gap;progress=p.t;}
   if(p.t-progress>3.5||p.t-gateStart>(i===22?60:35))return fail('drive no progress',p);
   if(gap<(i===road.length-1?2.8:4)){
    if(q[2])marks.push([q[2],p.t,p.x,p.z,gap]);
    i++;gateStart=progress=p.t;best=Infinity;
    if(i===road.length){mode='brake';return ['Space'];}
    q=road[i];gap=dist(p,q);
   }
   const prev=i?road[i-1]:starter,nxt=road[i+1]||q;
   const bend=Math.abs(angle(Math.atan2(q[0]-prev[0],q[1]-prev[1])-Math.atan2(nxt[0]-q[0],nxt[1]-q[1])));
   const err=angle(Math.atan2(p.x-q[0],p.z-q[1])-p.yaw);
   let v=Math.min(12.8,Math.max(5.4,gap*.58+(bend>.33?0:4.5)),Math.max(3.4,13-Math.abs(err)*12));
   if(i===road.length-1)v=Math.min(v,Math.max(2.3,gap*.55));
   if(approach){const until=-20-p.x;if(until<1.1)return ['Space'];v=Math.min(v,Math.max(.9,Math.sqrt(2*3*Math.max(0,until-.55))));}
   const steer=err-.33*dy,ks=[];
   if(steer>.062)ks.push('KeyA');else if(steer<-.062)ks.push('KeyD');
   if(p.v<v-.48)ks.push('KeyW');else if(p.v>v+.78)ks.push('KeyS');
   return ks;
  }
  if(mode==='brake'){
   if(p.foot||dist(p,[100,173])>5.7)return fail('bad stop',p);
   if(p.v<.15)stopSamples.push(p.t);else stopSamples=[];
   if(stopSamples.length<5)return ['Space'];
   mode='exit';out={t:p.t,car:[p.x,p.z]};return ['!KeyF'];
  }
  if(mode==='exit'){
   if(!p.foot){if(p.t-out.t>1)return fail('no dismount',p);return [];}
   if(dist(p,[100,173])>7)return fail('bad dismount point',p);
   out.foot=[p.x,p.z];mode='walk';return ['KeyW','ShiftLeft'];
  }
  if(mode==='walk'){
   if(!p.foot)return fail('unexpected reentry',p);
   const q=foot[fi],gap=dist(p,q);
   if(gap<(q[2]?1.35:.44)){
    if(q[2])footMarks.push([q[2],p.t,p.x,p.z,gap]);
    fi++;best=Infinity;progress=p.t;
    if(fi===foot.length){mode='tour';return [];}
   }else if(gap<best-.25){best=gap;progress=p.t;}
   if(p.t-progress>3.25||dist(p,[123,175])>29)return fail('pedestrian gate invalid',p);
   return footInput(p,foot[fi],fi%2===0);
  }
  if(mode==='tour'){
   if(!p.foot||p.x<112||p.x>136||Math.abs(p.z-180.12)>4)return fail('bad coast tour',p);
   if(p.t>=120){mode='portrait';return [];}
   const q=shuttle%2===0?[130,180.12]:[117,180.12];
   if(dist(p,q)<1.6)shuttle++;
   return footInput(p,shuttle%2===0?[130,180.12]:[117,180.12],false);
  }
  if(!p.foot)return fail('portrait not on foot',p);
  if(p.t>=124.5){
   if(walked<65||footMarks.length!==5)return fail('short coast route',p);
   mode='done';end=[p.t,p.x,p.z];return [];
  }
  if(p.t>=121&&portrait===0){portrait++;return ['!KeyC'];}
  if(p.t>=122&&portrait===1){portrait++;return ['!KeyC'];}
  return [];
 }
 return {update,snap};
}
