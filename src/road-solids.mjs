// Collision-only data from exact R13 instanced geometry. This is deliberately
// not a scene-mesh proxy: objects below have fixed, physically solid footprints.
const radius=.84, stations=[-1.33,0,1.33], reach=radius+1.33;
const eps=1e-8, cellSize=16;
const rect=(id,x,z,w,d,corner=0)=>Object.freeze({id,x,z,corner,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
const disc=(id,x,z,r)=>Object.freeze({id,x,z,r,minX:x-r,maxX:x+r,minZ:z-r,maxZ:z+r});
const take=(prefix,points,fn)=>points.map((point,i)=>fn(prefix+' '+(i+1),...point));
const parkBeds=[[-143.1,186.06],[-143.1,233.94],[-108.9,186.06],[-108.9,233.94],
  [-59.1,-65.94],[-59.1,-18.06],[-24.9,-65.94],[-24.9,-18.06]];
const oceanBeds=[-183.2,-99.2,-15.2,68.8,152.8,236.8].map(z=>[102.2,z]);
const bays=[-130,40,132,216];

export const ROAD_SOLIDS=Object.freeze([
  // Planter wall cap is face-verified: soil has been inset .22 m; cap adds .11
  // to the underlying wall width/depth. Round chassis corners, not a curb band.
  ...take('park masonry planter',parkBeds,(id,x,z)=>rect(id,x,z,8.21,1.81,.31)),
  ...take('Ocean Drive masonry planter',oceanBeds,(id,x,z)=>rect(id,x,z,5.51,1.76,.31)),
  ...take('park fountain basin',[[-126,210],[-42,-42]],(id,x,z)=>disc(id,x,z,4.17)),
  // Deck height and panel bands intersect a passenger car. Do not include
  // canopy overhang, any seat, moving characters, clothing, or nearby plants.
  ...bays.flatMap((z,i)=>[
    disc('shelter '+(i+1)+' south post',98.08,z-2.25,.077),
    disc('shelter '+(i+1)+' north post',98.08,z+2.25,.077),
    rect('shelter '+(i+1)+' fixed back panel',98.06,z+.45,.12,2.74),
    rect('shelter '+(i+1)+' schedule case',98.08,z-1.80,.21,.83),
    rect('shelter '+(i+1)+' fixed end panel',97.48,z+2.36,1.34,.12)
  ]),
  // There is 22 m of actual open space between separate timber beams. Keep
  // that gap; no continuous invisible shoreline bounding box.
  ...take('promenade guardrail',[-210,-126,-42,42,126,210].map(z=>[115.05,z]),(id,x,z)=>rect(id,x,z,.17,62))
]);

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const hit=(at,nx,nz)=>({at,nx,nz});

function discCast(x,z,dx,dz,ox,oz,r){
 const px=x-ox,pz=z-oz,q=px*px+pz*pz-r*r,along=px*dx+pz*dz;
 if(along>=-eps||q< -eps)return null;
 const a=dx*dx+dz*dz,discriminant=along*along-a*q;
 if(discriminant<=0||a<=eps*eps)return null;
 const t=(-along-Math.sqrt(discriminant))/a;
 if(t < -eps||t>1)return null;
 const at=Math.max(0,t);
 let nx=px+dx*at,nz=pz+dz*at;
 const len=Math.hypot(nx,nz);
 if(len<eps||nx*dx+nz*dz>=-eps)return null;
 nx/=len;nz/=len;
 return hit(at,nx,nz);
}

function overlaps(x,z,b){
 if(b.r!==undefined)return radius+b.r-Math.hypot(x-b.x,z-b.z)>eps;
 const k=b.corner??0;
 const px=clamp(x,b.minX+k,b.maxX-k),pz=clamp(z,b.minZ+k,b.maxZ-k);
 return radius+k-Math.hypot(x-px,z-pz)>eps;
}

function escape(x,z,dx,dz,s,c,b){
 if(b.r!==undefined){
   const vx=x-b.x,vz=z-b.z,l=Math.hypot(vx,vz);
   return l>eps&&vx*dx+vz*dz < -l*eps?hit(0,vx/l,vz/l):null;
 }
 const k=b.corner??0,x0=b.minX+k,x1=b.maxX-k,z0=b.minZ+k,z1=b.maxZ-k;
 const vx=x-clamp(x,x0,x1),vz=z-clamp(z,z0,z1),l=Math.hypot(vx,vz);
 if(l>eps)return vx*dx+vz*dz < -l*eps?hit(0,vx/l,vz/l):null;
 // While genuinely inside, use the nearest exit of the whole chassis.
 // A centred tie may choose either equally short outward side via input.
 const xPad=radius+1.33*Math.abs(s),zPad=radius+1.33*Math.abs(c);
 const sides=[
   [x-b.minX+xPad,-dx,-1,0], [b.maxX-x+xPad,dx,1,0],
   [z-b.minZ+zPad,-dz,0,-1], [b.maxZ-z+zPad,dz,0,1]
 ];
 let best=sides[0];
 for(const v of sides){
   if(v[0]<best[0]-eps||Math.abs(v[0]-best[0])<=eps&&v[1]>best[1])best=v;
 }
 return best[1]<-eps?hit(0,best[2],best[3]):null;
}

function boxCast(x,z,dx,dz,b){
 // Swept center against a rounded Minkowski rectangle: flat sides plus
 // four arcs, not the expanded square that artificially snags corners.
 let best=null,t,v;
 const k=b.corner??0,r=radius+k,minX=b.minX+k,maxX=b.maxX-k,minZ=b.minZ+k,maxZ=b.maxZ-k;
 if(Math.abs(dx)>eps){
   const sign=-Math.sign(dx),edge=(sign<0?minX:maxX)+sign*r;
   t=(edge-x)/dx;v=z+dz*t;
   if(t>=-eps&&t<=1&&v>=minZ-eps&&v<=maxZ+eps)best=hit(Math.max(0,t),sign,0);
 }
 if(Math.abs(dz)>eps){
   const sign=-Math.sign(dz),edge=(sign<0?minZ:maxZ)+sign*r;
   t=(edge-z)/dz;v=x+dx*t;
   if(t>=-eps&&t<=1&&v>=minX-eps&&v<=maxX+eps&&(!best||t<best.at))best=hit(Math.max(0,t),0,sign);
 }
 for(const sx of [-1,1])for(const sz of [-1,1]){
   const u=sx<0?minX:maxX,v=sz<0?minZ:maxZ;
   const h=discCast(x,z,dx,dz,u,v,r);
   if(h&&h.nx*sx>=-eps&&h.nz*sz>=-eps&&(!best||h.at<best.at))best=h;
 }
 return best;
}

function forShape(x,z,dx,dz,s,c,shape){
 let best=null;
 for(const k of stations){
   const a=x+k*s,b=z+k*c;
   // Older saves could straddle a slender fixed object. Choose the same
   // exit from the centre of the whole car, even if the deepest station
   // switches between opposite nose / tail contacts during recovery.
   if(overlaps(a,b,shape))return escape(x,z,dx,dz,s,c,shape);
   const h=shape.r===undefined?boxCast(a,b,dx,dz,shape):discCast(a,b,dx,dz,shape.x,shape.z,shape.r+radius);
   if(h&&(!best||h.at<best.at))best=h;
 }
 return best;
}

export function createRoadSolids(shapes=ROAD_SOLIDS){
 const grid=new Map();
 const cell=v=>Math.floor(v/cellSize);
 const key=(i,j)=>i*16384+j;
 for(const shape of shapes){
   for(let i=cell(shape.minX);i<=cell(shape.maxX);i++){
     for(let j=cell(shape.minZ);j<=cell(shape.maxZ);j++){
       const k=key(i,j);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(shape);
     }
   }
 }
 function pick(native,x,z,dx,dz,yaw){
   if(Math.abs(dx)+Math.abs(dz)<eps||!Number.isFinite(x+z+dx+dz+yaw))return native;
   let best=native,s,c;
   const x0=Math.min(x,x+dx)-reach,x1=Math.max(x,x+dx)+reach;
   const z0=Math.min(z,z+dz)-reach,z1=Math.max(z,z+dz)+reach;
   for(let i=cell(x0);i<=cell(x1);i++)for(let j=cell(z0);j<=cell(z1);j++){
     const bucket=grid.get(key(i,j));if(!bucket)continue;
     for(const b of bucket){
       if(b.maxX<x0||b.minX>x1||b.maxZ<z0||b.minZ>z1)continue;
       if(s===undefined){s=Math.sin(yaw);c=Math.cos(yaw);}
       const h=forShape(x,z,dx,dz,s,c,b);
       // Native collision precedence remains exact for equal times.
       if(h&&(!best||h.at<best.at-eps))best=h;
     }
   }
   return best;
 }
 function blocksPush(x,z,toX,toZ,yaw){
   return pick(null,x,z,toX-x,toZ-z,yaw)!==null;
 }
 return Object.freeze({pick,blocksPush});
}
