import { createP92Loadout } from './loadout.mjs';
import { createHeldP92 } from './held.mjs';
import { createAudition } from './audition.mjs';
import { validateBatch, LOADOUT_IDS, EXTENDED_IDS, BATCH7_PHASE_IDS, BATCH7_INTERVAL_ID } from './batch-profile.mjs';
import {createPhasedLoadout,createBoundedIncrementalLoadout} from './phased-loadout.mjs';
import { createBatchLoadout } from './batch-loadout.mjs';
import { createHeldBatch, createHeldSidearm } from './batch-held.mjs';
import {hasSidearmPose} from './batch-poses.mjs';
import {TITLE_ADAPTATION_NOTES,createTitleDelayLedger,createTitleRotaryMeter} from './adapted-title.mjs';
const min=(n,a,b)=>Math.max(a,Math.min(n,b));
function visualStop(ray,blocks,max) {
  let reach=max;
  for(const b of blocks) {
    if(ray.origin.x>b.minX&&ray.origin.x<b.maxX&&ray.origin.z>b.minZ&&ray.origin.z<b.maxZ)continue;
    let lo=0,hi=reach;
    for(const [o,d,a,c] of [[ray.origin.x,ray.direction.x,b.minX,b.maxX],[ray.origin.z,ray.direction.z,b.minZ,b.maxZ]]){
      if(Math.abs(d)<1e-7){if(o<a||o>c){lo=2;hi=1;break;}}
      else{let p=(a-o)/d,q=(c-o)/d;if(p>q){const s=p;p=q;q=s;}lo=Math.max(lo,p);hi=Math.min(hi,q);}
    }
    if(hi>=lo&&lo>.74)reach=Math.min(reach,lo-.025);
  }
  return reach;
}
export function createFieldDriver(g,opts,table,profile,isInRoom,batch,studioFactory) {
  const profiles=validateBatch(batch),p92=createP92Loadout(profile),states=new Map([['p92',p92]]);
  const forTitle=id=>BATCH7_PHASE_IDS.includes(id)?createPhasedLoadout(profiles[id],{allowInterrupt:true}):id===BATCH7_INTERVAL_ID?createBoundedIncrementalLoadout(profiles[id]):createBatchLoadout(profiles[id]);
  let id='p92',s=p92;
  const delay=createTitleDelayLedger(),rotary=createTitleRotaryMeter();let gestureEpoch=0;
  const adapted=()=>Object.hasOwn(TITLE_ADAPTATION_NOTES,id);
  let held=null,fx=null,audition=null,authorArt=null,acts=0;
  function ordinary(){
    return !!g.live&&!g.car&&!g.mission&&!g.heat&&!g.encounter?.armed&&!g.encounter?.active
      &&!g.story?.nearPrompt&&!g.story?.failed&&!g.story?.choice&&!(g.story?.active&&g.story.stage>=3&&g.story.stage<=5)
      &&!isInRoom();
  }
  function valid(){return ordinary()&&!g.paused&&opts.playing();}
  const focused=()=>!opts.doc.hidden&&(typeof opts.doc.hasFocus!=='function'||opts.doc.hasFocus());
  const canUseTitle=()=>valid()&&(!adapted()||focused());
  function holding(){return s.active()&&canUseTitle();}
  const cooling=()=>delay.remaining(id)>0||id==='gatling'&&!rotary.ready();
  function pressStamp(){
    if(!adapted())return undefined;
    if(!holding()||cooling())return null;
    const q=s.state();return q.draw>0||q.cycle>0||q.reload>0?null:gestureEpoch;
  }
  function suspend(){
    if(held){held.dispose(!!g.encounter?.armed);held=null;}
    if(audition){audition.stop(true);audition=null;}
    fx=null;authorArt=null;s.holster();rotary.reset();gestureEpoch++;
  }
  function display(){
    if(held)return true;
    try{
      const extended=EXTENDED_IDS.includes(id);
      if(extended&&typeof studioFactory!=='function')return false;
      if(extended&&!authorArt)authorArt=studioFactory();
      held=id==='p92'?createHeldP92(opts.THREE,g.player,opts.rig(g.player))
         :hasSidearmPose(id)?createHeldSidearm(opts.THREE,opts.rig(g.player),id,authorArt)
         :createHeldBatch(opts.THREE,opts.rig(g.player),id,opts.solveArm,extended?authorArt:undefined);
      return !!held;
    }catch{held=null;authorArt=null;return false;}
  }
  function tick(dt) {
    if(delay.pending())delay.tick(dt,valid()&&focused());
    if(!s.active())return;
    if(!canUseTitle()){suspend();return;}
    if(!g.sound?.enabled)audition?.stop(true);
    if(!display()){suspend();return;}
    const before=id==='gatling'?s.state():null;
    s.tick(dt);
    if(before&&!before.draw&&!before.reload)rotary.tick(dt,true);
  }
  function postPose(){
    if(!holding()||!held?.pose)return;
    const q=s.state();held.pose(id==='gatling'?{...q,rotaryProgress:rotary.progress()}:q);
  }
  function present(visual=false){
    if(s.active()&&!canUseTitle())suspend();
    else if(visual)postPose();
  }
  function fire(x,y){
    if(!holding())return !!(s.active()&&adapted()&&ordinary());
    if(!display()){suspend();return true;}
    if(cooling())return true;
    const action=s.fire();
    if(action!=='shot'){
      if(action==='empty'&&adapted()&&s.state().reload>0){gestureEpoch++;if(id==='gatling')rotary.reset();}
      return true;
    }
    if(adapted())gestureEpoch++;
    delay.noteAccepted(id);
    if(!fx)fx={ray:new opts.THREE.Raycaster(),ndc:new opts.THREE.Vector2(),from:new opts.THREE.Vector3(),to:new opts.THREE.Vector3()};
    const rect=g.renderer.domElement.getBoundingClientRect(),w=rect.width||1,h=rect.height||1;
    fx.ndc.set(Number.isFinite(x)?min((x-rect.left)/w*2-1,-1,1):0,Number.isFinite(y)?min(1-(y-rect.top)/h*2,-1,1):0);
    g.camera.updateMatrixWorld();
    fx.ray.setFromCamera(fx.ndc,g.camera);
    const r=fx.ray.ray,n=r.direction.y<-.03?min((.16-r.origin.y)/r.direction.y,.85,48):48;
    r.at(visualStop(r,g.blocks,n),fx.to);
    const yaw=Math.atan2(g.pos.x-fx.to.x,g.pos.z-fx.to.z),
      pitch=min(Math.atan2(fx.to.y-g.pos.y-1.34,Math.max(.5,Math.hypot(g.pos.x-fx.to.x,g.pos.z-fx.to.z))),-.55,.58);
    s.orient(yaw,pitch);
    g.player.rotation.y=yaw;
    opts.pose(g.player,g.walkPhase,0,{time:g.elapsed,aim:1,pitch,recoil:.8,crouch:g.crouched?1:0});
    postPose();held.worldCue(fx.from);
    // Reuse the same bounded native *visual* effect pool. Do not invoke
    // encounter damage, ammo, audio, heat, cutscene, or completion pathways.
    g.encounter.effects.show(fx.from,fx.to,false);acts++;
    if(Object.hasOwn(table,id)&&g.sound?.enabled){
      audition??=createAudition({table:{[id]:table[id]},audio:()=>({enabled:g.sound?.enabled,ctx:g.sound?.ctx,master:g.sound?.effects??g.sound?.master}),
        decode:v=>Uint8Array.from(atob(v),c=>c.charCodeAt(0))});
      void audition.play(id);
    }
    return true;
  }
  return {
    tick,present,fire,holding,suspend,ordinary,pressStamp,
    pending:item=>(item===undefined||item===id)&&s.pending(),
    authorize(item='p92'){
      if(!LOADOUT_IDS.includes(item))return false;
      if(item!==id){suspend();id=item;if(!states.has(id))states.set(id,forTitle(id));s=states.get(id);}
      s.authorize();return true;
    },
    applyOutside:()=>s.applyOutside(canUseTitle()),
    toggle(){
      const t=s.toggle(canUseTitle());if(t==='native')return false;
      if(t==='holster')suspend();
      return true;
    },
    reload(){if(!holding())return false;if(s.reloadNow()&&adapted()){gestureEpoch++;if(id==='gatling')rotary.reset();}return true;},
    decorate(combat){if(!holding())return combat;const q=s.state();return {...combat,armed:true,ammo:q.loaded,reserve:q.reserve,reload:q.reload,drawing:id==='gatling'?Math.max(q.draw,rotary.remaining()):q.draw,...(adapted()?{normalizedWait:delay.remaining(id)}:{}),p92:id==='p92',loadoutId:id};},
    pose(p){if(!holding())return p;const q=s.state();p.aim=q.aim;p.pitch=q.pitch;p.recoil=q.recoil;p.reload=q.reloadPose;return p;},
    yaw(fallback){if(!holding())return fallback;return s.state().yaw??fallback;},
    testing:()=>{const q=s.state();return {...q,id,...(adapted()?{normalizedWait:delay.remaining(id),rotaryProgress:id==='gatling'?rotary.progress():0,rotaryReady:id==='gatling'&&rotary.ready(),rotaryRemaining:id==='gatling'?rotary.remaining():0}:{}),held:held?.stats().group??0,fit:held?.measure?.()??null,acts,audio:audition?.stats()??{retained:0,bytes:0,live:0,decoded:0,played:0}};}
  };
}
