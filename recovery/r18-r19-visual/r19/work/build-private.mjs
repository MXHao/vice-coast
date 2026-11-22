// Private review carrier; not an upgrade to the shipped roster. Original is read-only.
import fs from 'node:fs';import {resolve} from 'node:path';import {gzipSync} from 'node:zlib';import {sha,splitHtml,parse} from './reload-ast.mjs';import {createCienagaArt} from './cienaga-mesh.mjs';import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const [assetfile,target,approvedArtSha]=process.argv.slice(2);assert.ok(assetfile&&target&&target.endsWith('/cienaga-private.html'),'isolated UNREVIEWED QA output required');
const art=fs.readFileSync(assetfile),raw=JSON.parse(art);assert.equal(approvedArtSha,'c6a4fbc5e0b1265b859cf7c3aa959a8977c565b38edcc2263556245aaac6c689');assert.equal(sha(art),approvedArtSha,'exact independently cleared private studio art SHA required');createCienagaArt(raw);
const f=fs.readFileSync(new URL('../baseline/r18-manta.html',import.meta.url));assert.equal(sha(f),'06f0be89919ed05f4edeebb10e18879e07e5dd7ff8d7150a9e8051d90a612f5a');
const {app,before,after}=splitHtml(f);let s=app;const edits=[];
function edit(from,to){assert.ok(s.includes(from)&&s.indexOf(from)===s.lastIndexOf(from),'unique '+from.slice(0,80));s=s.replace(from,()=>to);edits.push([from,to]);}
const tx=read('cienaga-observer.mjs').replaceAll('export function ','function ')+read('cienaga-mesh.mjs').replaceAll('export function ','function ');
const zip=gzipSync(art,{level:9});
const cart=`(() => {\n${tx}
const bytes="${zip.toString('base64')}";
const control=createCienagaPresentation();
return Object.freeze({ownSample:true,preStage:true,makeMeshes:createCienagaMeshes,clearance:cienagaClearance,
motion:control.motion,record:control.record,afterRight:control.afterRight,load:async()=>{
 if(typeof DecompressionStream!=="function")throw Error("Local art not supported");
 const b=Uint8Array.from(atob(bytes),x=>x.charCodeAt(0));if(b.length!==${zip.length})throw Error("Art transport incomplete");
 const stream=new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip"));
 const r=stream.getReader(),dst=new Uint8Array(${art.length});let off=0;
 try{for(;;){const x=await r.read();if(x.done)break;if(x.value.length>dst.length-off)throw Error("Art budget");dst.set(x.value,off);off+=x.value.length;}}
 finally{await r.cancel().catch(()=>{});r.releaseLock();}
 if(off!==dst.length)throw Error("Incomplete artwork");
 return createCienagaArt(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(dst)));
}});})()`;
edit("||id==='p90')?cartridges[id]:null;","||id==='p90'||id==='aug')?cartridges[id]:null;");
edit("const COHORT=new Set(['p92','m416','m700','nova','ump','usp','glock18','mini14','spas12','p90']);","const COHORT=new Set(['p92','m416','m700','nova','ump','usp','glock18','mini14','spas12','p90','aug']);");
edit("const cartridges=Object.freeze({p90:","const cartridges=Object.freeze({aug:"+cart+",p90:");
edit("||mount.id==='p90')){if(s.mount===mount)cut","||mount.id==='p90'||mount.id==='aug')){if(s.mount===mount)cut");
edit("||mount.id==='p90')&&s.mount===mount)cut","||mount.id==='p90'||mount.id==='aug')&&s.mount===mount)cut");
const output=before+s+after;
parse(s);for(const [a,b] of edits.toReversed()){assert.equal(s.indexOf(b),s.lastIndexOf(b));s=s.replace(b,()=>a);}
assert.equal(s,app);assert.equal(sha(before+s+after),sha(f));fs.writeFileSync(resolve(target),output,{flag:'wx',mode:0o600});
console.log(JSON.stringify({baseline:sha(f),candidate:sha(output),bytes:Buffer.byteLength(output),art:sha(art),compressed:sha(zip),private:true,unreviewed:true,isolatedEdits:edits.length,inverseExact:true}));
