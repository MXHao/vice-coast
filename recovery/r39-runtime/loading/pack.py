#!/usr/bin/env python3
"""Repackage exact R38 transport (or current merged carrier), without editing inputs."""
from __future__ import annotations
from pathlib import Path
import argparse, base64, gzip, hashlib, json, re, sys
D=Path(__file__).resolve().parent
OLD_INDEX="9b95774afe01af62e414c5792345a1820a85eca191ea033ed104d7bf40dac52b"
OLD_ASSETS=("5d65b2ded64d72b7c196308dbda730be027b384d22fa2ea0409d68a2f3adbdcd","48b194547dc387e2fc8e32b3dd5a52f4945f97bf02a056e36b3ade0b7a4b7c2b")
OLD_HTML="774c43549b4ea63f5ff1f6a37d2efcc1e638217bff9641ef9b9feeb15e384c27"
NOTICES="d26e53bfccc4d9f1a2b85685cd66ad92c22253e1090795fb71d03af036e81e16"
def sha(data): return hashlib.sha256(data).hexdigest()
def sri(data): return "sha256-"+base64.b64encode(hashlib.sha256(data).digest()).decode()
def ck(v,msg):
 if not v:raise ValueError(msg)
def once(s,a,b,label):
 ck(s.count(a)==1,"missing/ambiguous anchor "+label)
 return s.replace(a,b,1)
ref=re.compile(rb'__vcStaticR38Art_([01])\[(\d+)\]')
tags_pattern=re.compile(rb'<script src="\./(assets/r38-art-([01])-([a-f0-9]{64})\.js)" integrity="(sha256-[A-Za-z0-9+/]{43}=)"></script>\n')
old_sentinel=b'if(typeof __vcStaticR38Art_0==="undefined"||__vcStaticR38Art_0.length!==27||typeof __vcStaticR38Art_1==="undefined"||__vcStaticR38Art_1.length!==28)throw new Error("Static game art could not be verified or loaded.");\n'
wrap=b'(function(){"use strict";const gate=window.__vcR39Boot;if(!gate.claimBoot(document.currentScript))return;try{\n'
endwrap=b'\n}catch(error){gate.fatal(error);return;}gate.ready();})();\n'
# No leading "use strict" around the original application, whose body was classic/sloppy.
wrap=wrap.replace(b'"use strict";',b'')
def read_base(root):
 idx=(root/'index.html').read_bytes()
 ck(len(idx)==21740394 and sha(idx)==OLD_INDEX,"R38 index digest")
 matches=list(tags_pattern.finditer(idx)); ck(len(matches)==2,"R38 tag count")
 groups=[]
 for i,m in enumerate(matches):
  n,g,he,s=m.groups(); data=(root/n.decode()).read_bytes()
  ck(int(g)==i and he.decode()==OLD_ASSETS[i] and sha(data)==OLD_ASSETS[i] and sri(data).encode()==s and len(data)==(21647736,21935928)[i],"R38 art bytes/SRI")
  prefix=b'const __vcStaticR38Art_'+g+b'=Object.freeze([\n'
  suffix=b'\n]);\n'
  ck(data.startswith(prefix) and data.endswith(suffix),"carrier JS exact prefix and suffix")
  lits=data[len(prefix):-len(suffix)].split(b',\n')
  ck(len(lits)==(27,28)[i] and all(re.fullmatch(rb'''(["'])H4sI[A-Za-z0-9+/]+={0,2}\1''',a) for a in lits),"asset transport syntax")
  groups.append(lits)
 return idx,groups

def split_carrier(idx):
 tags=list(tags_pattern.finditer(idx));ck(len(tags)==2,"must be a merged R38 public carrier with two unchanged original script tags")
 for n,m in enumerate(tags):ck(int(m[2])==n and m[3].decode()==OLD_ASSETS[n],"original tag order/id")
 opening=b''.join(m[0] for m in tags)+b'<script>'+old_sentinel
 ck(idx.count(opening)==1,"old script/guards exact order")
 head,tail=idx.split(opening)
 app,after=tail.split(b'</script>',1)
 ck(not re.search(rb'</?script(?=[\s>])',app,re.I),"embedded HTML script delimiter")
 ck(not re.search(rb'<base\b',head,re.I) and head.count(b'<style>')==1,"expected single inline CSS; no base override")
 notice=re.search(rb'<script type="text/plain" id="third-party-notices">[\s\S]+?</script>',after)
 ck(notice and sha(notice[0])==NOTICES,"notices unchanged")
 return head,app,after

