// Additive scenic architecture for the pinned R11 panorama. Neither this file
// nor its bridge owns a navigable district, a collision body or an old mesh.
// Positions are native Vice Coast metres. North is -Z, water is east (+X).
const districtLots=Object.freeze([
 // Inlet: a narrow foreground shelf set between the last playable block and
 // the existing scattered northern city band. The causeway and mouth stay open.
 {id:'north-ferry',kind:'court',x:68,z:-307,w:24,d:12,h:41,yaw:.02,p:'salt'},
 {id:'north-telegraph',kind:'needle',x:37,z:-312,w:21,d:13,h:78,yaw:-.06,p:'teal'},
 {id:'north-resort',kind:'terrace',x:3,z:-307,w:30,d:15,h:52,yaw:.055,p:'salt'},
 {id:'north-garden',kind:'court',x:-39,z:-310.8,w:25,d:12,h:52,yaw:-.10,p:'lime'},
 {id:'north-court',kind:'loggia',x:-73,z:-306,w:23,d:15,h:62,yaw:.07,p:'teal'},
 {id:'north-annex',kind:'court',x:-111,z:-310.6,w:32,d:13,h:39,yaw:.14,p:'lime'},
 // Far north: real silhouette crest behind the older background band; not a
 // duplicate frontage row. Good negative space separates the end crowns.
 {id:'north-distant-municipal',kind:'loggia',x:48,z:-464,w:22,d:27,h:93,yaw:.13,p:'teal'},
 {id:'north-distant-inn',kind:'terrace',x:-1,z:-446,w:37,d:22,h:72,yaw:-.06,p:'salt'},
 {id:'north-distant-copper',kind:'needle',x:-52,z:-484,w:22,d:26,h:103,yaw:-.10,p:'lime'},
 {id:'north-distant-court',kind:'court',x:-99,z:-452,w:34,d:29,h:65,yaw:.08,p:'salt'},
 {id:'north-distant-print',kind:'shed',x:-149,z:-446,w:32,d:39,h:31,yaw:-.05,p:'dock'},
 // Western shoulder: extend the side districts only. The protected centre
 // street slot and the West Junction / Meridian art remain the axis anchor.
 {id:'upper-west-loggia',kind:'loggia',x:-358,z:-149,w:30,d:22,h:73,yaw:.09,p:'lime'},
 {id:'upper-west-crown',kind:'needle',x:-394,z:-188,w:25,d:23,h:88,yaw:-.10,p:'teal'},
 {id:'upper-west-terrace',kind:'terrace',x:-360,z:-227,w:33,d:22,h:58,yaw:.08,p:'salt'},
 {id:'upper-west-court',kind:'court',x:-404,z:-268,w:31,d:27,h:56,yaw:.03,p:'dock'},
 {id:'works-west-dock',kind:'shed',x:-352,z:146,w:34,d:39,h:27,yaw:-.08,p:'dock'},
 {id:'works-west-lift',kind:'silo',x:-395,z:184,w:30,d:28,h:38,yaw:.07,p:'dock'},
 {id:'works-west-terrace',kind:'terrace',x:-358,z:232,w:36,d:24,h:58,yaw:-.06,p:'marl'},
 {id:'works-west-loggia',kind:'loggia',x:-403,z:272,w:31,d:24,h:70,yaw:.11,p:'lime'},
 // Lower coastal-side edge; broad loft windows and salt-weathered lime, then 
 // a taller set-back belt on the horizon. No construction out in open water.
 {id:'south-pipeworks',kind:'shed',x:-173,z:301,w:33,d:12,h:26,yaw:.02,p:'dock'},
 {id:'south-court',kind:'court',x:-126,z:305,w:33,d:12,h:41,yaw:-.045,p:'marl'},
 {id:'south-lime-terrace',kind:'terrace',x:-77,z:303,w:33,d:14,h:55,yaw:.055,p:'lime'},
 {id:'south-coop',kind:'loggia',x:-34,z:303,w:26,d:13,h:49,yaw:-.055,p:'marl'},
 {id:'south-public',kind:'court',x:10,z:304,w:28,d:13,h:44,yaw:.065,p:'salt'},
 {id:'south-repair',kind:'shed',x:58,z:301,w:27,d:12,h:25,yaw:-.045,p:'teal'},
 {id:'south-distant-slab',kind:'loggia',x:-137,z:438,w:43,d:28,h:91,yaw:-.13,p:'marl'},
 {id:'south-distant-hotel',kind:'terrace',x:-64,z:456,w:38,d:28,h:79,yaw:.07,p:'lime'},
 {id:'south-distant-telephone',kind:'needle',x:11,z:429,w:21,d:25,h:74,yaw:.09,p:'teal'},
 {id:'south-distant-works',kind:'silo',x:62,z:414,w:26,d:23,h:51,yaw:-.05,p:'dock'}
].map(Object.freeze));

