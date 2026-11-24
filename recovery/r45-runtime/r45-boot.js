// Not part of menu startup or the standing R44 hero path. Local-only SRI loader.
let localCrouch;
function loadR45Crouch(){
 if(localCrouch)return localCrouch;
 localCrouch=new Promise((resolve,reject)=>{
   const el=document.createElement('script');let done=false;
   function finish(error){
     if(done)return;done=true;clearTimeout(timer);el.onload=el.onerror=null;el.remove();
     if(error)reject(error);
     else if(typeof globalThis.R45CrouchAsset?.bind==='function')resolve(globalThis.R45CrouchAsset);
     else reject(Error('蹲姿资源未注册'));
   }
   const fail=()=>finish(Error('蹲姿资源未读取或校验失败'));
   const timer=setTimeout(fail,20000);
   el.onload=()=>finish();el.onerror=fail;el.async=true;
   el.crossOrigin='anonymous';el.integrity=M.crouch.sri;el.src=assetURL(M.crouch);
   document.head.appendChild(el);
 });
 return localCrouch;
}
