// Inert game studio artwork for one display. Never observes virtual owner, mouse or audio.
export function createMantaArt(source) {
// Self-contained cosmetic stock avatar correction; display coordinates only. No game authority or timers.
// Call after the mixed pose (NOT after the direct endpoint copy), once per side, with the 2089*3 output positions.
function correctStockRingChain(a){
 if(!(a instanceof Float32Array)||a.length!==2089*3)throw Error('MANTA skin ring topology');
 const factors=[.026,.061,.12,.18,.26,.36,.48,.62,.73,.85,.94,.991,1,1.065,1.12,1.18,1.225,1.29,1.39,1.54,1.70,1.89,2];
 const center=first=>{const r=[0,0,0];for(let i=first;i<first+20;i++)for(let j=0;j<3;j++)r[j]+=a[i*3+j]/20;return r};
 const sub=(u,v)=>u.map((n,i)=>n-v[i]),add=(p,n,x)=>p.map((v,i)=>v+n[i]*x);
 const mean=(u,v)=>u.reduce((r,x,i)=>r+x*v[i],0),len=v=>Math.hypot(...v);
 const w=center(1589),e=center(1629+20*12),s=center(1629+20*22),span=sub(s,w),mag=len(span);
 if(!(mag>.0001))throw Error('invalid MANTA pose');
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

 const check=(x,label)=>{if(!x)throw Error('Manta studio '+label)};
 const vec=(a,n,lo,hi)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isFinite(x)&&x>=lo&&x<=hi);
 const lerp=(a,b,w)=>a+(b-a)*w;
 // Rotate vectors into and out of the prop frame. Nlerping skin positions in
 // camera space directly would cut the curve as the original hard surface rotates.
 function matrix(q){
  const [x,y,z,w]=q,xx=x*x,yy=y*y,zz=z*z;
  return [1-2*(yy+zz),2*(x*y-z*w),2*(x*z+y*w),
   2*(x*y+z*w),1-2*(xx+zz),2*(y*z-x*w),2*(x*z-y*w),2*(y*z+x*w),1-2*(xx+yy)];
 }
 check(source?.id==='p90'&&source.parts?.length===19&&vec(source.pulse,3,-1,1),'identity');
 const pieces=source.parts.map(p=>{
  const n=p.positions?.length;check(Number.isInteger(n)&&n>=9&&n%3===0&&n<=150000,'vertex budget');
  check(vec(p.positions,n,-2,2)&&vec(p.colors,n,0,1)&&Array.isArray(p.indices)&&p.indices.length%3===0&&p.indices.length>0&&p.indices.length<=150000&&p.indices.every(i=>Number.isInteger(i)&&i>=0&&3*i<n),'topology');
  check(typeof p.name==='string'&&p.name.length>0&&['prop','R','L'].includes(p.role),'identity');
  if(p.roughness!==undefined)check(Number.isFinite(p.roughness)&&p.roughness>=0&&p.roughness<=1,'roughness');
  if(p.metalness!==undefined)check(Number.isFinite(p.metalness)&&p.metalness>=0&&p.metalness<=1,'metalness');
  return {name:p.name,role:p.role,roughness:p.roughness??(p.role==='prop'?.47:.69),metalness:p.metalness??(p.role==='prop'?.19:0),positions:new Float32Array(p.positions),indices:new Uint16Array(p.indices),colors:new Float32Array(p.colors)};
 });
 const side={};for(const k of ['L','R']){const v=pieces.filter(p=>p.role===k);check(v.length===1,'one character arm');side[k]=v[0];}
 const keys=['carry','aim','press','release','arc','seat'];check(keys.every(k=>Object.hasOwn(source.poses,k)),'required authored positions');
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
 const smooth=x=>x*x*(3-2*x);
 const mix=(a,b,t)=>Object.fromEntries(keys.map(k=>[k,lerp(a[k]||0,b[k]||0,t)]));
 function sample(v){
  const u=v.phase,w=v.blend;check([u,w].every(n=>Number.isFinite(n)&&n>=0&&n<=1),'progress');
  const stand={carry:1-w,aim:w};let weights,tag;
  if(v.track==='accent'){
    // Transfer the studio carry->press displacement to the seated ADS pose.
    // Never shifts suddenly into carry during an accepted held action.
    const t=(u<.28?smooth(u/.28):1-smooth((u-.28)/.72))*(1-.60*w);
    weights={...stand,carry:stand.carry-t,press:t};tag='accent';
  }else if(v.track==='reload'){
    const keysR=[[0,stand],[.19,{release:1}],[.49,{arc:1}],[.72,{arc:1}],[.94,{seat:1}],[1,{seat:1}]];
    const i=keysR.findIndex((a,j)=>j>0&&u<=a[0]);const [a,b]=[keysR[i-1],keysR[i]];
    weights=mix(a[1],b[1],smooth((u-a[0])/(b[0]-a[0])));tag='reload';
  }else if(v.track==='return'){weights=mix({seat:1},stand,smooth(u));tag='return';}
  else {check(v.track==='stance','track');weights=stand;tag=w===0?'carry':w===1?'aim':'transition';}
  const active=keys.filter(k=>Math.abs(weights[k]||0)>1e-10).map(k=>[k,weights[k]]);
  const acc=f=>active.reduce((s,[k,wt])=>s+wt*f(rows[k]),0);
  const lens=acc(z=>z.lens),p=[0,1,2].map(i=>acc(z=>z.p[i]));
  const raw=[0,1,2,3].map(i=>acc(z=>z.q[i]*(z.q.reduce((sum,n,j)=>sum+n*rows.carry.q[j],0)<0?-1:1)));const mag=Math.hypot(...raw);check(mag>.8,'orientation');
  const q=raw.map(v=>v/mag),[x,y,z]=source.pulse,[a,b,c,d]=q,ix=d*x+b*z-c*y,iy=d*y+c*x-a*z,iz=d*z+a*y-b*x,iw=-a*x-b*y-c*z;
  const pulse=[p[0]+ix*d+iw*-a+iy*-c-iz*-b,p[1]+iy*d+iw*-b+iz*-a-ix*-c,p[2]+iz*d+iw*-c+ix*-b-iy*-a];
  return {tag,track:v.track,progress:u,blend:w,weights:active,p,q,lens,pulse};
 }
 function write(s,out){
  for(const k of ['L','R']){const a=out[k];check(a instanceof Float32Array&&a.length===side[k].positions.length,'arm output');const terms=s.weights.map(([id,w])=>[rows[id][k],w]);
   if(terms.length===1&&terms[0][1]===1){a.set(terms[0][0].direct);continue}
   const [first,w]=terms[0];for(let j=0;j<a.length;j++)a[j]=first.local[j]*w;
   for(let i=1;i<terms.length;i++){const [b,x]=terms[i];for(let j=0;j<a.length;j++)a[j]+=b.local[j]*x;}
   const m=matrix(s.q),p=s.p;for(let j=0;j<a.length;j+=3){const x=a[j],y=a[j+1],z=a[j+2];
    a[j]=m[0]*x+m[1]*y+m[2]*z+p[0];a[j+1]=m[3]*x+m[4]*y+m[5]*z+p[1];a[j+2]=m[6]*x+m[7]*y+m[8]*z+p[2];}
   correctStockRingChain(a);
  }
 }
 return Object.freeze({sample,write,pieces});
}
export function createMantaMeshes(T,g,state,asset){
 const pivot=new T.Group(),prop=new T.Group(),parts=[],out={},buffers={},materials=[];
 pivot.name='MANTA / Inlet • local view';pivot.visible=false;prop.name='Inlet enamel ribbon';pivot.add(prop);
 let previous=null,glint=null;
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
  if(hand){out[i.role]=positions;buffers[i.role]=geom}
 }
 // Two game-illustration sea-glass fins, not a target indicator: only the real
 // accepted field event owns an accent track. No timers, raycasts or audio here.
 const geom=new T.BufferGeometry();parts.push(geom);
 geom.setAttribute('position',new T.BufferAttribute(new Float32Array([
   -.006,.002,0, -.027,.010,0,-.014,.007,0, -.014,.007,0,-.027,.010,0,-.029,.014,0,
    .006,.002,0,  .014,.007,0, .027,.010,0,  .014,.007,0, .029,.014,0, .027,.010,0,
 ]),3));geom.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:0xa7f4db,emissive:0x62dccb,emissiveIntensity:.7,roughness:.8,metalness:0,transparent:true,depthWrite:false,side:2});
 materials.push(material);glint=new T.Mesh(geom,material);glint.name='Inlet / split sea-glass glint';glint.visible=false;glint.frustumCulled=false;pivot.add(glint);
 g.scene.add(pivot);
 }catch(e){dispose();throw e}
 function stage(s){
  if(previous&&s.track===previous.track&&s.progress===previous.progress&&s.blend===previous.blend)return;
  asset.write(s,out);for(const k of ['L','R']){buffers[k].attributes.position.needsUpdate=true;buffers[k].computeVertexNormals();}
  prop.position.set(...s.p);prop.quaternion.set(...s.q);
  glint.visible=s.track==='accent'&&s.progress>0&&s.progress<.86;
  if(glint.visible){const u=s.progress,env=Math.sin(Math.PI*u/.86);glint.position.set(s.pulse[0],s.pulse[1]+.004+.004*u,s.pulse[2]+.001);glint.scale.setScalar(.58+u*1.4);glint.material.opacity=.84*env;}
  previous=s;
 }
 return {stage,draw(s,c){stage(s);pivot.position.copy(c.position);pivot.quaternion.copy(c.quaternion);pivot.visible=true;pivot.updateMatrixWorld(true)},show(){pivot.visible=true},hide,dispose};
}

// Conservative camera-local free-space check for a wide, close graphic silhouette.
// Uses only the same read-only map query; never changes collision or navigation.
export function mantaClearance(g,head,near,dir){
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