def art_patch(app,groups):
 # Only R38 references, constrained to the existing independent art decoder closures.
 # Other optional feature branches are untouched, including prior raw sound/controller data.
 hits=list(ref.finditer(app));seen=set();repls=[]
 for j,m in enumerate(hits):
  g,k=map(int,m.groups());ck(0<=g<len(groups) and 0<=k<len(groups[g]) and (g,k) not in seen,"old asset reference used exactly once")
  seen.add((g,k))
  anchor=app[max(0,m.start()-32):m.start()]
  code=f'()=>window.__vcR39Assets.load("{g}-{k}")'.encode()
  if anchor.endswith(b'const bytes='):
   next_m=hits[j+1].start() if j+1<len(hits) else len(app)
   # Span capped to same native art decoder; prevents matching unrelated atob calls.
   local=app[m.end():min(next_m,m.end()+2900)]
   mk=re.search(rb'\bload:async\s*\(\)\s*=>\s*\{[\s\S]{0,650}?\batob\(bytes\)',local)
   ck(mk, f"closure decode lane {g}-{k}")
   idx=m.end()+mk.end()-len(b'atob(bytes)')
   repls.append((idx,idx+len(b'atob(bytes)'),b'atob(await bytes())'))
  elif anchor.endswith(b'"content":'):
   p=max(0,m.start()-3000);local=app[p:m.start()]
   matches=list(re.finditer(rb'const inflate=async p=>\{[\s\S]{0,300}\bdecode\(p\.content\)',local))
   ck(matches, f"legacy inflate decode lane {g}-{k}")
   idx=p+matches[-1].end()-len(b'decode(p.content)')
   repls.append((idx,idx+len(b'decode(p.content)'),b'decode(await p.content())'))
  else: raise ValueError(f"unexpected local first-view reference placement {g}-{k}")
  repls.append((m.start(),m.end(),code))
 ck(len(seen)==55 and len(repls)==110,"expected 55 references and 55 paired async decoding seams")
 # Realm states unchanged until async transport is explicitly needed; restore transport
 # failures only on manual V reattempt, never automatic retries in the play loop.
 scope_begin=app.find(b'function createSharedFirstView(')
 scope_end=app.find(b'// Standalone first-view integration seam.',scope_begin)
 ck(scope_begin>=0 and scope_end>scope_begin,"first-view ownership seam")
 scope=app[scope_begin:scope_end]
 scope=once(scope,b'assetFor.set(id,{records:null,goal:null,failed:false,pending:null});',b'assetFor.set(id,{records:null,goal:null,failed:false,pending:null,retryable:false});',"cache initialization")
 scope=once(scope,b'}).catch(()=>{a.failed=true;return null;});',b'}).catch(error=>{a.failed=true;a.retryable=error?.vcR39Transport===true;return null;}).finally(()=>{a.pending=null;});',"network failure handling")
 scope=once(scope,b'if(q.f.reload!==0||assetFor.get(q.f.id)?.failed)return false;',b"""const previousArt=assetFor.get(q.f.id);
   if(q.f.reload!==0||(previousArt?.failed&&!previousArt.retryable))return false;
   if(previousArt?.retryable){previousArt.failed=false;previousArt.retryable=false;}""","manual retry only")
 scope=once(scope,b'||a?.failed||(rejected',b'||(a?.failed&&!a.retryable)||(rejected',"allow visible retry cue")
 scope=once(scope,b"if(m){\n       const p=s.selected,last=s.helpStamp;", """if(a?.retryable) text='第一人称资源未加载 · V 重试';
     else if(m){
       const p=s.selected,last=s.helpStamp;""".encode(),"retry cue")
 repls.append((scope_begin,scope_end,scope))
 parts=[];pos=0
 for a,b,r in sorted(repls):
  ck(a>=pos,"overlapping patch substitutions");parts.extend([app[pos:a],r]);pos=b
 parts.append(app[pos:]);new=b''.join(parts);ck(not ref.search(new),"no eager large art references")
 return new

