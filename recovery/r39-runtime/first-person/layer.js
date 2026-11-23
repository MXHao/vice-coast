// R39 desktop cinematic first-view continuity. Presentation reads native clocks;
// never schedules game actions, changes player resources, or handles audio.
const r39Smooth=x=>{x=clip(x,0,1);return x*x*(3-2*x);};
const r39Settled=(v)=>Number.isFinite(v)&&v>=0;
function r39ReloadEdge(previous,event,now){
   const {op,result,before:a,after:b,serial}=event;
   if(!a?.active||!b?.active||!Number.isFinite(now)||
      ![a.loaded,b.loaded,a.reserve,b.reserve].every(Number.isSafeInteger)||
      !r39Settled(a.reload)||!r39Settled(b.reload))return previous;
   const delta=b.loaded-a.loaded, reserve=a.reserve-b.reserve;
   if((op==='reload'&&result===true||op==='fire'&&result==='empty')&&a.reload===0&&b.reload>0&&delta===0&&reserve===0)
      return {start:now,clock:b.reload,pending:true,phase:b.phase??null,serial,fallback:false};
   if(!previous?.pending)return previous;
   if(op==='fire'&&result==='shot')return null;
   if(op!=='tick'||a.reload===0)return previous;
   if(b.reload>0)return {...previous,phase:b.phase??null};
   if(delta<0||reserve!==delta)return null;
   return {...previous,pending:false,end:now};
}
function r39Depth(s,now,f){
   if(s.swap){
     const draw=Number.isFinite(f?.draw)?clip(f.draw,0,s.swap.draw):s.swap.draw;
     const raised=1-Math.max(draw/Math.max(s.swap.draw,.001),1-clip((now-s.swap.visualAt)/.18,0,1));
     const z=1-r39Smooth(raised);
     if(z<=.001&&f?.ready)s.swap=null;
     if(z>0)return z;
   }
   const ep=s.r39Reload;if(!ep?.fallback)return 0;
   if(ep.pending)return r39Smooth((now-ep.start)/.09)*(ep.phase==='settle'?.56:1);
   const z=1-r39Smooth((now-ep.end)/.17);if(z<=.001)s.r39Reload=null;return z;
}
function r39ArtCamera(s,p,d,T){
   if(d<=0)return p.camera;
   const view=s.r39ArtLens??=new T.PerspectiveCamera();
   view.copy(p.camera,false);
   const up=p.camera.up.clone().set(0,-.24*d,0).applyQuaternion(p.camera.quaternion);
   view.position.add(up);view.updateMatrixWorld(true);
   return view; // Used only by the cosmetic mesh; world camera & collision are unchanged.
}
