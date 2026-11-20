// R14 graphics controls. No save, world/model handles, or adaptive quality loop.
export function createGraphicsQuality() {
  const key = 'vice-coast-graphics-v1';
  const modes = [
    ['high','最高','原版清晰度与日照阴影'],
    ['balanced','均衡','适度降低分辨率与阴影精度'],
    ['smooth','流畅','优先减少像素与阴影开销']
  ];
  const valid = id => modes.some(m => m[0] === id);
  let id = 'high', persistent = true, device = null;
  try { const saved = localStorage.getItem(key); if (valid(saved)) id = saved; } catch { persistent = false; }
  const ratio = (base, mode=id) => mode === 'high' ? base :
    mode === 'balanced' ? Math.min(1.5, base * .84) : Math.min(1, base * .68);
  const shadowSize = (base, mode=id) => mode === 'high' ? base : Math.min(base,mode === 'balanced' ? 2048 : 1024);
  function bindRenderer(renderer, nativeRatio) {
    device = {renderer,nativeRatio,sun:null};
    return ratio(nativeRatio);
  }
  function bindSun(renderer, light, nativeSize, setSnap) {
    if (!device || device.renderer !== renderer || !light.castShadow) return;
    device.sun = {shadow:light.shadow,nativeSize,setSnap};
    setSnap(shadowSize(nativeSize)); // original constructor writes mapSize using this same resolution
  }
  function choose(next) {
    if (!valid(next) || next === id) return;
    const previous = id;
    if (device) {
      const {renderer,nativeRatio,sun} = device;
      if (ratio(nativeRatio,next) !== ratio(nativeRatio,previous)) renderer.setPixelRatio(ratio(nativeRatio,next));
      if (sun) {
        const {shadow,nativeSize,setSnap} = sun, size = shadowSize(nativeSize,next);
        if (size !== shadow.mapSize.x || size !== shadow.mapSize.y) {
          // Three's pinned shadow pass allocates when map===null, not on a mapSize change.
          // The live map and optional second-pass target are owned by this one light.
          shadow.dispose(); shadow.map = null; shadow.mapPass = null;
          shadow.mapSize.set(size,size); setSnap(size);
          shadow.needsUpdate = true; renderer.shadowMap.needsUpdate = true;
        }
      }
    }
    id = next;
    try { localStorage.setItem(key,next); persistent = true; } catch { persistent = false; }
  }
  const label = () => modes.find(m => m[0] === id)[1];
  function menuMarkup(name, previous, find) {
    if (name === 'pause') return '<button type="button" class="menu-row" data-action="vcq-open"><strong>画质设置</strong><span>'+label()+'</span></button>'+previous;
    if (name !== 'graphics') return previous;
    find('panelTitle').textContent = '画质设置';
    return '<p class="vcq-help">手机卡顿时可选「流畅」。随时切换，不影响剧情进度。</p><div class="vcq-options" role="group" aria-label="画质档位">'+
      modes.map(([value,title,desc])=>'<button type="button" class="menu-row vcq-mode" data-action="vcq-'+value+'" aria-pressed="'+(id===value)+'"><strong>'+title+'</strong><span>'+desc+'</span><b aria-hidden="true">✓</b></button>').join('')+
      '</div><p class="vcq-status" role="status">'+status()+'</p><button class="action" data-action="close">返回</button>';
  }
  function status() { return '当前：'+label()+' · '+(persistent?'此设备记忆选择':'本次有效，浏览器未允许保存'); }
  function handle(action, panel, show) {
    if (action === 'vcq-open') { show('graphics','pause'); return true; }
    if (typeof action !== 'string' || !action.startsWith('vcq-') || !valid(action.slice(4))) return false;
    choose(action.slice(4));
    // Keep the original focused button: no duplicate native pause/save, no lost keyboard focus.
    for (const b of panel.querySelectorAll('.vcq-mode')) b.setAttribute('aria-pressed',String(b.dataset.action === 'vcq-'+id));
    const s = panel.querySelector('.vcq-status'); if (s) s.textContent = status();
    return true;
  }
  function mountTitle(find, show) {
    const guide = find('guide');
    const b = document.createElement('button'); b.id='vcq-title'; b.type='button'; b.className='iconbtn';
    b.setAttribute('aria-label','画质设置'); b.textContent='画质'; b.onclick=()=>show('graphics');
    guide.parentElement.insertBefore(b,guide);
    const style=document.createElement('style');
    style.textContent='#top #vcq-title{font:600 14px/1 system-ui,sans-serif;width:auto;min-width:48px;padding:0 9px;border-radius:12px}.playing #top #vcq-title{display:none}.vcq-help,.vcq-status{color:var(--cream);font-size:14px;line-height:1.5;margin:8px 0 14px}.vcq-status{color:var(--aqua)}.vcq-options .vcq-mode{display:grid;grid-template-columns:auto 1fr 20px;min-height:48px;padding:9px 6px;text-align:left}.vcq-mode span{color:var(--cream);font-size:13px}.vcq-mode b{visibility:hidden}.vcq-mode[aria-pressed=true]{color:var(--aqua);background:#69ccb412}.vcq-mode[aria-pressed=true] b{visibility:visible}@media(any-pointer:coarse){#top #vcq-title{min-height:44px}}';
    document.head.appendChild(style);
  }
  return {bindRenderer,bindSun,menuMarkup,handle,mountTitle,ratio,shadowSize,choose};
}
