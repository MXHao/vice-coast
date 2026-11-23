const __vcR39RaceUI = (() => {
  "use strict";
  const C=__vcR39Course,R=__vcR39Race;
  const focusCanvas=g=>{const c=g.renderer.domElement;c.tabIndex=-1;c.focus({preventScroll:true})};
  const racePanel=()=>IA==="vc-circuit";
  const fmt=x=>{const t=Math.max(0,Math.floor(x*100));return Math.floor(t/6000)+":"+String(Math.floor(t/100)%60).padStart(2,"0")+"."+String(t%100).padStart(2,"0")};
  const gt=x=>Math.round(x);
  function paint(g) {
    const s=R.driveState(g);if(!s)return;
    __vcR14Touch.mode("drive",false);
    document.body.classList.remove("story-mode","armed");
    Wt("touchDeck").dataset.mode="drive";
    Wt("touchBrake").hidden=false;Wt("touchCar").hidden=Wt("touchGun").hidden=Wt("touchCrouch").hidden=Wt("touchReload").hidden=Wt("touchFire").hidden=true;
    Wt("chapter").hidden=Wt("dialogue").hidden=Wt("interact").hidden=Wt("combatHUD").hidden=Wt("hitCue").hidden=true;
    Wt("foeMarks").replaceChildren();Wt("damage").style.opacity="0";
    Wt("context").textContent="环线竞速";
    Wt("taskType").textContent=s.phase==="countdown"?"发车准备  /  GRID":"海湾街道赛  /  CIRCUIT";
    Wt("taskTitle").textContent=`第 ${s.lap}/${s.laps} 圈　排名 ${s.place===null?"—":s.place}/${s.grid}`;
    const d=s.next?Math.hypot(s.next.x-g.pos.x,s.next.z-g.pos.z):0;
    const hint=s.phase==="countdown"?`发车倒计时 · ${Math.ceil(s.remaining)}`
      :s.phase==="finished"?`完赛 · ${fmt(s.result.time)}`
      :s.phase==="dnf"?"超出选手时限 · 未完赛"
      :s.offTrack?"偏离路线 · 返回上一个路门后继续"
      :!s.gate?(s.lap===s.laps?`终点线 · ${gt(d)} m`:`发车 / 计圈线 · ${gt(d)} m`)
      :`下一路门 ${s.gate}/${s.gates-1} · ${gt(d)} m`;
    Wt("taskHint").textContent=hint;
    Wt("taskProgress").style.width=`${100*s.progress}%`;Wt("taskProgress").parentElement.hidden=false;
    Wt("street").textContent=fmt(s.clock);delete Wt("street").dataset.cue;
    Wt("speedGroup").hidden=false;
    const speed=Math.round(Math.abs(g.speed)*3.6);
    Wt("speed").textContent=String(speed).padStart(3,"0");
    Wt("gear").textContent=g.speed<-.2?"R":speed<2?"N":"D"+g.chassis.gear;
    Wt("rev").style.width=(g.chassis.rpm*100)+"%";Wt("vehicleLabel").textContent="Mirage GT · 赛道专用";
    const shortcut=Wt("shortcuts");
    if(shortcut.dataset.mode!=="vc-circuit"){
      shortcut.dataset.mode="vc-circuit";
      shortcut.innerHTML="<span><kbd>WASD</kbd>驾驶</span><span><kbd>空格</kbd>手刹</span><span><kbd>C</kbd>视角</span><span><kbd>Esc</kbd>比赛菜单</span>";
    }
    R.drawMap(Wt("mini"),g);
    const marker=Wt("worldTarget");marker.hidden=true;
    if(s.next&&d>9){
      const v=g.projected.set(s.next.x,4.2,s.next.z).project(g.camera);
      if(Math.abs(v.x)<.92&&v.y>-.61&&v.y<.82&&v.z>0&&v.z<1){
        marker.hidden=false;
        marker.style.transform=`translate(${(v.x+1)*innerWidth/2}px,${(1-v.y)*innerHeight/2}px) translate(-50%,-100%)`;
        marker.firstElementChild.style.borderColor="#75fce7";
        marker.lastElementChild.textContent=gt(d)+" m";
      }
    }
  }
  function resume() {
    if(!racePanel()||!R.active(ne))return false;
    const state=R.driveState(ne);if(state.result)return true; // result closes only by restarting/exiting
    IA="";Zo="";Wt("overlay").hidden=true;Wt("close").hidden=false;
    R.quiet(ne,false);focusCanvas(ne);return true;
  }
  function open(where="pause"){
    if(!R.active(ne))return false;
    const s=R.driveState(ne),result=s.result;
    IA="vc-circuit";Zo="";Wt("overlay").hidden=false;Wt("close").hidden=Boolean(result);
    R.quiet(ne,true);
    const body=Wt("panel");
    const row=(a,v,h="")=>`<button class="menu-row" type="button" data-vc-race-action="${a}"><strong>${v}</strong><span>${h}</span></button>`;
    Wt("panelTitle").textContent=result?(s.phase==="finished"?"比赛结果":"未完赛"):(where==="map"?"环线路线":"比赛暂停");
    body.innerHTML=result
      ?`<p class="vc-race-result">${s.phase==="finished"?`第 <b>${result.place}</b> / ${s.grid} 名`:"超过完赛时限"}<span>${fmt(result.time)}</span></p>${row("restart","再跑一次","两圈 · 四名对手")}${row("exit","返回主菜单")}`
      :`<p class="maphelp">按顺序穿过绿色路门，跑完两圈。当前比赛不会改变剧情或自由漫游存档。</p>${where==="map"?'<canvas id="vcRaceMap" class="map-canvas" width="480" height="265" aria-label="海湾环线赛道图"></canvas>':""}${row("resume","继续比赛","ESC")}${s.phase==="running"?row("recover","回到上一个路门后","保留已通过路门与时间"):""}${row("restart","重新发车")}${row("exit","退出竞速","返回主菜单")}`;
    if(where==="map"&&!result)R.drawMap(Wt("vcRaceMap"),ne,true);
    (result?body.querySelector("button"):Wt("close"))?.focus({preventScroll:true});
    return true;
  }
  function exit(){
    if(!R.stop(ne))return false;
    IA="";Zo="";Wt("overlay").hidden=true;Wt("close").hidden=false;Wt("panel").replaceChildren();
    document.body.classList.remove("vc-circuit");
    Nw(false);Pd();Wt("vcRace").focus({preventScroll:true});
    return true;
  }
  function click(evt){
    if(!R.active(ne))return false;
    if(!racePanel())return true;
    const action=evt.target.closest("button")?.dataset.vcRaceAction;
    if(action==="exit")exit();
    else if(action==="resume")resume();
    else if(action==="recover"){R.revive(ne);resume();paint(ne)}
    else if(action==="restart"){R.retry(ne);resume();paint(ne)}
    return true;
  }
  async function start(){
    if(wd||IA||R.active(ne))return;
    wd=true;const button=Wt("vcRace"),label=button.querySelector("span");
    try {
      button.disabled=Wt("start").disabled=Wt("roam").disabled=true;
      if(label)label.textContent="正在准备赛道…";
      if(q0!==false){On.set(true);K0()}
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(IA)return; // a newer title panel now owns focus
      if(!ne)ne=R.construct(()=>new G0(Wt("viewport"),On,{note:Y0,hud:Hs,panel:XA},Ri));
      R.start(ne);
      Nw(true);document.body.classList.add("vc-circuit");
      ne.resize();paint(ne);focusCanvas(ne);
    }catch(err){
      console.error(err);
      if(R.active(ne))exit();else On.drive(0,false);
      XA("error");
    }finally{
      wd=false;button.disabled=Wt("start").disabled=Wt("roam").disabled=false;
      if(label)label.textContent="环线竞速";
      Pd();
    }
  }
  return Object.freeze({racePanel,paint,resume,open,click,start});
})();