def build(base, merged):
 idx,groups=read_base(base)
 # Prove the upstream resolved source regardless of expansion presence.
 h,j,z=split_carrier(idx)
 raw=ref.sub(lambda m:groups[int(m[1])][int(m[2])],j)
 ck(sha(h+b'<script>'+raw+b'</script>'+z)==OLD_HTML,"pin exact original R38")
 idx=merged.read_bytes() if merged else idx
 head,app,after=split_carrier(idx)
 modified=art_patch(app,groups)
 ck(not re.search(rb'</script\b',modified,re.I),"malformed game script")
 style=re.search(rb'<style>([\s\S]*?)</style>',head)
 css=style[1]
 ck(all(re.fullmatch(rb'''\s*["']?data:[^)]*''',m[1]) for m in re.finditer(rb'url\(([^)]*)\)',css)), "moved CSS may only reference data URLs")
 files={}
 def add(label,data,ext,kind):
  p=f'assets/{label}-{sha(data)}.{ext}'
  ck(len(data)<25*1024*1024,"static carrier file <=25MiB")
  if p in files:ck(files[p]==data,"digest collision")
  files[p]=data
  return {'p':p,'bytes':len(data),'sha':sha(data),'sri':sri(data),'mime':kind}
 js=add('game',wrap+modified+endwrap,'js','js')
 sc=add('layout',css,'css','css')
 art={f'{g}-{k}':add('view',raw[1:-1],'txt','art') for g,rows in enumerate(groups) for k,raw in enumerate(rows)}
 manifest={'game':js,'style':sc,'views':art}
 boot=(D/'boot.js').read_bytes()
 boot=once(boot,b'__R39_MANIFEST__',json.dumps(manifest,separators=(',',':')).encode(),"manifest")
 ck(not re.search(rb'</script\b',boot,re.I),"malformed bootstrap script")
 ui=(D/'shell.html').read_bytes(); css0=(D/'shell.css').read_bytes()
 shell=head[:style.start()]+b'<style id="vc-load-css">'+css0+b'</style><meta id="vc-core-style-slot">'+head[style.end():]
 shell=once(shell,b'<body>',b'<body data-vc-loading>'+ui,"first paint body shell")
 shell+=b'<script>\n'+boot+b'\n</script>'+after
 ck(len(shell)<=70000,"boot HTML must remain small")
 files['index.html']=shell
 out_files={p:{'bytes':len(b),'sha256':sha(b),'gzip6':len(gzip.compress(b,compresslevel=6,mtime=0))} for p,b in sorted(files.items())}
 mandatory={'index.html',js['p'],sc['p']}
 report={'baseRelease':'R38','baseAcceptedSource':OLD_HTML,'inputCarrierIndexSHA256':sha(idx),'modifiedAppSHA256':sha(modified),'noticesSHA256':NOTICES,'critical':sorted(mandatory),'criticalBytes':sum(out_files[p]['bytes'] for p in mandatory),'criticalGzip6Bytes':sum(out_files[p]['gzip6'] for p in mandatory),'allBytes':sum(i['bytes'] for i in out_files.values()),'allGzip6Bytes':sum(i['gzip6'] for i in out_files.values()),'files':out_files,'viewTransportKeys':len(art),'viewUniqueFiles':len({v['p'] for v in art.values()}),'viewDecodedBytesUnchanged': all(files[v['p']]==groups[int(g)][int(k)][1:-1] for key,v in art.items() for g,k in [key.split('-')]),'progressSemantics':'Transport decoded bytes; CSS/JS verification and execution are explicitly separate and no game/GPU numeric percent.'}
 return files,report

def main():
 a=argparse.ArgumentParser();a.add_argument('--base',type=Path,required=True);a.add_argument('--out',type=Path,required=True);a.add_argument('--merged-index',type=Path)
 args=a.parse_args()
 if args.out.exists(): raise ValueError('pick a new output folder')
 files,report=build(args.base,args.merged_index)
 dist=args.out/'dist';(dist/'assets').mkdir(parents=True)
 for p,b in files.items(): (dist/p).write_bytes(b)
 (args.out/'loading-receipt.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k!='files'},indent=2,ensure_ascii=False))
if __name__=='__main__':main()
