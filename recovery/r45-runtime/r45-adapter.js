// This adapter borrows the existing actor's bones. No mesh, material, gameplay
// state or scene object is replaced or allocated by the hot pose path.
if(spec.schema!==1)throw Error('unexpected crouch addon version');
const names=['crouch_idle','crouch_walk'];
const durations=Object.freeze(Object.fromEntries(names.map(n=>[n,spec.clips[n][0]])));
const meta=Object.freeze({durations,strideM:spec.strideM,contacts:Object.freeze(spec.contacts)});
let shared=null;
function decode(){
  if(shared)return shared;
  const raw=atob(packet);
  if(raw.length!==spec.bytes||raw.length%4)throw Error('invalid crouch byte stream');
  const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const buf=new Float32Array(bytes.buffer);
  const span=([i,n])=>{if(!Number.isInteger(i)||!Number.isInteger(n)||n<1||i<0||i+n>buf.length)throw Error('bad crouch track range');return buf.subarray(i,i+n);};
  const info=Object.create(null);
  for(const name of names){
    const [duration,tracks]=spec.clips[name], list=new Array(spec.rest.length*3).fill(null);
    for(const [bone,channel,t,v] of tracks){
      const ix=bone*3+channel,times=span(t),values=span(v);
      if(ix<0||ix>=list.length||list[ix]||values.length!==times.length*(channel===1?4:3))throw Error('bad crouch track');
      list[ix]=[times,values];
    }
    info[name]={duration,list};
  }
  return shared=info;
}
function bind(hero,T){
  const clipData=decode(),bones=spec.rest.map(([name,parent],i)=>{
    const b=hero?.bones?.[name];
    if(!b?.isBone||b.name!==name||parent>=0&&b.parent!==hero.bones[spec.rest[parent][0]])throw Error('crouch skeleton mismatch at '+i);
    return b;
  });
  const basePose=hero.pose.bind(hero),props=['position','quaternion','scale'];
  const q=new T.Quaternion(),r=new T.Quaternion(),p=new T.Vector3(),v=new T.Vector3();
  // Only two geometry-confirmed jacket-teeth strips in high material batch 39
  // were Head-rigid. Keep the original attributes (and all R44 bytes) pristine.
  // Their dormant replacement is borrowed only while the new pose contributes.
  const trim=spec.trim,holder=hero.root.getObjectByName('R44_Harbor_High_'+trim.highBatch),geo=holder?.geometry;
  const srcI=geo?.getAttribute('skinIndex'),srcW=geo?.getAttribute('skinWeight');
  if(!srcI||!srcW||srcI.itemSize!==4||srcW.itemSize!==4||!srcW.normalized||srcI.count!==2836||srcW.count!==2836||
     trim.first!==1108||trim.rows.length!==1728)throw Error('crouch clothing mesh mismatch');
  const altI=new T.BufferAttribute(srcI.array.slice(),4,srcI.normalized),altW=new T.BufferAttribute(srcW.array.slice(),4,srcW.normalized);
  for(let i=0;i<trim.rows.length;i++){
    const k=(trim.first+i)*4,[a,b]=trim.rows[i];
    if(srcI.array[k]!==trim.head||srcW.array[k]!==65535)throw Error('crouch clothing bind mismatch');
    altI.array.set([trim.head,a,b,0],k);
  }
  let key=0;
  const footChain=new Set(),world=new Array(bones.length);
  for(const pt of spec.soles)for(const [j] of pt)for(let n=j;n>=0&&!footChain.has(n);n=spec.rest[n][1])footChain.add(n);
  const sorted=[...footChain].sort((a,b)=>a-b);
  for(const n of sorted)world[n]=new T.Matrix4();
  function supportLift(weight){
    if(weight<=1e-6||weight>=1-1e-6)return 0; // never change the authored endpoints
    for(const n of sorted){
      const b=bones[n],m=world[n],parent=spec.rest[n][1];
      m.compose(b.position,b.quaternion,b.scale);if(parent>=0)m.premultiply(world[parent]);
    }
    let floor=Infinity;
    for(const pt of spec.soles){
      let y=0;
      for(const [n,x,dy,z,w] of pt){const m=world[n].elements;y+=m[1]*x+m[5]*dy+m[9]*z+m[13]*w;}
      if(y<floor)floor=y;
    }
    // Only raise a submerged patch. Don't pin a natural jog/sprint flight to
    // the floor or move the controller. Fade out at both pristine endpoints.
    return Math.min(.19,Math.max(0,.001-floor))*Math.min(1,weight/.06,(1-weight)/.06);
  }
  function release(){
    if(key===0)return;
    geo.setAttribute('skinIndex',srcI);geo.setAttribute('skinWeight',srcW);key=0;
  }
  function tailor(weight){
    const to=Math.max(0,Math.min(65535,Math.round(weight*65535)));
    if(to===key)return;
    if(!to){release();return;}
    for(let i=0;i<trim.rows.length;i++){
      const k=(trim.first+i)*4,w=Math.round(to*trim.rows[i][2]/65535);
      altW.array[k]=65535-to;altW.array[k+1]=w;altW.array[k+2]=to-w;altW.array[k+3]=0;
    }
    if(!key){geo.setAttribute('skinIndex',altI);geo.setAttribute('skinWeight',altW);}
    altW.needsUpdate=true;key=to;
  }
  function pose(layers){
    const normal=[],crouch=[];
    let sum=0;
    for(const layer of layers){
      if(!layer||!(layer.weight>0))continue;
      if(clipData[layer.name])crouch.push(layer);else{normal.push(layer);sum+=layer.weight;}
    }
    if(normal.length)basePose(normal);
    for(const layer of crouch){
      const entry=clipData[layer.name], time=Math.min(1,Math.max(0,layer.phase))*entry.duration;
      const mix=layer.weight/(sum+layer.weight),cached=new Map();
      for(let i=0;i<bones.length;i++){
        for(let j=0;j<3;j++){
          const track=entry.list[i*3+j],out=bones[i][props[j]],quat=j===1,a=quat?q:p,b=quat?r:v;
          if(!track){a.fromArray(spec.rest[i][j+2]);if(quat)a.normalize();}
          else{
            const [times,values]=track,k=quat?4:3;
            // Identical packed timestamp spans share one binary search per layer.
            const key=times.byteOffset;
            let frame=cached.get(key);
            if(!frame||frame[3]!==times.length){
              let l=0,h=times.length-1;
              if(time<=times[l])h=l;else if(time>=times[h])l=h;
              else while(h-l>1){const m=(l+h)>>>1;if(times[m]>time)h=m;else l=m;}
              frame=[l,h,l===h?0:(time-times[l])/(times[h]-times[l]),times.length];cached.set(key,frame);
            }
            const [l,h,t]=frame;a.fromArray(values,k*l);
            if(quat)a.normalize();
            if(l!==h){b.fromArray(values,k*h);if(quat)a.slerp(b.normalize(),t);else a.lerp(b,t);}
            if(quat)a.normalize();
          }
          if(mix===1)out.copy(a);else if(quat)out.slerp(a,mix).normalize();else out.lerp(a,mix);
        }
      }
      sum+=layer.weight;
    }
    const mix=crouch.reduce((n,c)=>n+c.weight,0);tailor(mix);
    return supportLift(mix);
  }
  return Object.freeze({pose,meta,release});
}
return Object.freeze({bind,sourceSHA256:spec.sourceSHA256,meta});
