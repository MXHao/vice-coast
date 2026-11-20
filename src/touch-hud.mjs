// Responsiveness and rendering only: game buttons retain their original nodes,
// bindings, analog input, pointer capture and release, targeting, and vehicle logic.
export function createTouchHUD(layout) {
  const css=`
  #vct-title{display:none}
  @media(any-pointer:coarse){
    #vct-title{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:6px 12px;
      color:#e5f5f1;font-weight:700;font-size:13px;border:1px solid #c6e8dd70;border-radius:5px;background:#181e29cc}
    #vct-title i{color:#88e1d3;font-style:normal}
    @media(max-width:550px) and (orientation:portrait){#vct-title{display:flex;width:max-content;margin-top:6px}}
    @media(orientation:landscape){.title-content:has(#vct-title) .start-actions{display:inline-flex}.title-content #vct-title{margin-left:8px;vertical-align:bottom}}
    .vct-ready.playing .tools{pointer-events:none;padding-right:50px}.vct-ready.playing .tools>button{pointer-events:auto}
    .vct-ready #touchDeck .thumb-actions,.vct-ready #touchDeck .steering{display:contents}
    .vct-ready #touchDeck[data-mode="walk"] .steering{display:none}
    .vct-ready.playing [data-vct-live]{position:fixed!important;box-sizing:border-box;
      left:var(--vx)!important;top:var(--vy)!important;width:var(--vw)!important;height:var(--vh)!important;
      max-width:none!important;max-height:none!important;right:auto!important;bottom:auto!important;
      margin:0!important;transform:none!important}
    .vct-ready.playing #interact{font-size:12px;line-height:1.12;padding:3px 5px;border-radius:12px}
    .vct-ready.playing #miniButton{align-content:start;grid-template-rows:minmax(0,1fr) 14px;gap:0}
    .vct-ready.playing #miniButton canvas{height:100%;width:auto;max-width:100%;justify-self:start}
    .vct-ready.playing #street{max-width:100%;white-space:nowrap;line-height:14px;padding:0 3px;font-size:10px}
    .vct-ready.playing #gasKey,.vct-ready.playing #brakeKey{border-radius:26%;border-bottom-width:3px}
    .vct-ready.playing #gasKey i,.vct-ready.playing #brakeKey i,.vct-ready.playing #touchFire i{font-size:1.6em}
    .vct-ready.playing #touchFire{box-shadow:0 1px 4px #2c1b2c70,inset 0 0 0 4px #ffb3c01c}
    .vct-ready.playing #touchDeck button{line-height:1;gap:1px}
    .vct-ready.playing #touchDeck .active{border-color:#a7fce4}
    @media(orientation:landscape){.vct-ready.playing .task-box{left:calc(var(--edge-left) + clamp(54px,8.6vmin,76px) + 14px);max-width:min(35vw,230px)}
      .vct-ready.playing .speed{right:auto;left:50%;bottom:8px;transform:translateX(-50%);opacity:.9}.vct-ready.playing .speed #vehicleLabel{display:none}
      .vct-ready.playing .speed strong{font-size:23px}}
    @media(orientation:portrait){.vct-ready.playing .speed{right:var(--edge-right);bottom:auto;top:calc(var(--hud-top) + 115px);opacity:.9}}
  }
  .vct-editor#overlay{padding:0;background:linear-gradient(155deg,#252c3af5,#1a2331f7 55%,#272433fa);backdrop-filter:none}
  .vct-editor .dialog{height:100%;width:100%;max-height:none;max-width:none;padding:0;margin:0;border:0;border-radius:0;box-shadow:none;background:none;overflow:hidden}
  .vct-editor .dialog-head{display:none}.vct-editor #panel{height:100%;position:relative;display:block}
  .vct-stage{position:absolute;inset:0;touch-action:none;overflow:hidden;user-select:none;
    background-image:linear-gradient(#b4dbe309 1px,transparent 1px),linear-gradient(90deg,#b4dbe309 1px,transparent 1px);
    background-size:24px 24px}
  .vct-stage:before{content:"";position:absolute;left:50%;top:28%;width:43%;height:28%;
    border:1px dashed #a9dcd33d;border-radius:35%;pointer-events:none}
  .vct-stage:after{content:"滑动环顾";position:absolute;top:39%;left:62%;
    letter-spacing:.14em;color:#abd3ce91;font-size:12px;pointer-events:none}
  .vct-token{position:absolute;z-index:1;display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;
    margin:0;padding:0 2px;line-height:1.12;text-align:center;font-weight:650;font-size:12px;
    background:#343d50e6;border:1px solid #b2c2cf9c;border-radius:50%;color:#eef5f2;touch-action:none}
  .vct-token svg{width:20px;height:20px}.vct-token[data-control=gasKey],.vct-token[data-control=brakeKey],
    .vct-token[data-control=interact],.vct-token[data-control=left],.vct-token[data-control=right]{border-radius:23%}
  .vct-token[data-control=gasKey]{background:#38584a}.vct-token[data-control=touchFire]{background:#794359}
  .vct-token[data-picked]{outline:3px solid #8cf1d8;outline-offset:2px;z-index:2;color:white}
  .vct-rack{position:absolute;z-index:3;left:50%;top:calc(env(safe-area-inset-top) + 7px);transform:translateX(-50%);
    width:max-content;max-width:calc(100% - env(safe-area-inset-left) - env(safe-area-inset-right) - 16px);
    border:1px solid #72948c;border-radius:12px;background:#19242df7;padding:4px 7px;color:#e8f5ef;
    display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;box-shadow:0 3px 12px #10192466;font:600 12px/1.2 system-ui,sans-serif}
  .vct-rack[data-bottom]{top:auto;bottom:calc(env(safe-area-inset-bottom) + 7px)}
  .vct-rack button,.vct-rack select{min-height:44px;min-width:44px;touch-action:manipulation;border:1px solid #506672;
    border-radius:7px;background:#283744;color:#e8f5ef;padding:5px 7px;font:inherit}
  .vct-rack .vct-save{background:#92e8ce;color:#132e28;border-color:#92e8ce}
  .vct-size{display:inline-flex;align-items:center;gap:4px}.vct-size span{min-width:32px;text-align:center;font-variant-numeric:tabular-nums}
  .vct-hint{position:absolute;pointer-events:none;left:50%;bottom:calc(env(safe-area-inset-bottom) + 6px);
    transform:translateX(-50%);color:#a5c4c0;font:11px/1.2 system-ui,sans-serif;white-space:nowrap}
  .vct-rack[data-bottom]~.vct-hint{bottom:auto;top:calc(env(safe-area-inset-top) + 6px)}
  @media(max-width:520px){.vct-rack{width:calc(100% - 28px);padding:4px}.vct-rack button,.vct-rack select{min-height:44px}}
  `;
  const styleProps=(el,r,b)=>{
    for(const [k,v] of [['--vx',b.l+r.x-r.w/2],['--vy',b.t+r.y-r.h/2],['--vw',r.w],['--vh',r.h]])el.style.setProperty(k,v.toFixed(2)+'px');
  };
  const store=()=>localStorage;
  let prefs=layout.empty(),current='drive',armed=true,get,openPanel,closePanel,note,media,safeProbe,nodes={},editor=null,enabled=false;
  function bounds(){
    const r=safeProbe.getBoundingClientRect();
    return {l:r.left,t:r.top,w:Math.max(1,r.width),h:Math.max(1,r.height)};
  }
  function live(){
    if(!enabled)return;
    const b=bounds(),places=layout.solve(current,b,prefs,armed);
    for(const [id,r] of Object.entries(places))styleProps(nodes[id],r,b);
  }
  function mode(next,hasWeapon){if(next!==current||armed!==!!hasWeapon){current=next;armed=!!hasWeapon;live();}}
  function name(id,m){return id==='touchCar'&&m==='drive'?'下车':layout.labels[id];}
  function markup(panel,html){
    if(!enabled)return html;
    if(panel==='pause')return '<button class="menu-row" data-action="vc-hud-open"><strong>自定义布局</strong><span>触屏按键</span></button>'+html;
    if(panel!=='vc-hud')return html;
    get('panelTitle').textContent='自定义布局';
    return '<div class="vct-stage" aria-label="触屏布局预览"></div>'+
      '<div class="vct-rack" aria-label="自定义布局工具">'+
      '<select class="vct-mode" aria-label="预览模式"><option value="walk">步行布局</option><option value="drive">驾驶布局</option></select>'+
      '<select class="vct-select" aria-label="选择按键"></select>'+
      '<div class="vct-size" aria-label="按键大小"><button type="button" data-tool="minus" aria-label="缩小">−</button><span class="vct-pct"></span><button type="button" data-tool="plus" aria-label="放大">＋</button></div>'+
      '<button type="button" data-tool="reset" title="恢复当前模式、当前方向">恢复默认</button>'+
      '<button type="button" data-tool="dock" aria-label="移动工具栏">移开工具栏</button><button type="button" data-tool="cancel">取消</button>'+
      '<button type="button" data-tool="save" class="vct-save">保存</button></div>'+
      '<span class="vct-hint" role="status">拖动按键调位置，点 − / ＋ 调大小</span>';
  }
  function release(){
    const d=editor?.drag;if(!d)return;editor.drag=null;
    if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id);
  }
  function leave(){
    if(!editor)return;release();editor=null;get('overlay').classList.remove('vct-editor');
  }
  function draw(){
    if(!editor)return;
    const e=editor,b=bounds(),r=layout.solve(e.mode,b,e.draft);e.rects=r;e.box=b;
    for(const [id,rect] of Object.entries(r)){
      const t=e.tokens[id];t.style.left=(b.l+rect.x-rect.w/2)+'px';t.style.top=(b.t+rect.y-rect.h/2)+'px';
      t.style.width=rect.w+'px';t.style.height=rect.h+'px';t.toggleAttribute('data-picked',id===e.id);t.setAttribute('aria-pressed',String(id===e.id));
    }
    e.select.value=e.id;e.pct.textContent=Math.round(r[e.id].s*100)+'%';
  }
  function draftItem(){
    const e=editor,aspect=layout.aspect(e.box),bucket=e.draft[e.mode][aspect];
    return bucket[e.id]??(bucket[e.id]={});
  }
  function gesture(token,id,ev){
    if(!editor||editor.drag||ev.button!==0)return;
    ev.preventDefault();const e=editor;e.id=id;draw();
    const r=e.rects[id];e.drag={id:ev.pointerId,el:token,x:ev.clientX,y:ev.clientY,rx:r.x,ry:r.y};
    token.setPointerCapture(ev.pointerId);
  }
  function move(ev){
    if(!editor)return;const e=editor,d=e.drag;if(!d||ev.pointerId!==d.id)return;
    ev.preventDefault();let p=draftItem();
    p.x=layout.clamp((d.rx+ev.clientX-d.x)/e.box.w,0,1);
    p.y=layout.clamp((d.ry+ev.clientY-d.y)/e.box.h,0,1);draw();
  }
  function buildTokens(mode){
    const e=editor;release();e.mode=mode;e.id=mode==='walk'?'touchFire':'gasKey';e.modeSelect.value=mode;
    e.stage.replaceChildren();e.select.replaceChildren();e.tokens={};
    for(const id of layout.ids[mode]){
      const t=document.createElement('button'), label=name(id,mode),opt=document.createElement('option');
      t.type='button';t.className='vct-token';t.dataset.control=id;t.setAttribute('aria-label',label);
      const icon=nodes[id].querySelector('svg');if(icon)t.appendChild(icon.cloneNode(true));
      const s=document.createElement('span');s.textContent=label;t.appendChild(s);opt.value=id;opt.textContent=label;
      t.addEventListener('pointerdown',ev=>gesture(t,id,ev));t.addEventListener('pointermove',move);
      for(const k of ['pointerup','lostpointercapture','pointercancel'])t.addEventListener(k,ev=>{if(editor?.drag?.id===ev.pointerId)release();});
      t.addEventListener('click',()=>{if(editor){editor.id=id;draw();}});
      e.stage.appendChild(t);e.select.appendChild(opt);e.tokens[id]=t;
    }
    draw();
  }
  function entered(panel){
    if(panel!=='vc-hud'||!enabled){leave();return;}
    leave();get('overlay').classList.add('vct-editor');
    const p=get('panel'),q=s=>p.querySelector(s);
    editor={draft:layout.clean(prefs),stage:q('.vct-stage'),rack:q('.vct-rack'),select:q('.vct-select'),pct:q('.vct-pct'),modeSelect:q('.vct-mode'),drag:null};
    const e=editor;
    e.modeSelect.addEventListener('change',()=>buildTokens(e.modeSelect.value));
    e.select.addEventListener('change',()=>{release();e.id=e.select.value;draw();});
    e.rack.addEventListener('click',ev=>{
      const tool=ev.target.closest('[data-tool]')?.dataset.tool;if(!tool||e!==editor)return;
      if(tool==='dock'){e.rack.toggleAttribute('data-bottom');return;}
      if(tool==='cancel'){closePanel();return;}
      if(tool==='save'){
        prefs=layout.clean(e.draft);const ok=layout.write(store,prefs);closePanel();live();
        note(ok?'触屏布局已保存':'此设备不允许保存，仅本次使用');return;
      }
      release();if(tool==='reset'){e.draft[e.mode][layout.aspect(e.box)]={};}
      else if(tool==='minus'||tool==='plus'){const p=draftItem();p.s=layout.clamp(Math.round(((p.s??1)+(tool==='plus'?.1:-.1))*10)/10,.7,1.6);}
      draw();
    });
    buildTokens(document.body.classList.contains('playing')?current:'walk');e.modeSelect.focus({preventScroll:true});
  }
  function reflow(){release();live();if(editor)draw();}
  function mount(Wt,XA,wi,notify){
    if(typeof matchMedia!=='function'||typeof document==='undefined')return;
    get=Wt;openPanel=XA;closePanel=wi;note=notify;media=matchMedia('(any-pointer:coarse)');
    function configure(){
      const wanted=media.matches;
      if(wanted===enabled)return;
      enabled=wanted;if(!wanted){if(editor)closePanel();document.body.classList.remove('vct-ready');return;}
      if(safeProbe){document.body.classList.add('vct-ready');live();return;}
      const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
      safeProbe=document.createElement('div');safeProbe.setAttribute('aria-hidden','true');
      safeProbe.style.cssText='position:fixed;pointer-events:none;visibility:hidden;left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px);top:env(safe-area-inset-top,0px);bottom:env(safe-area-inset-bottom,0px)';
      document.body.appendChild(safeProbe);
      for(const id of new Set([...layout.ids.walk,...layout.ids.drive])){
        const el=id==='left'||id==='right'?get('touchDeck').querySelector('[data-key="'+(id==='left'?'KeyA':'KeyD')+'"]'):get(id);
        nodes[id]=el;el.setAttribute('data-vct-live',id);
      }
      const title=document.createElement('button');title.type='button';title.id='vct-title';
      title.innerHTML='<i aria-hidden="true">⊹</i> 自定义布局';title.onclick=()=>openPanel('vc-hud');
      const row=get('roam').parentElement;
      // Put the title entry beside the two native large actions when room allows,
      // below them on narrower phones. No fixed bottom overlay over title/footer.
      row.insertAdjacentElement('afterend',title);
      prefs=layout.read(store);document.body.classList.add('vct-ready');
      window.addEventListener('resize',reflow);window.addEventListener('orientationchange',reflow);
      window.visualViewport?.addEventListener('resize',reflow);live();
    }
    configure();media.addEventListener?.('change',configure);
  }
  function keydown(ev){
    if(!editor)return false;
    if(ev.code==='Escape'){ev.preventDefault();if(!ev.repeat)closePanel();return true;}
    if(ev.code==='Tab'){
      const els=[...get('panel').querySelectorAll('button,select')];
      if(els.length&&document.activeElement===els[ev.shiftKey?0:els.length-1]){
        ev.preventDefault();els[ev.shiftKey?els.length-1:0].focus();
      }
    }
    return true; // Keep native selects/buttons working; do not route editor keys into the game.
  }
  function action(key){if(enabled&&key==='vc-hud-open'){openPanel('vc-hud','pause');return true;}return false;}
  return {mount,mode,markup,entered,leave,action,keydown};
}
