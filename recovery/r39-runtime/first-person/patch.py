"""Counted local transforms for the sealed R38 split build; composable with independent lanes."""
from pathlib import Path
import hashlib, argparse
HERE=Path(__file__).resolve().parent
BASE='9b95774afe01af62e414c5792345a1820a85eca191ea033ed104d7bf40dac52b'
def transform(s):
    def put(old,new):
        nonlocal s
        if s.count(old)!=1: raise ValueError('Expected unique exact anchor: '+old[:140]+': count '+str(s.count(old)))
        s=s.replace(old,new,1)
    def after(old,new):put(old,old+new)
    put('function createSharedFirstView(T,cartridges,barrierFactory,nativeAir,makeHUD){',
        (HERE/'layer.js').read_text()+'\nfunction createSharedFirstView(T,cartridges,barrierFactory,nativeAir,makeHUD){')
    put('function seed(g,s){','function seed(g,s,transition=false){')
    put('!f.active||!f.allowed||!f.ready||!owner||!l?.owner||',
        '!f.active||!f.allowed||(!f.ready&&!transition)||!owner||!l?.owner||')
    put('const h=seed(s.game,s);','const h=seed(s.game,s,!!s.swap);')
    put('!assetFor.get(m.id)?.records)return null;','(!assetFor.get(m.id)?.records&&!s.swap))return null;')
    put('const q=!host?.hidden&&!g.story?.active?seed(g,s):null;',
        'const q=!host?.hidden&&!g.story?.active?seed(g,s,!!s.swap):null;')
    put('     const a=q&&assetFor.get(q.f.id),m=s.mount;',
        '''     const failure=s.r39SwapFailure,actual=q&&assetFor.get(q.f.id),m=s.mount;
     const failedSwap=!!q&&failure?.id===q.f.id&&failure.owner===q.owner&&failure.canvas===q.l.owner;
     if(!failedSwap)s.r39SwapFailure=null;
     const a=failedSwap&&!actual?.retryable?null:actual;''')
    put("'第三人称 · V 切换第一人称 · 进入后按住鼠标右键瞄准'",
        "failedSwap?'装备视图未加载 · 已返回第三人称':'第三人称 · V 切换第一人称'")
    put("?\u0027第一人称 · V 返回第三人称 · 按住鼠标右键瞄准\u0027",
        "?s.swap?'装备切换中 · V 取消':q.f.reload>0?'换弹中 · X 换装备':'第一人称 · V 返回 · 右键瞄准 · R 换弹 · X 换已有装备'")
    put('s.mount=null;s.lens=null;s.nextEpoch++;s.gate.invalidate(why);',
        's.mount=null;s.lens=null;s.swap=s.r39Reload=s.r39Stable=s.r39ArtLens=s.r39SwapFailure=null;s.r39ArtDepth=0;s.nextEpoch++;s.gate.invalidate(why);')
    put('const q=seed(g,s);\n   if(!q||q.l.owner!==e.target)return false;',
        'const q=seed(g,s,!!s.swap);\n   if(!q||q.l.owner!==e.target)return false;')
    put(' function right(g,e,target,owner){', ''' function quickSwitch(g,e,change){
   const s=stateFor.get(g),m=s?.mount;
   if(!m||s.swap||e?.isTrusted!==true||e.repeat||e.defaultPrevented||
      e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||touchForm(e)||e.target!==s.canvas||
      !samePrepared(s)||!seed(g,s))return false;
   const prior=seed(g,s),oldFov=s.selected.camera.fov;
   if(typeof change!=='function'||change(prior.f.id)!==true)return false;
   const next=seed(g,s,true);
   if(!next||next.f.id===prior.f.id||next.owner===prior.owner||next.l.owner!==prior.l.owner||
      !r39Settled(next.f.draw)||!Number.isFinite(g.elapsed))return true;
   if(s.mount)cut(g,'item-switch');
   s.swap={draw:next.f.draw,lens:okay(oldFov,18,110)?oldFov:70,visualAt:null};
   s.mount=Object.freeze({id:next.f.id,field:next.owner,canvas:next.l.owner,epoch:++s.nextEpoch});
   s.gate.invalidate('owner-change');
   s.hud=entry(next.f.id).opticHUD?.(s.doc,s.canvas)??entry(next.f.id).scenicHUD?.(s.doc,s.canvas)??makeHUD(s.doc,s.canvas,next.f.id);
   void load(next.f.id);return true;
 }
 function inputParked(g){
   const s=stateFor.get(g);return !!s?.swap&&!!determine(s);
 }
 function right(g,e,target,owner){''')
    put("if(!s?.mount||e.button!==2||(e.type==='mousedown'&&!target))return false;",
        "if(!s?.mount||e.button!==2||(e.type==='mousedown'&&(!target||s.swap)))return false;")
    put('      entry(s.mount.id).afterRight?.(s,g);\n      if(s.episode||s.end)cut(g,\'mount-retired\');',
        '''      if(s.r39Reload?.pending){
         s.r39Reload={...s.r39Reload,fallback:true};s.episode=s.end=s.kick=null;
      }else{
         entry(s.mount.id).afterRight?.(s,g);
         if(s.episode||s.end)cut(g,'mount-retired');
      }''')
    put('   if(q.opticHUD){\n      const layout=s.hud?.getLayout(c,row.optic);',
        '   if(q.opticHUD&&row.optic){\n      const layout=s.hud?.getLayout(c,row.optic);')
    put('const a=assetFor.get(m.id),q=entry(m.id),real=seed(g,s);','const a=assetFor.get(m.id),q=entry(m.id),real=seed(g,s,!!s.swap);')
    put("   if(!a?.records){if(a?.failed)cut(g,'intent-denied');return false;}",
        """   if(!a?.records&&(a?.failed||!s.swap)){
     if(a?.failed){
       const lost=s.swap?{id:m.id,owner:m.field,canvas:m.canvas}:null;
       cut(g,'intent-denied');s.r39SwapFailure=lost;
     }
     return false;
   }""")
    put('     const posed=a.goal(s,intent,dt,now);\n     const sample=q.ownSample?posed:a.records.descriptor(posed);\n     if(!sample){cut(g,\'mount-retired\');return false;}',
        '''     const ep=s.r39Reload;
     let sample=null;
     if(a?.records){
       const posed=a.goal(s,intent,dt,now);
       sample=posed?(q.ownSample?posed:a.records.descriptor(posed)):null;
       if(!sample&&ep?.pending&&s.r39Stable){ep.fallback=true;s.episode=s.end=s.kick=null;}
       if(ep?.fallback&&s.r39Stable)sample=s.r39Stable;
       if(!sample){cut(g,'mount-retired');return false;}
       if(!ep?.pending&&!s.episode&&!s.end)s.r39Stable=sample;
     }else if(s.swap){
       s.swap.lens=okay(g.camera.fov,48,95)?g.camera.fov:66;
       const p=s.gate.prepareFrame(++s.frame,()=>choose(s,scope,{lens:s.swap.lens},q));
       if(!p){cut(g,'occlusion');return false;}
       s.selected=p;s.sample={};return true;
     }
     if(s.swap&&s.swap.visualAt===null)s.swap.visualAt=now;
     s.r39ArtDepth=r39Depth(s,now,real.f);''')
    put('     const p=s.gate.prepareFrame(++s.frame,()=>choose(s,scope,sample,q));',
        '''     const z=s.swap?s.r39ArtDepth:0;
     const lensSample=z>0&&Number.isFinite(sample.lens)?{...sample,lens:s.swap.lens*z+sample.lens*(1-z)}:sample;
     const p=s.gate.prepareFrame(++s.frame,()=>choose(s,scope,lensSample,q));''')
    put('mesh.draw(sample,p.camera,s.plannedOptic?.artOpacity);','mesh.draw(sample,r39ArtCamera(s,p,s.r39ArtDepth,T),s.plannedOptic?.artOpacity);')
    put('   if(!determine(s))return false;', '   if(!determine(s)||!assetFor.get(m.id)?.records)return false;')
    put('   if(q.record)return q.record(s,g,event,now,assetFor.get(m.id).records,samePrepared,cut);',
        '''   const was=s.r39Reload;const ep=s.r39Reload=r39ReloadEdge(was,event,now);
   if(ep?.fallback)return true;
   function cosmeticCut(game,why){
     if((ep?.pending||was?.pending)&&s.r39Stable&&['intent-denied','mount-retired'].includes(why)){
       s.r39Reload={...(ep??was),fallback:true};s.episode=s.end=s.kick=null;
     }else cut(game,why);
   }
   if(q.record){
     const accepted=q.record(s,g,event,now,assetFor.get(m.id).records,samePrepared,cosmeticCut);
     if(!accepted&&ep?.pending&&s.r39Stable&&!s.episode)cosmeticCut(g,'intent-denied');
     return accepted;
   }''')
    put("      if(!s.selected?.ads||s.alpha<.98){cut(g,'intent-denied');return false;}",
        "      if(!s.selected?.ads||s.alpha<.98){cosmeticCut(g,'intent-denied');return false;}")
    put("         else cut(g,'mount-retired');\n      }\n   }\n   return true;\n }\n function needsNativeTick",
        "         else cosmeticCut(g,'mount-retired');\n      }\n   }\n   return true;\n }\n function needsNativeTick")
    put('return !!s?.episode&&m?.id===id&&m?.field===owner;',
        'return !!(s?.episode||s?.r39Reload?.pending)&&m?.id===id&&m?.field===owner;')
    put('   if(!p||!s.mesh){if(s){s.mesh?.hide();hideHUD(s);}return legacy();}',
        '''   if(!p||(!s.mesh&&!s.swap)){if(s){s.mesh?.hide();hideHUD(s);}return legacy();}
   if(!s.mesh&&s.swap){
     const visible=g.player.visible;
     try{hideHUD(s);g.player.visible=false;const ok=g.renderer.render(g.scene,p.camera);if(ok===false)cut(g,'mount-retired');return ok;}
     catch{cut(g,'mount-retired');return legacy();}
     finally{g.player.visible=visible;}
   }''')
    put("   const m=s.sample[entry(s.mount.id).visualAnchor??'muzzle'];",
        "   if(s.r39ArtDepth>0||s.swap)return original;\n   const m=s.sample[entry(s.mount.id).visualAnchor??'muzzle'];")
    put('busy:!!s.episode||!!s.end','busy:!!s.episode||!!s.end||!!s.swap||!!s.r39Reload?.pending||s.r39ArtDepth>0')
    put('worldLensForNative,visualNativeCue,nativeRecord,needsNativeTick,inspect,awaitLocalArt',
        'worldLensForNative,visualNativeCue,nativeRecord,needsNativeTick,quickSwitch,inputParked,inspect,awaitLocalArt')
    put('ready:q.draw<=1e-8,reload:q.reload}},()=>s);','ready:q.draw<=1e-8,reload:q.reload,draw:q.draw}},()=>s);')
    put('    applyOutside:()=>s.applyOutside(canUseTitle()),\n    toggle(){',
        '''    applyOutside:()=>s.applyOutside(canUseTitle()),
    quickEquip(item){
      if(item===id||!LOADOUT_IDS.includes(item)||!holding())return false;
      if(!this.authorize(item))return false;
      return this.applyOutside();
    },
    toggle(){''')
    put('  const field=g=>records.get(g)?.field;\n  return {',
        '''  const field=g=>records.get(g)?.field;
  function quickEquip(g,e){
    const r=records.get(g);
    if(!r||r.session.view().active||!r.field.ordinary())return false;
    return __vcPrivateSharedFirstView.quickSwitch(g,e,from=>{
      const owned=r.session.owned().filter(id=>LOADOUT_IDS.includes(id)&&ITEMS[id]?.price!=null&&r.session.owns(id));
      if(!owned.length)return false;
      const to=owned[(owned.indexOf(from)+1)%owned.length];
      return !!to&&to!==from&&r.field.quickEquip(to);
    });
  }
  return {quickEquip,''')
    put("function onKey(e){if(e.code==='KeyV'&&__vcPrivateSharedFirstView.toggle(game,e)){stop(e);return;}",
        '''function onKey(e){
     if(e.code==='KeyV'&&__vcPrivateSharedFirstView.toggle(game,e)){clearShot();stop(e);return;}
     if(e.code==='KeyX'&&locked&&owns()&&playable()&&__vcR15ArmoryReplacement.quickEquip(game,e)){clearShot();stop(e);return;}
     if(e.code==='KeyR'&&e.isTrusted===true&&e.target===canvas&&locked&&owns()&&playable()&&__vcPrivateSharedFirstView.inputParked(game)){stop(e);return;}''')
    after("     if(e.isTrusted!==true||e.sourceCapabilities?.firesTouchEvents||e.button!==0)return;\n     if(blockMousePress){if(e.type==='mouseup')blockMousePress=false;return;}",
        '''
     if(locked&&owns()&&playable()&&__vcPrivateSharedFirstView.inputParked(game)){clearShot();if(e.target===canvas)stop(e);return;}''')
    put('<span><kbd>C</kbd>视角</span></div>', '<span><kbd>C</kbd>驾驶视角</span><span><kbd>V</kbd>切换第一人称</span><span><kbd>R</kbd>换弹</span><span><kbd>X</kbd>换已有装备</span></div>')
    return s
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('target',type=Path);p.add_argument('--composed',action='store_true')
    a=p.parse_args();b=a.source.read_bytes()
    if not a.composed and hashlib.sha256(b).hexdigest()!=BASE:raise SystemExit('Wrong exact R38 base')
    o=transform(b.decode()).encode()
    a.target.parent.mkdir(parents=True,exist_ok=True);a.target.write_bytes(o)
    print(len(o),hashlib.sha256(o).hexdigest())
