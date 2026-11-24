// Optional local asset. It is absent from title-startup progress, identical
// route policy as the base package, and must pass browser SRI before use.
let localHero;
function loadR44Hero(){
 if(localHero)return localHero;
 localHero=new Promise((resolve,reject)=>{
   const el=document.createElement('script');
   const fail=()=>finish(Error('新男主资源未读取或校验失败'));
   const finish=error=>{
     clearTimeout(timer);el.remove();
     if(error)reject(error);
     else if(typeof globalThis.R44HeroAsset?.create==='function')resolve(globalThis.R44HeroAsset);
     else reject(Error('新男主资源未注册'));
   };
   const timer=setTimeout(fail,20000);
   el.onload=()=>finish();el.onerror=fail;
   el.async=true;el.crossOrigin='anonymous';el.integrity=M.hero.sri;el.src=assetURL(M.hero);
   document.head.appendChild(el);
 });
 return localHero;
}
