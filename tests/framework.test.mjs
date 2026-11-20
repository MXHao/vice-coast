import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from '../build.mjs';
import {PIN,sha,parse,moduleBody,splitHtml,inspectProgram} from '../tools/ast.mjs';

const src=n=>readFile(new URL('../src/'+n+'.mjs',import.meta.url),'utf8');
const vendorPath=new URL('../vendor/R11.html',import.meta.url);
const sources=Object.fromEntries(await Promise.all(['bridge','skyline','activity'].map(async n=>[n,await src(n)])));
const vendor=await readFile(vendorPath).catch(e=>{
  if(e.code==='ENOENT')throw Error('Install the authorized byte-exact vendor copy as documented in vendor/README.md');
  throw e;
});
test('clean vendor identity, version-pinned semantic anchors and exactly three reversible insertions',()=>{
  assert.equal(sha(vendor),PIN.html);
  assert.equal(vendor.byteLength,PIN.bytes);
  const a=build(vendor,sources);
  const p=splitHtml(vendor),q=splitHtml(a.candidate);
  assert.equal(sha(p.app),PIN.app);
  assert.ok(a.metadata.reversible);
  assert.equal(p.before,q.before);assert.equal(p.after,q.after);
  assert.equal(a.metadata.insertions.length,3);
  assert.match(p.after,/third-party-notices/);
  assert.equal(sha(vendor),PIN.html,'No source mutation');
  assert.equal(inspectProgram(q.app,false).game.parent.id.name,'G0');
});
test('builder rejects a bit change before parsing',()=>{
  const modified=Buffer.from(vendor);modified[431]^=1;
  assert.throws(()=>build(modified,sources),/Wrong vendor SHA-256/);
  assert.throws(()=>build(vendor.subarray(0,-1),sources),/Wrong vendor byte count/);
});
test('named local helper exports work, imported or newly executable vendor content fails closed',()=>{
  const x=moduleBody('export const detail=3; export function createArt(a){return detail+a;}', 'createArt');
  assert.doesNotThrow(()=>parse(x));
  for(const m of [
    'import foo from "somewhere";export function createArt(){return foo;}',
    'export function createArt(){return import("https://invalid.test/");}',
    'export function createArt(){return localStorage.getItem("x");}',
    'export function createArt(){return Math["random"]();}',
    'export function createArt(){return "</script>";}',
    'export {createArt}; function createArt(){}',
    'export async function createArt(){}'
  ])assert.throws(()=>moduleBody(m,'createArt'));
});
