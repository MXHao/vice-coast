import { createArmoryProp } from './wave1-forms.mjs';
// All positions are native character-local appearance anchors. The authored
// art has forward -Z, Y up. Use the stock right-hand slot without moving bones.
const P92_GRIP=[0,-.03055,.02115], SLOT_CONTACT=[0,-.031,.0015];
export function createHeldP92(T,player,rig){
  const slot=rig?.sidearm;
  if(!slot?.parent||slot.parent.name!=='handR'||!rig.digitsRClose||!rig.digitsRStreet)return null;
  const prop=createArmoryProp(T,'p92'), mount=new T.Group(), cue=new T.Object3D();
  if(!prop)return null;
  mount.name='VICE COAST R15 | equipped P92 cosmetic';
  mount.position.copy(slot.position);mount.quaternion.copy(slot.quaternion);mount.scale.copy(slot.scale);
  const b=new T.Box3().setFromObject(prop);
  prop.position.set(...SLOT_CONTACT.map((v,i)=>v-P92_GRIP[i]));
  // The visual cue uses the leading end of the fictional prop mesh, not
  // the displaced stock weapon that is hidden underneath it.
  cue.position.set(0,(b.min.y+b.max.y)*.33,b.min.z+.004);prop.add(cue);
  mount.add(prop);slot.parent.add(mount);
  const closed=[rig.digitsRClose,rig.digitsRStreet];
  const grip=(native)=>{slot.visible=!!native;for(const part of closed)part.morphTargetInfluences[0]=1;};
  grip(false);
  let done=false;
  return {
    worldCue(v){return cue.getWorldPosition(v);},
    // Remove both depot mesh and ownership of the corresponding blend.
    dispose(nativeArmed=false){
      if(done)return;done=true;mount.removeFromParent();
      const geometry=new Set(),materials=new Set();mount.traverse(o=>{
        if(o.geometry)geometry.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
      });
      for(const x of geometry)x.dispose();
      for(const x of materials)x.dispose();
      slot.visible=!!nativeArmed;
      for(const m of closed)m.morphTargetInfluences[0]=nativeArmed?1:0;
    },
    stats:()=>({group:done?0:1,ownedMesh:done?0:prop.children.filter(v=>v.isMesh).length})
  };
}
