// Source-owned, non-interactive ambient street life for the exact R11 scene.
// The bridge provides only a detached rig factory; no reads/writes of game,
// physics, mission, input, renderer, clock, traffic, or save objects.
const PI = Math.PI, TAU = 2 * PI;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = x => x * x * (3 - 2 * x);
const signed = a => Math.atan2(Math.sin(a), Math.cos(a));
const wobble = (t, f, p) => Math.sin(t * f + p);
const reach = (t, a, b, c, d) => smooth(clamp((t - a) / (b - a))) * (1 - smooth(clamp((t - c) / (d - c))));
const yawTo = (x, z, X, Z) => Math.atan2(x - X, z - Z);

// Feet are native world coordinates from the R11 parcels. The two receiving
// stations are recessed in the existing auction building collider, outside
// player walkability. Market visitors stay in the stall pockets north of Las
// Olas and never walk an original through-lane. See footprint audit.
export const sites = Object.freeze({
  market: Object.freeze({x:29.4, z:13.0, range:77}),
  port: Object.freeze({x:-69.3, z:195.9, range:80})
});
export const crew = Object.freeze([
  {id:'produce', site:'market', variant:2, scarf:0xa17838, offset:11.74, period:24,
    path:[[0,17.76,.167,11.33,-PI/2],[2.4,20.63,.167,11.33,-PI/2],[3.5,21.28,.167,12.32,PI],[8.2,21.28,.167,12.32,PI],[9.7,21.28,.167,12.32,.68],[12.2,18.37,.167,11.33,PI/2],[13.0,17.76,.167,11.33,PI/2],[17.7,17.76,.167,11.33,-PI/2],[24,17.76,.167,11.33,-PI/2]]},
  {id:'queue', site:'market', variant:4, scarf:0x7f4644, offset:3.6, period:28,
    path:[[0,25.28,.167,11.38,.22],[3.2,25.28,.167,11.38,PI/2],[9.4,25.28,.167,11.38,PI/2],[11.7,25.07,.167,12.29,PI],[17,25.07,.167,12.29,PI],[21,25.28,.167,11.38,.12],[28,25.28,.167,11.38,.22]]},
  {id:'fish-customer', site:'market', variant:1, scarf:0x585e76, offset:9.1, period:29,
    path:[[0,40.77,.167,11.68,PI],[6,40.77,.167,11.68,PI],[9.0,38.71,.167,11.68,PI/2],[10.1,38.71,.167,11.68,PI],[19.3,38.71,.167,11.68,PI],[21.8,40.77,.167,11.68,-PI/2],[23.6,40.77,.167,11.68,PI],[29,40.77,.167,11.68,PI]]},
  {id:'fish-tender', site:'market', variant:5, apron:0xc8a66f, offset:16.63, period:23,
    path:[[0,38.88,.211,14.72,.26],[3.7,38.88,.211,14.72,.30],[6.4,39.67,.211,14.70,-1.32],[8.2,39.67,.211,14.70,.10],[15,39.67,.211,14.70,.10],[19,38.88,.211,14.72,1.29],[21,38.88,.211,14.72,.26],[23,38.88,.211,14.72,.26]]},
  {id:'handler', site:'port', variant:3, apron:0x697a84, offset:2.62, period:20,
    path:[[0,-69.19,.874,194.57,-PI/2],[3.95,-69.19,.874,194.57,-PI/2],[4.9,-69.19,.874,194.57,PI],
          [9.0,-69.24,.874,198.12,PI],[10.1,-69.19,.874,198.12,-PI/2],
          [20,-69.19,.874,198.12,-PI/2]]},
  {id:'checker', site:'port', variant:6, apron:0x978063, offset:6.4, period:31,
    path:[[0,-69.11,.874,199.91,-.47],[4.0,-69.11,.874,199.91,-.47],
          [7.0,-69.11,.874,201.08,PI],[9.0,-69.11,.874,201.08,-.52],
          [17,-69.11,.874,201.08,-.52],[20.2,-69.11,.874,199.91,0],
          [24,-69.11,.874,199.91,-.47],[31,-69.11,.874,199.91,-.47]]}
].map(a => Object.freeze({...a, path:Object.freeze(a.path.map(Object.freeze))})));

