// R14 engine-only mix. Reuses the existing two oscillators, three filters,
// noise loop and routes. No new nodes, timers, one-shots or sample assets.
// Keep enough 2nd–4th body to read on small speakers, not just sub-bass.
const partials=[0,1,.35,.235,.104,.055,.026,.015,.008,.005];
const voices=Object.freeze({
 sport:[34,127,.98,.88,1.05],
 sedan:[33,108,.87,1.09,.97],
 taxi:[30,94,.79,1.15,.94],
 police:[36,118,.93,1.01,1]
});
const cap=(a,b,c)=>Math.min(c,Math.max(b,a));
const unit=v=>cap(Number(v)||0,0,1);

export function enginePartialTable(n=partials.length){
 const real=new Float32Array(n),imag=new Float32Array(n);
 for(let i=1;i<Math.min(n,partials.length);i++){
  // Gently uneven timing breaks the buzz without adding modulation/sources.
  const phase=i===1?0:.17*(i-1)+.09*(i%3-1);
  real[i]=Math.sin(phase)*partials[i];
  imag[i]=Math.cos(phase)*partials[i];
 }
 return {real,imag};
}

export function createEngineAudio(){
 const mounted=new WeakSet(), engines=new WeakMap();
 function periodic(owner,ctx,a){
  // Leave the original table intact as a fallback. A healthy context
  // allocates only one PeriodicWave, using this small precomputed range.
  const {real,imag}=enginePartialTable(a.length);
  try{
   const custom=ctx.createPeriodicWave(real,imag);
   if(custom){mounted.add(owner);return custom;}
  }catch{}
  // Keep the original engine branch in environments rejecting the new table.
  return null;
 }
 function owns(owner){return engines.has(owner);}
 function drive(owner,now,on,rpm,throttle,shift,state,set){
  if(!mounted.has(owner))return false;
  let s=engines.get(owner);
  if(!s){
   if(!owner.engine||!owner.sub||!owner.motor||!owner.engineFilter||!owner.exhaustFilter||
      !owner.exhaust||!owner.intakeFilter||!owner.intake)return false;
   s={at:now,rpm:.15,charge:0,active:false,shift:-1};
   engines.set(owner,s);
  }
  const raw=unit(rpm),gas=unit(throttle);
  const driveLoad=Number.isFinite(state.driveLoad)?unit(state.driveLoad):gas;
  const torque=.63*driveLoad+.37*gas;
  let dt=cap(now-s.at,.016,.14);s.at=now;
  if(on&&!s.active){s.rpm=.15;s.charge=0;s.shift=-1;dt=.032;}
  if(shift)s.shift=now;
  s.active=on;
  // Continuous soft knee, rather than hard jitter at the last gear / top rev.
  const head=Math.max(0,(raw-.84)/.16);
  const target=on?raw-.07*head*head:.15;
  const inShift=s.shift>=0&&now-s.shift<.18;
  s.rpm+=(target-s.rpm)*dt/(dt+(target>s.rpm?.079:inShift?.083:.112));
  s.charge+=((on?torque:0)-s.charge)*dt/(dt+.092);
  const tune=Object.hasOwn(voices,state.type)?voices[state.type]:voices.sport;
  const [base,span,color,bass,volume]=tune;
  const rev=s.rpm*(.74+.26*s.rpm),load=s.charge;
  const hz=base+span*rev,phase=s.shift>=0?cap((now-s.shift)/.18,0,1):1;
  const lift=4*phase*(1-phase),cut=1-.15*lift*lift;
  set(owner.engine.frequency,hz,now,.041);
  set(owner.sub.frequency,hz*.5,now,.049);
  set(owner.engineFilter.frequency,(392+500*rev+282*load)*color,now,.071);
  set(owner.exhaustFilter.frequency,172+175*load+46*rev,now,.083);
  set(owner.exhaust.gain,(.33+.13*load+.042*(1-rev))*bass,now,.084);
  set(owner.intakeFilter.frequency,394+614*load+139*rev,now,.093);
  set(owner.intake.gain,on?(.020+.109*load)*rev:0,now,.080);
  set(owner.motor.gain,on?(.071+.093*load+.040*rev)*volume*cut*.86:0,now,on?.059:.079);
  return true;
 }
 return Object.freeze({periodic,drive,owns});
}
