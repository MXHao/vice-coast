export function createAudition({table={},audio,decode}) {
  const cache=new Map();
  let epoch=0,node=null,decoded=0,played=0;
  function detach(){if(!node)return;const old=node;node=null;old.onended=null;try{old.stop();}catch{}try{old.disconnect();}catch{}}
  function stop(clear=false){++epoch;detach();if(clear)cache.clear();}
  function stats(){return {retained:cache.size,bytes:[...cache.values()].reduce((n,v)=>n+v.buffer.length*4,0),live:Number(!!node),decoded,played};}
  async function play(id) {
    stop(); const ticket=epoch, item=Object.hasOwn(table,id)?table[id]:null, a=audio();
    if(!item||!a?.enabled||!a.ctx||!a.master||![22050,44100].includes(item.rate)||!(item.frames>0&&item.frames<=90000))return false;
    try{
      if(a.ctx.state!=='running')await a.ctx.resume();
      if(ticket!==epoch||!a.enabled||a.ctx.state!=='running')return false;
      let current=cache.get(id);
      if(current?.ctx!==a.ctx){
        const raw=decode(item.f32le);
        if(raw.length!==item.frames*4)return false;
        const floats=new Float32Array(item.frames), v=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
        for(let i=0;i<floats.length;i++){const value=v.getFloat32(i*4,true);if(!Number.isFinite(value))return false;floats[i]=value;}
        const buf=a.ctx.createBuffer(1,floats.length,item.rate);
        buf.getChannelData(0).set(floats);
        current={ctx:a.ctx,buffer:buf}; decoded++;
      }
      cache.delete(id);cache.set(id,current);
      while(cache.size>2)cache.delete(cache.keys().next().value);
      while(cache.size>1&&stats().bytes>360000)cache.delete(cache.keys().next().value);
      node=a.ctx.createBufferSource();node.buffer=current.buffer;
      const mine=node;node.onended=()=>{if(node===mine){mine.disconnect();node=null;}};
      node.connect(a.master);node.start();played++;return true;
    }catch{if(ticket===epoch)detach();return false;}
  }
  return {play, stop, stats};
}
