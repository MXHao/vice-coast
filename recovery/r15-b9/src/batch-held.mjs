import {createArmoryProp} from './wave1-forms.mjs';
import {groupedHeldPose,hasGroupedPose,sidearmHeldPose} from './batch-poses.mjs';
// Original illustration-surface contacts used only to pose the existing hero
// skeleton. The marker coordinates are not physical part dimensions.
const CONTACTS=Object.freeze({
 m416:Object.freeze({grip:[0,-.03525,.0282],support:[.01645,.00235,-.23735],shoulder:[0,.01175,.2209],base:[.184,.560,.016],scale:.78,bend:.17,roll:.025}),
 p90:Object.freeze({grip:[0,-.0282,.02115],support:[.01645,-.02115,-.11045],shoulder:[0,.01175,.1363],base:[.182,.533,-.018],scale:1.03,bend:.10,roll:.055}),
 m870:Object.freeze({grip:[0,-.0235,.0423],support:[.0141,.00235,-.2397],shoulder:[0,.0047,.2303],base:[.186,.536,.027],scale:.76,bend:.16,roll:-.025}),
 mini14:Object.freeze({grip:[0,-.0235,.03995],support:[.0141,.00235,-.22795],shoulder:[0,.0094,.2397],base:[.184,.551,.018],scale:.73,bend:.17,roll:.017}),
 m249:Object.freeze({grip:[0,-.03995,.0329],support:[.0188,.00705,-.27965],shoulder:[0,.01175,.26085],base:[.188,.539,.037],scale:.62,bend:.16,roll:-.041}),
 m700:Object.freeze({grip:[0,-.0376,.02115],support:[.0188,.0047,-.20915],shoulder:[0,.01175,.27025],base:[.181,.571,.014],scale:.7,bend:.18,roll:.015}),
 ump:Object.freeze({grip:[0,-.0423,.0329],support:[.0141,.00705,-.1692],shoulder:[0,.00705,.2068],base:[.178,.545,.024],scale:.90,bend:.14,roll:.039})
});
function releaseOwnedProp(prop){
 const geometry=new Set(),materials=new Set();
 prop.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 for(const x of geometry)x.dispose();for(const x of materials)x.dispose();
}
function makeRotaryIndicator(T,b){
 const R=.023,points=[];
 for(const [a,n] of [[0,4],[6,3]]){
  for(let j=0;j<n;j++){
   const turn=k=>2*Math.PI*(a+k)/12;
   const p=(f,k)=>points.push(R*f*Math.cos(turn(k)),R*f*Math.sin(turn(k)),0);
   p(.61,j);p(1,j);p(1,j+1);p(.61,j);p(1,j+1);p(.61,j+1);
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));
 const m=new T.Mesh(geo,new T.MeshBasicMaterial({color:0xffbb59,side:2}));
 m.name='VC / readiness dial / cosmetic only';
 m.position.set((b.min.x+b.max.x)*.5,b.max.y-.023,b.max.z+.002);
 return m;
}
export function createHeldBatch(T,rig,id,arm,art=createArmoryProp){
 const authored=CONTACTS[id], stock=rig?.sidearm,right=rig?.right,left=rig?.left,core=right?.upper?.parent;
 if((!authored&&!hasGroupedPose(id))||!stock||!core||left?.upper?.parent!==core||!right.hand||!left.hand||typeof arm!=='function')return null;
 if(!rig.digitsRClose||!rig.digitsRStreet||!rig.digitsLClose||!rig.digitsLStreet)return null;
 const prop=art(T,id), mount=new T.Group(), mark=new T.Object3D();
 if(!prop)return null;
 mount.name='VICE COAST R15 | equipped '+id+' cosmetic';
 const b=new T.Box3().setFromObject(prop),s=authored??groupedHeldPose(id,b);
 if(!s){releaseOwnedProp(prop);return null;}
 mark.position.set((b.min.x+b.max.x)/2,(b.max.y+b.min.y)*.22,b.min.z+.004);
 const halo=id==='gatling'?makeRotaryIndicator(T,b):null;
 if(halo)prop.add(halo);
 prop.add(mark);mount.add(prop);mount.scale.setScalar(s.scale);core.add(mount);
 const rs=[rig.digitsRClose,rig.digitsRStreet],ls=[rig.digitsLClose,rig.digitsLStreet];
 const shoulder=new T.Vector3(),r=new T.Vector3(),l=new T.Vector3(),e1=new T.Vector3(),e2=new T.Vector3();
 let done=false;
 function point(out,row){return out.set(...row).multiplyScalar(s.scale).applyQuaternion(mount.quaternion).add(mount.position);}
 function pose(q){
  if(done)return;
  stock.visible=false;
  if(halo)halo.rotation.z=2*Math.PI*(q.rotaryProgress||0);
  const low=1-q.aim,down=low*.23+q.reloadPose*.20,pitch=q.pitch*.64+down-q.recoil*.045;
  mount.rotation.set(pitch,s.bend+low*.12,s.roll+q.reloadPose*.07,'YXZ');
  shoulder.set(...s.shoulder).multiplyScalar(s.scale).applyQuaternion(mount.quaternion);
  mount.position.set(s.base[0]+low*.014,s.base[1]-low*.09-q.reloadPose*.068,s.base[2]+q.recoil*.021).sub(shoulder);
  point(r,s.grip);point(l,s.support);
  arm(right,1,r,1.49+pitch,s.bend*.65,.11,1);
  arm(left,-1,l,1.32+pitch,s.bend+.18,-.49,1);
  for(const p of rs)p.morphTargetInfluences[0]=.91;
  for(const p of ls)p.morphTargetInfluences[0]=.76;
 }
 return {
  pose,worldCue:v=>mark.getWorldPosition(v),
  measure(){core.updateWorldMatrix(true,false);return {right:right.hand.getWorldPosition(e1).distanceTo(core.localToWorld(r.clone())),left:left.hand.getWorldPosition(e2).distanceTo(core.localToWorld(l.clone()))};},
  stats:()=>({group:done?0:1,ownedMesh:done?0:prop.children.filter(v=>v.isMesh).length}),
  dispose(nativeArmed=false){
   if(done)return;done=true;mount.removeFromParent();
   releaseOwnedProp(prop);
   stock.visible=!!nativeArmed;
   for(const p of rs)p.morphTargetInfluences[0]=nativeArmed?1:0;
   for(const p of ls)p.morphTargetInfluences[0]=nativeArmed?.73:0;
  }
 };
}

