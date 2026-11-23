#!/usr/bin/env python3
"""Replay the isolated Free Roam economy patch on the pinned R38 runtime (full index.html or detached JS)."""
from argparse import ArgumentParser
from pathlib import Path

HELPER = '''
/* VC_R39_ROAM_ECONOMY_BEGIN */
const __vcR39Roam=(()=>{
  const storyKey='vice-coast-drive-v1', roamKey='vice-coast-drive-freeroam-r39';
  const routeKey='vc-play';
  const isUnlimited=g=>g?.vcMode==='roam';
  const keyFor=mode=>mode==='roam'?roamKey:mode==='story'?storyKey:null;
  const balance=raw=>{
    const n=Number(raw);
    return Number.isFinite(n)?Math.max(0,n):0;
  };
  const cashInHUD=(n,unlimited)=>unlimited?'COIN ∞':'$'+n.toLocaleString('en-US');
  // R38 retains a resident GPU world and does not expose a full scene teardown.
  // A document replacement on the rare actual profile switch creates exactly
  // one fresh world, from the right isolated save, and never mixes live state.
  function routeFor(href,mode){
    if(!keyFor(mode))throw Error('Unknown campaign mode');
    const u=new URL(href);
    u.searchParams.set(routeKey,mode);
    return u;
  }
  function takeRoute(href,replace){
    const u=new URL(href), mode=u.searchParams.get(routeKey);
    if(!keyFor(mode))return null;
    u.searchParams.delete(routeKey);
    try{replace(u);}catch{}
    return mode;
  }
  return Object.freeze({isUnlimited,keyFor,balance,cashInHUD,routeFor,takeRoute});
})();
/* VC_R39_ROAM_ECONOMY_END */
'''

