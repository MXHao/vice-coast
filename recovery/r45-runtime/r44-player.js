// R44 local-trial-only locomotion. R39 continues to own input, collision, camera,
// game state and the underlying rig used by native equipment and view code.
const __vcR44Player=(()=>{
  'use strict';
  const states=new WeakMap();
  const rootName='vc-r44-on-foot-hero';
  const assetWaiting='正在读取新男主…';
  const fallbackNotice='新男主资源未能打开，本次先使用原角色。重新打开试玩可重试。';
  const engine=()=>({Group:Qe,Mesh:ae,BufferGeometry:oe,BufferAttribute:me,Matrix4:Fe,
    Skeleton:Ma,SkinnedMesh:jr,Bone:mf,Quaternion:rn,Vector3:pt,MeshStandardMaterial:te,
    Color:jt,DoubleSide:2,FrontSide:0,BackSide:1});
  const validMotionNames=new Set(['idle','walk','jog','sprint','takeoff','air','land']);
  const held=g=>__vcR15ArmoryReplacement.holding(g)||!!g.encounter?.armed;
  function fromPlayer(g){
    const old=states.get(g);
    if(old?.player===g.player)return old;
    const s={player:g.player,hero:null,gait:null,status:'idle',hidden:false,modelOn:false,
      notified:false,stock:[],gaitLatest:null,reason:null,count:0};
    states.set(g,s);
    const ignore=Q0.get(g.player)?.sidearm;
    g.player.traverse(obj=>{
      if(!obj.isMesh||obj.name==='footContact')return;
      for(let p=obj;p&&p!==g.player;p=p.parent){if(ignore&&p===ignore)return;}
      s.stock.push([obj,obj.layers.mask]);
    });
    return s;
  }
  function swap(s,showMale){
    if(s.hidden===showMale)return;
    if(s.hero)s.hero.root.visible=showMale;
    for(const [obj,mask] of s.stock)obj.layers.mask=showMale?0:mask;
    s.hidden=showMale;
    s.modelOn=showMale;
  }
  function fail(g,s,error){
    swap(s,false);
    if(s.hero){s.hero.root.removeFromParent();s.hero.dispose?.();}
    s.hero=null;s.gait=null;s.gaitLatest=null;s.status='failed';
    s.reason=String(error?.message||'asset');
    if(!s.notified){s.notified=true;g.events?.note?.(fallbackNotice);}
  }
  function begin(g,s){
    if(s.status!=='idle')return;
    s.status='loading';
    // Called on the first eligible on-foot update, not from title boot or racing.
    if(!globalThis.R44HeroAsset)g.events?.note?.(assetWaiting);
    const available=globalThis.R44HeroAsset?Promise.resolve(globalThis.R44HeroAsset):
       Promise.resolve().then(()=>window.__vcR39Boot.loadHero());
    available.then(api=>{
      if(states.get(g)!==s||s.player!==g.player||!g.live)return;
      const created=api.create(engine());
      if(!created?.root?.isObject3D||created.root.parent||typeof created.pose!=='function'||typeof created.setLOD!=='function')
        throw Error('invalid player mesh');
      s.hero=created;
      s.gait=globalThis.VCGaitR44.create();
      // Test pose off-scene first; never hide stock on a partial asset.
      created.root.name=rootName;created.root.visible=false;
      created.pose([{name:'idle',phase:0,weight:1}]);
      s.player.add(created.root);
      s.status='ready';
    }).catch(error=>{if(states.get(g)===s&&s.player===g.player&&g.live)fail(g,s,error);});
  }
  function reset(g){
    const s=states.get(g);
    if(!s)return;
    s.gait?.reset();s.gaitLatest=null;s.count=0;
  }
  function motion(g,dt,finalFrame,speed,grounded,nativeJumpPlayedFoley,surface){
    // Only the actual owned player enters this seam, never the NPC loop.
    if(!g.live||g.paused||g.car||!g.player.visible)return false;
    const s=fromPlayer(g);
    if(s.status==='idle')begin(g,s);
    if(s.status!=='ready')return false;
    // R43 motion library is locomotion. Keep existing crouch/down and the
    // authored two-handed third-person equipment poses until retargeted.
    if(g.crouched||held(g)||(g.encounter?.hp??100)<=0){
      swap(s,false);reset(g);return false;
    }
    if(!Number.isFinite(dt)||dt<=0)return s.modelOn;
    // A separation correction is not a footstep. A new lifecycle starts a fresh clock.
    const normalSpeed=Number.isFinite(speed)&&speed>=0&&speed<9.25;
    try{
      const update=s.gait.step({dt,speed:normalSpeed?speed:0,grounded,reset:!normalSpeed});
      if(!update?.clips?.length||update.clips.some(q=>!validMotionNames.has(q.name)||!Number.isFinite(q.phase)||!Number.isFinite(q.weight)))
        throw Error('invalid gait pose');
      s.gaitLatest=update;
      if(finalFrame){
        s.hero.pose(update.clips);
        s.hero.root.position.y=Number.isFinite(update.visualYOffset)?Math.max(-.2,Math.min(.1,update.visualYOffset)):0;
        const distance=g.camera?.position?.distanceTo(g.player.position)??0;
        // First-person already hides g.player as before; use high detail in normal chase.
        s.hero.setLOD(distance>10.0?1:0);
        swap(s,true);
      }
      if(!s.modelOn)return false;
      // Landing is already played by the unmodified jump owner. Play only
      // planted locomotion contacts, using the exact stock surface foley.
      if(grounded&&!nativeJumpPlayedFoley)for(const contact of update.footfalls||[]){
        if(contact.kind==='step'||contact.kind==='runstep'){
          g.sound.fx(contact.kind,{surface});s.count++;
        }
      }
      return true; // suppress only the old player gait oscillator's step sound
    }catch(error){fail(g,s,error);return false;}
  }
  function inspect(g){
    const s=states.get(g);
    return s?{status:s.status,root:s.hero?.root??null,stock:s.stock,modelOn:s.modelOn,
      gait:s.gaitLatest,count:s.count,reason:s.reason}:null;
  }
  return Object.freeze({motion,reset,inspect});
})();
