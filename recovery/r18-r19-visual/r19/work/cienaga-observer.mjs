// Private game presentation only. Only the shipped native owner confirms a transition.
// No input listeners, audio writes, clocks, save data, ray casts or counter mutation.
export function createCienagaPresentation(){
 const limits=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b,clip=x=>Math.max(0,Math.min(1,x));
 const bounded=x=>Number.isSafeInteger(x)&&limits(x,0,512);
 const state=x=>x?.active===true&&bounded(x.loaded)&&bounded(x.reserve)&&limits(x.reload,0,12)&&x.phase==null;
 function record(s,g,e,now,asset,prepared,cut){
  const a=e?.before,b=e?.after;
  if(e?.id!=='aug'||!state(a)||!state(b)||!Number.isFinite(now))return false;
  const qty=b.loaded-a.loaded,spent=a.reserve-b.reserve;
  if(e.op==='fire'&&e.result==='shot'&&qty===-1&&spent===0&&a.reload===0&&b.reload===0){
   const p=prepared(s,e.owner);
   if(!p||s.episode)return false;
   s.kick={time:now,carry:!p.ads&&s.alpha===0&&!s.end};
   return true;
  }
  const started=(e.op==='reload'&&e.result===true)||(e.op==='fire'&&e.result==='empty');
  if(started&&a.reload===0&&b.reload>0&&qty===0&&spent===0){
   const p=prepared(s,e.owner);
   // Let native reload proceed if an edge occurred mid-dissolve. It is not
   // eligible to start our art path from an unreviewed intermediate pose.
   if(!p||p.ads&&s.alpha!==1||!p.ads&&s.alpha!==0||s.end){cut(g,'intent-denied');return false}
   const tail=!p.ads&&s.sample?.track==='carryAction'?s.sample.progress:1;
   const lead=clip((1-tail)*.15/b.reload);
   s.episode={initial:b.reload,progress:0,aim:p.ads===true,tail,lead};s.kick=null;
   return true;
  }
  if(e.op!=='tick'||!s.episode||a.reload<=0)return false;
  const q=s.episode;
  if(b.reload>0&&b.reload<=a.reload&&qty===0&&spent===0){
   q.progress=Math.max(q.progress,clip(1-b.reload/q.initial));return true;
  }
  if(b.reload===0&&qty>0&&qty===spent&&qty<=30){
   s.end={time:now,aim:q.aim};s.episode=null;return true;
  }
  cut(g,'mount-retired');return false;
 }
 function motion(asset){
  return (s,intent,dt,now)=>{
   if(!Number.isFinite(now)||!Number.isFinite(dt)||dt<0)return null;
   const ads=intent===true,goal=ads?1:0;
   if(!s.episode&&!s.end){s.alpha+=(goal-s.alpha)*(1-Math.exp(-Math.min(dt,.12)/(ads?.103:.079)));if(Math.abs(s.alpha-goal)<.0008)s.alpha=goal;}
   if(s.episode){
    const e=s.episode;
    if(e.lead&&e.progress<e.lead)return asset.sample({track:'carryAction',phase:e.tail+(1-e.tail)*e.progress/e.lead});
    return asset.sample({track:e.aim?'aimBridge':'carryBridge',phase:clip((e.progress-e.lead)/(1-e.lead))});
   }
   const kick=s.kick,u=kick?clip((now-kick.time)/.15):1;
   if(u>=1)s.kick=null;
   const gleam=kick&&u<.78?clip(Math.sin(Math.PI*u/.78)*.79):0;
   if(s.end){
    const end=s.end,f=clip((now-end.time)/.21);
    if(f<1)return asset.sample({track:end.aim?'settleAim':'settleCarry',phase:f,gleam});
    s.end=null;
   }
   if(kick?.carry&&u<1&&!ads&&s.alpha===0)return asset.sample({track:'carryAction',phase:u,gleam});
   return asset.sample({track:'stance',phase:s.alpha,gleam});
  }
 }
 return Object.freeze({record,motion,afterRight:s=>{s.kick=null;}});
}
