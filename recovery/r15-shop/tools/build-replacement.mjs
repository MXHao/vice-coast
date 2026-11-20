import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ALIASES,sha,splitHtml,parse,inspectProgram,query,slice,unique,ident} from '../../../tools/ast.mjs';
import {R14_CORE_ARTIFACT} from '../../../tools/r14-core-lock.mjs';
import {ROOM_STYLE} from '../src/interface.mjs';
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const modules=['catalog','session','wave1-forms','room','audition','interface','runtime'];
const nativeModels='09dfc12d27740e402b2b7304dcdf2ad42487ce1c723f76594e1a3d772242ec9e';
const name='__vcR15ArmoryReplacement';
const localRead=p=>readFileSync(resolve(here,p),'utf8');
const any=(scope,predicate,label)=>unique(query(scope,predicate),label).node;
const exactly=(app,scope,type,want)=>any(scope,n=>n.type===type&&slice(app,n)===want,want);
const locks={Scene:['Da','isScene'],PerspectiveCamera:['tA','isPerspectiveCamera'],Box3:['ii','isBox3'],
  HemisphereLight:['ka','isHemisphereLight'],DirectionalLight:['Po','isDirectionalLight'],PointLight:['Wa','isPointLight']};

function importsAway(src) {
  assert.ok(!/<\/script/i.test(src));
  const allowed=new Set(modules.map(n=>'./'+n+'.mjs'));
  const changes=[];
  for(const v of parse(src,'module').body){
    if(v.type==='ImportDeclaration'){assert.ok(allowed.has(v.source.value));changes.push([v.start,v.end]);}
    if(v.type.startsWith('Export')){assert.equal(v.type,'ExportNamedDeclaration');assert.ok(v.declaration);changes.push([v.start,v.declaration.start]);}
  }
  return changes.toReversed().reduce((s,[a,b])=>s.slice(0,a)+s.slice(b),src);
}

