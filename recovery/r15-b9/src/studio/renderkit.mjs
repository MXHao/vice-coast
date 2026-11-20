// Local, render-only illustration toolkit for the Vice Coast cosmetic props.
export const finishes=Object.freeze({oxide:{metalness:.53,roughness:.43},coat:{metalness:.17,roughness:.51},inlay:{metalness:.07,roughness:.34}});
const area=p=>p.reduce((a,[x,y],i)=>{const [u,v]=p[(i+1)%p.length];return a+x*v-y*u},0)/2;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function ears(p){
  const remain=p.map((_,i)=>i), result=[];
  while(remain.length>3) {
    let found=false;
    for(let k=0;k<remain.length;k++){
      const a=remain[(k+remain.length-1)%remain.length],b=remain[k],c=remain[(k+1)%remain.length];
      if(cross(p[a],p[b],p[c])<1e-8)continue;
      if(remain.some(h=>h!==a&&h!==b&&h!==c&&cross(p[a],p[b],p[h])>=-1e-8&&cross(p[b],p[c],p[h])>=-1e-8&&cross(p[c],p[a],p[h])>=-1e-8))continue;
      result.push([a,b,c]);remain.splice(k,1);found=true;break;
    }
    if(!found)throw Error('Non-simple illustration contour');
  }
  return result.concat([remain.slice()]);
}
const unit=(x,y)=>{const l=Math.hypot(x,y);return[x/l,y/l]};
function inset(p,edge){
  return p.map(([x,y],i)=>{
    const a=p[(i+p.length-1)%p.length],c=p[(i+1)%p.length],
      [a1,a2]=unit(a[1]-y,x-a[0]),[b1,b2]=unit(y-c[1],c[0]-x),
      s=edge/Math.max(.35,1+a1*b1+a2*b2);
    return [x+s*(a1+b1),y+s*(a2+b2)];
  });
}
export const convex6=(u,v,U,V,cut)=>[[u+cut,v],[U-cut,v],[U,v+cut],[U,V-cut],[U-cut,V],[u+cut,V],[u,V-cut],[u,v+cut]];
// One draw per finish rather than per decorative part. The bevel is actual mass;
// livery is raised opaque color geometry, with no maps, blend sorting or shader hooks.
export const illustrationScale=.00235;
export const toAssetPoint=(u,v,w=0)=>[w*illustrationScale,v*illustrationScale,-u*illustrationScale];
export function canvas(T){
  const batches=new Map(), swatches=new Map();
  function tri(a,b,c,key,col) {
    if(!batches.has(key))batches.set(key,{p:[],c:[]});
    const batch=batches.get(key);
    if(!swatches.has(col))swatches.set(col,new T.Color(col).toArray());
    for(const [u,v,w] of [a,b,c]){batch.p.push(...toAssetPoint(u,v,w));batch.c.push(...swatches.get(col));}
  }
  function shell(p,w,bevel,key,col) {
    if(area(p)<0)p=p.slice().reverse();
    const q=inset(p,bevel),k=Math.min(bevel,w*.52);
    const fillet=inset(p,bevel*.293);
    const rings=[[q,-w],[fillet,-w+k*.293],[p,-w+k],[p,w-k],[fillet,w-k*.293],[q,w]].map(([arr,d])=>arr.map(([u,v])=>[u,v,d]));
    for(const [a,b,c] of ears(q)){
      tri(rings[0][c],rings[0][b],rings[0][a],key,col);tri(rings.at(-1)[a],rings.at(-1)[b],rings.at(-1)[c],key,col);
    }
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<p.length;i++){
      const h=(i+1)%p.length,A=rings[j][i],B=rings[j][h],C=rings[j+1][h],D=rings[j+1][i];
      tri(A,B,C,key,col);tri(A,C,D,key,col);
    }
  }
  function mark(p,depth,key,col) {
    if(area(p)<0)p=p.slice().reverse();const ix=ears(p);
    for(const sign of [-1,1]){const a=p.map(([u,v])=>[u,v,sign*depth]);for(const [x,y,z] of ix)sign>0?tri(a[x],a[y],a[z],key,col):tri(a[z],a[y],a[x],key,col);}
  }
  function stripe(path,thick,z,col,key='coat'){
    // Flat-ended ink strokes with miter joints, single continuous shape.
    const ds=path.slice(1).map(([u,v],i)=>unit(path[i][1]-v,u-path[i][0]));
    const upper=[],lower=[];
    path.forEach(([u,v],i)=>{const a=ds[Math.max(0,i-1)],b=ds[Math.min(i,ds.length-1)],s=thick*.5/(1+a[0]*b[0]+a[1]*b[1]);
      const x=(a[0]+b[0])*s,y=(a[1]+b[1])*s;upper.push([u+x,v+y]);lower.push([u-x,v-y]);});
    mark([...upper,...lower.reverse()],z,key,col);
  }
  function crown(poly,level,key,col,slope=0){
    // Artwork printed on an upward-facing facet; the rear camera sees this
    // surface more often than either profile. Coordinates are (u, lateral).
    if(area(poly)<0)poly=poly.slice().reverse();const v=poly.map(([u,w])=>[u,level+slope*u,w]);
    for(const [a,b,c] of ears(poly))tri(v[c],v[b],v[a],key,col);
  }
  function span(a,b,sections,key,col,n=12) {
    // Closed, decorative faceted rods, with sealed end discs. Never hollow.
    const rings=sections.map(([at,ry,rz])=>Array.from({length:n},(_,i)=>{
      const t=2*Math.PI*i/n;return[at,a+ry*Math.cos(t),b+rz*Math.sin(t)];}));
    for(let k=0;k<rings.length-1;k++)for(let i=0;i<n;i++){const j=(i+1)%n;tri(rings[k][i],rings[k][j],rings[k+1][j],key,col);tri(rings[k][i],rings[k+1][j],rings[k+1][i],key,col);}
    for(let i=1;i<n-1;i++){tri(rings[0][i+1],rings[0][i],rings[0][0],key,col);tri(rings.at(-1)[0],rings.at(-1)[i],rings.at(-1)[i+1],key,col);}
  }
  return {shell,mark,stripe,span,crown,finish(id){
    const root=new T.Group();root.name='VC / '+id+' / detached cosmetic';
    for(const [name,b] of batches){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
      const mat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,...finishes[name]});
      mat.name='VC / '+name;const m=new T.Mesh(g,mat);m.name=id+'/'+name;m.castShadow=true;m.receiveShadow=true;root.add(m);
    }return root;
  }};
}
