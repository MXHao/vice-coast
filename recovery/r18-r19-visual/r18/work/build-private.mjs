// Private review carrier; not an upgrade to the shipped roster. Original is read-only.
import fs from 'node:fs';import {resolve} from 'node:path';import {gzipSync} from 'node:zlib';import {sha,splitHtml,parse} from '../kit/tools/reload-ast.mjs';import {createMantaArt} from './manta-mesh.mjs';import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const [assetfile,target,approvedArtSha]=process.argv.slice(2);assert.ok(assetfile&&target&&target.endsWith('/manta-unreviewed.html'),'isolated UNREVIEWED QA output required');
const art=fs.readFileSync(assetfile),raw=JSON.parse(art);assert.equal(sha(art),approvedArtSha,'exact independently cleared private studio art SHA required');createMantaArt(raw);
const f=fs.readFileSync(new URL('../baseline/shared-inline-nine.html',import.meta.url));assert.equal(sha(f),'87caa135670470900e8bc9b20f1f3fd21141b960f237db7240e07c17f1cd2843');
const {app,before,after}=splitHtml(f);let s=app;const edits=[];
function edit(from,to){assert.ok(s.includes(from)&&s.indexOf(from)===s.lastIndexOf(from),'unique '+from.slice(0,80));s=s.replace(from,()=>to);edits.push([from,to]);}
const tx=read('manta-observer.mjs').replaceAll('export function ','function ')+read('manta-mesh.mjs').replaceAll('export function ','function ');
const zip=gzipSync(art,{level:9});
const cart=`(() => {\n${tx}
const bytes="${zip.toString('base64')}";
const control=createMantaPresentation();
return Object.freeze({ownSample:true,preStage:true,visualAnchor:"pulse",makeMeshes:createMantaMeshes,clearance:mantaClearance,
motion:control.motion,record:control.record,load:async()=>{
 if(typeof DecompressionStream!=="function")throw Error("Local art not supported");
 const b=Uint8Array.from(atob(bytes),x=>x.charCodeAt(0));if(b.length!==${zip.length})throw Error("Art transport incomplete");
 const stream=new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip"));
 const r=stream.getReader(),dst=new Uint8Array(${art.length});let off=0;
 try{for(;;){const x=await r.read();if(x.done)break;if(x.value.length>dst.length-off)throw Error("Art budget");dst.set(x.value,off);off+=x.value.length;}}
 finally{await r.cancel().catch(()=>{});r.releaseLock();}
 if(off!==dst.length)throw Error("Incomplete artwork");
 return createMantaArt(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(dst)));
}});})()`;
edit("||id==='spas12')?cartridges[id]:null;","||id==='spas12'||id==='p90')?cartridges[id]:null;");
edit("const COHORT=new Set(['p92','m416','m700','nova','ump','usp','glock18','mini14','spas12']);","const COHORT=new Set(['p92','m416','m700','nova','ump','usp','glock18','mini14','spas12','p90']);");
edit("const cartridges=Object.freeze({p92:","const cartridges=Object.freeze({p90:"+cart+",p92:");
edit("||mount.id==='spas12')){if(s.mount===mount)cut","||mount.id==='spas12'||mount.id==='p90')){if(s.mount===mount)cut");
edit("||mount.id==='spas12')&&s.mount===mount)cut","||mount.id==='spas12'||mount.id==='p90')&&s.mount===mount)cut");
const output=before+s+after;
parse(s);for(const [a,b] of edits.toReversed()){assert.equal(s.indexOf(b),s.lastIndexOf(b));s=s.replace(b,()=>a);}
assert.equal(s,app);assert.equal(sha(before+s+after),sha(f));fs.writeFileSync(resolve(target),output);
console.log(JSON.stringify({baseline:sha(f),candidate:sha(output),bytes:Buffer.byteLength(output),art:sha(art),compressed:sha(zip),private:true,unreviewed:true,isolatedEdits:edits.length,inverseExact:true}));
