// Fictional, closed-surface game props. Coordinates are illustration points on a
// character-local canvas, NOT measurements. No internals, moving parts, animation,
// projectile markers, mechanics, game references, equipment or persistence.
export const catalog=Object.freeze([
  {id:'p92',name:'CALA / 92',subtitle:'Enamel tide • sidearm',story:'Port enamel, shaped thumb panel, swept silver brow.'},
  {id:'m416',name:'PALMA / 416',subtitle:'Nightshift • carbine',story:'Desert ceramic, a bridge of floating dark slats and a broken chevron.'},
  {id:'p90',name:'MANTA / 90',subtitle:'Pelagic • compact',story:'Sea glass, swept ribbon body and open twin-window silhouette.'},
  {id:'m870',name:'MADERA / 870',subtitle:'Shipwright • longarm',story:'Waxed mahogany, tapered whale-tail silhouette and copper wave inlay.'}
].map(Object.freeze));
const INK='#222831', GRAPH='#36404a', IRON='#53606b', NICK='#97a8ad', BONE='#d3c7ab',
  TEAL='#487c7b', GREEN='#73968d', AMBER='#c88a53', SAND='#b49c79', EARTH='#806e5c',
  WALNUT='#754a3f', PECAN='#9e6551', GRAIN='#ca8d65', OXBLOOD='#844d48';
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
const convex6=(u,v,U,V,cut)=>[[u+cut,v],[U-cut,v],[U,v+cut],[U,V-cut],[U-cut,V],[u+cut,V],[u,V-cut],[u,v+cut]];
// One draw per finish rather than per decorative part. The bevel is actual mass;
// livery is raised opaque color geometry, with no maps, blend sorting or shader hooks.
function canvas(T){
  const batches=new Map(), swatches=new Map();
  function tri(a,b,c,key,col) {
    if(!batches.has(key))batches.set(key,{p:[],c:[]});
    const batch=batches.get(key),s=.00235;
    if(!swatches.has(col))swatches.set(col,new T.Color(col).toArray());
    for(const [u,v,w] of [a,b,c]){batch.p.push(w*s,v*s,-u*s);batch.c.push(...swatches.get(col));}
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
function cala({shell:S,mark:M,stripe:I,crown:C}) {
  S([[-15,6],[-18,13],[-14,17],[60,17],[71,14],[75,9],[74,4],[65,2],[48,1],[18,2],[9,-1],[-4,-1]],9.5,1.9,'oxide',NICK);
  S([[-14,5],[64,5],[64,-1],[55,-4],[31,-4],[26,-11],[23,-17],[9,-18],[8,-15],[21,-14],[24,-8],[20,-4],[8,-4],[-1,-27],[0,-31],[-5,-34],[-17,-31],[-18,-27],[-10,-5],[-14,-3]],7.6,.7,'coat',GRAPH);
  S([[-10,-4],[0,-6],[-7,-27],[-11,-29],[-16,-26]],8.55,1,'inlay',TEAL);
  M([[-15,-24],[-7,-9],[-8,-18],[-12,-25]],8.7,'inlay',GREEN);
  I([[-12,-26],[-6,-21],[-4,-17]],.85,8.75,BONE,'inlay');
  S([[-18,-27],[-6,-30],[0,-29],[1,-32],[-4,-35],[-18,-32]],8.6,.7,'coat',INK);
  M([[-12,13],[-7,15],[64,15],[70,12],[27,12],[19,9],[-12,9]],9.65,'oxide',IRON);
  for(let j=0;j<4;j++)I([[-10+j*3.4,6.5],[-8+j*3.4,11.3]],1.05,9.76,INK);
  I([[27,10],[55,10],[61,11.4]],.9,9.77,BONE,'inlay');
  M([[48,13.1],[53,14.3],[60,14.3],[56,13.1]],9.77,'inlay',TEAL);
  S([[4,16],[5,17.8],[8,18.8],[43,18.8],[50,17],[45,16]],5.05,.58,'oxide',IRON);
  C([[9,-2.9],[31,-2.9],[38,-1.1],[40,0],[38,1.1],[31,2.9],[9,2.9],[13,0]],18.85,'inlay',GRAPH);
  C([[20,0],[28,-1.7],[34,0],[28,1.7]],18.89,'inlay',TEAL);
  for(let k=0;k<3;k++)I([[-11+k*1.45,-16.8],[-10+k*1.45,-13.8]],.53,8.83,IRON,'inlay');
  S(convex6(-12,16,0,19,.7),5,.65,'oxide',GRAPH);
  S([[61,16],[68,15],[67,18],[63,18]],2.6,.45,'inlay',AMBER);
}
function palma({shell:S,mark:M,stripe:I,span:R,crown:C}){
  S([[-98,5],[-96,19],[-88,23],[-59,23],[-49,17],[-20,17],[-17,7],[-52,5],[-64,3],[-79,-7],[-91,-15],[-97,-12]],9,2.1,'coat',EARTH);
  S([[-99,-13],[-95,-15],[-91,-14],[-92,22],[-97,21],[-100,17]],10,1,'coat',GRAPH);
  M([[-88,17],[-63,19],[-54,14],[-74,12],[-87,6]],9.2,'coat',SAND);
  M([[-88,2],[-75,8],[-63,9],[-79,-2],[-88,-7]],9.3,'oxide',GRAPH);
  S([[-23,3],[-22,19],[-14,23],[51,23],[60,17],[62,1],[44,-5],[18,-5],[10,-2],[6,-5],[-5,-4],[-12,0]],10.5,1.8,'oxide',GRAPH);
  S([[-13,14],[-9,20],[44,20],[55,17],[55,11],[39,9],[9,10],[-2,6],[-13,7]],11,1,'coat',SAND);
  S([[-12,2],[1,1],[7,-3],[-2,-27],[-9,-31],[-18,-27],[-15,-16],[-8,-4]],7.7,1.25,'coat',IRON);
  S([[4,1],[47,0],[45,-12],[40,-22],[43,-32],[50,-38],[43,-44],[28,-44],[19,-32],[18,-15],[19,-5],[5,-4]],8.4,1.25,'coat',EARTH);
  S([[20,-31],[29,-42],[44,-42],[48,-38],[51,-39],[46,-46],[26,-46],[16,-34]],9,1,'coat',GRAPH);
  for(let k=0;k<3;k++)I([[23+k*6,-8],[22+k*6,-21],[25+k*6,-30]],1.25,8.64,SAND);
  R(13,0,[[48,5,6],[135,5,6],[143,4.6,4.6],[172,4.6,4.6],[176,4,4]],'oxide',IRON);
  S([[49,4],[51,20],[63,23],[131,23],[143,18],[142,6],[134,0],[67,-1]],10,1.7,'coat',SAND);
  M([[57,7],[64,15],[137,15],[135,10],[127,7]],10.18,'oxide',IRON);
  for(let k=0;k<6;k++)M([[63+k*10,8.7],[66+k*10,12.6],[74+k*10,12.6],[71+k*10,8.7]],10.36,'oxide',INK);
  I([[69,5],[116,5],[124,6.6]],1.05,10.36,BONE);
  R(13,0,[[169,6,6],[174,7.1,7.1],[184,7.1,7.1],[188,5.5,5.5]],'oxide',GRAPH);
  S(convex6(-13,21,133,25,.8),5.6,.7,'oxide',INK);
  for(const [a,b] of [[12,31],[39,59],[68,89],[97,119]]){
    S(convex6(a,24,b,26.7,.5),4.5,.5,'oxide',IRON);
    C([[a+2,-2.0],[b-3,-2.0],[b-1,0],[b-3,2.0],[a+2,2.0]],26.74,'coat',GRAPH);
  }
  M([[-7,10],[-3,14],[0,14],[-3,10]],11.3,'inlay',BONE);
  S([[-8,23],[-8,31],[-4,34],[2,34],[6,31],[6,24]],4.6,.8,'oxide',IRON);
  S([[124,23],[126,31],[130,32],[135,28],[137,23]],3.3,.7,'oxide',GRAPH);
  M([[3,16],[7,18],[20,18],[12,15]],11.2,'inlay',AMBER);
  I([[20,13],[35,13],[43,15]],1.2,11.24,BONE);
}
function manta({shell:S,mark:M,stripe:I,span:R,crown:C}){
  // Split ribbon silhouettes retain two large, real negative spaces at icon scale.
  S([[-60,8],[-58,19],[-46,25],[49,25],[65,21],[78,14],[80,5],[73,-2],[62,-4],[51,-1],[42,8],[27,10],[16,9],[9,4],[-11,3],[-21,7],[-41,7],[-48,2],[-51,-4],[-60,-6]],12.8,2.15,'coat',TEAL);
  S([[-61,10],[-51,7],[-48,-9],[-39,-15],[-21,-15],[-11,-9],[-5,3],[2,6],[10,2],[8,-7],[-2,-18],[-15,-24],[-34,-27],[-51,-23],[-59,-17],[-63,-8]],11.2,1.8,'coat',TEAL);
  S([[4,8],[14,8],[22,-11],[29,-16],[42,-15],[48,-10],[51,-3],[48,6],[58,10],[66,4],[62,-11],[52,-21],[40,-24],[25,-24],[16,-20],[7,-9]],9.8,1.55,'coat',GREEN);
  S([[-63,-11],[-63,12],[-59,18],[-54,16],[-56,8],[-56,-9],[-52,-18],[-57,-18]],13.3,1.1,'coat',GRAPH);
  M([[-49,19],[-41,22],[40,22],[53,19],[23,18],[7,14],[-21,12],[-45,14]],13,'inlay',GREEN);
  M([[-43,16],[-22,17],[-9,19],[1,19],[-22,14]],13.13,'inlay',BONE);
  I([[-43,10],[-20,10],[-5,7],[9,8],[18,11]],1.15,13.1,INK);
  I([[19,-17],[27,-20],[39,-20]],1.05,10.05,BONE);
  S([[-44,23],[-40,29],[37,30],[51,26],[49,22],[-12,21]],9.2,1.55,'inlay',IRON);
  M([[-34,24],[-28,27],[28,27],[32,25]],9.42,'inlay',NICK);
  S([[27,28.4],[29,30.8],[35,30.8],[43,28.2],[44,26.5]],6.8,.55,'inlay',GREEN);
  C([[-33,-4.1],[-24,-4.1],[-16,-1.8],[-13,0],[-16,1.8],[-24,4.1],[-33,4.1],[-28,0]],29.615,'inlay',TEAL,.01299);
  C([[-23,-1.4],[-19,0],[-23,1.4],[-26,0]],29.64,'inlay',BONE,.01299);
  for(let k=0;k<3;k++)I([[45+k*2.5,11.7],[47.5+k*2.5,13.7]],.72,13.19,INK);
  S([[-12,28],[-8,36],[-1,39],[19,39],[27,33],[26,28],[21,28],[17,34],[0,34],[-5,28]],4.4,.7,'oxide',GRAPH);
  S([[64,7],[67,15],[77,17],[85,12],[86,6],[80,2],[73,2]],8.3,1,'oxide',GRAPH);
  R(10,0,[[78,5,5],[86,5.7,5.7],[98,5.7,5.7],[102,4.2,4.2]],'oxide',IRON);
  M([[57,15],[60,18],[65,16],[62,13]],13.05,'inlay',AMBER);
}
function madera({shell:S,mark:M,stripe:I,span:R}){
  S([[-102,-14],[-98,13],[-92,20],[-67,20],[-50,14],[-29,12],[-17,14],[5,14],[9,7],[4,-1],[-5,-6],[-14,-19],[-22,-21],[-27,-15],[-20,-8],[-28,-5],[-45,-8],[-78,-16],[-94,-22]],9.9,2.1,'inlay',WALNUT);
  S([[-104,-16],[-100,15],[-96,20],[-93,20],[-96,-19],[-100,-22]],10.2,.9,'coat',GRAPH);
  M([[-91,14],[-70,16],[-53,11],[-28,8],[-53,8],[-76,12]],10.02,'inlay',PECAN);
  I([[-89,9],[-75,10],[-53,6],[-40,6]],.75,10.11,GRAIN,'inlay');
  I([[-88,-9],[-71,-6],[-59,-2],[-48,0]],.85,10.12,PECAN,'inlay');
  S([[-8,7],[-5,18],[1,21],[49,21],[60,17],[61,6],[54,0],[20,-2],[13,-1],[6,3],[-4,1]],10,1.55,'oxide',IRON);
  M([[0,16],[5,18],[48,18],[54,16],[50,12],[14,12]],10.17,'oxide',NICK);
  S([[5,2],[33,3],[31,-7],[25,-13],[13,-14],[6,-12],[3,-8],[6,-7],[10,-10],[20,-10],[25,-7],[27,-1],[7,-1]],4.4,.55,'oxide',GRAPH);
  R(15,0,[[49,5,6],[62,6,6.8],[75,5.3,5.8],[202,4.5,4.9],[231,4.35,4.65],[234,3.85,4.3]],'oxide',IRON);
  R(4,0,[[51,4,4],[61,5.4,5.4],[156,5.1,5.1],[163,4,4]],'oxide',GRAPH);
  S([[65,6],[71,10],[123,10],[136,7],[140,2],[137,-3],[129,-6],[79,-7],[69,-4],[65,0]],10.6,1.65,'inlay',PECAN);
  M([[72,-1],[79,4],[129,5],[133,3],[127,1],[84,-2]],10.75,'inlay',WALNUT);
  for(let k=0;k<7;k++)I([[79+k*6.5,-1],[83+k*6.5,3.4]],1.18,10.88,GRAIN,'inlay');
  I([[75,6],[96,7],[122,7]],.75,10.81,GRAIN,'inlay');
  I([[5,6],[16,5],[23,7],[36,7]],1.05,10.25,AMBER,'inlay');
  M([[36,8.5],[41,10.5],[46,9.3],[41,8]],10.28,'inlay',AMBER);
  M([[9,13],[14,15],[20,14],[25,15],[31,14],[21,13.4],[16,14]],10.23,'inlay',GRAPH);
  for(let k=0;k<3;k++)I([[-43-k*5,-1],[-48-k*5,-1.7],[-53-k*5,-2.9]],.4,10.18,GRAIN,'inlay');
  S([[224,18],[226,22],[230,22],[231,18]],2,.55,'inlay',AMBER);
}
const draw={p92:cala,m416:palma,p90:manta,m870:madera};
export function createArmoryProp(T,id) {
  if(!Object.hasOwn(draw,id))throw RangeError('Unknown cosmetic proof: '+id);
  const c=canvas(T);draw[id](c);return c.finish(id);
}
