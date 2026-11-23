const __vcR39Course = (() => {
  "use strict";
  const LAPS = 2, GRID = 5, MAX_TIME = 125, COUNTDOWN = 3, HALF_GATE = 6.9;
  const point = (x,z) => ({x,z}), mod = (x,d) => ((x%d)+d)%d;
  const mix = (a,b,k) => a+(b-a)*k;
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const len = (x,z) => Math.hypot(x,z);
  const corners = [[84,84],[0,84],[0,168],[84,168]];
  const pts = [point(84,136)];
  for (let i=0;i<corners.length;i++) {
    const [x,z]=corners[i], [px,pz]=corners[mod(i-1,4)], [nx,nz]=corners[(i+1)%4];
    const r=10, ax=x+(px-x)*r/84, az=z+(pz-z)*r/84, bx=x+(nx-x)*r/84, bz=z+(nz-z)*r/84;
    pts.push(point(ax,az));
    for (let j=1;j<=8;j++) {
      const t=j/8, v=1-t;
      pts.push(point(v*v*ax+2*t*v*x+t*t*bx,v*v*az+2*t*v*z+t*t*bz));
    }
  }
  pts.push(pts[0]);
  let length=0;
  const legs = pts.slice(1).map((b,i) => {
    const a=pts[i], dx=b.x-a.x, dz=b.z-a.z, d=len(dx,dz), start=length;
    length+=d;
    return Object.freeze({a:Object.freeze(a),b:Object.freeze(b),start,d,tx:dx/d,tz:dz/d,corner:d<12});
  });
  function sample(s,lane=0) {
    s=mod(s,length);const v=legs.find(v=>s<v.start+v.d)||legs.at(-1), u=(s-v.start)/v.d;
    return {x:mix(v.a.x,v.b.x,u)-v.tz*lane,z:mix(v.a.z,v.b.z,u)+v.tx*lane,
      tx:v.tx,tz:v.tz,yaw:Math.atan2(-v.tx,-v.tz),corner:v.corner};
  }
  function project(p) {
    let d=Infinity,s=0;
    for (const v of legs) {
      const k=clamp((p.x-v.a.x)*v.tx+(p.z-v.a.z)*v.tz,0,v.d);
      const offset=len(p.x-v.a.x-k*v.tx,p.z-v.a.z-k*v.tz);
      if(offset<d) {d=offset;s=mod(v.start+k,length)}
    }
    return {s,d};
  }
  // Cross each road after the turn, not at the open intersection; the shared 0 gate is the line.
  const gates = Object.freeze([[84,136],[62,84],[0,107],[23,168],[84,151]].map(([x,z],i)=>{
    const at=project({x,z}).s;return Object.freeze({...sample(at),s:at,i})
  }));
  const G=gates.length, LAST=LAPS*G;
  if(gates[0].s!==0||gates.some((v,i)=>i&&v.s<=gates[i-1].s))throw Error("Invalid circuit ordering");
  function gateAt(next) {return gates[next%G]}
  function gateDistance(next) {return Math.floor(next/G)*length+gateAt(next).s}
  function signed(p,g) {return (p.x-g.x)*g.tx+(p.z-g.z)*g.tz}
  function crossing(before,after,g) {
    const l=signed(before,g), r=signed(after,g);
    if(l>=0||r<0||r-l<1e-7)return false;
    const t=-l/(r-l), x=mix(before.x,after.x,t)-g.x, z=mix(before.z,after.z,t)-g.z;
    return Math.abs(-x*g.tz+z*g.tx)<=HALF_GATE;
  }
  const specs=Object.freeze([
    {label:"红隼",color:0xeb5164,lane:-3.5,start:-3.6,pace:22.2,rhythm:4.3,phase:.4},
    {label:"海燕",color:0x52b5f1,lane:3.15,start:-5.2,pace:20.8,rhythm:4.0,phase:2.0},
    {label:"余晖",color:0xeeb254,lane:-1.15,start:-10.6,pace:19.6,rhythm:4.2,phase:3.7},
    {label:"夜潮",color:0x9a71df,lane:4.8,start:-12.5,pace:18.3,rhythm:3.8,phase:1.3},
  ].map(Object.freeze));
  function create() {
    return {phase:"countdown",clock:0,remaining:COUNTDOWN, next:0, progress:-13.7, previousGrid:-13.7,
      offTrack:false,lastRank:GRID,result:null,npcs:specs.map(t=>({t,progress:t.start,speed:0,finishTime:null}))};
  }
  function ranking(q) {
    if(q.result)return q.result.place;
    return 1+q.npcs.filter(v=>v.progress>q.progress+1e-5).length;
  }
  function view(q) {
    const next=q.phase==="finished"||q.phase==="dnf"?null:gateAt(q.next);
    return {phase:q.phase,lap:Math.min(LAPS,Math.floor(Math.max(0,q.next-1)/G)+1), laps:LAPS, place:ranking(q),grid:GRID,
      progress:clamp(q.progress/(length*LAPS),0,1),offTrack:q.offTrack,clock:q.clock,remaining:q.remaining,
      next, gate:q.next%G, gates:G, targetLaps:LAPS, result:q.result};
  }
  function legalProjection(q,p) {
    const r=project(p), lower=q.next?gateDistance(q.next-1):-30, upper=gateDistance(q.next);
    const estimate=r.s+Math.round(((lower+upper)*.5-r.s)/length)*length;
    return {on:r.d<=HALF_GATE+1.5&&estimate>=lower-7&&estimate<=upper+7, estimate, lower,upper};
  }
  function advance(q, dt, playerBefore, playerAfter, held=[]) {
    if(!Number.isFinite(dt)||dt<=0||dt>.08)return null;
    if(q.phase==="countdown") {
      q.remaining=Math.max(0,q.remaining-dt);
      if(q.remaining>1e-9)return null;
      q.phase="running";q.remaining=0;return "go";
    }
    if(q.phase!=="running")return null;
    // The native driving simulation substeps; a discontinuous relocation never yields a gate/lap.
    const jump = playerBefore&&playerAfter ? len(playerAfter.x-playerBefore.x,playerAfter.z-playerBefore.z):Infinity;
    const finite = playerAfter&&Number.isFinite(playerAfter.x)&&Number.isFinite(playerAfter.z);
    const route = finite?legalProjection(q,playerAfter):null;
    q.clock+=dt;
    for(const [i,n] of q.npcs.entries()) {
      if(n.finishTime!==null)continue;
      const t=n.t, path=sample(n.progress+5);
      const want=(t.pace+t.rhythm*Math.sin(q.clock*.17+t.phase))*(path.corner?.74:1)*(held[i]?.52:1);
      n.speed+=clamp(want-n.speed,-9*dt,5.2*dt);
      const prior=n.progress;n.progress=Math.min(LAPS*length,n.progress+n.speed*dt);
      if(n.progress>=LAPS*length){n.finishTime=q.clock-dt+dt*(LAPS*length-prior)/Math.max(1e-7,n.speed*dt);n.speed=0}
    }
    const target=gateAt(q.next), priorRoute=playerBefore&&Number.isFinite(playerBefore.x)&&Number.isFinite(playerBefore.z)?legalProjection(q,playerBefore):null;
    q.offTrack=!(route?.on&&jump<=Math.max(2.6,58*dt));
    if(!q.offTrack)q.progress=clamp(route.estimate,route.lower-5,route.upper-.001);
    if(!q.offTrack&&priorRoute?.on&&crossing(playerBefore,playerAfter,target)) {
      const exact=gateDistance(q.next);
      q.progress=exact;q.next++;
      if(q.next>LAST) {
        const before=signed(playerBefore,target),after=signed(playerAfter,target),time=q.clock-dt+dt*clamp(-before/(after-before),0,1);
        q.result=Object.freeze({place:1+q.npcs.filter(n=>n.finishTime!==null&&n.finishTime<time).length,time});
        q.phase="finished";q.lastRank=q.result.place;return "finish";
      }
      q.lastRank=ranking(q);return q.next>1&&target.i===0?"lap":"gate";
    }
    if(q.clock>=MAX_TIME){q.result=Object.freeze({place:null,time:MAX_TIME});q.phase="dnf";return "dnf"}
    q.lastRank=ranking(q);return null;
  }
  function restartPoint(q) {
    return q.next===0?sample(q.previousGrid,1.65):sample(gateDistance(q.next-1)+2.5);
  }
  return Object.freeze({create,sample,project,gateAt,gateDistance,advance,restartPoint,ranking,view,legs:Object.freeze(legs),
     gates,length,LAPS,GRID,MAX_TIME,HALF_GATE,specs});
})();
