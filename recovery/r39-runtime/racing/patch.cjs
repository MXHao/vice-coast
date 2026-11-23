"use strict";
const A=require("node:assert/strict"),fs=require("node:fs"),P=require("node:path"),vm=require("node:vm");
const cwd=__dirname,load=f=>fs.readFileSync(P.join(cwd,f),"utf8").trimEnd();
function once(s,mark,out){
  const i=s.indexOf(mark);A.ok(i!==-1&&i===s.lastIndexOf(mark),"unique reviewed race seam: "+mark.slice(0,120));
  return s.slice(0,i)+out(mark)+s.slice(i+mark.length);
}
function patch(source){
  A.ok(!source.includes("__vcR39RaceUI"),"already patched");
  const at=source.indexOf('<script>if(typeof __vcStaticR38'),end=source.indexOf('</script>',at);
  A.ok(at>0&&end>at,"known split R38 carrier");
  let pre=source.slice(0,at+8),js=source.slice(at+8,end),post=source.slice(end);
  pre=once(pre,'</head>',s=>'<style id="vc-r39-circuit-style">\n'+load("styles.css")+'\n</style>\n'+s);
  const roam=/<button\s+id="roam"[^>]*>[^]*?<\/button>/g;
  const buttons=[...pre.matchAll(roam)];A.equal(buttons.length,1);
  pre=once(pre,buttons[0][0],m=>m+'\n        <button id="vcRace" class="secondary" type="button" aria-label="环线竞速，两圈，四名对手"><span aria-hidden="true">⚑</span>&nbsp;环线竞速</button>'.replace('<span aria-hidden="true">⚑</span>&nbsp;环线竞速','<i aria-hidden="true">⚑</i><span>环线竞速</span>'));
  js=once(js,'var G0=class{constructor(',s=>load("course.js")+"\n"+load("runtime.js")+"\n"+load("ui.js")+"\n"+s);
  js=once(js,"save(){let t=this.car||this.lastVehicle||this.hero",s=>s.replace("save(){","save(){if(__vcR39Race.savingBlocked(this))return;"));
  js=once(js,'frame(t){if(!this.live)return;',s=>s+'if(__vcR39Race.active(this))return __vcR39Race.frame(this,t,__vcR39RaceUI);');
  js=once(js,'t&&this.car!==this.cop&&(this.heat=Math.min(3,this.heat+1)',s=>s.replace('t&&','t&&!__vcR39Race.active(this)&&'));
  js=once(js,'toggleVehicle(){if(__vcR16FootJump.air(this))return;',s=>s.replace('toggleVehicle(){','toggleVehicle(){if(__vcR39Race.active(this))return;'));
  js=once(js,'function Hs(A){',s=>s+'if(__vcR39Race.active(ne))return __vcR39RaceUI.paint(ne);');
  js=once(js,'function XA(A,t=""){',s=>s+'if(__vcR39RaceUI.open(A))return;');
  js=once(js,'function wi(A=!1){',s=>s+'if(__vcR39RaceUI.resume())return;');
  js=once(js,'Wt("panel").onclick=A=>{',s=>s+'if(__vcR39RaceUI.click(A))return;');
  js=once(js,'__vcR14Graphics.mountTitle(Wt,XA);',s=>'Wt("vcRace").onclick=()=>__vcR39RaceUI.start();'+s);
  js=once(js,'addEventListener("keydown",A=>{if(__vcR14Touch.keydown(A))return;',s=>s.replace('{if(','{if(__vcR39Race.onKey(ne,A,IA,__vcR39RaceUI))return;if('));
  js=once(js,'addEventListener("keyup",A=>{if(A.code==="Space")__vcR16FootJump.release(ne);',s=>s.replace('{if(','{if(__vcR39Race.active(ne)){ne.keys.delete(kw[A.code]||A.code);return;}if('));
  js=once(js,'Ri.bindTap(Wt("interact"),()=>(ne?.story.interact()||__vcR15ArmoryReplacement.act(ne)));',s=>s.replace('()=>(ne?', '()=>!__vcR39Race.active(ne)&&(ne?'));
  new vm.Script(js,{filename:"r39-race-inline.js"});
  return pre+js+post;
}
if(require.main===module){
  const [input,output]=process.argv.slice(2);A.ok(input&&output&&P.resolve(input)!==P.resolve(output),"INPUT INDEX and NEW OUTPUT INDEX required");
  fs.mkdirSync(P.dirname(output),{recursive:true});fs.writeFileSync(output,patch(fs.readFileSync(input,"utf8")),{flag:"wx",mode:0o644});
}
module.exports={patch};
