// Dock Road's working frontage, mapped to the measured R11 lot and facade
// planes already present in R12. Static, attached art only. No old object,
// actor, ground/collision surface or route is read or rewritten.
const frontages=Object.freeze([
 {id:'bonded-transfer-east',lot:[-194,58],axis:'x',sign:1,wall:-181.899,left:47.15,right:69.82,mode:'transfer',depth:1.62,word:'BONDED TRANSFER'},
 {id:'carrier-repair-north',lot:[-194,110],axis:'z',sign:-1,wall:97.185,left:-204.82,right:-182.40,mode:'repair',depth:1.27,word:'CARRIER REPAIR'},
 {id:'carrier-repair-east',lot:[-194,110],axis:'x',sign:1,wall:-181.818,left:98.05,right:121.92,mode:'repair',depth:1.41,word:'SERVICE / PARTS'},
 {id:'freight-packing-north',lot:[-194,194],axis:'z',sign:-1,wall:181.960,left:-204.34,right:-182.97,mode:'packing',depth:1.30,word:'FREIGHT PACKING'},
 {id:'meter-house-west',lot:[-142,110],axis:'x',sign:-1,wall:-154.169,left:97.83,right:113.17,mode:'supply',depth:1.06,word:'SHIP SUPPLY'}
].map(Object.freeze));
const finishes={
 transfer:{rock:0xb2a38d,trim:0xc2b89f,damp:0x737466,wall:0x9a9d91,shadow:0x555c54,beam:0x536c60,iron:0x687a77,door:0x99a59c,joint:0x535e5b,sgn:0xcad0b7,glass:0x59747a,mastic:0x4c5450},
 repair:{rock:0xb6a691,trim:0xc2a385,damp:0x776d5e,wall:0xa57b64,shadow:0x645249,beam:0x68594e,iron:0x545858,door:0x776e64,joint:0x595850,sgn:0xe3d5b1,glass:0x525f6c,mastic:0x504d47},
 packing:{rock:0xb3a687,trim:0xb8b48f,damp:0x737063,wall:0xa29a82,shadow:0x62604e,beam:0x66715d,iron:0x59625b,door:0x7d8374,joint:0x62685a,sgn:0xd1d2af,glass:0x546a64,mastic:0x51554c},
 supply:{rock:0xa69c8a,trim:0x8f9284,damp:0x747469,wall:0x9a9b8d,shadow:0x606758,beam:0x4f655d,iron:0x515f57,door:0x667a71,joint:0x59645c,sgn:0xd1d3c0,glass:0x526c70,mastic:0x525a54}
};
// A private compact strip of traditional stencil letters. Label geometry is
// colour only; no font, canvas, image fetch or externally licensed assets.
const glyph={
 'A':[14,17,17,31,17,17,17],'B':[30,17,17,30,17,17,30],'C':[15,16,16,16,16,16,15],
 'D':[30,17,17,17,17,17,30],'E':[31,16,16,30,16,16,31],'F':[31,16,16,30,16,16,16],
 'G':[15,16,16,23,17,17,15],'H':[17,17,17,31,17,17,17],'I':[14,4,4,4,4,4,14],
 'J':[7,2,2,2,18,18,12],'K':[17,18,20,24,20,18,17],'L':[16,16,16,16,16,16,31],
 'M':[17,27,21,21,17,17,17],'N':[17,25,25,21,19,19,17],'O':[14,17,17,17,17,17,14],
 'P':[30,17,17,30,16,16,16],'Q':[14,17,17,17,21,18,13],'R':[30,17,17,30,20,18,17],
 'S':[15,16,16,14,1,1,30],'T':[31,4,4,4,4,4,4],'U':[17,17,17,17,17,17,14],
 'V':[17,17,17,17,17,10,4],'W':[17,17,17,21,21,21,10],'X':[17,17,10,4,10,17,17],
 'Y':[17,17,10,4,4,4,4],'Z':[31,1,2,4,8,16,31],'/':[1,1,2,4,8,16,16],
 '0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],'2':[14,17,1,6,8,16,31],
 '3':[30,1,1,14,1,1,30],'4':[2,6,10,18,31,2,2],'5':[31,16,30,1,1,17,14],
 '6':[6,8,16,30,17,17,14],'7':[31,1,2,4,8,8,8],'8':[14,17,17,14,17,17,14],
 '9':[14,17,17,15,1,2,12]
};
function facade(f,add){
 const p=finishes[f.mode],{left:L,right:R,depth}=f,S=R-L;
 // Along-store, height, offset outward; remain on already-built frontage.
 const world=([u,y,d])=>f.axis==='x'?[f.wall+f.sign*d,y,u]:[u,y,f.wall+f.sign*d];
 const reverse=(f.axis==='x'?-1:1)*f.sign<0;
 function face(v,c,m='stone',kind='skin'){
  add(m,(reverse?[...v].reverse():v).map(world),c,kind);
 }
 const qu=(a,b,l,h,d,c,m,kind)=>face([[a,l,d],[b,l,d],[b,h,d],[a,h,d]],c,m,kind);
 function cub(a,b,l,h,o,t,col,m='stone',kind='skin',shadow=p.shadow){
  if(b-a<.003||h-l<.003||t-o<.003)return;
  qu(a,b,l,h,t,col,m,kind);
  face([[b,l,o],[a,l,o],[a,h,o],[b,h,o]],shadow,m,kind);
  face([[a,l,o],[a,l,t],[a,h,t],[a,h,o]],shadow,m,kind);
  face([[b,l,t],[b,l,o],[b,h,o],[b,h,t]],col,m,kind);
  face([[a,h,t],[b,h,t],[b,h,o],[a,h,o]],col,m,kind);
  face([[a,l,o],[b,l,o],[b,l,t],[a,l,t]],shadow,m,kind);
 }
 function sign(text,center,bottom,px,d){
  const span=(text.length*6-1)*px;
  // Side-on inscriptions have ordinary direction rather than mirrored texture.
  const flip=reverse;
  for(let i=0;i<text.length;i++){
   const g=glyph[text[i]];
   if(!g)continue;
   for(let row=0;row<7;row++)for(let c=0;c<5;c++)if(g[row]&(16>>c)){
    const x=i*6+c;
    const u=center+(flip?span*.5-(x+1)*px:x*px-span*.5),y=bottom+(6-row)*px;
    qu(u,u+px*.93,y,y+px*.96,d,p.sgn,'stone','sign');
   }
  }
 }
 function foldedRoof(a,b,back,outer,h0,h1,step,m='metal'){
  const a0=[a,h0,back],a1=[a,h1,outer],b0=[b,h0,back],b1=[b,h1,outer];
  face([a0,b0,b1,a1],p.iron,m,'canopy');
  face([a1,b1,b0,a0].map(([u,y,d])=>[u,y-.09,d]),f.mode==='transfer'?p.trim:p.rock,m,'canopy');
  cub(a,b,h1-.22,h1+.028,outer-.078,outer+.046,p.beam,m,'canopy');
  cub(a,b,h1-.116,h1-.058,outer+.043,outer+.049,p.trim,m,'canopy');
  cub(a,b,h0-.19,h0+.012,-.09,back+.025,p.beam,m,'canopy');
  const ribs=Math.max(6,Math.floor((b-a)/step));
  for(let i=0;i<ribs;i++){
   const x=a+((i+.22)/ribs)*(b-a);
   face([[x,h0+.019,back],[x+.035,h0+.019,back],[x+.035,h1+.019,outer],[x,h1+.019,outer]],
    i%6===0?p.beam:p.trim,m,'canopy');
  }
 }
 function pitchBox(a,b,k,d,t,top,faceHeights){
  const [y0,y1]=faceHeights;
  const z1=d+t;
  const q=(u,y,o)=>[u,y,o];
  const off=.05;
  face([q(a,y0,d),q(b,y0,d),q(b,y1,z1),q(a,y1,z1)],p.iron,'metal','canopy');
  face([q(a,y1-off,z1),q(b,y1-off,z1),q(b,y0-off,d),q(a,y0-off,d)],p.shadow,'metal','canopy');
  face([q(a,y0,d),q(a,y1,z1),q(a,y1-off,z1),q(a,y0-off,d)],p.trim,'metal','canopy');
  face([q(b,y1,z1),q(b,y0,d),q(b,y0-off,d),q(b,y1-off,z1)],p.shadow,'metal','canopy');
  if(top) cub(a,b,y1-.15,y1+.015,z1-.04,z1+.024,p.beam,'metal','canopy');
 }
 function dock(x,w,label,kind){
  const a=x-w/2,b=x+w/2,head=kind==='double'?3.43:kind==='bay'?3.18:3.07;
  const low=kind==='double'?.18:kind==='bay'?.51:.42;
  // Thick inner returns lead the eye to a closed shutter, never a false opening.
  cub(a,b,.115,head,-.12,.028,p.shadow);
  const doorTint=kind==='double'?p.iron:label==='02'||label==='06'?p.beam:p.door;
  cub(a+.13,b-.13,low,head-.20,.029,.072,doorTint,'metal');
  cub(a-.14,a+.12,.29,head+.07,-.09,.246,p.trim);
  cub(b-.12,b+.14,.29,head+.07,-.09,.246,p.trim);
  cub(a-.14,b+.14,head-.13,head+.12,-.11,.31,p.beam,'metal');
  cub(a+.15,b-.15,Math.max(.078,low-.11),low+.048,-.08,.23,p.damp);
  if(kind==='double'){
   const sx=(a+b)*.5;
   for(const xx of [a+.31,sx,b-.31])cub(xx-.037,xx+.037,low+.07,head-.25,.073,.097,p.joint,'metal');
   for(const sy of [1.11,2.16,2.74])cub(a+.16,b-.16,sy,sy+.054,.072,.102,p.beam,'metal');
  }else{
   for(let y=low+.20;y<head-.26;y+=kind==='bay'?.175:.21)
    qu(a+.155,b-.155,y,y+.017,.079,p.joint,'metal');
  }
  // Old live connections visual only: a thick physical threshold and stamp.
  cub(a-.03,b+.03,.18,Math.max(.30,low-.08),-.07,.14,p.mastic);
  const mr=b-.51;
  cub(mr-.24,mr+.16,head+.22,head+.57,-.008,.21,p.beam,'metal');
  sign(label,mr-.036,head+.30,.025,.214);
 }
 function sash(a,b,y,h,split){
  cub(a,b,y,h,-.04,.103,p.beam,'metal');
  cub(a+.072,b-.072,y+.07,h-.062,.106,.143,p.glass,'glass');
  const k=(b-a)/split;
  for(let j=1;j<split;j++){
   const x=a+k*j;
   cub(x-.034,x+.034,y+.02,h-.02,.14,.173,p.iron,'metal');
  }
  cub(a,b,y-.105,y+.07,-.03,.233,p.trim);
 }
 function plinth(){
  // A continuous 22m base band expresses the shared dock level.
  cub(L,R,.078,.27,-.075,.162,p.damp);
  cub(L,R,.273,.412,-.075,.138,p.rock);
  cub(L,R,.411,.478,-.08,.103,p.trim);
  const panel=2.2;
  for(let x=L+.48,i=0;x<R-.31;x+=panel,i++){
   const end=Math.min(R-.18,x+panel-.014);
   if(end-x>.1)qu(x,end,.102,.225,.165,i%3? p.damp:p.shadow);
   qu(x-.007,x+.009,.411,.474,.105,p.damp);
  }
 }
 function facadeField(top,color){
  cub(L,R,.415,top,-.19,.019,color);
  cub(L,L+.32,.375,top-.16,-.12,.21,p.rock);
  cub(R-.31,R,.375,top-.16,-.12,.21,p.rock);
 }
 const low=v=>L+S*v, center=(L+R)*.5;
 plinth();
 if(f.mode==='transfer'){
  facadeField(6.58,p.wall);
  for(const [v,w,l,k] of [[.157,.181,'01','bay'],[.365,.150,'02','bay'],[.578,.199,'03','double']])dock(low(v),S*w,l,k);
  cub(low(.718),low(.955),.42,3.85,-.11,.11,p.rock);
  sash(low(.755),low(.934),2.21,3.21,3);
  cub(low(.797),low(.884),.41,2.15,.095,.13,p.iron,'metal');
  foldedRoof(L+.12,low(.713),.02,depth,4.63,4.10,.19);
  for(const v of [.03,.233,.469,.699]){
   const u=low(v);
   // Overhead outriggers, free of usable sidewalk under the 4-metre soffit.
   pitchBox(u-.065,u+.065,0,.02,depth-.11,false,[5.10,4.12]);
   cub(u-.11,u+.11,4.80,5.24,-.08,.16,p.beam,'metal','canopy');
  }
  cub(L+.27,R-.28,4.62,6.08,-.07,.075,p.beam,'metal');
  sash(low(.055),low(.275),4.92,5.83,7);
  sash(low(.70),low(.945),4.92,5.83,7);
  cub(low(.299),low(.672),4.87,5.75,.073,.188,p.iron,'metal');
  sign(f.word,low(.485),5.083,.073,.191);
  cub(L,R,6.18,6.49,-.12,.227,p.trim);
 }else if(f.mode==='repair'){
  facadeField(6.94,p.wall);
  const mirror=f.axis==='z';
  for(const [v,w,l,k] of (mirror?[[.17,.204,'04','double'],[.422,.225,'05','bay'],[.68,.168,'06','bay']]:
   [[.17,.178,'07','bay'],[.40,.228,'08','double'],[.641,.190,'09','bay']]))dock(low(v),S*w,l,k);
  const end=mirror?low(.802):low(.78);
  cub(end,R-.23,.40,3.64,-.15,.08,p.rock);
  sash(end+.22,R-.49,1.99,3.08,3);
  const hatch=end+(R-end)*.44;
  cub(hatch-.64,hatch+.69,.42,2.03,.06,.13,p.iron,'metal');
  // Bay canopy parts form a narrow saw-edge when seen along the actual curve.
  const start=L+.26,len=(end-start)/3;
  for(let i=0;i<3;i++){
   const x=start+i*len;
   foldedRoof(x+.019,x+len-.034,.03,depth-(i===0?.24:0),4.82+(i%2)*.135,4.49,.26);
   cub(x+.021,x+.14,4.47,5.18,-.07,.23,p.beam,'metal','canopy');
  }
  cub(L+.10,R-.10,5.02,5.97,-.1,.071,p.rock);
  for(let u=L+.16;u<R-.9;u+=1.05){
   const v=Math.min(R-.19,u+1.02);
   qu(u,v,6.11,6.74,.022,p.wall);
   qu(u,v,6.34,6.356,.028,p.shadow);
  }
  sash(low(.068),low(.315),5.19,5.87,7);
  sash(low(.706),low(.92),5.19,5.87,6);
  cub(low(.329),low(.686),5.15,5.93,.069,.17,p.beam,'metal');
  sign(f.word,low(.507),5.34,.069,.174);
  cub(L,R,6.65,6.97,-.11,.256,p.trim);
 }else if(f.mode==='packing'){
  facadeField(7.26,p.wall);
  dock(low(.168),S*.226,'10','double');
  dock(low(.427),S*.214,'11','bay');
  dock(low(.654),S*.176,'12','bay');
  sash(low(.777),low(.943),1.96,3.21,4);
  cub(low(.804),low(.893),.42,1.96,.08,.13,p.iron,'metal');
  foldedRoof(L+.18,R-.19,.03,depth,4.74,4.24,.205);
  for(const v of [.05,.32,.546,.76,.945]){
   const u=low(v);
   pitchBox(u-.076,u+.076,0,.045,depth-.075,false,[5.07,4.25]);
  }
  cub(L+.14,R-.14,5.07,6.42,-.12,.085,p.rock);
  sash(low(.069),low(.297),5.34,6.13,6);
  sash(low(.732),low(.924),5.34,6.13,6);
  cub(low(.31),low(.713),5.25,6.17,.083,.182,p.beam,'metal');
  sign(f.word,low(.513),5.472,.068,.186);
  cub(L,R,6.98,7.29,-.14,.19,p.trim);
 }else{
  facadeField(5.53,p.wall);
  dock(low(.204),S*.271,'13','bay');
  // Meter/supply windows occupy this half, not another repeated truck door.
  cub(low(.365),low(.969),.43,3.18,-.11,.084,p.rock);
  sash(low(.4),low(.609),1.72,2.93,4);
  sash(low(.729),low(.929),1.72,2.93,3);
  cub(low(.633),low(.704),.42,3.01,.08,.133,p.iron,'metal');
  foldedRoof(low(.022),low(.976),.02,depth,4.23,3.97,.185);
  cub(L+.18,R-.18,4.45,5.28,-.13,.081,p.beam,'metal');
  cub(low(.281),low(.721),4.53,5.22,.08,.156,p.iron,'metal');
  sign(f.word,center,4.625,.068,.159);
  cub(L,R,5.19,5.53,-.12,.19,p.trim);
 }
}
export function createArt({THREE,actors}){
 const root=new THREE.Group();
 root.name='R13 | Dock Road working warehouses';
 const atlas={stone:{pos:[],col:[]},metal:{pos:[],col:[]},glass:{pos:[],col:[]}};
 const mats={
  stone:new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.85}),
  metal:new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.64,metalness:.28}),
  glass:new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.48,metalness:.15,envMapIntensity:.58})
 };
 const linear=new THREE.Color(),sites=[];
 for(const f of frontages){
  const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
  let lowProjection=0,overheadFloor=Infinity;
  facade(f,(mat,vertices,c,kind)=>{
   const bucket=atlas[mat];
   linear.setHex(c);
   for(const v of vertices){
    for(let j=0;j<3;j++){low[j]=Math.min(low[j],v[j]);high[j]=Math.max(high[j],v[j]);}
    const d=(v[f.axis==='x'?0:2]-f.wall)*f.sign;
    if(v[1]<3.70)lowProjection=Math.max(lowProjection,d);
    if(d>.34)overheadFloor=Math.min(overheadFloor,v[1]);
   }
   for(const j of [0,1,2,0,2,3]){
    bucket.pos.push(...vertices[j]);bucket.col.push(linear.r,linear.g,linear.b);
   }
  });
  sites.push({id:f.id,style:f.mode,lot:[...f.lot],axis:f.axis,wall:f.wall,low,high,lowProjection,overheadFloor});
 }
 for(const [id,a] of Object.entries(atlas)){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(a.pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(a.col,3));
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  const o=new THREE.Mesh(g,mats[id]);
  o.name='R13 dock warehouse '+id;
  o.castShadow=false;o.receiveShadow=false;
  root.add(o);
 }
 root.userData.warehouseFrontages=sites;
 return {root};
}