// Uses the existing illustration socket and native one-arm motion. Unlike a
// paired-hand stance, attaching a new cosmetic must not own the other hand.
export function createHeldSidearm(T,rig,id,art){
 const slot=rig?.sidearm,closed=[rig?.digitsRClose,rig?.digitsRStreet];
 if(slot?.parent?.name!=='handR'||closed.some(x=>!x)||typeof art!=='function')return null;
 const prop=art(T,id);
 if(!prop)return null;
 const b=new T.Box3().setFromObject(prop),s=sidearmHeldPose(id,b);
 if(!s){releaseOwnedProp(prop);return null;}
 const mount=new T.Group(),mark=new T.Object3D(),modelPoint=new T.Vector3(),actorPoint=new T.Vector3();
 mount.name='VICE COAST R15 | equipped '+id+' cosmetic';
 mount.position.copy(slot.position);mount.quaternion.copy(slot.quaternion);mount.scale.copy(slot.scale);
 prop.scale.setScalar(s.scale);
 prop.position.set(...s.socket.map((v,i)=>v-s.scale*s.grip[i]));
 mark.position.set((b.min.x+b.max.x)/2,(b.min.y+b.max.y)*.33,b.min.z+.004);
 prop.add(mark);mount.add(prop);slot.parent.add(mount);
 let done=false;
 const pose=()=>{if(done)return;slot.visible=false;for(const m of closed)m.morphTargetInfluences[0]=1;};
 pose();
 return {
  pose,worldCue:v=>mark.getWorldPosition(v),
  measure:()=>({right:prop.localToWorld(modelPoint.set(...s.grip)).distanceTo(mount.localToWorld(actorPoint.set(...s.socket))),left:null}),
  stats:()=>({group:done?0:1,ownedMesh:done?0:prop.children.filter(v=>v.isMesh).length}),
  dispose(nativeArmed=false){
   if(done)return;done=true;mount.removeFromParent();releaseOwnedProp(prop);
   slot.visible=!!nativeArmed;for(const m of closed)m.morphTargetInfluences[0]=nativeArmed?1:0;
  }
 };
}