const palette={
 salt:{wall:0xbaaea6,trim:0xcfbbab,shadow:0x918e8e,pane:0x738992,seat:0xaeaaa2,copper:0x859a95},
 lime:{wall:0xbcb29e,trim:0xccc2a8,shadow:0x949184,pane:0x7e8d8e,seat:0xa7a398,copper:0x8c9c8d},
 teal:{wall:0x9caaa6,trim:0xbabfb1,shadow:0x858e92,pane:0x6f8992,seat:0xa4a8a0,copper:0x778d88},
 dock:{wall:0xa49b9a,trim:0xbdb1aa,shadow:0x807b83,pane:0x6d7a89,seat:0x989b96,copper:0x858d88},
 marl:{wall:0xb4a19a,trim:0xc4b1a1,shadow:0x938486,pane:0x778891,seat:0xa69390,copper:0x92958d}
};
const SEA_LEVEL=-.27;
const rect=(u,v,W,D,ch=0)=>{
 const a=u-W/2,b=u+W/2,n=v-D/2,s=v+D/2;
 if(ch===0)return [[a,s],[b,s],[b,n],[a,n]];
 return [[a+ch,s],[b-ch,s],[b,s-ch],[b,n+ch],[b-ch,n],[a+ch,n],[a,n+ch],[a,s-ch]];
};
// Hand-authored panelization. Diagonal bevels stay solid, and the deep/joined
// reveals keep far windows from becoming high-contrast rows of pixels.
function districtBuilding(lot,add){
 const C=palette[lot.p],cs=Math.cos(lot.yaw),sn=Math.sin(lot.yaw),{w,d,h}=lot;
 const map=p=>[lot.x+p[0]*cs+p[2]*sn,p[1],lot.z+p[2]*cs-p[0]*sn];
 const face=(pts,tint,kind='stone')=>add(kind,pts.map(map),tint);
 const p=(v,y)=>[v[0],y,v[1]];
 const loop=(a,u,v)=>rect(u,v,a[0],a[1],a[2]||0);
 function cap(out,y,c,down=false){
   for(let i=1;i<out.length-1;i++){
     const pts=[p(out[0],y),p(out[i],y),p(out[i+1],y)];
     face(down?pts.reverse():pts,c);
   }
 }
 function solid(out,lo,hi,col=C.wall,returnCol=C.shadow,material='stone'){
    cap(out,hi,col);
    for(let i=0;i<out.length;i++){
      const a=out[i],b=out[(i+1)%out.length];
      face([p(a,lo),p(b,lo),p(b,hi),p(a,hi)],i%4===2?returnCol:col,material);
    }
 }
 const part=(x,z,W,D,lo,hi,c,shade)=>solid(rect(x,z,W,D),lo,hi,c,shade);
 function skin(out,base,top,opt={}){
    const {stride=3.96,columns:requested=3,head=.62,knee=.48,depth=.74,linked=false,bayColor=C.wall}=opt;
    const deepBelt=Math.abs(lot.z)>395||lot.x< -375,columns=Math.max(2,requested-(deepBelt?1:0));
    for(let j=0;j<out.length;j++){
      const a=out[j],b=out[(j+1)%out.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
      const W=(u,y,o=0)=>[a[0]+dx*u/len-dz*o/len,y,a[1]+dz*u/len+dx*o/len];
      const q=(a,b,y,t,c,o=0,k='stone')=>{
        if(t-y<.001||b-a<.001)return;
        face([W(a,y,o),W(b,y,o),W(b,t,o),W(a,t,o)],c,k);
      };
      // Small diagonal returns and the long blind end are solid shear walls.
      if(len<5.4||(j===6&&linked)){
        q(0,len,base,top,j%3?C.wall:C.shadow);
        continue;
      }
      const span=len/columns;
      for(let k=0;k<columns;k++){
        const a=k*span,b=(k+1)*span;
        const gl0=a+Math.min(span*.26,k===0?.74:.26),gl1=b-Math.min(span*.24,k===columns-1?.72:.27);
        const solidBand=linked&&(k===(j+columns-1)%columns)&&j%2===0;
        if(solidBand){q(a,b,base,top,k%2?C.shadow:C.seat);continue;}
        q(a,gl0,base,top,k%2?C.trim:bayColor);q(gl1,b,base,top,k===columns-1?C.wall:bayColor);
        const inner=-depth*(linked&&k%2?.70:1);
        face([W(gl0,base,inner),W(gl0,base),W(gl0,top),W(gl0,top,inner)],C.shadow);
        face([W(gl1,base),W(gl1,base,inner),W(gl1,top,inner),W(gl1,top)],C.seat);
        for(let kRow=0,y=base;y<top-1.76;kRow++,y+=stride){
          const Y=(y+stride*1.50>top)?top:Math.min(top,y+stride);
          const s=y+knee+(kRow===0?.13:0),t=Y-head;
          if(t-s<.43){q(gl0,gl1,y,Y,bayColor);break;}
          q(gl0,gl1,y,s,j%2?C.seat:bayColor);q(gl0,gl1,t,Y,C.wall);
          q(gl0,gl1,s,t,C.pane,inner,'glass');
          // Open dark edges and shaded soffits; a single structural crossbar
          // expresses the loft story precisely enough for 60-200 px silhouettes.
          face([W(gl0,s),W(gl1,s),W(gl1,s,inner),W(gl0,s,inner)],C.trim);
          if(!deepBelt)face([W(gl0,t,inner),W(gl1,t,inner),W(gl1,t),W(gl0,t)],C.shadow);
          if(t-s>5.3)q(gl0,gl1,s+(t-s)*.48-.21,s+(t-s)*.48+.22,C.copper,inner+.084);
          if(Y===top)break;
        }
      }
    }
    cap(out,top,C.seat);
 }
 const sk=(u,v,W,D,cut,low,high,opt)=>skin(loop([W,D,cut],u,v),low,high,opt);
 const rim=(u,v,W,D,cut,y)=>solid(loop([W,D,cut],u,v),y-.125,y+.57,C.trim,C.seat);
 if(lot.kind==='needle'){
   const a=h*.59,b=h*.81,c=h*.952;
   sk(0,0,w,d,1.74,SEA_LEVEL,a,{stride:7.13,columns:4,depth:.74,linked:true});
   rim(0,0,w+.77,d+.65,1.74,a);
   sk(-.53,.71,w*.84,d*.85,1.56,a+.57,b,{stride:6.68,columns:3,depth:.85,linked:true});
   rim(-.53,.71,w*.84+.54,d*.85+.55,1.56,b);
   sk(-1.58,.84,w*.63,d*.67,1.29,b+.57,c,{stride:5.5,columns:2,depth:.61,linked:true});
   solid(loop([w*.48,d*.50,.95],-1.67,.38),c,h-.36,C.seat,C.shadow);
   part(-w*.156,-d*.025,w*.33,d*.24,h-.36,h+.72,C.trim,C.wall);
   // Short flat broadcast lantern, different from the Meridian's double sail.
   if(lot.id==='north-telegraph'||lot.id==='upper-west-crown'){
     part(-w*.142,-d*.024,1.13,1.15,h+.70,h+6.05,C.wall,C.shadow);
     part(-w*.142,-d*.024,3.67,1.12,h+3.56,h+4.29,C.copper,C.shadow);
   }
 }else if(lot.kind==='terrace'){
   const steps=[[0,0,1,1,.48],[-.63,-.42,.93,.92,.68],[-w*.11,-d*.09,.77,.78,.84],[-w*.15,-d*.15,.56,.60,.98]];
   let y=SEA_LEVEL,cut=Math.min(2.8,w*.13,d*.22);
   for(const [i,[x,z,W,D,k]] of steps.entries()){
     const top=h*k,model=loop([w*W,d*D,cut],x,z);
     skin(model,y,top,{stride:i===0?5.68:4.13,columns:i<2?4:3,depth:i%2?.91:.61,knee:.51});
     // The setback slab really changes depth across the sun-facing contour.
     rim(x,z,w*W+.94,d*D+.95,cut+.21,top);
     y=top+.57;cut*=.79;
   }
   part(-w*.16,-d*.15,w*.28,d*.28,y,h+2.37,C.seat,C.shadow);
 }else if(lot.kind==='loggia'){
   const base=h*.17,wallTop=h*.85;
   sk(0,0,w,d,0,SEA_LEVEL,base,{stride:4.37,columns:4,depth:.63});
   rim(0,0,w+.41,d+.41,0,base);
   sk(-.27,.39,w*.91,d*.90,0,base+.57,wallTop,
      {stride:8.18,columns:5,depth:1.11,linked:true,knee:.78,head:.62});
   rim(-.27,.39,w*.91+.65,d*.90+.75,0,wallTop);
   const roof=loop([w*.68,d*.62,1.65],-w*.086,d*.103),c=h-1.37;
   skin(roof,wallTop+.57,c,{stride:7.4,columns:3,depth:.71,linked:true});
   rim(-w*.086,d*.103,w*.68+.50,d*.62+.64,1.69,c);
   part(-w*.17,d*.13,w*.32,d*.35,c+.57,h+2.44,C.wall,C.shadow);
   // A narrower stair tower interrupts the roof without a duplicate antenna.
   part(w*.341,d*.351,w*.17,d*.142,base+.57,wallTop+.92,C.shadow,C.seat);
 }else if(lot.kind==='court'){
   const low=h*.29,high=h*.79;
   sk(0,0,w,d,1.31,SEA_LEVEL,low,{stride:4.40,columns:5,depth:.60});
   rim(0,0,w+.38,d+.31,1.34,low);
   sk(w*.02,-.3,w*.87,d*.84,1.28,low+.57,high,{stride:5.36,columns:4,depth:.57,linked:true});
   rim(w*.02,-.3,w*.87+.51,d*.84+.54,1.35,high);
   solid(loop([w*.68,d*.63,1.09],-w*.035,-d*.10),high+.57,h-2.26,C.wall,C.shadow);
   const la=loop([w*.38,d*.40,.81],w*.082,d*.078);
   skin(la,h-2.26,h+1.96,{stride:5.14,columns:2,depth:.51});
   rim(w*.082,d*.078,w*.38+.59,d*.40+.59,.88,h+1.96);
 }else if(lot.kind==='shed'){
   const base=h*.61;
   sk(0,0,w,d,0,SEA_LEVEL,base,{stride:6.02,columns:4,depth:.64,knee:.69});
   for(let i=0;i<3;i++){
     const l=-w*.5+w*i/3,r=l+w/3-.17,m=r-w*.083;
     const n=-d*.48,s=d*.48,a=base+.19,Y=h-(i%2)*2.5;
     face([[l,a,s],[m,Y,s],[m,Y,n],[l,a,n]],i%2?C.seat:C.copper);
     face([[m,Y,s],[r,a,s],[r,a,n],[m,Y,n]],C.seat);
     face([[l,a,s],[r,a,s],[m,Y,s]],C.wall);
     face([[m,Y,n],[r,a,n],[l,a,n]],C.shadow);
     part(m-w*.031,0,w*.054,d*.64,Y-.84,Y+.57,C.trim,C.shadow);
   }
   part(-w*.21,-d*.27,w*.17,d*.20,h*.59,h+4.9,C.wall,C.shadow);
 }else if(lot.kind==='silo'){
   solid(rect(0,0,w,d),SEA_LEVEL,5.4,C.seat,C.shadow);
   const ring=(u,v,R,n=12)=>Array.from({length:n},(_,i)=>{
     const a=-i/n*Math.PI*2;return [u+R*Math.cos(a),v+R*Math.sin(a)];
   });
   for(let j=0;j<4;j++){
     const x=(j%2?.24:-.24)*w,z=(j<2?.25:-.254)*d,r=Math.min(w,d)*.203,Y=h*(.56+j*.117);
     solid(ring(x,z,r),5.4,Y,j%2?C.trim:C.wall,C.shadow);
     solid(ring(x,z,r*1.025),Y,Y+.67,C.seat,C.shadow);
     solid(ring(x,z,r*.68),Y+.67,Y+1.27,C.wall,C.shadow);
   }
   sk(-w*.135,-d*.079,w*.214,d*.331,.58,5.4,h,
      {stride:6.76,columns:2,depth:.43,linked:true});
   part(-w*.135,-d*.079,w*.236,d*.391,h,h+1.46,C.trim,C.shadow);
 }
}

// External shade retrofits above verified, generic R11 wall spans. Origins and
// the working limits come from the shipped mesh vertices, not the collider
// dimensions. No R11 geometry/material is hidden or reassigned. Each skeleton
// ties back through a continuous backpan, staying over its building footprint.
const retrofitWalls=Object.freeze([
 // Civic office: long, warm travertine bays at the 13 m setback. Adjacent
 // old shells differ intentionally; these are not one oversized modern block.
 {id:'civic-travertine-east',axis:'x',normal:1,wall:-101.27736,left:-66.68,right:-50.02,low:13.10,high:46.99,bays:4,story:7.90,family:'travertine'},
 {id:'civic-travertine-south',axis:'z',normal:1,wall:-47.70438,left:-117.60,right:-103.53,low:13.10,high:46.99,bays:3,story:7.90,family:'travertine'},
 // Two plate levels on the bronze annex, with a blind lift strip, not a
 // gridded retrofit pasted across the original stepped silhouette.
 {id:'bronze-annex-south',axis:'z',normal:1,wall:-98.28543,left:-120.43,right:-99.42,low:9.87,high:28.37,bays:5,story:6.19,family:'bronze'},
 {id:'bronze-annex-south-upper',axis:'z',normal:1,wall:-99.90126,left:-119.59,right:-101.83,low:28.72,high:46.95,bays:4,story:6.06,family:'bronze'},
 {id:'bronze-annex-east',axis:'x',normal:1,wall:-98.30427,left:-120.5,right:-99.20,low:9.87,high:28.37,bays:5,story:6.19,family:'bronze'},
 {id:'bronze-annex-east-upper',axis:'x',normal:1,wall:-101.69585,left:-119.2,right:-100.02,low:28.72,high:46.95,bays:4,story:6.06,family:'bronze'},
 {id:'civic-distant-aerated-east',axis:'x',normal:1,wall:-130.48828,left:-121.18,right:-99.08,low:8.50,high:41.45,bays:4,story:5.96,family:'travertine'},
 // South marine lane: the nearest rectangle visible above the freight
 // approach becomes a two-storey loading loft with deep sill and fascia.
 {id:'south-loading-loft-north',axis:'z',normal:-1,wall:265.37024,left:-68.07,right:-47.70,low:6.59,high:15.75,bays:4,story:4.53,family:'loading'}
].map(Object.freeze));
const retroPalette={
 travertine:{wall:0xc3bcb0,trim:0xd1c8b5,shadow:0x9b9993,pane:0x748a92,seat:0xafa99c,copper:0x879e9d},
 bronze:{wall:0xb0aba3,trim:0xc0b19a,shadow:0x817c79,pane:0x72848a,seat:0xa4a09b,copper:0x7d9994},
 loading:{wall:0xb0a6a0,trim:0xc5b4a6,shadow:0x928383,pane:0x7b9296,seat:0xa7a09d,copper:0x85978c}
};
function retrofit(p,add){
 const C=retroPalette[p.family];
 const W=(u,y,d)=>p.axis==='z'?[u,y,p.wall+p.normal*d]:[p.wall+p.normal*d,y,u];
 const reflect=(p.axis==='z'?1:-1)*p.normal<0;
 const emit=(verts,color,kind='stone')=>add(kind,(reflect?[...verts].reverse():verts).map(v=>W(...v)),color);
 const q=(a,b,y,z,d,c,kind='stone')=>{
  if(b-a>.012&&z-y>.012)emit([[a,y,d],[b,y,d],[b,z,d],[a,z,d]],c,kind);
 };
 const box=(a,b,y,z,k,d,c)=>{
  q(a,b,y,z,d,c);q(a,b,y,z,k,C.shadow);
  emit([[a,y,d],[a,y,k],[a,z,k],[a,z,d]],C.shadow);
  emit([[b,y,k],[b,y,d],[b,z,d],[b,z,k]],C.seat);
  emit([[a,z,d],[b,z,d],[b,z,k],[a,z,k]],C.trim);
  emit([[a,y,k],[b,y,k],[b,y,d],[a,y,d]],C.shadow);
 };
 // A deep, continuous colour field replaces the repeated little square
 // rhythm in each inner opening by one joined glazed bay, not another grid.
 const {left:L,right:R,low:B,high:H}=p;
 const inset=.31,behind=.08,trim=p.family==='travertine'?.80:.69;
 box(L,R,B,B+.42,-.08,trim*.82,C.seat);box(L,R,H-.47,H,-.08,trim,C.trim);
 const pitch=(R-L)/p.bays;
 for(let j=0;j<p.bays;j++){
   const a=L+pitch*j,b=a+pitch,w=(j===0||j===p.bays-1)?.57:.31;
   if(j===0)box(a,a+w,B,H,-.08,trim,C.wall);
   box(b-w,b,B,H,-.08,trim*(j%3===1?.77:1),j%3===1?C.trim:C.wall);
   const l=a+(j===0?.57:.095),r=b-w;
   const solid=p.family==='bronze'&&j===2;
   if(solid){box(l,r,B,H,-.08,.43,C.seat);continue;}
   let stretch=p.story; 
   if(p.family==='loading')stretch=p.story*(j%2?.98:1.02);
   for(let y=B+.42;y<H-.70;){
    const t=(H-y<stretch*1.45)?H-.47:Math.min(H-.47,y+stretch),head=Math.min(1.16,(t-y)*.35),knee=Math.min(.74,(t-y)*.28);
    box(l,r,y,y+knee,-.06,trim*.76,C.wall);
    q(l,r,y+knee,t-head,behind,C.pane,'glass');
    box(l,r,t-head,t,-.06,p.family==='bronze'?.55:trim*.87,C.wall);
    // Wider interrupted awnings in the concrete districts, rather than
    // spraying shallow balcony rails over every facade at a single height.
    if(j%3!==1&&p.family!=='bronze')box(l,r,y+knee*.70,y+knee*.92,inset,Math.min(.97,trim+.12),C.trim);
    if(p.family==='bronze'&&j%2===0){
      const m=(l+r)*.5;
      box(m-.084,m+.084,y+knee,t-head,behind,.46,C.copper);
    }
    y=t;
   }
 }
}

export function createArt({THREE,actors}){
 const root=new THREE.Group();
 root.name='R12 | Terraced inland skyline and north inlet';
 const batches={stone:{p:[],c:[]},glass:{p:[],c:[]}};
 const color=new THREE.Color();
 const append=(material,points,tint)=>{
   const batch=batches[material],fan=points.length===4?[0,1,2,0,2,3]:[0,1,2];
   color.setHex(tint);
   for(const j of fan){
     batch.p.push(...points[j]);batch.c.push(color.r,color.g,color.b);
   }
 };
 const lots=[];
 for(const lot of districtLots){
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   districtBuilding(lot,(mat,pts,tint)=>{
      for(const point of pts)for(let i=0;i<3;i++){
        min[i]=Math.min(min[i],point[i]);max[i]=Math.max(max[i],point[i]);
      }
      append(mat,pts,tint);
   });
   lots.push({id:lot.id,style:lot.kind,min,max});
 }
 const skins=[];
 for(const wall of retrofitWalls){
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   retrofit(wall,(mat,pts,tint)=>{
     for(const v of pts)for(let i=0;i<3;i++){min[i]=Math.min(min[i],v[i]);max[i]=Math.max(max[i],v[i]);}
     append(mat,pts,tint);
   });
   skins.push({id:wall.id,axis:wall.axis,wall:wall.wall,family:wall.family,min,max});
 }
 const materials={
   stone:new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),
   glass:new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.43,
     metalness:.12,envMapIntensity:.58})
 };
 materials.stone.name='R12 distant cast stone, worn concrete and copper';
 materials.glass.name='R12 grouped distant deep window glazing';
 for(const style of ['stone','glass']){
   const a=batches[style],g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute(a.p,3));
   g.setAttribute('color',new THREE.Float32BufferAttribute(a.c,3));
   g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
   const m=new THREE.Mesh(g,materials[style]);
   m.name='R12 skyline '+style;m.castShadow=false;m.receiveShadow=false;
   root.add(m);
 }
 root.userData.scenicLots=lots;
 root.userData.externalUpperSkins=skins;
 return {root};
}
