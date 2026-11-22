// Private game animation only; no independent timers, inputs, audio, counters or storage.
export function createMantaPresentation() {
 const bounded=(x,lo=0,hi=1)=>Number.isFinite(x)&&x>=lo&&x<=hi;
 const count=x=>Number.isSafeInteger(x)&&bounded(x,0,512);
 const state=x=>x?.active===true&&count(x.loaded)&&count(x.reserve)&&bounded(x.reload,0,12)&&x.phase==null;
 const clip=x=>Math.max(0,Math.min(1,x));
 // A sample can change motion only after the game's actual owner confirms the transition.
 function record(s,g,e,now,asset,prepared,cut) {
  const a=e?.before,b=e?.after;
  if(e?.id!=='p90'||!state(a)||!state(b)||!Number.isFinite(now))return false;
  const gained=b.loaded-a.loaded,spent=a.reserve-b.reserve;
  if(e.op==='fire'&&e.result==='shot'&&gained===-1&&spent===0&&a.reload===0&&b.reload===0){
    if(!prepared(s,e.owner))return false;
    s.kick={start:now};s.end=null;s.lastWorldCue=false;return true;
  }
  if((e.op==='reload'&&e.result===true||e.op==='fire'&&e.result==='empty')&&a.reload===0&&b.reload>0&&gained===0&&spent===0){
    const p=prepared(s,e.owner);if(!p){cut(g,'intent-denied');return false;}
    s.episode={base:b.reload,progress:0,ads:p.ads===true,blend:clip(s.alpha),start:now};
    s.end=s.kick=null;return true;
  }
  if(e.op!=='tick'||!s.episode||!(a.reload>0))return false;
  const ep=s.episode;
  if(b.reload>0&&b.reload<=a.reload&&gained===0&&spent===0){
    ep.progress=Math.max(ep.progress,clip(1-b.reload/ep.base));return true;
  }
  if(b.reload===0&&gained>0&&gained===spent&&gained<=50){
    s.end={start:now,blend:ep.blend};s.episode=null;return true;
  }
  cut(g,'mount-retired');return false;
 }
 // Unit timeline is presentation only; does not determine when a refill is committed.
 function motion(asset) {
  return (s,ads,dt,now)=>{
    if(!Number.isFinite(now)||!Number.isFinite(dt)||dt<0)return null;
    const goal=ads===true?1:0;
    s.alpha=s.episode?s.episode.blend:s.alpha+(goal-s.alpha)*(1-Math.exp(-Math.min(dt,.12)/(goal?.095:.070)));
    if(Math.abs(s.alpha-goal)<.0008)s.alpha=goal;
    const ep=s.episode;if(ep)return asset.sample({track:'reload',phase:ep.progress,blend:ep.blend});
    if(s.end) {
      const u=clip((now-s.end.start)/.17);
      if(u<1)return asset.sample({track:'return',phase:u,blend:s.end.blend});
      s.end=null;
    }
    if(s.kick) {
      const u=clip((now-s.kick.start)/.13);
      if(u<1)return asset.sample({track:'accent',phase:u,blend:s.alpha});
      s.kick=null;
    }
    return asset.sample({track:'stance',phase:s.alpha,blend:s.alpha});
  };
 }
 return Object.freeze({record,motion});
}