function describe(time, actor) {
  const {path, period} = actor;
  const total = time + actor.offset;
  let cycle = Math.floor(total / period), t = total - cycle * period;
  if(t >= period){cycle++; t=0;} else if(t<0){t=0;}
  let u = 1, distance = 0, periodDistance = 0;
  for(let i = 1; i < path.length; i++){
    const a=path[i-1], b=path[i], d=Math.hypot(b[1]-a[1],b[3]-a[3]);
    periodDistance += d;
    if(b[0] <= t){u = i + 1;distance += d;}
  }
  const a=path[u-1],b=path[u], span=b[0]-a[0], raw=clamp((t-a[0])/span), p=smooth(raw);
  const x=lerp(a[1],b[1],p), y=lerp(a[2],b[2],p), z=lerp(a[3],b[3],p);
  const d=Math.hypot(b[1]-a[1],b[3]-a[3]), pace=d*6*raw*(1-raw)/span;
  const yawBlend=smooth(clamp((raw - (d>.12?.02:.08)) / (d>.12?.78:.84)));
  const turning=signed(b[4]-a[4]), yaw=a[4]+turning*yawBlend;
  const gait=clamp(pace/1.65,0,1.22), stride=actor.site==='port'?.97:.84;
  // Use position-derived phase so reversing or pausing cannot march in place.
  // Give each leg/loop an integral repeat count for continuity at the seam.
  const cycles=Math.max(2,Math.round(periodDistance/stride));
  const posePhase=(periodDistance? (distance+d*p)/periodDistance*cycles*TAU:0) + actor.variant*.78;
  let lookX=x-Math.sin(yaw)*2, lookZ=z-Math.cos(yaw)*2, lookPitch=0, gesture=0, squat=0, carry=0, point=0;
  if(actor.id==='produce'){
    lookX=21.93;lookZ=13.95;
    gesture=reach(t,4.32,4.7,6.22,7.1)*(.65+.13*wobble(t,4.5,1.1));
    lookPitch=.18+.095*gesture;
  }else if(actor.id==='queue'){
    const toward=reach(t,3.4,4.7,8.35,9.45);
    lookX=lerp(24.21,21.31,toward);lookZ=lerp(13.04,12.18,toward);
    gesture=reach(t,5.15,5.48,5.82,6.35)*.58;
    lookPitch=.03+.085*(1-toward);
  }else if(actor.id==='fish-customer'){
    lookX=pace>.45?x:41.42;lookZ=13.8;
    gesture=reach(t,11.2,12.0,14.76,15.54)*.64; lookPitch=.19;
  }else if(actor.id==='fish-tender'){
    lookX=39.62;lookZ=11.8;
    gesture=Math.max(reach(t,.75,1.28,2.73,3.55),reach(t,8.3,9.4,11.68,13.75),.74*reach(t,14.02,14.7,15.5,16.02))*(.79+.10*wobble(t,4.1,.72));
    lookPitch=.24*.46+.12*gesture;
  }else if(actor.id==='handler'){
    lookX=-68.65;lookZ=t<4.5?194.6:t<9.2?198.2:198.12;
    carry=reach(t,1.22,3.6,10.25,12.16);
    squat=.61*Math.max(reach(t,.45,1.54,2.30,3.8),reach(t,10.12,11.16,12.03,13.07));
    lookPitch=.10+.21*squat;
  }else{
    lookX=-69.21;lookZ=196.56;
    gesture=.48*reach(t,0,.44,2.06,3.4)+.83*reach(t,9.8,10.26,13.94,15.25)+.62*reach(t,22.17,23.38,25.5,26.77);
    lookPitch=.14+.13*gesture;point=reach(t,10.37,10.68,11.19,12.01);
  }
  const gaze=signed(yawTo(x,z,lookX,lookZ)-yaw);
  return {x,y,z,yaw,phase:posePhase,pace,gait,lookYaw:clamp(gaze,-.99,.99)*(1-.65*gait),lookPitch:lookPitch*(1-.67*gait),
    strafe:pace>.03?clamp(((b[1]-a[1])*Math.cos(yaw)-(b[3]-a[3])*Math.sin(yaw))/Math.max(.01,d),-.95,.95):0,
    backpedal:pace>.03&&(-(b[1]-a[1])*Math.sin(yaw)-(b[3]-a[3])*Math.cos(yaw))/Math.max(.01,d)<-.63,
    turn:clamp(turning*.31*Math.sin(PI*raw),-.63,.63),gesture,carry,squat,point,time,t,cycle};
}

export function sampleActivity(elapsed, actor) {
  return describe(Number.isFinite(elapsed)?elapsed:0, actor);
}

