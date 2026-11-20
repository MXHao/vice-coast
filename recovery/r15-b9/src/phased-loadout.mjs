// Optional virtual resource refill with cosmetic lead and settle. No real
// equipment operation, input/discharge cadence change, inventory writes or audio.
const phaseKeys='cadence/end/equip/magazine/reload/start/style';
const phaseEpsilon=1e-8;
const phaseInRange=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
export function validatePhaseProfile(p){
 if(!p||Object.keys(p).sort().join('/')!==phaseKeys||p.style!=='phased'
   ||!Number.isInteger(p.magazine)||!phaseInRange(p.magazine,1,128)
   ||!phaseInRange(p.cadence,.06,1.25)||!phaseInRange(p.equip,.2,1.65)||!phaseInRange(p.reload,.25,6)
   ||!phaseInRange(p.start,.01,6)||!phaseInRange(p.end,.01,6))throw Error('Invalid bounded phased title profile');
 return Object.freeze({...p});
}
export function createPhasedLoadout(input,{allowInterrupt=false}={}){
 return runBoundedRefill(validatePhaseProfile(input),allowInterrupt===true);
}
export function createBoundedIncrementalLoadout(input){
 if(!input||Object.keys(input).sort().join('/')!=='cadence/equip/magazine/reload/style'||input.style!=='incremental')
  throw Error('Invalid incremental title profile');
 // Validate the same existing action and commit caps. This path has no lead
 // or settle; validation does not invent time or grant an extra action.
 const p=validatePhaseProfile({...input,start:.01,end:.01,style:'phased'});
 return runBoundedRefill({...p,start:0,end:0},true);
}
function runBoundedRefill(p,allowInterrupt){
 let preferred=false,queued=false,mode=false,loaded=p.magazine,reserve=p.magazine*2;
 let draw=0,cycle=0,recoil=0,aimYaw=null,aimPitch=0,aimTime=0;
 let phase=null,remaining=0,duration=0;
 function setPhase(next,seconds=0){phase=next;remaining=duration=seconds;}
 function activate(valid){
  if(!valid||!preferred||mode)return false;
  mode=true;draw=p.equip;cycle=recoil=0;aimYaw=null;aimPitch=aimTime=0;setPhase(null);return true;
 }
 function holster(){
  const was=mode;mode=false;queued=false;draw=cycle=recoil=aimPitch=aimTime=0;aimYaw=null;setPhase(null);return was;
 }
 function reloadNow(){
  if(!mode||draw||phase||loaded>=p.magazine||reserve<1)return false;
  if(p.start>0)setPhase('lead',p.start);else setPhase('refill',p.reload);return true;
 }
 function tick(dt){
  if(!mode||!Number.isFinite(dt)||dt<0)return;
  dt=Math.min(.12,dt);
  draw=Math.max(0,draw-dt);cycle=Math.max(0,cycle-dt);
  recoil=Math.max(0,recoil-5*dt);aimTime=Math.max(0,aimTime-dt);
  if(draw<phaseEpsilon)draw=0;if(cycle<phaseEpsilon)cycle=0;
  // Carry frame overflow across phases. Only completing a bounded refill
  // interval can transfer one virtual unit, never the lead/final animation.
  while(phase&&dt+phaseEpsilon>=remaining){
   dt=Math.max(0,dt-remaining);
   if(phase==='lead')setPhase('refill',p.reload);
   else if(phase==='settle')setPhase(null);
   else {
    if(loaded<p.magazine&&reserve>0){loaded++;reserve--;}
    if(loaded<p.magazine&&reserve>0)setPhase('refill',p.reload);
    else if(p.end>0)setPhase('settle',p.end);
    else setPhase(null);
   }
  }
  if(phase)remaining-=dt;
 }
 function reloadPose(){
  if(!phase)return 0;
  const f=1-remaining/duration;
  if(phase==='lead')return .64*f;
  if(phase==='settle')return .64*(1-f);
  return .64+.2*Math.sin(Math.PI*f);
 }
 return {
  active:()=>mode,pending:()=>queued,preferred:()=>preferred,
  authorize(){preferred=queued=true;},
  applyOutside(valid){const yes=queued;queued=false;return yes&&activate(valid);},
  toggle(valid){if(!valid||!preferred)return 'native';if(mode){holster();return 'holster';}return activate(valid)?'draw':'native';},
  holster,tick,reloadNow,
  fire(){
   if(!mode)return 'native';
   if(draw||cycle)return 'busy';
   if(phase){if(!allowInterrupt||loaded<1)return 'busy';setPhase(null);}
   if(!loaded){reloadNow();return 'empty';}
   loaded--;cycle=p.cadence;recoil=1;return 'shot';
  },
  orient(yaw,pitch){if(mode&&Number.isFinite(yaw)&&Number.isFinite(pitch)){aimYaw=yaw;aimPitch=pitch;aimTime=.52;}},
  state(){return {active:mode,preferred,pending:queued,loaded,reserve,draw,reload:remaining,phase,cycle,recoil,yaw:aimTime>0?aimYaw:null,pitch:aimTime>0?aimPitch:0,aim:mode?(1-draw/p.equip):0,reloadPose:reloadPose()};}
 };
}
