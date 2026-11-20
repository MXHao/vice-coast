import { CATALOG, ITEMS } from './catalog.mjs';
export const ROOM_STYLE=`
.vc-armory-entry,.vc-armory-room,.vc-armory-room *{box-sizing:border-box}
.vc-armory-entry,.vc-armory-room button,.vc-armory-room select{font:700 14px system-ui;color:#f4e8d3;border:1px solid #a97f54;min-height:44px;background:#222a31;padding:0 13px;border-radius:9px}
.vc-armory-room button:focus-visible,.vc-armory-room select:focus-visible,.vc-armory-entry:focus-visible{outline:2px solid #f7c387;outline-offset:2px}
.vc-armory-room button:disabled{opacity:.55}
.vc-armory-entry{position:fixed;z-index:16;bottom:max(20vh,8rem);left:50%;transform:translateX(-50%);box-shadow:0 7px 27px #121517;touch-action:manipulation}
.vc-armory-room{position:fixed;inset:0;z-index:16;color:#f5e6cb;font:500 14px system-ui;pointer-events:none}
.vc-armory-room [hidden],.vc-armory-entry[hidden]{display:none!important}
.vc-armory-look{position:absolute;inset:0;touch-action:none;pointer-events:auto}
.vc-armory-top,.vc-armory-foot,.vc-armory-panel,.vc-armory-pad{position:absolute;pointer-events:auto}
.vc-armory-top{top:max(14px,env(safe-area-inset-top));left:max(14px,env(safe-area-inset-left));right:max(14px,env(safe-area-inset-right));display:flex;align-items:center;justify-content:space-between;gap:12px}
.vc-armory-label{display:grid;gap:3px;padding:10px 14px;border-left:2px solid #f9c38d;background:#1d2228de;letter-spacing:.08em}
.vc-armory-label strong{font-size:18px;letter-spacing:.09em}.vc-armory-label span{font-size:11px;color:#dbc09b}
.vc-armory-top aside,.vc-armory-row,.vc-armory-pad{display:flex;gap:8px}
.vc-armory-foot{bottom:max(26px,calc(env(safe-area-inset-bottom) + 13px));left:50%;transform:translateX(-50%);max-width:90vw;text-align:center}
.vc-armory-foot p{color:#f8e6ce;margin:0 0 8px;padding:6px 9px;background:#1a2228e9;border-radius:5px;white-space:nowrap}
.vc-armory-panel{right:max(18px,env(safe-area-inset-right));top:20%;width:min(34vw,365px);max-height:72%;overflow:auto;padding:16px;background:#20262bec;border:1px solid #92704c;border-left:3px solid #e3a970;border-radius:10px;box-shadow:0 17px 52px #091218bb}
.vc-armory-panel h2{font-size:20px;margin:0 0 4px}.vc-armory-panel p{margin:7px 0 10px;line-height:1.42}
.vc-armory-panel .vc-armory-wallet{font-variant-numeric:tabular-nums;color:#efc894}.vc-armory-panel select{width:100%;margin:5px 0 11px}
.vc-armory-row{flex-wrap:wrap;margin-top:8px}.vc-armory-panel .vc-armory-primary{background:#8d582f;border-color:#cfad82}
.vc-armory-pad{left:max(18px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));touch-action:none}
@media (pointer:fine){.vc-armory-pad{display:none}}
@media (max-width:660px) and (orientation:portrait){.vc-armory-panel{top:auto;bottom:max(14px,env(safe-area-inset-bottom));left:12px;right:12px;width:auto;max-height:43%;padding:12px}.vc-armory-foot:not([hidden]){bottom:85px}}
@media (max-height:470px) and (orientation:landscape){.vc-armory-panel{top:18%;width:min(37vw,365px);max-height:78%;padding:9px}.vc-armory-panel h2{font-size:16px}.vc-armory-panel p{margin:4px 0}.vc-armory-panel select{margin:2px 0 5px}}
body[data-vc-armory] #hud,body[data-vc-armory] #top,body[data-vc-armory] #touchDeck,body[data-vc-armory] #dialogue,body[data-vc-armory] #combatHUD,body[data-vc-armory] #worldTarget,body[data-vc-armory] #foeMarks,body[data-vc-armory] #notice{visibility:hidden!important}
`;
const UI_COPY={unavailable:'此项目前不能购买。',insufficient:'游戏币不够，本次没有扣款。',stale:'已取消，请重新确认。','write-failed':'存档不可用，本次没有扣款。',purchased:'已放入库存。这个版本暂不支持装备。'};
export function createShowroomUI(doc,callbacks){
  const make=(tag,kind,label)=>{const e=doc.createElement(tag);if(kind)e.className=kind;if(label)e.textContent=label;return e;};
  const btn=(label,id,run)=>{const e=make('button',null,label);e.type='button';if(id)e.dataset.armory=id;if(run)e.addEventListener('click',run);return e;};
  const room=make('section','vc-armory-room'),look=make('div','vc-armory-look');
  room.setAttribute('aria-label','潮汐装备店');room.setAttribute('data-armory-room','');
  const top=make('div','vc-armory-top'), label=make('div','vc-armory-label'), bar=make('aside');
  label.append(make('strong',null,'潮汐装备店'),make('span',null,'TIDE OUTFITTERS  ·  热湾市'));
  bar.append(btn('暂停','pause',()=>callbacks.pause()),btn('离开商店','leave',()=>callbacks.leave()));top.append(label,bar);
  const footer=make('div','vc-armory-foot'), hint=make('p'), service=btn('查看柜台','counter',()=>callbacks.open());
  footer.append(hint,service);
  const pad=make('div','vc-armory-pad');
  const touchDir=new Map(),change=()=>callbacks.touch([...touchDir.values()]);
  for(const [code,text,desc] of [['KeyA','←','向左'],['KeyW','↑','向前'],['KeyS','↓','向后'],['KeyD','→','向右']]){
    const b=btn(text,'move-'+code);
    b.setAttribute('aria-label',desc);
    b.addEventListener('pointerdown',ev=>{ev.preventDefault();b.setPointerCapture?.(ev.pointerId);touchDir.set(ev.pointerId,code);change();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,ev=>{if(touchDir.delete(ev.pointerId))change();});
    pad.append(b);
  }
  let tracking=null;
  look.addEventListener('pointerdown',ev=>{if(ev.button&&ev.button!==0)return;tracking={id:ev.pointerId,x:ev.clientX,y:ev.clientY};look.setPointerCapture?.(ev.pointerId);});
  look.addEventListener('pointermove',ev=>{if(tracking?.id!==ev.pointerId)return;const dx=ev.clientX-tracking.x,dy=ev.clientY-tracking.y;tracking.x=ev.clientX;tracking.y=ev.clientY;callbacks.look(dx,dy);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])look.addEventListener(event,ev=>{if(tracking?.id===ev.pointerId)tracking=null;});
  const stock=make('section','vc-armory-panel'), title=make('h2',null,'柜台目录'), meta=make('p','vc-armory-wallet'), select=make('select');
  select.setAttribute('aria-label','选择目录商品');
  for(const category of new Set(CATALOG.map(item=>item.category))){
    const g=make('optgroup');g.label=category;
    for(const obj of CATALOG.filter(i=>i.category===category)){const o=make('option',null,obj.label+(obj.preview?' · 有样件':' · 目录'));o.value=obj.id;g.append(o);}select.append(g);
  }
  select.addEventListener('change',()=>callbacks.select(select.value));
  const summary=make('p'), status=make('p');
  status.setAttribute('aria-live','polite');
  const actions=make('div','vc-armory-row'), rotate=btn('旋转样件','rotate',()=>callbacks.rotate()),
    listen=btn('试听合成音','audition',()=>callbacks.listen()),buy=btn('购买','quote',()=>callbacks.ask());
  buy.className='vc-armory-primary';
  actions.append(rotate,listen,buy,btn('回到展厅','close',()=>callbacks.close()));
  const verify=make('div','vc-armory-row'), pay=btn('确认付款','confirm',()=>callbacks.confirm());
  pay.className='vc-armory-primary';verify.append(pay,btn('取消','cancel',()=>callbacks.cancel()));
  stock.append(title,meta,select,summary,actions,verify,status);room.append(look,top,footer,pad,stock);
  doc.body.append(room);doc.body.setAttribute('data-vc-armory','');
  const refresh=(v,reachable,audioReady,msg='')=>{
    footer.hidden=v.panel;pad.hidden=v.panel;stock.hidden=!v.panel;service.hidden=!reachable;
    hint.textContent=reachable?'E / 触按 · 查看柜台':'前往柜台 · WASD 或触屏方向键移动';
    if(!v.panel)return;
    const item=ITEMS[v.selected];select.value=item.id;meta.textContent='游戏币 '+v.cash;
    summary.textContent=item.label+' · '+(v.owns?'已收入库存，本版不可装备':item.price!==null?'库存购买 · '+item.price+' 游戏币':item.preview?'仅供外观与音色预览':'本版仅列入目录');
    rotate.hidden=!item.preview;listen.hidden=!item.preview||!audioReady;buy.hidden=item.price===null||v.owns||!!v.quote;
    buy.textContent='购买 · '+(item.price??0);verify.hidden=!v.quote;
    if(v.quote)pay.textContent='确认支付 '+v.quote.price+' 游戏币';
    status.textContent=UI_COPY[msg]??msg;
  };
  return {refresh,clearPointers(){tracking=null;touchDir.clear();change();},focusCounter:()=>service.focus?.({preventScroll:true}),
    focusStock:()=>select.focus?.({preventScroll:true}),dispose(){tracking=null;touchDir.clear();room.remove();doc.body.removeAttribute('data-vc-armory');}};
}
