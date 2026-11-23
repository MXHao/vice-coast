// R39 fictional circuit; deliberately separate from mission and save state.
const __vcR39Race = (() => {
  "use strict";
  const C=__vcR39Course, activeRaces=new WeakMap(), garages=new WeakMap();
  let constructing=0;
  const own=["cars","car","chassis","lastVehicle","cooldown","heat","chaseAge","capture","policePlan","camMode","orbit","pitch","lookDelay","drag","crouched","speed","steer","spin","playerYaw","camTravel","elapsed","paused","last","saveClock","hudClock","tireMarks","contactFX"];
  function active(g){return !!g&&activeRaces.has(g)}
  function savingBlocked(g){return constructing>0||active(g)}
  function construct(fn){constructing++;try{return fn()}finally{constructing--}}
  function inputs(g) {
    g.keys.clear();g.touch.reset();
    const pid=g.drag?.id,canvas=g.renderer.domElement;
    g.drag=null;if(pid!==undefined&&canvas.hasPointerCapture?.(pid))canvas.releasePointerCapture(pid);
  }
  function pose(g,c,p,rolling=0,dt=0) {
    c.yaw=p.yaw;c.mesh.position.set(p.x,.025,p.z);c.mesh.rotation.set(0,c.yaw,0,"YXZ");
    if(dt){c.spin-=rolling*dt/.34;T0(c.mesh,c.spin,0,0,0)}
  }
  // Geometry is built lazily and reused per world. It consists solely of simple roadway signs.
  function signs() {
    const group=new Qe(), bars=new oe(), v=[];
    function line(x,y,z,x1,y1,z1){v.push(x,y,z,x1,y1,z1)}
    for(let n=-C.HALF_GATE;n<C.HALF_GATE;n+=.85) {
      line(n+.04,.055,0,n+.79,.055,0);
      line(n+.04,.055,.31,n+.79,.055,.31);
    }
    for(const x of [-C.HALF_GATE,C.HALF_GATE]) {
      line(x,0,0,x,3.8,0);line(x+.09,0,0,x+.09,3.8,0);
    }
    line(-C.HALF_GATE,3.8,0,C.HALF_GATE,3.8,0);
    line(-C.HALF_GATE,3.68,0,C.HALF_GATE,3.68,0);
    bars.setAttribute("position",new Yt(v,3));
    const material=new uo({color:0x71f8de,transparent:true,opacity:.95,depthWrite:false});
    const lineMesh=new Ca(bars,material);lineMesh.isLineSegments=true;group.add(lineMesh);return group;
  }
  function getGarage(g) {
    if(garages.has(g))return garages.get(g);
    const cars=[], gates=[];const fx=new Qe();
    try {
      const player=g.addVehicle("sport",0x15abaa,C.sample(-13.7,1.65),0);cars.push(player);
      for(const n of C.specs)cars.push(g.addVehicle("sport",n.color,C.sample(n.start,n.lane),0));
      for(const a of C.gates) {
        const node=signs();node.position.set(a.x,0,a.z);node.rotation.y=Math.atan2(a.tx,a.tz);
        g.scene.add(node);gates.push(node);
      }
      const out={cars,gates,fx,tireMarks:new F0(fx),contactFX:new I0(fx,g.city.wetAt)};
      g.scene.add(fx);garages.set(g,out);return out;
    } catch(err) {
      for(const c of cars)g.scene.remove(c.mesh);
      for(const q of gates)g.scene.remove(q);
      g.scene.remove(fx);throw err;
    }
  }
  function start(g) {
    if(active(g))throw Error("Circuit already open");
    const restore=Object.fromEntries(own.map(k=>[k,{exists:Object.hasOwn(g,k),value:g[k]}]));
    const hidden=[...g.cars.map(c=>c.mesh),...g.walkers.map(w=>w.mesh),g.player,g.beacon,...((g.encounter.foes||[]).map(f=>f.mesh))].filter(Boolean).map(mesh=>({mesh,visible:mesh.visible}));
    const camera={position:g.camera.position.clone(),rotation:g.camera.quaternion.clone(),aim:g.aim.clone(),fov:g.camera.fov};
    const r={restore,hidden,camera,garage:null,q:C.create(),hud:0};
    activeRaces.set(g,r);
    try {
      g.cars=[];r.garage=getGarage(g);
      for(const {mesh} of hidden)mesh.visible=false;
      g.cars=r.garage.cars;g.car=g.cars[0];g.lastVehicle=g.car;g.chassis=new L0();
      g.tireMarks=r.garage.tireMarks;g.contactFX=r.garage.contactFX;r.garage.fx.visible=true;
      g.cooldown=0;g.heat=0;g.elapsed=0;g.camMode=0;
      reset(g,r);
      return r;
    } catch(err){stop(g);throw err}
  }
  function quiet(g,value) {
    g.paused=value;inputs(g);g.last=performance.now();g.sound.drive(0,false);g.sound.setPaused?.(value);
  }
  function reset(g,r) {
    r.q=C.create();r.hud=0;
    for(const c of r.garage.cars){c.mesh.visible=true;c.wait=0;c.roadSpeed=0;c.spin=0;c.way=c===g.car?[]:[{x:84,z:136}]}
    g.contactFX?.reset();g.tireMarks.previous=null;
    placePlayer(g,C.restartPoint(r.q));
    for(let i=0;i<r.q.npcs.length;i++){
      const n=r.q.npcs[i];pose(g,g.cars[i+1],C.sample(n.progress,n.t.lane));
    }
    g.camMode=0;g.heat=0;quiet(g,false);g.setCamera(1,true);displayGate(r);
  }
  function placePlayer(g,p) {
    pose(g,g.car,p);g.orbit=0;g.pitch=0;g.lookDelay=0;g.camTravel=0;g.speed=0;g.steer=0;g.spin=0;g.cooldown=0;
    g.chassis.reset(p.yaw);
  }
  function displayGate(r) {
    const target=C.view(r.q).next,i=target?.i;
    r.garage.gates.forEach((node,j)=>{node.visible=i===j});
  }
  function advance(g,r,dt) {
    const q=r.q;
    g.elapsed+=dt;g.cooldown-=dt;g.lookDelay-=dt;
    const before={x:g.pos.x,z:g.pos.z};
    if(q.phase==="running")g.drive(dt); // exact original chassis, tire, collision and control methods
    const crossed=C.advance(q,dt,before,g.pos,g.cars.slice(1).map(c=>c.wait>0));
    if(q.phase==="running"||q.phase==="finished"){
      for(let i=0;i<q.npcs.length;i++) {
        const n=q.npcs[i], c=g.cars[i+1];
        c.wait=Math.max(0,c.wait-dt);c.roadSpeed=n.speed;
        c.mesh.visible=n.finishTime===null;
        if(c.mesh.visible)pose(g,c,C.sample(n.progress,n.t.lane),n.speed,dt);
      }
    }
    if(crossed==="go")g.sound.fx("checkpoint");
    if(crossed==="gate"||crossed==="lap") {g.sound.fx("checkpoint");displayGate(r)}
    if(crossed==="lap")g.events.note("进入最后一圈");
    if(crossed==="finish"||crossed==="dnf"){
      displayGate(r);
      if(crossed==="finish")g.sound.fx("win");
      g.speed=0;g.sound.drive(0,false);
    }
    g.contactFX.update(dt);g.setCamera(dt);
    g.env.update(dt,g.elapsed,g.pos,g.camera);g.city.updateSignals(g.elapsed);
    return crossed;
  }
  // Own frame branch: no story.tick, civilian traffic, police, armory or save runs in this mode.
  function frame(g,now,ui) {
    const r=activeRaces.get(g);
    if(!r)return;
    const dt=Math.min(.12,Math.max(0,(now-g.last)/1000));g.last=now;
    if(!g.paused&&dt>0) {
      const n=Math.ceil(dt/(1/45));
      let end=false;
      for(let i=0;i<n&&!end;i++){
        const e=advance(g,r,dt/n);
        end=e==="finish"||e==="dnf";
      }
      g.renderer.render(g.scene,g.camera);
      r.hud+=dt;
      if(r.hud>.07||end){ui.paint(g);r.hud=0}
      if(end)ui.open("result");
    }
    requestAnimationFrame(g.frame);
  }
  function stop(g) {
    const r=activeRaces.get(g);if(!r)return false;
    inputs(g);
    for(const c of r.garage?.cars||[]) c.mesh.visible=false;
    for(const gate of r.garage?.gates||[])gate.visible=false;
    if(r.garage?.fx)r.garage.fx.visible=false;
    for(const {mesh,visible} of r.hidden)mesh.visible=visible;
    for(const [k,q] of Object.entries(r.restore)){if(q.exists)g[k]=q.value;else delete g[k]}
    activeRaces.delete(g);
    g.camera.position.copy(r.camera.position);g.camera.quaternion.copy(r.camera.rotation);
    g.camera.fov=r.camera.fov;g.camera.updateProjectionMatrix();g.aim.copy(r.camera.aim);
    g.paused=true;g.last=performance.now();
    g.sound.drive(0,false);g.sound.setPaused?.(true);
    return true;
  }
  function onKey(g,e,overlay,ui) {
    if(!active(g))return false;
    const a=e.code;
    if(overlay&&a==="Tab")return false; // let shared modal focus trap handle Tab
    if(overlay&&a!=="Escape"&&a!=="KeyJ"&&a!=="KeyM")return true; // don't capture Enter/Space on buttons
    if(a==="Escape"||a==="KeyJ"||a==="KeyM"){
      if(!e.repeat){e.preventDefault();if(overlay)ui.resume();else ui.open(a==="KeyM"?"map":"pause")}
      return true;
    }
    const k=({ArrowUp:"KeyW",ArrowLeft:"KeyA",ArrowDown:"KeyS",ArrowRight:"KeyD"})[a]||a;
    if(["KeyW","KeyA","KeyS","KeyD","Space"].includes(k)) {
      if(!e.altKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();g.keys.add(k)}
    }else if(a==="KeyC"&&!e.repeat){g.camMode=(g.camMode+1)%3;g.setCamera(1,true)}
    return true;
  }
  function driveState(g){
    const r=activeRaces.get(g);return r?C.view(r.q):null;
  }
  function revive(g){
    const r=activeRaces.get(g);
    if(!r||r.q.phase!=="running")return false;
    g.contactFX?.reset();g.tireMarks.previous=null;
    placePlayer(g,C.restartPoint(r.q));g.setCamera(1,true);return true;
  }
  function retry(g){
    const r=activeRaces.get(g);if(!r)return false;
    reset(g,r);return true;
  }
  function drawMap(canvas,g,big=false){
    if(!canvas)return;
    const c=canvas.getContext("2d");if(!c)return;
    const w=canvas.width,h=canvas.height,s=Math.min(w,h)*.0091;
    const x=p=>(p.x-42)*s+w/2, z=p=>(p.z-126)*s+h/2;
    c.fillStyle="#101625";c.fillRect(0,0,w,h);c.beginPath();
    for(let i=0;i<C.legs.length;i++){const p=C.legs[i].a;if(i)c.lineTo(x(p),z(p));else c.moveTo(x(p),z(p))}
    c.closePath();c.lineJoin="round";c.strokeStyle="#53677b";c.lineWidth=big?9:6;c.stroke();
    const q=activeRaces.get(g)?.q;if(!q)return;
    const gate=C.view(q).next;
    function dot(p,color,r){c.beginPath();c.arc(x(p),z(p),r,0,2*Math.PI);c.fillStyle=color;c.fill()}
    if(gate)dot(gate,"#75fce7",big?8:5.5);
    for(const n of q.npcs)if(n.finishTime===null)dot(C.sample(n.progress,n.t.lane),"#"+n.t.color.toString(16).padStart(6,"0"),big?6:3.8);
    c.save();c.translate(x(g.pos),z(g.pos));c.rotate(-g.yaw);c.beginPath();const r=big?9:6;
    c.moveTo(0,-r);c.lineTo(-r*.72,r*.62);c.lineTo(r*.72,r*.62);c.closePath();c.fillStyle="#fff9e9";c.fill();c.restore();
  }
  return Object.freeze({active,savingBlocked,construct,start,frame,stop,retry,revive,quiet,onKey,driveState,drawMap});
})();
