// Original thumb arcs, laid out in CSS pixels inside the device's measured safe rectangle.
export function createTouchLayout() {
  const key='vc-touch-layout-v1', modes=['walk','drive'], aspects=['wide','tall'];
  const labels={moveStick:'移动',touchFire:'开火',touchGun:'拔枪 / 收枪',touchCrouch:'蹲下 / 起身',touchReload:'换弹',touchCar:'上车',gasKey:'油门',brakeKey:'刹车 / 倒车',touchBrake:'手刹',left:'左转',right:'右转',interact:'剧情互动',miniButton:'地图',pause:'暂停'};
  const ids={
    walk:['moveStick','touchFire','touchCrouch','touchReload','touchGun','touchCar','interact','miniButton','pause'],
    drive:['gasKey','brakeKey','left','right','touchBrake','touchCar','interact','miniButton','pause']
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
  const finite=x=>typeof x==='number'&&Number.isFinite(x);
  const aspect=b=>b.w>=b.h?'wide':'tall';
  const empty=()=>({v:1,walk:{wide:{},tall:{}},drive:{wide:{},tall:{}}});
  function clean(raw) {
    const out=empty(); if(raw?.v!==1)return out;
    for(const m of modes)for(const a of aspects)for(const id of ids[m]){
      const p=raw[m]?.[a]?.[id];if(!p||typeof p!=='object')continue;
      const q={};
      if(finite(p.x)&&finite(p.y)){q.x=clamp(p.x,0,1);q.y=clamp(p.y,0,1);}
      if(finite(p.s))q.s=clamp(p.s,.7,1.6);
      if(Object.keys(q).length)out[m][a][id]=q;
    }
    return out;
  }
  function read(storage){try{return clean(JSON.parse(storage().getItem(key)));}catch{return empty();}}
  function write(storage,data){try{storage().setItem(key,JSON.stringify(clean(data)));return true;}catch{return false;}}
  function box(w,h,safe={}){
    const val=(k,limit)=>clamp(finite(safe[k])?safe[k]:0,0,limit*.30);
    const l=val('left',w),r=val('right',w),t=val('top',h),b=val('bottom',h);
    return {l,t,w:Math.max(1,w-l-r),h:Math.max(1,h-t-b)};
  }
  function defs(mode,b){
    const {w,h}=b, wide=aspect(b)==='wide',u=clamp(Math.min(w,h)*.138,44,62);
    const side=wide?clamp(w*.085,36,100):clamp(w*.087,26,54);
    const bottom=wide?clamp(h*.105,26,68):clamp(h*.075,32,74);
    const x=w-side-.70*u, y=h-bottom-.70*u, lx=side+(wide?1.18:1.02)*u;
    const p=(x,y,w,h=w)=>({x,y,w,h});
    // Distances are offsets of the OUTSIDE of each primary target, not of its center.
    // Secondary controls curve *inward*; none sit closer to the glass edge than fire.
    const d={
      pause:p(w-18-22,12+22,44),
      miniButton:wide?p(16+.61*u,12+.75*u,1.22*u,1.50*u):p(16+.71*u,110+.86*u,1.42*u,1.72*u),
      moveStick:p(lx,h-bottom-1.1*u,wide?2.18*u:2.03*u),
      touchFire:p(x,y,1.40*u),
      touchCrouch:p(x-1.44*u,y+.04*u,1.02*u),
      touchReload:p(x+.03*u,y-1.46*u,u),
      touchGun:p(x-1.32*u,y-1.22*u,u),
      touchCar:p(wide?x-2.62*u:x-.20*u,wide?y-.89*u:y-2.78*u,u),
      interact:p(wide?w*.5:w*.30,wide?h-bottom-.52*u:y-2.75*u,wide?2.08*u:1.82*u,1.02*u),
      gasKey:p(x,y,1.37*u,1.48*u),
      brakeKey:p(x-1.69*u,y+.06*u,1.35*u,1.23*u),
      left:p(side+.60*u,h-bottom-.65*u,1.20*u,1.22*u),
      right:p(side+2.06*u,h-bottom-.65*u,1.20*u,1.22*u),
      touchBrake:p(x-.18*u,y-1.60*u,1.02*u)
    };
    if(mode==='drive')d.touchCar=p(wide?x-1.78*u:x-.45*u,wide?y-1.48*u:y-2.93*u,u);
    return d;
  }
  function constrain(p,b){const inset=6;
    const w=clamp(p.w,44,Math.max(44,b.w-2*inset)),h=clamp(p.h,44,Math.max(44,b.h-2*inset));
    return {x:clamp(p.x,inset+w/2,b.w-inset-w/2),y:clamp(p.y,inset+h/2,b.h-inset-h/2),w,h,s:p.s??1};
  }
  const clashes=(a,b,g=5)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+g&&Math.abs(a.y-b.y)<(a.h+b.h)/2+g;
  function reserve(b){
    const w=b.w,wide=aspect(b)==='wide',u=clamp(Math.min(w,b.h)*.138,44,62);
    // Stock task card and the two remaining native toolbar buttons are interactive.
    const mapW=wide?1.22*u:0, tLeft=wide?16+mapW+12:16,tw=wide?Math.min(w*.35,230):Math.max(65,w-182);
    return [{x:tLeft+tw/2,y:42,w:tw,h:72},{x:w-18-48-46,y:34,w:92,h:44}];
  }
  function nearest(p,b,others){
    const c=constrain(p,b),ok=q=>!others.some(o=>clashes(q,o));
    if(ok(c))return c;
    // Exact obstacle edges plus viewport boundaries, so invalid repeated/custom
    // positions cannot hide mandatory controls. Nearest valid center wins.
    const xs=[c.x],ys=[c.y];
    for(const o of others){
      const dx=(c.w+o.w)/2+6, dy=(c.h+o.h)/2+6;
      xs.push(o.x-dx,o.x+dx); ys.push(o.y-dy,o.y+dy);
    }
    xs.push(6+c.w/2,b.w-6-c.w/2);ys.push(6+c.h/2,b.h-6-c.h/2);
    let best=null,dist=Infinity;
    for(const x of xs)for(const y of ys){
      const q=constrain({...c,x,y},b),d=(q.x-c.x)**2+(q.y-c.y)**2;
      if(d<dist&&ok(q)){best=q;dist=d;}
    }
    return best;
  }
  // Exceptionally small split views may not fit full arcs after reserving HUD text.
  function compact(order,stock,b){
    const cols=Math.max(1,Math.floor((b.w-7)/49)), rows=Math.max(1,Math.floor((b.h-7)/49));
    const slots=[],used=reserve(b),out={};
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const r={x:b.w/2+(i-(cols-1)/2)*49,y:b.h/2+(j-(rows-1)/2)*49,w:44,h:44,s:1};
      if(!used.some(o=>clashes(o,r,3)))slots.push(r);
    }
    for(const id of order){const d=stock[id],dist=r=>(r.x-d.x)**2+(r.y-d.y)**2;
      slots.sort((a,b)=>dist(a)-dist(b));out[id]=slots.shift()||constrain(d,b);
    }return out;
  }
  function solve(mode,b,data,armed=true) {
    const stock=defs(mode,b),custom=data?.[mode]?.[aspect(b)]||{},out={};
    if(mode==='walk'&&!armed&&custom.touchGun?.x===undefined)stock.touchGun={...stock.touchFire};
    const baseOrder=['pause','miniButton',...ids[mode].filter(i=>i!=='pause'&&i!=='miniButton'&&(armed||!['touchFire','touchReload'].includes(i)))];
    // Prefer moved controls, then native high-priority controls. Never write the
    // reflow back on resize: normalized user choices survive a temporary viewport.
    const order=baseOrder.filter(i=>custom[i]).concat(baseOrder.filter(i=>!custom[i]));
    const used=reserve(b);
    for(const id of order){
      const d=stock[id],p=custom[id]||{},s=p.s??1;
      const c=constrain({x:p.x===undefined?d.x:p.x*b.w,y:p.y===undefined?d.y:p.y*b.h,w:d.w*s,h:d.h*s,s},b);
      let rect=nearest(c,b,used);
      if(!rect){ // Overfilled by corrupted maximum sizes: restore a known playable layout.
        if(Object.keys(custom).length)return solve(mode,b,null,armed);
        rect=nearest({...c,w:44,h:44},b,used);
        if(!rect)return compact(baseOrder,stock,b);
      }
      out[id]=rect;used.push(rect);
    }
    return out;
  }
  return {key,ids,labels,aspect,empty,clean,read,write,box,defs,solve,clamp,clashes};
}