export function compile(base,{probe=false}={}){
  assert.equal(base.byteLength,R14_CORE_ARTIFACT.bytes);assert.equal(sha(base),R14_CORE_ARTIFACT.sha256);
  const {before,app,after}=splitHtml(base);assert.equal(sha(app),R14_CORE_ARTIFACT.app);
  const p=inspectProgram(app,false),{tree,inner,ctor,mount,frame,method,declarations,game}=p;
  assert.equal(query(tree,n=>ident(n,name)).length,0);
  const map={...ALIASES,...locks};
  for(const [k,[symbol,signature]] of Object.entries(locks)){
    const v=unique(declarations.get(symbol),k);
    assert.equal(v.init.type,'ClassExpression');assert.ok(slice(app,v.init).includes(signature));
  }
  assert.equal(sha(localRead('src/wave1-forms.mjs')),nativeModels);
  const table={}; // No audio payload is bundled by the public recovery capsule.
  const sources=modules.map(n=>[n,localRead('src/'+n+'.mjs')]);
  const shim=sources.map(([k,v])=>'\n// armory '+k+'\n'+importsAway(v)).join('\n');
  const bound='{'+Object.entries(map).map(([k,[v]])=>k+':'+v).join(',')+'}';
  const edit=[],add=(id,at,text)=>edit.push({id,at,text}),around=(id,node,open,close)=>{add(id+'-left',node.start,open);add(id+'-right',node.end,close);};
  add('detached-armory',inner.start+1,'\nconst '+name+'=(()=>{'+shim+'\nreturn createArmoryRuntime('+JSON.stringify(table)+');\n})();\n');
  exactly(app,ctor,'VariableDeclaration','let c=pd();');
  add('native-bind',mount.node.start,name+'.bind(this,c,{THREE:'+bound+',doc:document,storage:localStorage,playing:()=>typeof IA!=="undefined"&&!IA&&!!document.body?.classList.contains("playing"),floor:(x,z)=>vs(x,z)??.025,openMenu:k=>XA(k)}),');
  const sav=exactly(app,method('save'),'CallExpression','localStorage.setItem(Rw,JSON.stringify(n))');
  const originalTry=any(method('save'),n=>n.type==='TryStatement'&&n.start<sav.start&&n.end>sav.end,'native storage commit');
  add('native-save-boundary',originalTry.start,';if('+name+'.onSave(this,n))return;');
  const live=exactly(app,frame,'IfStatement','if(!this.live)return;');
  add('exclusive-room-frame',live.end,'if('+name+'.frame(this,t)){this.last=t;requestAnimationFrame(this.frame);return;}');
  const sceneAction=any(inner,n=>n.type==='CallExpression'&&slice(app,n)==='ne.story.interact()','native story keyboard priority');
  const touchAction=any(inner,n=>n.type==='ChainExpression'&&slice(app,n)==='ne?.story.interact()','native story touch priority');
  for(const [label,n] of [['native-E',sceneAction],['native-touch-interact',touchAction]])around(label,n,'(','||'+name+'.act(ne))');
  const route=exactly(app,inner,'IfStatement','if(__vcR14Touch.keydown(A))return;');
  add('native-keydown-after-touch-editor',route.end,'if('+name+'.onKey(ne,A))return;');
  const up=any(inner,n=>n.type==='CallExpression'&&n.arguments?.[0]?.value==='keyup'&&slice(app,n).startsWith('addEventListener("keyup",A=>'),'global native keyup');
  add('native-keyup',up.arguments[1].body.start+1,name+'.onKey(ne,A,true);');
  const blurCall=exactly(app,inner,'CallExpression','addEventListener("blur",()=>ne?.clearInput())');
  const blur=blurCall.arguments[1].body;assert.equal(blur.type,'ChainExpression');
  around('native-blur',blur,'('+name+'.onBlur(ne),',')');
  const menu=any(inner,n=>n.type==='FunctionDeclaration'&&ident(n.id,'XA'),'native pause and editors');
  add('native-menu-priority',menu.body.start+1,name+'.leaveForMenu(ne);');
  if(probe)add('offline-probe',game.node.body.end-1,'__vcArmoryProbe(){return '+name+'.probe(this)}');
  edit.sort((a,b)=>a.at-b.at);
  let cursor=0,formed='';const undo=[];
  for(const a of edit){assert.ok(a.at>=cursor);formed+=app.slice(cursor,a.at);const start=formed.length;formed+=a.text;undo.push({id:a.id,start,end:formed.length,sha256:sha(a.text)});cursor=a.at;}
  formed+=app.slice(cursor);
  parse(formed);
  const restored=undo.toReversed().reduce((s,v)=>{assert.equal(sha(s.slice(v.start,v.end)),v.sha256);return s.slice(0,v.start)+s.slice(v.end);},formed);
  assert.equal(restored,app);
  const style='<style id="vc-armory-replacement-style">'+ROOM_STYLE+'</style>';
  const split=before.indexOf('</head>');assert.ok(split>0);assert.equal(before.lastIndexOf('</head>'),split);
  const changedHead=before.slice(0,split)+style+before.slice(split);
  assert.ok(Buffer.from(changedHead.slice(0,split)+changedHead.slice(split+style.length)+restored+after).equals(base));
  return {html:Buffer.from(changedHead+formed+after),manifest:{basis:R14_CORE_ARTIFACT,kind:'R15 public-only showroom replacement, not original R15 source',scoped:undo.map(o=>o.id),probe,modules:Object.fromEntries(sources.map(([n,c])=>[n,sha(c)]))}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const flags=new Set(process.argv.slice(2));assert.ok([...flags].every(k=>k==='--probe'));
  const base=readFileSync(resolve(here,'../../out/r14-core/index.html'));
  const out=compile(base,{probe:flags.has('--probe')});
  const tag='source-only'+(out.manifest.probe?'-probe':'');
  mkdirSync(resolve(here,'out'),{recursive:true});
  writeFileSync(resolve(here,'out',tag+'.html'),out.html,{mode:0o600});
  const meta={...out.manifest,artifactSHA256:sha(out.html),bytes:out.html.length};
  writeFileSync(resolve(here,'out',tag+'.json'),JSON.stringify(meta,null,2)+'\n',{mode:0o600});
  console.log(tag,meta.artifactSHA256,meta.scoped.length);
}
