(()=>{
'use strict';
const M=__R39_MANIFEST__;
const by=id=>document.getElementById(id);
const panel=by('vc-load'),status=by('vc-lp-status'),meter=by('vc-lp-meter'),bytesUI=by('vc-lp-bytes'),retry=by('vc-lp-retry');
const styleSlot=by('vc-core-style-slot');
const total=M.game.bytes+M.style.bytes;
const enc=n=>new Intl.NumberFormat('zh-CN',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n/1048576);
const ui=(message,loaded=null)=>{
 if(status.textContent!==message)status.textContent=message;
 if(loaded===null){meter.removeAttribute('value');bytesUI.textContent='';}
 else {meter.max=total;meter.value=loaded;bytesUI.textContent=enc(loaded)+' / '+enc(total)+' MiB · 已读取';}
};
const secure=typeof window.fetch==='function'&&typeof window.crypto?.subtle?.digest==='function'&&typeof window.ReadableStream==='function';
const assetURL=spec=>{
 const url=new URL('./'+spec.p,document.baseURI);
 if(url.origin!==window.location.origin||!/^https?:$/.test(url.protocol))throw Error('需要通过试玩网页打开游戏');
 return url.href;
};
function hex(bytes){return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
function kindMatches(type,kind){
 return kind==='js'?/(?:javascript|ecmascript)/i.test(type):
  kind==='css'?/^text\/css(?:;|$)/i.test(type):/^(?:text\/plain|application\/octet-stream)(?:;|$)/i.test(type);
}
async function transfer(spec,{parent=null,progress=null,fresh=false,nativeIntegrity=false}={}){
 const control=new AbortController();
 let timer,timed=false,rd;
 const fromParent=()=>control.abort();
 const tick=()=>{clearTimeout(timer);timer=setTimeout(()=>{timed=true;control.abort();},45000);};
 if(parent?.aborted)throw Error('已中止读取');
 parent?.addEventListener('abort',fromParent,{once:true});
 try{
  tick();
  const response=await fetch(assetURL(spec),{signal:control.signal,credentials:'same-origin',redirect:'error',cache:fresh?'reload':'default',...(nativeIntegrity?{integrity:spec.sri}:{})});
  if(!response.ok)throw Error('资源暂不可用（HTTP '+response.status+'）');
  if(!kindMatches(response.headers.get('content-type')||'',spec.mime))throw Error('资源响应类型不符');
  if(!response.body?.getReader)throw Error('当前浏览器不支持流式读取');
  const buffer=new Uint8Array(spec.bytes);
  let pos=0;
  rd=response.body.getReader();
  for(;;){
   const {done,value}=await rd.read();if(done)break;
   if(!(value?.byteLength>0))continue;
   tick();
   if(value.byteLength>spec.bytes-pos)throw Error('资源长度超出预期');
   buffer.set(value,pos);pos+=value.byteLength;
   if(progress)progress(pos);
  }
  clearTimeout(timer);
  if(pos!==spec.bytes)throw Error('资源读取不完整');
  if(hex(await window.crypto.subtle.digest('SHA-256',buffer))!==spec.sha)throw Error('资源完整性校验失败');
  return buffer;
 }catch(e){control.abort();if(timed)throw Error('连续 45 秒未收到资源，请检查网络');throw e;}
 finally{clearTimeout(timer);parent?.removeEventListener('abort',fromParent);try{rd?.releaseLock();}catch{}}
}
const inflight=new Map(),retried=new Set();
const ascii=new TextDecoder('utf-8',{fatal:true});
Object.defineProperty(window,'__vcR39Assets',{value:Object.freeze({
 load(key){
  if(!Object.prototype.hasOwnProperty.call(M.views,key))return Promise.reject(Error('没有对应的第一人称资源'));
  if(inflight.has(key))return inflight.get(key);
  const promise=transfer(M.views[key],{fresh:retried.has(key),nativeIntegrity:true}).then(data=>ascii.decode(data)).catch(error=>{
   retried.add(key);
   const wrapped=new Error('第一人称资源未加载',{cause:error});wrapped.vcR39Transport=true;throw wrapped;
  }).finally(()=>inflight.delete(key));
  inflight.set(key,promise);return promise;
 }
})});
let state=null,noRetry=false,attemptNumber=0;
function fail(a,e,reload=false){
 if(state!==a||a.done)return;
 a.done=true;a.controller.abort();noRetry=reload||a.claimed;
 for(const el of a.cleanup)el.remove();
 const reason=e?.message||'网络或浏览器初始化异常';
 ui((noRetry?'游戏初始化失败：':'游戏资源未加载：')+reason+(noRetry?'。请刷新页面重试。':'。可以重新加载。'),a.retained);
 panel.setAttribute('aria-busy','false');retry.hidden=false;retry.textContent=noRetry?'刷新页面':'重新加载';
}
Object.defineProperty(window,'__vcR39Boot',{value:Object.freeze({
 claimBoot(script){const a=state;if(!a||a.done||a.claimed||script?.getAttribute('data-vc-r39-boot')!==a.token)return false;a.claimed=true;return true;},
 ready(){const a=state;if(!a||a.done||!a.claimed)return;a.done=true;
  document.body.removeAttribute('data-vc-loading');panel.hidden=true;panel.setAttribute('aria-busy','false');},
 fatal(error){if(state)fail(state,error,true);}
})});
function nativeStyle(a){
 return new Promise((resolve,reject)=>{
  const el=document.createElement('link');el.rel='stylesheet';el.crossOrigin='anonymous';el.integrity=M.style.sri;el.href=assetURL(M.style);a.cleanup.push(el);
  const finish=e=>{clearTimeout(timer);a.controller.signal.removeEventListener('abort',abort);e?reject(e):resolve(el);};
  const abort=()=>finish(Error('已中止读取'));
  const timer=setTimeout(()=>finish(Error('样式读取超时')),180000);
  a.controller.signal.addEventListener('abort',abort,{once:true});
  el.onload=()=>finish();el.onerror=()=>finish(Error('样式资源不可用或完整性校验失败'));
  document.head.insertBefore(el,styleSlot);
 });
}
function addScript(a,src,integrity){
 return new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.async=true;
  if(integrity){s.crossOrigin='anonymous';s.integrity=integrity;}
  s.setAttribute('data-vc-r39-boot',a.token);s.src=src;a.cleanup.push(s);
  const finish=e=>{clearTimeout(timer);a.controller.signal.removeEventListener('abort',abort);e?reject(e):resolve();};
  const abort=()=>finish(Error('已中止读取'));
  const timer=setTimeout(()=>finish(Error('游戏脚本读取超时')),180000);
  a.controller.signal.addEventListener('abort',abort,{once:true});
  s.onload=()=>{if(a.done)return finish();if(!a.claimed)return finish(Error('游戏脚本未能开始运行'));finish(Error('游戏脚本未完成初始化'));};
  s.onerror=()=>finish(Error('游戏脚本被浏览器阻止或完整性校验失败'));
  document.head.appendChild(s);
 });
}
async function boot(){
 if(state&&!state.done)return;
 if(noRetry){window.location.reload();return;}
 const a={controller:new AbortController(),token:String(attemptNumber+1),done:false,claimed:false,retained:null,cleanup:[]};
 state=a;const fresh=attemptNumber++>0;
 panel.setAttribute('aria-busy','true');retry.hidden=true;
 try{
  if(!secure){
   ui('浏览器正在读取并验证游戏资源…');
   await nativeStyle(a);
   ui('启动游戏菜单…');
   await addScript(a,assetURL(M.game),M.game.sri);
   return;
  }
  let gameBytes=0,styleBytes=0;
  const observe=()=>{
   a.retained=gameBytes+styleBytes;
   const message=a.retained===total?'读取完成，正在核验游戏资源…':'正在读取游戏资源…';
   ui(message,a.retained);
  };
  observe();
  let [game,style]=await Promise.all([
   transfer(M.game,{parent:a.controller.signal,fresh,progress:n=>{gameBytes=n;observe();}}),
   transfer(M.style,{parent:a.controller.signal,fresh,progress:n=>{styleBytes=n;observe();}})
  ]);
  const sheet=document.createElement('style');sheet.textContent=ascii.decode(style);style=null;document.head.insertBefore(sheet,styleSlot);a.cleanup.push(sheet);
  ui('核验完成，正在初始化游戏菜单…',total);
  if(typeof URL.createObjectURL==='function'){
   const blob=URL.createObjectURL(new Blob([game],{type:'text/javascript'}));game=null;
   try{await addScript(a,blob);return;}
   catch(error){if(a.done||a.claimed)throw error;}
   finally{URL.revokeObjectURL(blob);}
  }
  // Some CSP implementations disallow blob: while allowing same-origin classic scripts.
  // SRI protects this no-double-execution fallback; report this second stage without a byte count.
  ui('切换到浏览器原生验证并读取游戏脚本…');
  await addScript(a,assetURL(M.game),M.game.sri);
 }catch(e){fail(a,e);}
}
retry.addEventListener('click',()=>{void boot();});
void boot();
})();