def apply(src: str) -> str:
    def one(old, new):
        nonlocal src
        found = src.count(old)
        if found != 1:
            raise ValueError(f'R38 patch anchor expected once, found {found}: {old[:105]!r}')
        src = src.replace(old, new, 1)

    # One runtime-local helper, safe before game bindings/asset evaluation.
    one('/* VC_R24_OWNER_AUDIO_EXACT_BEGIN */', HELPER+'/* VC_R24_OWNER_AUDIO_EXACT_BEGIN */')
    one("const STORAGE_KEY='vice-coast-drive-v1';\n", '')
    one(
        '  function view(){return {active,panel,selected,quote:quote?{...quote}:null,owns:owned.has(selected),cash:host.getCash()};}',
        '  const unlimited=()=>host.isUnlimited?.()===true;\n'
        '  function view(){return {active,panel,selected,quote:quote?{...quote}:null,owns:owned.has(selected),cash:host.getCash(),...(unlimited()?{unlimited:true}:{})};}'
    )
    one(
        "      if(!Number.isSafeInteger(cash)||cash<item.price)return 'insufficient';\n"
        "      quote={id:item.id,price:item.price,baseline:cash};return 'quote';",
        "      const noCharge=unlimited();\n"
        "      if(!Number.isSafeInteger(cash)||(!noCharge&&cash<item.price))return 'insufficient';\n"
        "      quote={id:item.id,price:item.price,baseline:cash,...(noCharge?{noCharge:true}:{})};return 'quote';"
    )
    one(
        '''      const cash=host.getCash();
      if(!Number.isSafeInteger(cash)||cash!==offer.baseline||cash<offer.price)return 'stale';
      const next=new Set(owned).add(offer.id);
      try{
        const projected=host.projectSave();
        const body=withOwnership(host.withProjectedCash(projected,cash-offer.price),next,prior);
        // Native storage writes once. Complete that before the primitive in-memory assignment.
        if(host.commit({expectedCash:cash,nextCash:cash-offer.price,body})!==true)return 'write-failed';
''',
        '''      const cash=host.getCash(),noCharge=unlimited();
      if((offer.noCharge===true)!==noCharge||!Number.isSafeInteger(cash)||cash!==offer.baseline||(!noCharge&&cash<offer.price))return 'stale';
      const next=new Set(owned).add(offer.id), nextCash=noCharge?cash:cash-offer.price;
      try{
        const projected=host.projectSave();
        const body=withOwnership(host.withProjectedCash(projected,nextCash),next,prior);
        // Write only the active profile, before assigning in-memory cash and ownership.
        if(host.commit({expectedCash:cash,nextCash,body})!==true)return 'write-failed';
''',
    )
    one("meta.textContent='游戏币 '+v.cash;", "meta.textContent='游戏币 '+(v.unlimited?'∞':v.cash);")
    one("item.price!==null?'库存购买 · '+item.price+' 游戏币':canPreview?", "item.price!==null?(v.unlimited?'库存可领 · 不扣游戏币':'库存购买 · '+item.price+' 游戏币'):canPreview?")
    one("buy.textContent='购买 · '+(item.price??0);", "buy.textContent=v.unlimited?'领取 · 不扣币':'购买 · '+(item.price??0);")
    one("if(v.quote)pay.textContent='确认支付 '+v.quote.price+' 游戏币';", "if(v.quote)pay.textContent=v.quote.noCharge?'确认领取（不扣币）':'确认支付 '+v.quote.price+' 游戏币';")
    one('const sig=[v.panel,v.selected,!!v.quote,v.owns,v.cash,', 'const sig=[v.panel,v.selected,!!v.quote,v.owns,v.cash,v.unlimited,')
    one('readSave:()=>saved,getCash:()=>g.money,canEnter:', 'readSave:()=>saved,getCash:()=>g.money,isUnlimited:()=>__vcR39Roam.isUnlimited(g),canEnter:')
    one(
        '''        if(g.money!==expectedCash||body.v!==1||!Number.isFinite(body.x+body.z+body.yaw))return false;
        opts.storage.setItem(STORAGE_KEY,JSON.stringify(body));''',
        '''        const saveKey=__vcR39Roam.keyFor(g.vcMode);
        if(!saveKey||g.money!==expectedCash||body.v!==1||!Number.isFinite(body.x+body.z+body.yaw))return false;
        opts.storage.setItem(saveKey,JSON.stringify(body));'''
    )
    one('Rw="vice-coast-drive-v1",pi=', 'pi=')
    one(
        'function pd(){try{let A=JSON.parse(localStorage.getItem(Rw));',
        'function pd(mode="story"){try{const key=__vcR39Roam.keyFor(mode);if(!key)return null;let A=JSON.parse(localStorage.getItem(key));'
    )
    one('var Lw=()=>!!pd(),Fw=()=>pd()?.story;', 'var Lw=mode=>!!pd(mode),Fw=()=>pd("story")?.story;')
    one(
        'var G0=class{constructor(t,e,n,i={keys:new Set,axes:{right:0,forward:0},reset(){}}){this.touch=i,',
        'var G0=class{constructor(t,e,n,i={keys:new Set,axes:{right:0,forward:0},reset(){}},vcMode="story"){'
        'Object.defineProperty(this,"vcMode",{value:vcMode});this.touch=i,'
    )
    one('this.projected=new pt;let c=pd();', 'this.projected=new pt;let c=pd(this.vcMode);')
    one('this.money=Math.max(0,Number(c.cash)||0)', 'this.money=__vcR39Roam.balance(c.cash)')
    one('carYaw:t.yaw,cash:this.money,done:', 'carYaw:t.yaw,cash:__vcR39Roam.balance(this.money),done:')
    one('try{localStorage.setItem(Rw,JSON.stringify(n))}', 'try{const key=__vcR39Roam.keyFor(this.vcMode);if(key)localStorage.setItem(key,JSON.stringify(n))}')
    one('mission:this.story.active?null:this.mission,money:this.money,heat:', 'mission:this.story.active?null:this.mission,money:this.money,unlimitedCoin:__vcR39Roam.isUnlimited(this),heat:')
    one('Wt("money").textContent="$"+A.money.toLocaleString("en-US")', 'Wt("money").textContent=__vcR39Roam.cashInHUD(A.money,A.unlimitedCoin)')
    # Returning to the title keeps the resident world, but Pd must always use the story profile.
    one('function Pd(){let A=ne?.story||Fw();', 'function Pd(){let A=(ne?.vcMode==="story"?ne.story:null)||Fw();')
    # Use native startup for both profiles with a mode fixed at construction. Resume roam's
    # own job on returning from title or reload rather than resetting it at every entry.
    one(
        'async function Dd(A="story"){if(!(wd||IA)){',
        'function vcR39Switch(A){if(wd)return;wd=!0;try{ne?.save();location.replace(__vcR39Roam.routeFor(location.href,A).href)}'
        'catch(e){wd=!1;console.error(e);Y0("暂时无法切换模式，请重试。")}}'
        'async function Dd(A="story",vcAuto=false){if(!(wd||IA)){if(ne&&ne.vcMode!==A){vcR39Switch(A);return;}'
    )
    one('try{q0!==!1&&(On.set(!0),K0()),await new Promise', 'try{!vcAuto&&q0!==!1&&(On.set(!0),K0()),await new Promise')
    one(
        'let t=!ne&&!Lw();ne||(ne=new G0(Wt("viewport"),On,{note:Y0,hud:Hs,panel:XA},Ri)),'
        'A==="story"?ne.story.resume():(ne.story.suspend(),ne.save())',
        'let t=!ne&&!Lw(A);ne||(ne=new G0(Wt("viewport"),On,{note:Y0,hud:Hs,panel:XA},Ri,A)),'
        'A==="story"?ne.story.resume():ne.save()'
    )
    one(
        'if(e==="free"){ne.free(),wi(!0),Hs(ne.state());return}if(e==="story"){ne.story.resume(),wi(!0),Hs(ne.state());return}',
        'if(e==="free"){if(ne.vcMode!=="roam"){vcR39Switch("roam");return}ne.free(),wi(!0),Hs(ne.state());return}'
        'if(e==="story"){if(ne.vcMode!=="story"){vcR39Switch("story");return}ne.story.resume(),wi(!0),Hs(ne.state());return}'
    )
    one(
        'addEventListener("pagehide",()=>ne?.save());})();',
        'addEventListener("pagehide",()=>ne?.save());\n'
        'const vcR39Route=__vcR39Roam.takeRoute(location.href,u=>history.replaceState(history.state,"",u.href));'
        'if(vcR39Route)void Dd(vcR39Route,true);\n})();'
    )
    return src

def main():
    ap=ArgumentParser(description=__doc__)
    ap.add_argument('source', type=Path)
    ap.add_argument('target', type=Path)
    args=ap.parse_args()
    if args.source.resolve()==args.target.resolve():
        ap.error('use an explicit separate output file')
    with args.source.open(encoding='utf-8',newline='') as f:
        out=apply(f.read())
    with args.target.open('w',encoding='utf-8',newline='') as f:
        f.write(out)

if __name__=='__main__':
    main()
