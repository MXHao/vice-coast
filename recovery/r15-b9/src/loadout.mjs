/* The optional free-roam P92 uses game-only state. No field is written to
   the native story encounter or to legacy combat/save data. */
export const TITLE_PROFILE=Object.freeze({magazine:10,cadence:.22,reload:1.25,equip:.55});
export function validateProfile(p){
  if(!p||Object.keys(p).sort().join(',')!=='cadence,equip,magazine,reload'
    ||!Number.isInteger(p.magazine)||p.magazine<1||p.magazine>32
    ||![p.cadence,p.reload,p.equip].every(Number.isFinite)
    ||p.cadence<.06||p.cadence>.8||p.reload<.3||p.reload>4||p.equip<.2||p.equip>2)throw Error('Invalid game-only profile');
  return Object.freeze({...p});
}
export function createP92Loadout(profile=TITLE_PROFILE){
  const p=validateProfile(profile);
  let preferred=false,queued=false,mode=false,loaded=p.magazine,reserve=p.magazine*2;
  let draw=0,cycle=0,reload=0,recoil=0,aimYaw=null,aimPitch=0,aimTime=0;
  function holster(){
    const was=mode;
    mode=false; queued=false; draw=cycle=reload=recoil=aimPitch=aimTime=0; aimYaw=null; return was;
  }
  function activate(valid){
    if(!valid||!preferred||mode)return false;
    mode=true; draw=p.equip; cycle=reload=recoil=0; aimPitch=0; aimYaw=null; aimTime=0;return true;
  }
  function reloadNow(){
    if(!mode||draw||reload||loaded===p.magazine||!reserve)return false;
    reload=p.reload;return true;
  }
  return {
    active:()=>mode, pending:()=>queued, preferred:()=>preferred,
    authorize(){preferred=queued=true;},
    applyOutside(valid){const yes=queued;queued=false;return yes&&activate(valid);},
    toggle(valid){if(!valid||!preferred)return 'native';if(mode){holster();return 'holster';}return activate(valid)?'draw':'native';},
    holster,
    tick(dt){if(!mode)return;dt=Math.min(.12,Math.max(0,dt));draw=Math.max(0,draw-dt);cycle=Math.max(0,cycle-dt);recoil=Math.max(0,recoil-5*dt);aimTime=Math.max(0,aimTime-dt);
      if(reload){reload=Math.max(0,reload-dt);if(!reload){const give=Math.min(p.magazine-loaded,reserve);loaded+=give;reserve-=give;}}},
    reloadNow,
    fire(){if(!mode)return 'native';if(draw||cycle||reload)return 'busy';if(!loaded){reloadNow();return 'empty';}loaded--;cycle=p.cadence;recoil=1;return 'shot';},
    orient(yaw,pitch){if(mode&&Number.isFinite(yaw)&&Number.isFinite(pitch)){aimYaw=yaw;aimPitch=pitch;aimTime=.52;}},
    state(){return {active:mode,preferred,pending:queued,loaded,reserve,draw,reload,cycle,recoil,yaw:aimTime>0?aimYaw:null,pitch:aimTime>0?aimPitch:0,aim:mode?(1-draw/p.equip):0,reloadPose:mode&&reload?1-reload/p.reload:0};}
  };
}
