// Separate finite game-only channel. P92 continues to use its prior machine.
export function createBatchLoadout(p){
 let preferred=false,queued=false,mode=false,loaded=p.magazine,reserve=p.magazine*2;
 let draw=0,cycle=0,reload=0,recoil=0,aimYaw=null,aimPitch=0,aimTime=0;
 const epsilon=1e-8;
 function activate(valid){
  if(!valid||!preferred||mode)return false;
  mode=true;draw=p.equip;cycle=reload=recoil=0;aimYaw=null;aimPitch=aimTime=0;return true;
 }
 function holster(){
  const was=mode;mode=false;queued=false;draw=cycle=reload=recoil=aimPitch=aimTime=0;aimYaw=null;return was;
 }
 function reloadNow(){
  if(!mode||draw||reload||loaded>=p.magazine||reserve<1)return false;
  reload=p.reload;return true;
 }
 function tick(dt){
  if(!mode)return;dt=Math.min(.12,Math.max(0,dt));
  draw=Math.max(0,draw-dt);cycle=Math.max(0,cycle-dt);recoil=Math.max(0,recoil-5*dt);aimTime=Math.max(0,aimTime-dt);
  if(draw<epsilon)draw=0;if(cycle<epsilon)cycle=0;
  if(!reload)return;
  reload-=dt;
  // Exactly one unit per incremental cycle, no implicit supply on switching.
  while(reload<epsilon){
   const give=Math.min(p.style==='incremental'?1:p.magazine-loaded,reserve);
   loaded+=give;reserve-=give;
   if(p.style!=='incremental'||loaded>=p.magazine||reserve<1){reload=0;break;}
   reload+=p.reload;
  }
 }
 return {
  active:()=>mode,pending:()=>queued,preferred:()=>preferred,
  authorize(){preferred=queued=true;},applyOutside(valid){const yes=queued;queued=false;return yes&&activate(valid);},
  toggle(valid){if(!valid||!preferred)return 'native';if(mode){holster();return 'holster';}return activate(valid)?'draw':'native';},
  holster,tick,reloadNow,
  fire(){if(!mode)return 'native';if(draw||cycle||reload)return 'busy';if(!loaded){reloadNow();return 'empty';}loaded--;cycle=p.cadence;recoil=1;return 'shot';},
  orient(yaw,pitch){if(mode&&Number.isFinite(yaw)&&Number.isFinite(pitch)){aimYaw=yaw;aimPitch=pitch;aimTime=.52;}},
  state(){return {active:mode,preferred,pending:queued,loaded,reserve,draw,reload,cycle,recoil,yaw:aimTime>0?aimYaw:null,pitch:aimTime>0?aimPitch:0,aim:mode?(1-draw/p.equip):0,reloadPose:mode&&reload?1-reload/p.reload:0};}
 };
}
