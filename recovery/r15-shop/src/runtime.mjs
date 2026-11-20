import { ITEMS } from './catalog.mjs';
import { createSession, DOOR, STORAGE_KEY, inDoor, inCounter } from './session.mjs';
import { createAudition } from './audition.mjs';
import { createShowroomUI } from './interface.mjs';
import { createShowroom } from './room.mjs';

export function createArmoryRuntime(table={}) {
  const records=new WeakMap();
  let prompt=null, prompted=null;
  const allowed=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

  function setPrompt(g,show) {
    if(!show){if(prompt&&prompted===g){prompt.hidden=true;prompted=null;}return;}
    const r=records.get(g); if(!r?.opts.doc.body?.append)return;
    if(!prompt){
      const a=r.opts.doc.createElement('button');a.type='button';a.className='vc-armory-entry';a.dataset.armory='enter';
      a.textContent='E / 触按 · 进入潮汐装备店';a.addEventListener('click',()=>act(prompted));r.opts.doc.body.append(a);
      prompt=a;
    }
    prompted=g;prompt.hidden=false;
  }
  function eligible(g,r){
    return !!g?.live&&!g.paused&&!g.car&&!g.mission&&!g.heat&&!g.encounter?.armed&&!g.encounter?.active
      &&!g.story?.nearPrompt&&!g.story?.failed&&!g.story?.choice
      &&!(g.story?.active&&g.story.stage>=3&&g.story.stage<=5)
      &&r.opts.playing()&&inDoor(g.pos.x,g.pos.z)&&!g.blocked(DOOR.exitX,DOOR.exitZ,.29);
  }
  function bind(g,saved,opts){
    const r={opts,room:null,ui:null,capturing:false,captured:null,audition:null,
      keys:new Set(),touch:new Set(),pausedForMenu:false,ms:null,status:'',refreshSig:'',visibility:null};
    records.set(g,r);
    const refresh=()=>{
      const v=r.session.view(),p=r.room?.position();
      const ready=!!g.sound?.enabled&&!!table[v.selected];
      const reachable=p&&inCounter(p.x,p.z);
      const sig=[v.panel,v.selected,!!v.quote,v.owns,v.cash,reachable,ready,r.status].join('/');
      if(r.ui&&sig!==r.refreshSig){r.refreshSig=sig;r.ui.refresh(v,!!reachable,ready,r.status);}
    };
    const clear=()=>{r.keys.clear();r.touch.clear();r.ui?.clearPointers();};
    function close(){
      r.session.close();r.audition?.stop();clear();r.room?.show(null);r.status='';refresh();r.ui?.focusCounter();
    }
    function open(){
      if(!r.session.open())return false;
      clear();r.status='';r.room.show(ITEMS[r.session.view().selected].preview?r.session.view().selected:null);
      refresh();r.ui?.focusStock();return true;
    }
    function perform(n){r.status=r.session[n]();refresh();}
    r.session=createSession({
      readSave:()=>saved,getCash:()=>g.money,canEnter:()=>eligible(g,r),
      position:()=>r.room?.position()??g.pos,
      enter(){
        try{
          r.room=createShowroom(opts.THREE);
          r.audition=createAudition({table,audio:()=>g.sound,decode:s=>Uint8Array.from(atob(s),v=>v.charCodeAt(0))});
          r.ui=createShowroomUI(opts.doc,{
            pause:()=>opts.openMenu('pause'),leave:()=>leave(g),open,close,
            select:id=>{if(!r.session.select(id))return;r.audition.stop();r.room.show(ITEMS[id].preview?id:null);r.status='';refresh();},
            rotate:()=>r.room?.turnInspect(Math.PI/9),
            listen:()=>{const v=r.session.view();if(v.active&&v.panel)void r.audition.play(v.selected);},
            ask:()=>perform('ask'),confirm:()=>perform('confirm'),
            cancel:()=>{r.session.cancel();r.status='';refresh();},
            touch:keys=>{r.touch=new Set(keys);},
            look:(dx,dy)=>{if(r.session.view().panel)r.room?.turnInspect(dx*.014);else r.room?.turn(-dx*.005,-dy*.005);}
          });
          r.visibility=()=>{if(opts.doc.hidden){clear();r.audition?.stop();}};
          opts.doc.addEventListener?.('visibilitychange',r.visibility);
          g.setPaused(true);setPrompt(g,false);r.ms=null;r.refreshSig='';
          return true;
        }catch{
          dispose();
          if(g.paused)g.setPaused(false);
          return false;
        }
      },
      leave(){
        dispose();
        g.player.position.set(DOOR.exitX,opts.floor(DOOR.exitX,DOOR.exitZ),DOOR.exitZ);
        g.footVelocity.set(0,0);g.setCamera(1,true);
        if(!r.pausedForMenu)g.setPaused(false);
        g.save();
        if(!r.pausedForMenu)g.renderer.domElement.focus?.({preventScroll:true});
      },
      projectSave(){
        r.capturing=true;r.captured=null;
        try{g.save();if(!r.captured)throw Error('Native save capture missing');return r.captured;}
        finally{r.capturing=false;r.captured=null;}
      },
      withProjectedCash:(p,money)=>({...p,cash:money}),
      commit({expectedCash,nextCash,body}){
        if(g.money!==expectedCash||body.v!==1||!Number.isFinite(body.x+body.z+body.yaw))return false;
        opts.storage.setItem(STORAGE_KEY,JSON.stringify(body));
        g.money=nextCash;
        return true;
      }
    });
    function dispose(){
      opts.doc.removeEventListener?.('visibilitychange',r.visibility);
      clear();r.ui?.dispose();r.room?.dispose();r.audition?.stop(true);
      r.ui=r.room=r.audition=r.visibility=null;r.ms=null;
    }
    r.refresh=refresh;r.open=open;r.close=close;r.dispose=dispose;r.clear=clear;
  }
  function leave(g,forMenu=false){
    const r=records.get(g);
    if(!r?.session.view().active)return false;
    r.pausedForMenu=forMenu;
    try{return r.session.leave();}
    finally{r.pausedForMenu=false;}
  }
  function act(g){
    const r=records.get(g);if(!r)return false;
    if(r.session.view().active){if(!r.session.view().panel)r.open();return true;}
    const yes=r.session.enter();if(yes)r.refresh();return yes;
  }
  function frame(g,t){
    const r=records.get(g);if(!r)return false;
    if(!r.session.view().active){setPrompt(g,eligible(g,r));return false;}
    const v=r.session.view();let dt=r.ms===null?0:Math.min(.05,Math.max(0,(t-r.ms)/1000));r.ms=t;
    if(r.opts.doc.hidden||!g.sound?.enabled)r.audition?.stop();
    if(!v.panel&&!r.opts.doc.hidden){
      const has=k=>r.keys.has(k)||r.touch.has(k);
      const x=Number(has('KeyD'))-Number(has('KeyA')), z=Number(has('KeyW')||has('ArrowUp'))-Number(has('KeyS')||has('ArrowDown'));
      r.room.move(x,z,dt);
      r.room.turn((Number(has('ArrowLeft'))-Number(has('ArrowRight')))*1.5*dt,0);
    }
    try{r.room.render(g.renderer,v.panel);}
    catch{leave(g);return false;}
    r.refresh();return true;
  }
  function onKey(g,event,up=false) {
    const r=records.get(g);if(!r?.session.view().active)return false;
    const code=event.code,v=r.session.view();
    if(up){if(allowed.has(code))r.keys.delete(code);return;}
    if(code==='Escape'){event.preventDefault();if(!event.repeat){if(v.panel)r.close();else leave(g);}return true;}
    if(v.panel){return true;} // Do not cancel stock/select default controls or leak them to the native game.
    if(code==='KeyE'){event.preventDefault();if(!event.repeat)r.open();return true;}
    if(allowed.has(code)){event.preventDefault();r.keys.add(code);return true;}
    return true;
  }
  function onSave(g,projected){
    const r=records.get(g);
    if(!r)return false;
    if(r.capturing){r.captured=projected;return true;}
    const extended=r.session.recordOwnership(projected);
    if(extended!==projected)projected.armory=extended.armory;
    return false;
  }
  function probe(g){
    const r=records.get(g);
    return r?{configureForFixture:values=>Object.assign(r.opts,values),view:()=>r.session.view(),action:()=>act(g),key:(e,up)=>onKey(g,e,up),position:()=>r.room?.position(),
      devices:()=>r.room?.stats()??{shelf:0,selected:0},audition:()=>r.audition?.stats(),leave:()=>leave(g)}:null;
  }
  return {bind,act,frame,onKey,onSave,onBlur:g=>{const r=records.get(g);r?.clear();r?.audition?.stop();},leaveForMenu:g=>{setPrompt(g,false);return leave(g,true);},probe};
}
