// Desktop-only mouse look over Vice Coast's existing camera and aim input.
// Native desktop acquisition on a deliberate gameplay gesture; no mode toggle.
// No automatic permission request on load/focus, storage, or new camera math.
export function createDesktopLook() {
 const states=new WeakMap();
 let current;
 const desktopQuery='(pointer: fine) and (hover: hover)';
 const limit=(n,min,max)=>Math.max(min,Math.min(max,n));
 const fineDelta=v=>typeof v==='number'&&Number.isFinite(v);
 function mount(game,doc,win) {
   if(states.has(game))return;
   const canvas=game.renderer?.domElement;
   // The native no-render fixture and unsupported platforms stay on the exact
   // original input path. A same-origin page or embed can still deny a request.
   if(!canvas||!doc?.head||typeof canvas.requestPointerLock!=='function'||
      typeof doc?.exitPointerLock!=='function'||!('pointerLockElement' in doc)||
      typeof win?.matchMedia!=='function'||typeof win.addEventListener!=='function'||
      typeof doc.addEventListener!=='function')return;
   const fine=win.matchMedia(desktopQuery);
   current?.dispose();
   const removers=[];
   function listen(node,name,fn,capture=false){
     node.addEventListener(name,fn,capture);
     removers.push(()=>node.removeEventListener(name,fn,capture));
   }
   // The focus indicator on the full-size canvas isn't actionable while locked.
   // Only this specific canvas/state is in scope; accessibility and browser UI are not.
   const style=doc.createElement('style');
   style.textContent='canvas[data-vc-mouse-look="locked"]:focus{outline:none}';
   doc.head.append(style);
   const reticle=doc.createElement('span');
   reticle.id='vc-desktop-aim';
   reticle.setAttribute('aria-hidden','true');
   Object.assign(reticle.style,{
     position:'fixed',left:'50%',top:'50%',zIndex:'12',pointerEvents:'none',
     width:'8px',height:'8px',border:'1px solid rgba(253,247,219,.82)',
     boxShadow:'0 0 3px rgba(0,0,0,.9)',borderRadius:'50%',translate:'-50% -50%'
   });
   doc.body.append(reticle);
   let dead=false,want=false,locked=false,exiting=false,pending=false,failed=false;
   let generation=0,shotPressed=false,blockMousePress=false,guardEscapeUntil=-Infinity,releaseTimer;
   const owns=()=>doc.pointerLockElement===canvas;
   const playable=()=>!dead&&fine.matches&&game.live===true&&!game.paused&&canvas.isConnected!==false&&
     !doc.hidden&&doc.body.classList.contains('playing')&&
     (typeof doc.hasFocus!=='function'||doc.hasFocus());
   const now=()=>win.performance?.now?.()??0;
   function paint() {
     const active=locked&&owns()&&playable();
     const hideAim=!(active&&!game.car&&game.encounter?.armed);
     if(reticle.hidden!==hideAim)reticle.hidden=hideAim;
     if(active){
       if(canvas.getAttribute('data-vc-mouse-look')!=='locked')canvas.setAttribute('data-vc-mouse-look','locked');
     }else if(canvas.getAttribute('data-vc-mouse-look')!==null){
       canvas.removeAttribute('data-vc-mouse-look');
     }
   }
   function clearShot() { shotPressed=false; }
   function stopTimer(){
     if(releaseTimer!==undefined)win.clearTimeout?.(releaseTimer);
     releaseTimer=undefined;
   }
   function clearDrag(){
     const id=game.drag?.id;
     if(id===undefined)return;
     game.drag=null;
     // Never leave native pointer capture armed across a desktop state change.
     try{if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);}catch{}
   }
   function exit(){
     if(!owns()||exiting)return;
     exiting=true;
     try{doc.exitPointerLock();}catch{exiting=false;}
   }
   function release() {
     const wasMouse=locked||pending||want||owns();
     want=false;pending=false;locked=false;generation++;
     stopTimer();clearShot();blockMousePress=false;
     if(wasMouse)clearDrag();
     exit();paint();
   }
   function changed() {
     if(owns()){
       if(!want||!playable()){release();return;}
       const acquired=!locked;
       pending=false;locked=true;failed=false;exiting=false;stopTimer();
       if(acquired){
         clearShot();clearDrag();guardEscapeUntil=-Infinity;
         // Restore native Space for handbrake/fire instead of leaving UI focus.
         canvas.focus?.({preventScroll:true});
       }
     }else{
       exiting=false;
       if(locked){
         // The browser may handle Escape before JavaScript sees that keydown.
         // Do not convert that same keystroke into opening the pause dialog.
         guardEscapeUntil=now()+125;
         want=false;locked=false;pending=false;generation++;stopTimer();clearShot();blockMousePress=false;clearDrag();
         game.keys?.clear();
       }
     }
     paint();
   }
   function reject(ticket) {
     if(ticket!==generation||!pending)return;
     if(owns()&&want&&playable()){changed();return;}
     failed=true;release();
     if(playable())canvas.focus?.({preventScroll:true});
   }
   function request(){
     if(!playable()||locked||pending||(doc.pointerLockElement&& !owns()))return;
     failed=false;want=true;pending=true;clearShot();
     const ticket=++generation;
     paint();
     try{
       const result=canvas.requestPointerLock();
       // Legacy browsers notify through Events; a modern return may reject.
       if(result&&typeof result.then==='function')
         result.then(()=>{if(ticket===generation||owns())changed();},()=>reject(ticket));
       if(pending&&typeof win.setTimeout==='function')
         releaseTimer=win.setTimeout(()=>reject(ticket),1800);
     }catch{reject(ticket);}
   }
   function stop(e){e.preventDefault();e.stopImmediatePropagation();}
   const trustedPrimaryMouse=e=>e.isTrusted===true&&e.pointerType==='mouse'&&
     !e.sourceCapabilities?.firesTouchEvents&&e.button===0&&e.isPrimary!==false;
   function resume(e){
     // Native explicit Continue button: trusted mouse click, or native keyboard
     // button activation represented by a click with no pointer kind and detail 0.
     // Unknown-detail legacy input is left for a subsequent canvas gesture.
     if(e?.isTrusted===true&&!e.sourceCapabilities?.firesTouchEvents&&
        (trustedPrimaryMouse(e)||(!e.pointerType&&e.detail===0)))request();
   }
   function pointer(e) {
     if(e.pointerType!=='mouse') {
       if((e.pointerType==='touch'||e.pointerType==='pen')&&e.type==='pointerdown'&&(locked||pending))release();
       return;
     }
     if(e.type==='pointerdown'&&trustedPrimaryMouse(e)&&playable()){
       if(locked&&owns())blockMousePress=false; // A new physical press, not the acquisition.
       else if(!failed&&!pending&&!doc.pointerLockElement){
         // Start the request synchronously in the native mouse gesture. Keep its
         // compatibility MouseEvents, but don't let this press start a game action.
         blockMousePress=true;
         e.stopImmediatePropagation();request();return;
       }
     }
     if(!playable()||(!locked&&!pending&&!blockMousePress))return;
     e.stopImmediatePropagation();
     if(e.type==='pointercancel'||e.type==='lostpointercapture'){
       clearShot();if(e.type==='pointercancel')blockMousePress=false;
     }
   }
   function mouseButton(e){
     if(e.isTrusted!==true||e.sourceCapabilities?.firesTouchEvents||e.button!==0)return;
     if(blockMousePress){if(e.type==='mouseup')blockMousePress=false;return;}
     // A press released outside the playable canvas must still disarm.
     if(e.target!==canvas||!locked||!owns()||!playable()){
       if(e.type==='mouseup')clearShot();
       return;
     }
     if(e.type==='mousedown'){shotPressed=true;return;}
     const shoot=shotPressed;shotPressed=false;
     if(shoot&&!game.car&&game.encounter?.armed)game.encounter.shoot(); // Native screen-centre shot.
   }
   function move(e) {
     if(e.isTrusted!==true||e.sourceCapabilities?.firesTouchEvents||
        !locked||!owns()||!playable()||!fineDelta(e.movementX)||!fineDelta(e.movementY))return;
     const x=limit(e.movementX,-96,96)*.0035,y=limit(e.movementY,-96,96)*.0105;
     if(x===0&&y===0)return;
     if(game.car){const orbit=game.orbit-x;game.orbit=Math.atan2(Math.sin(orbit),Math.cos(orbit));}
     else game.walkAngle-=x;
     game.pitch=limit(game.pitch+y,-1.35,4);
     game.lookDelay=2; // Standard recenter delay starts after an intentional release.
   }
   function onKey(e){
     if(e.code==='Escape'&&(locked||owns())){
       guardEscapeUntil=now()+125;stop(e);release();game.keys?.clear();return;
     }
     if(e.code==='Escape'&&(pending||now()<guardEscapeUntil)){
       stop(e);if(pending)release();return;
     }
     if(e.target===canvas&&e.code==='Enter'&&e.isTrusted===true&&!e.repeat&&playable()&&!locked&&!pending){
       stop(e);request();
     }
   }
   for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])
     listen(canvas,name,pointer,true);
   listen(doc,'mousemove',move,true); // Exactly one relative motion stream.
   listen(doc,'mousedown',mouseButton,true);
   listen(doc,'mouseup',mouseButton,true);
   listen(doc,'pointerlockchange',changed);
   listen(doc,'pointerlockerror',()=>reject(generation));
   listen(doc,'visibilitychange',()=>{if(doc.hidden)release();else paint();});
   listen(win,'keydown',onKey,true);
   listen(win,'keyup',e=>{if(e.code==='Escape')guardEscapeUntil=-Infinity;},true);
   listen(win,'blur',release);
   listen(win,'pagehide',release);
   if(typeof fine.addEventListener==='function')
     listen(fine,'change',()=>{if(!fine.matches)release();else paint();});
   function hold(){
     if((locked||pending||owns())&&!playable())release();
     else paint();
     return locked&&owns()&&playable();
   }
   function dispose(){
     dead=true;release();
     for(const remove of removers)remove();
     style.remove();reticle.remove();states.delete(game);
   }
   const state={release,hold,dispose,resume};
   states.set(game,state);
   current=state;
   paint();
 }
 function release(game){states.get(game)?.release();}
 function hold(game){return states.get(game)?.hold()===true;}
 function resume(game,e){states.get(game)?.resume(e);}
 return Object.freeze({mount,release,hold,resume});
}