// One reusable shallow cargo crate. At a hand-off the grip target and crate
// follow the same place and time, not two unrelated prop loops. The two rests
// stand behind the real platform outer edge and below counter sightlines.
export function handlerState(s) {
  if((s.cycle&1)===0)return s;
  return {...s,z:194.57+198.12-s.z,yaw:signed(PI-s.yaw),turn:-s.turn,lookYaw:-s.lookYaw,strafe:-s.strafe};
}
export function sampleCargo(s) {
  const {t}=s;
  const h=.285,w=.52,standY=1.608,loadYaw=-PI/2;
  const before=t<9.0, reversal=(s.cycle&1)!==0;
  const actor=handlerState(s);
  const anchor={x:-68.80,y:standY+h*.5,z:before!==reversal?194.57:198.12,yaw:loadYaw};
  const held={x:actor.x-.38*Math.sin(actor.yaw),y:actor.y+.994-.116*s.squat,
    z:actor.z-.38*Math.cos(actor.yaw),yaw:actor.yaw};
  const grip=reach(t,1.54,3.58,10.51,12.41);
  // Keep the crate level in both directions. Both endpoints coincide with
  // the bench, the visible body, and the next cycle’s pickup (no teleport).
  return {x:lerp(anchor.x,held.x,grip),y:lerp(anchor.y,held.y,grip),z:lerp(anchor.z,held.z,grip),
    yaw:anchor.yaw+signed(held.yaw-anchor.yaw)*grip,grip,w,h,reversal};
}
function namedRig(actor) {
 const get=n=>actor.getObjectByName(n);
 const left={upper:get('armL'),elbow:get('elbowL'),hand:get('handL')};
 const right={upper:get('armR'),elbow:get('elbowR'),hand:get('handR')};
 if([left,right].some(a=>!a.upper||!a.elbow||!a.hand))throw new Error('R11 detached activity rig is missing a named arm joint');
 return {left,right,spine:left.upper.parent};
}
function colors(THREE) {
 const m=(color,roughness=.84,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 return {wood:m(0x99755b),woodEdge:m(0xb89672),woodDark:m(0x66584a),metal:m(0x627374,.53,.44),
  fruit:m(0xdd9a50,.59), paper:m(0xe5d3a4),list:m(0x5e5145),green:m(0x5c7156),canvas:m(0xc0a577)};
}
function propTools(THREE, m) {
 const unit=new THREE.BoxGeometry(1,1,1);
 function box(root, name, mat, w,h,d,x,y,z, shadow=true) {
  const o=new THREE.Mesh(unit, typeof mat==='string'?m[mat]:mat);
  o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);
  o.castShadow=shadow;o.receiveShadow=true;root.add(o);return o;
 }
 function cargo(w,h,d,name='Working pine fish tote') {
  const g=new THREE.Group();g.name=name;
  box(g,'planked bottom','woodDark',w,.039,d,0,-h/2+.02,0);
  for(const s of [-1,1]){
   for(let i=0;i<3;i++){const y=-h*.5+.063+i*.087;
    box(g,'long deck slat',i===2?'woodEdge':'wood',w,.078,.027,0,y,s*(d/2-.015));
    box(g,'short deck slat',i===2?'woodEdge':'wood',.026,.079,d-.06,s*(w/2-.014),y,0);
   }
   for(const q of [-1,1])box(g,'bound corner cleat','woodDark',.051,h,.049,s*(w*.5-.025),0,q*(d*.5-.025));
   box(g,'braced recessed handle','metal',.037,.032,.12,s*(w*.5+.013),h*.27,0);
  }
  box(g,'covered fish sheets','paper',w*.83,.013,d*.79,0,.073,0,false);
  return g;
 }
 function basket() {
  const g=new THREE.Group();g.name='Wicker market carry basket';
  box(g,'basket shadow body','woodDark',.252,.151,.196,0,-.03,0);
  for(const s of [-1,1]){
   for(let i=0;i<4;i++){
    box(g,'wicker weave','woodEdge',.295,.023,.021,0,i*.037-.11,s*.108);
    box(g,'basket end weave','canvas',.020,.022,.217,s*.14,i*.037-.11,0);
   }
   box(g,'loop foot','woodDark',.026,.158,.025,s*.121,.060,0);
  }
  box(g,'curved handle crown','woodEdge',.249,.030,.032,0,.138,0);
  box(g,'wrapped produce','paper',.225,.033,.166,0,.045,0);
  for(const q of [-1,1])box(g,'citrus and root wraps',q===1?'fruit':'green',.071,.048,.069,q*.059,.066,q*.019);
  return g;
 }
 function marketBag(){
  const g=new THREE.Group();g.name='Folded market paper and produce';
  // Crimped kraft gusset, two cotton loops and loose produce at the lip.
  box(g,'paper folded sack','paper',.218,.235,.166,0,-.122,0);
  box(g,'creased lower gusset','canvas',.217,.052,.163,0,-.211,0);
  for(const x of [-.105,.105])box(g,'paper fold','canvas',.012,.223,.175,x,-.119,0);
  for(const z of [-.056,.056]){
   for(const x of [-.052,.052])box(g,'cotton sling','canvas',.016,.093,.012,x,.029,z);
   box(g,'folded loop','woodEdge',.10,.017,.014,0,.074,z);
  }
  box(g,'orange just inside bag','fruit',.06,.047,.06,0,.004,.005);
  return g;
 }
 function clipboard(){
  const g=new THREE.Group();g.name='Harbor tally board';
  box(g,'oiled tally board','list',.215,.021,.284,0,0,0);
  box(g,'receiving ledger','paper',.181,.003,.237,0,.012,0);
  for(let j=0;j<6;j++)box(g,'ruled lines','woodDark',.152,.001,.004,.005,.015,.081-j*.032,false);
  box(g,'clip','metal',.083,.019,.037,0,.023,-.108);
  return g;
 }
 return {box,cargo,basket,marketBag,clipboard};
}
function rigTools(THREE){
 const {Vector3,Quaternion}=THREE;
 const down=new Vector3(0,-1,0),dir=new Vector3(),pole=new Vector3(),delta=new Vector3(),
  fore=new Vector3(),elbow=new Vector3(),uw=new Quaternion(),lw=new Quaternion(),local=new Quaternion();
 return function wrist({upper,elbow:hinge,hand},target,sign,weight){
  if(weight<.001)return;
  // Native arm joints are detached clones. Derive bone lengths from the rig
  // (not ABI constants), solve both chains against the same carry prop.
  const distanceUpper=hinge.position.length(),distanceFore=hand.position.length();
  if(distanceUpper<.001||distanceFore<.001)return;
  dir.copy(target).sub(upper.position);
  const d=clamp(dir.length(),Math.abs(distanceUpper-distanceFore)+.003,distanceUpper+distanceFore-.002);
  if(dir.lengthSq()<1e-6)return;
  dir.normalize();delta.copy(dir).multiplyScalar(d);
  pole.set(sign*.57,-.70,.39).addScaledVector(dir,-pole.dot(dir)).normalize();
  const projection=(d*d+distanceUpper**2-distanceFore**2)/(2*d);
  elbow.copy(dir).multiplyScalar(projection).addScaledVector(pole,Math.sqrt(Math.max(0,distanceUpper**2-projection**2)));
  fore.copy(delta).sub(elbow).normalize();elbow.normalize();
  uw.setFromUnitVectors(down,elbow);lw.setFromUnitVectors(down,fore);
  upper.quaternion.slerp(uw,weight);local.copy(uw).invert().multiply(lw);hinge.quaternion.slerp(local,weight);
  // Wrists stay neutral; we don't use the native combat rig's grasp poses.
  hand.rotation.set(.24*weight,sign*.02,-sign*.06);
 };
}

