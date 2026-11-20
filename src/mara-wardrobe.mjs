// Asset-side repair of Mara's original jeans weighting only. No new gait,
// actor movement, geometry positions, textures, animation or per-frame work.
const ease=(a,b,x)=>{
 const u=Math.max(0,Math.min(1,(x-a)/(b-a)));
 return u*u*(3-2*u);
};
export function reweightJeans({position,uv,boneIndices,weights,bones}){
 if(!Array.isArray(bones)||!position||!uv||!(boneIndices instanceof Uint8Array)||!(weights instanceof Uint8Array))return null;
 const n=position.count;
 if(n!==uv.count||weights.length!==n*4||boneIndices.length!==n*4)return null;
 const names=['hips','legL','kneeL','legR','kneeR'];
 const ids=Object.fromEntries(names.map(k=>[k,bones.indexOf(k)]));
 if(names.some(k=>ids[k]<0||ids[k]>255))return null;
 const nextIndices=boneIndices.slice(),nextWeights=weights.slice(),touched={knee:0,pelvis:0};
 function row(i,entries){
  const data=entries.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
  if(data.length>4)throw Error('Original rig supports four skin influences at most');
  let sum=0;
  for(const [j,[bone,value]] of data.entries()){
   nextIndices[i+j]=bone;
   nextWeights[i+j]=j===data.length-1?255-sum:Math.round(255*value);
   sum+=nextWeights[i+j];
  }
  for(let j=data.length;j<4;j++){nextIndices[i+j]=0;nextWeights[i+j]=0;}
 }
 for(let j=0,i=0;j<n;j++,i+=4){
  // The original wardrobe already marks this atelier's denim area with the
  // matching atlas interval. Footwear, upper body and edges of other fabrics
  // remain byte-exact in the original quantized attributes.
  if(!(uv.getX(j)>.623&&uv.getY(j)>.375))continue;
  const x=position.getX(j),y=position.getY(j),z=position.getZ(j);
  if(!Number.isFinite(x+y+z))return null;
  let hip=0,ll=0,lr=0,kl=0,kr=0;
  for(let k=0;k<4;k++){
   const id=boneIndices[i+k],w=weights[i+k]/255;
   if(id===ids.hips)hip+=w;
   else if(id===ids.legL)ll+=w;
   else if(id===ids.legR)lr+=w;
   else if(id===ids.kneeL)kl+=w;
   else if(id===ids.kneeR)kr+=w;
  }
  if(y>.275&&y<.528&&ll+lr+kl+kr>.995){
   const l=ll+kl>=lr+kr,L=ids[l?'legL':'legR'],K=ids[l?'kneeL':'kneeR'];
   // Uneven inherited weights went from .60 thigh to .03 across 19 mm.
   // A continuous weld around the existing knee keeps both edge endpoints
   // on predictable adjacent bones without changing mesh/authored anatomy.
   // On the inside of a bend the jacket-facing fold needs a broader
   // hand-off. Keeping the front seam narrower avoids a rubbery kneecap.
   const back=ease(.004,.064,z);
   const upper=ease(.308-.073*back,.478+.073*back,y);
   row(i,[[L,upper],[K,1-upper]]);
   touched.knee++;
  }else if(y>.520&&y<.822&&hip+ll+lr>.995&&(ll+lr)>.01){
   const soften=ease(.532,.625,y)*(1-ease(.784,.822,y));
   const center=(1-ease(.034,.177,Math.abs(x)))*ease(.506,.686,y);
   // The joined inside seam belongs to the pelvis, not the opposite limb.
   // Fade out both horizontally and before the waistband.
   const goal=1-(1-ease(.638,.794,y))*(1-center*.96);
   const trunk=hip*(1-soften)+goal*soften;
   const base=lr/(ll+lr),sameSide=ease(-.066,.066,x);
   const right=base*(1-soften)+sameSide*soften;
   row(i,[[ids.hips,trunk],[ids.legL,(1-trunk)*(1-right)],[ids.legR,(1-trunk)*right]]);
   touched.pelvis++;
  }
 }
 return {indices:nextIndices,weights:nextWeights,touched};
}
// Protect the opt-in merge boundary: this fit is for the exact original
// stock geometry, never the artist's new body/wardrobe if buffers change.
function isExactStock(a,near,far){
 const parts=[a.position,a.uv,a.skinIndex,a.skinWeight,near.index,far.index];
 const sizes=[66516,22172,22172,22172,55500,16194];
 let h=2166136261;
 for(const [i,p] of parts.entries()){
  const raw=p?.array;
  if(!ArrayBuffer.isView(raw)||raw.byteLength!==sizes[i])return false;
  for(const v of new Uint8Array(raw.buffer,raw.byteOffset,raw.byteLength))h=Math.imul(h^v,16777619);
 }
 return (h>>>0)===0x97a98aef;
}
export function createMaraWardrobe(){
 const seen=new WeakSet();
 return Object.freeze({
  apply(actor,Geometry,Attribute){
   if(!actor||actor.userData?.variant!==0||seen.has(actor))return false;
   const near=actor.getObjectByName('outfitClose'),far=actor.getObjectByName('outfitStreet');
   if(!near?.isSkinnedMesh||!far?.isSkinnedMesh)return false;
   const rest=near.geometry,lower=far.geometry,a=rest?.attributes;
   if(!a||!lower?.attributes||lower.attributes.skinIndex!==a.skinIndex||lower.attributes.skinWeight!==a.skinWeight||
      !a.skinIndex||a.skinIndex.normalized||!a.skinWeight?.normalized||
      near.skeleton!==far.skeleton||!isExactStock(a,rest,lower))return false;
   const weights=reweightJeans({position:a.position,uv:a.uv,boneIndices:a.skinIndex.array,
     weights:a.skinWeight.array,bones:near.skeleton.bones.map(b=>b.name)});
   if(!weights||weights.touched.knee<20||weights.touched.pelvis<20)return false;
   const index=new Attribute(weights.indices,4,false),weight=new Attribute(weights.weights,4,true);
   function localGeometry(source){
    // Share immutable shape, UVs, material and index; allocate only the two
    // changed attributes (also shared by the two native LODs).
    const copy=new Geometry();
    copy.name=source.name;
    copy.setIndex(source.index);
    for(const [key,val] of Object.entries(source.attributes))copy.setAttribute(key,val);
    copy.setAttribute('skinIndex',index);copy.setAttribute('skinWeight',weight);
    copy.morphAttributes=source.morphAttributes;copy.morphTargetsRelative=source.morphTargetsRelative;
    copy.boundingBox=source.boundingBox;copy.boundingSphere=source.boundingSphere;
    copy.setDrawRange(source.drawRange.start,source.drawRange.count);
    for(const group of source.groups)copy.addGroup(group.start,group.count,group.materialIndex);
    return copy;
   }
   near.geometry=localGeometry(rest);far.geometry=localGeometry(lower);seen.add(actor);
   return true;
  }
 });
}
