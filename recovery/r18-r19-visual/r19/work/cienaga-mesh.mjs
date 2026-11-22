// Inert game studio artwork for one display. Never observes virtual owner, mouse or audio.
export function createCienagaArt(source) {
// Self-contained cosmetic stock avatar correction; display coordinates only. No game authority or timers.
// Call after the mixed pose (NOT after the direct endpoint copy), once per side, with the 2089*3 output positions.
function correctStockRingChain(a){
 if(!(a instanceof Float32Array)||a.length!==2089*3)throw Error('CIÉNAGA skin ring topology');
 const factors=[.026,.061,.12,.18,.26,.36,.48,.62,.73,.85,.94,.991,1,1.065,1.12,1.18,1.225,1.29,1.39,1.54,1.70,1.89,2];
 const center=first=>{const r=[0,0,0];for(let i=first;i<first+20;i++)for(let j=0;j<3;j++)r[j]+=a[i*3+j]/20;return r};
 const sub=(u,v)=>u.map((n,i)=>n-v[i]),add=(p,n,x)=>p.map((v,i)=>v+n[i]*x);
 const mean=(u,v)=>u.reduce((r,x,i)=>r+x*v[i],0),len=v=>Math.hypot(...v);
 const w=center(1589),e=center(1629+20*12),s=center(1629+20*22),span=sub(s,w),mag=len(span);
 if(!(mag>.0001))throw Error('invalid CIÉNAGA pose');
 const n=span.map(v=>v/mag),F=.204,U=.239;
 const d=Math.min(F+U-.0002,Math.max(Math.abs(F-U)+.0002,mag)),ss=add(w,n,d);
 const p=(d*d+F*F-U*U)/(2*d),mid=add(w,n,p);
 const raw=sub(e,w),pole=add(raw,n,-mean(raw,n)); const pl=len(pole);if(pl<1e-7)return;
 const ee=add(mid,pole,Math.sqrt(Math.max(0,F*F-p*p))/pl),de=sub(ee,e),ds=sub(ss,s);
 for(let k=0;k<factors.length;k++){
  const f=factors[k],T=Math.max(0,f-1),A=(f<=1?f:2-f);
  for(let j=0;j<3;j++){const change=A*de[j]+T*ds[j];
   for(let t=0;t<20;t++)a[(1629+20*k+t)*3+j]+=change;}
 }
}

 const check=(x,label)=>{if(!x)throw Error('Cienaga studio '+label)};
 const vec=(a,n,lo,hi)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isFinite(x)&&x>=lo&&x<=hi);
 const lerp=(a,b,w)=>a+(b-a)*w;
 // Rotate vectors into and out of the prop frame. Nlerping skin positions in
 // camera space directly would cut the curve as the original hard surface rotates.
 function matrix(q){
  const [x,y,z,w]=q,xx=x*x,yy=y*y,zz=z*z;
  return [1-2*(yy+zz),2*(x*y-z*w),2*(x*z+y*w),
   2*(x*y+z*w),1-2*(xx+zz),2*(y*z-x*w),2*(x*z-y*w),2*(y*z+x*w),1-2*(xx+yy)];
 }
 check(source?.id==='aug'&&source.parts?.length===5&&source.pulse===undefined,'identity');
 const pieces=source.parts.map(p=>{
  const n=p.positions?.length;check(Number.isInteger(n)&&n>=9&&n%3===0&&n<=150000,'vertex budget');
  check(vec(p.positions,n,-2,2)&&vec(p.colors,n,0,1)&&Array.isArray(p.indices)&&p.indices.length%3===0&&p.indices.length>0&&p.indices.length<=150000&&p.indices.every(i=>Number.isInteger(i)&&i>=0&&3*i<n),'topology');
  check(typeof p.name==='string'&&p.name.length>0&&['prop','R','L'].includes(p.role),'identity');
  if(p.roughness!==undefined)check(Number.isFinite(p.roughness)&&p.roughness>=0&&p.roughness<=1,'roughness');
  if(p.metalness!==undefined)check(Number.isFinite(p.metalness)&&p.metalness>=0&&p.metalness<=1,'metalness');
  return {name:p.name,role:p.role,roughness:p.roughness??(p.role==='prop'?.47:.69),metalness:p.metalness??(p.role==='prop'?.19:0),positions:new Float32Array(p.positions),indices:new Uint16Array(p.indices),colors:new Float32Array(p.colors)};
 });
 const side={};for(const k of ['L','R']){const v=pieces.filter(p=>p.role===k);check(v.length===1,'one character arm');side[k]=v[0];}
 const keys=['carry','aim','beat','transfer','arc','seat'];check(keys.every(k=>Object.hasOwn(source.poses,k)),'required authored positions');
 const rows={};for(const key of keys){
  const p=source.poses[key],t=p.prop;
  check(Number.isFinite(p.lens)&&p.lens>=35&&p.lens<=75&&vec(t?.position,3,-2,2)&&vec(t?.quaternion,4,-1.00001,1.00001)&&Math.abs(Math.hypot(...t.quaternion)-1)<.0001,'lens and root');
  rows[key]={lens:p.lens,p:t.position,q:t.quaternion};
  for(const k of ['L','R']){
   check(vec(p[k]?.positions,side[k].positions.length,-2,2),'character points');const direct=new Float32Array(p[k].positions),local=new Float32Array(direct.length),m=matrix(t.quaternion);
   for(let i=0;i<direct.length;i+=3){const x=direct[i]-t.position[0],y=direct[i+1]-t.position[1],z=direct[i+2]-t.position[2];
    local[i]=m[0]*x+m[3]*y+m[6]*z;local[i+1]=m[1]*x+m[4]*y+m[7]*z;local[i+2]=m[2]*x+m[5]*y+m[8]*z;}
   rows[key][k]={direct,local};
  }
 }
 // These six exact tracks and cubic interpolation were the independently
 // sampled art trajectories. Do not invent a mixed reload/ADS start path.
 const tracks=Object.freeze({
  stance:[['carry','aim',0,1]],
  carryAction:[['carry','beat',0,.29],['beat','carry',.29,1]],
  carryBridge:[['carry','transfer',0,.15],['transfer','arc',.15,.46],['arc','arc',.46,.67],['arc','seat',.67,.90],['seat','seat',.90,1]],
  aimBridge:[['aim','transfer',0,.15],['transfer','arc',.15,.46],['arc','arc',.46,.67],['arc','seat',.67,.90],['seat','seat',.90,1]],
  settleCarry:[['seat','carry',0,1]],
  settleAim:[['seat','aim',0,1]],
 });
 check(pieces.filter(p=>p.role==='prop').map(p=>p.name).join('/')==='aug/coat/aug/inlay/aug/oxide','the three exact finish groups');
 const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
 function sample(v){
  const {track,phase:u,gleam=0}=v;check(typeof track==='string'&&Object.hasOwn(tracks,track)&&[u,gleam].every(n=>Number.isFinite(n)&&n>=0&&n<=1),'progress');
  const [x,y,t0,t1]=tracks[track].find(r=>u>=r[2]&&u<=r[3]);const m=(u-t0)/(t1-t0),w=m*m*(3-2*m);
  const a=rows[x],b=rows[y],p=a.p.map((k,j)=>lerp(k,b.p[j],w)),dotQ=dot(a.q,b.q);
  const q0=a.q.map((k,j)=>lerp(k,(dotQ<0?-1:1)*b.q[j],w)),len=Math.hypot(...q0);check(len>.8,'orientation');
  return {tag:w===0||x===y?x:w===1?y:'transition',track,progress:u,w,lo:x,hi:y,lens:lerp(a.lens,b.lens,w),p,q:q0.map(k=>k/len),gleam};
 }
 function write(s,out){
  for(const k of ['L','R']){
   const a=out[k];check(a instanceof Float32Array&&a.length===side[k].positions.length,'arm output');
   const {lo,hi,w}=s,L=rows[lo][k],R=rows[hi][k];
   if(w===0||lo===hi){a.set(L.direct);continue}
   if(w===1){a.set(R.direct);continue}
   const q=matrix(s.q),p=s.p,v=L.local,b=R.local;
   for(let j=0;j<a.length;j+=3){
    const x=lerp(v[j],b[j],w),y=lerp(v[j+1],b[j+1],w),z=lerp(v[j+2],b[j+2],w);
    a[j]=p[0]+(q[0]*x+q[1]*y+q[2]*z);a[j+1]=p[1]+(q[3]*x+q[4]*y+q[5]*z);a[j+2]=p[2]+(q[6]*x+q[7]*y+q[8]*z);
   }
   correctStockRingChain(a);
  }
 }

 return Object.freeze({sample,write,pieces});
}
export function createCienagaMeshes(T,g,state,asset){
 const pivot=new T.Group(),prop=new T.Group(),parts=[],out={},buffers={},materials=[];
 pivot.name='CIÉNAGA / Tide Pool • local view';pivot.visible=false;prop.name='Tide Pool opaque artwork';pivot.add(prop);
 let previous=null,inlay=null;
 const hide=()=>{pivot.visible=false};
 const dispose=()=>{g.scene?.remove(pivot);for(const x of parts)x.dispose();for(const m of materials)m.dispose();};
 try{
 for(const i of asset.pieces){
  const hand=i.role!=='prop',geom=new T.BufferGeometry();parts.push(geom);
  const positions=hand?i.positions.slice():i.positions;
  geom.setAttribute('position',new T.BufferAttribute(positions,3));geom.setIndex(new T.BufferAttribute(i.indices,1));geom.setAttribute('color',new T.BufferAttribute(i.colors,3));geom.computeVertexNormals();
  const mat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:i.roughness,metalness:i.metalness});
  materials.push(mat);const mesh=new T.Mesh(geom,mat);mesh.name=i.name;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
  (hand?pivot:prop).add(mesh);
  if(i.name==='aug/inlay'){inlay=mat;inlay.emissive.set(0x26d39c);inlay.emissiveIntensity=0;}
  if(hand){out[i.role]=positions;buffers[i.role]=geom}
 }
 if(!inlay)throw Error('Missing exact Tide Pool paint');
 g.scene.add(pivot);
 }catch(e){dispose();throw e}
 function stage(s){
  // The accepted owner edge changes one existing material. No geometry,
  // lighting volume, hit placement or independent timer is introduced.
  inlay.emissiveIntensity=s.gleam;
  if(previous&&s.lo===previous.lo&&s.hi===previous.hi&&s.w===previous.w)return;
  asset.write(s,out);for(const k of ['L','R']){buffers[k].attributes.position.needsUpdate=true;buffers[k].computeVertexNormals();}
  prop.position.set(...s.p);prop.quaternion.set(...s.q);
  previous=s;
 }
 return {stage,draw(s,c){stage(s);pivot.position.copy(c.position);pivot.quaternion.copy(c.quaternion);pivot.visible=true;pivot.updateMatrixWorld(true)},show(){pivot.visible=true},hide,dispose};
}

// Conservative camera-local free-space check for a wide, close graphic silhouette.
// Uses only the same read-only map query; never changes collision or navigation.
export function cienagaClearance(g,head,near,dir){
 if(![head?.x,head?.y,head?.z,dir?.x,dir?.y,dir?.z,near].every(Number.isFinite))return false;
 const h=Math.hypot(dir.x,dir.z);if(h<.2||typeof g.blocked!=='function')return false;
 const sx=-dir.z/h,sz=dir.x/h;
 for(let i=0;i<=10;i++){
  const u=i*.079,x=head.x+dir.x*u,z=head.z+dir.z*u;
  if(g.blocked(x,z,near))return false;
  if(i>0)for(const w of [-.16,.16])if(g.blocked(x+sx*w,z+sz*w,.10))return false;
 }
 return true;
}