function workRest(tools, THREE, near, y, z, paint) {
 const g=new THREE.Group();g.name='Recessed low cargo trestle';
 g.position.set(near,y,z);g.rotation.y=-PI/2;
 for(const x of [-.24,.24])for(const zz of [-.12,.12])tools.box(g,'painted trestle leg','metal',.058,.724,.061,x,.361,zz);
 tools.box(g,'waxed trestle deck','wood',.60,.037,.318,0,.7195,0);
 tools.box(g,'shore identifying edge stripe',paint,.60,.025,.021,0,.71,-.160,false);
 return g;
}
export function createArt({THREE,actors}) {
 const root=new THREE.Group();root.name='R12 street life | actual market & receiving work';
 const mats=colors(THREE),tools=propTools(THREE,mats),solve=rigTools(THREE),v=new THREE.Vector3(),world=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const apronMaterial=color=>new THREE.MeshStandardMaterial({color,roughness:.86});
 const places={};
 for(const [site,p] of Object.entries(sites)){const g=new THREE.Group();g.name=site==='market'?'Mercado Las Olas • produce packets':'South Wharf • dock manifest and freight';g.visible=false;root.add(g);places[site]={...p,group:g};}
 // No baked actors/actions. Variants are existing non-hero silhouettes.
 const mem=new Map();
 for(const a of crew){
  const man=actors.create(a.variant),rig=namedRig(man);
  man.name='Ambient vignette: '+a.id;places[a.site].group.add(man);
  if(a.apron){
   const fabric=apronMaterial(a.apron),apron=new THREE.Group();apron.name='Heavy canvas work apron';
   tools.box(apron,'fitted folded cloth panel',fabric,.333,.304,.012,0,.224,-.163,false);
   tools.box(apron,'knotted gathered waist',fabric,.353,.034,.025,0,.297,-.167,false);
   for(const s of [-1,1])tools.box(apron,'shoulder straps',fabric,.028,.171,.015,s*.100,.395,-.149,false);
   // Panel is fitted to this isolated actor; no material or mesh is modified.
   rig.spine.add(apron);
  }
  const item=a.id==='produce'?tools.basket():a.id==='checker'?tools.clipboard():a.id==='fish-customer'?tools.marketBag():null;
  if(item){item.rotation.set(a.id==='checker'?-.11:.0,0,0);places[a.site].group.add(item);}
  mem.set(a.id,{man,rig,item});
 }
 const crate=tools.cargo(.52,.285,.317);
 places.port.group.add(crate,workRest(tools,THREE,-68.80,.87,194.57,'green'),workRest(tools,THREE,-68.80,.87,198.12,'woodEdge'));
 function update({elapsed,eye}) {
   if(!Number.isFinite(elapsed))return;
   for(const [,p] of Object.entries(places)){p.group.visible=!eye||Math.hypot(eye.x-p.x,eye.z-p.z)<=p.range;}
   const operator=places.port.group.visible?sampleActivity(elapsed,crew[4]):null;
   const cargo=operator?sampleCargo(operator):null;
   if(cargo){crate.position.set(cargo.x,cargo.y,cargo.z);crate.rotation.y=cargo.yaw;}
   for(const a of crew){
    if(!places[a.site].group.visible)continue;
    let s=sampleActivity(elapsed,a);
    if(a.id==='handler')s=handlerState(s);
    const {man,rig,item}=mem.get(a.id);
    man.position.set(s.x,s.y,s.z);man.rotation.y=s.yaw;
    actors.pose(man,s.phase,s.gait,{time:elapsed+a.offset,pace:s.pace,turn:s.turn,lookYaw:s.lookYaw,lookPitch:s.lookPitch,
     crouch:s.squat,strafe:s.strafe,backpedal:s.backpedal});
    man.updateMatrixWorld(true);
    const hand=(name,x,y,z,w)=>solve(rig[name],v.set(x,y,z),name==='right'?1:-1,w);
    if(a.id==='handler'&&cargo){
      // Both wrist endpoints are reconstructed from the SAME holdable prop.
      // Native shoulders are solved in spine space, not aimed via gun poses.
      for(const side of [-1,1]){
       world.set(side*(cargo.w*.5+.022),.084,-.002).applyAxisAngle(up,cargo.yaw).add(crate.position);
       rig.spine.worldToLocal(world);
       hand(side<0?'left':'right',world.x,world.y,world.z,Math.max(cargo.grip,.62*s.squat));
      }
    }else if(a.id==='fish-tender'){
      const oscillation=wobble(elapsed,5.6,1.25);
      hand('right',.126+.10*oscillation,.248+.040*oscillation,-.308,.88*s.gesture);
      hand('left',-.17,.161,-.271,.53*s.gesture);
    }else if(a.id==='checker'){
      hand('left',-.082,.237,-.282,.80);
      hand('right',lerp(.01,.224,s.point),lerp(.239,.491,s.point),lerp(-.290,-.407,s.point),.68*s.gesture+.25*s.point);
    }else if(a.id==='produce'){
      hand('left',-.241,.132,-.071,.76);
      hand('right',.116,.306+.038*wobble(elapsed,5.9,.22),-.338,.98*s.gesture);
    }else if(a.id==='fish-customer'){
      hand('left',-.231,.131,-.125,.84);
      hand('right',.114,.358,-.316,.88*s.gesture);
    }else if(a.id==='queue'){
      hand('right',.164,.29,-.249,.67*s.gesture);
    }
    if(item){
      rig.left.hand.updateWorldMatrix(true,false);rig.left.hand.getWorldPosition(world);
      const h=a.id==='produce'?-.125:a.id==='fish-customer'?-.066:-.009;
      item.position.set(world.x,world.y+h,world.z);
      item.rotation.set(a.id==='checker'?-.22-.06*s.gesture:0,s.yaw,a.id==='produce'?.06*wobble(elapsed,3.1,1.2)*s.gait:0);
    }
   }
 }
 return {root,update};
}
