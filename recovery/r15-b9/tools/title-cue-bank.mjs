import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {renderTitleCue,ORIGINAL_CUE_IDS,TITLE_CUE_RATE} from '../src/title-foley.mjs';
export function buildOriginalCueBank(ids=ORIGINAL_CUE_IDS){
 assert.deepEqual([...ids],ORIGINAL_CUE_IDS,'Title-original cue roster and engine agree exactly');
 const table={};
 for(const id of ids){
  const x=renderTitleCue(id),b=Buffer.alloc(x.length*4);
  assert.ok(x.length>800&&x.length<=8500&&x.every(Number.isFinite));
  for(let i=0;i<x.length;i++)b.writeFloatLE(x[i],i*4);
  table[id]=Object.freeze({rate:TITLE_CUE_RATE,frames:x.length,sha256:createHash('sha256').update(b).digest('hex'),f32le:b.toString('base64')});
 }
 assert.equal(new Set(Object.values(table).map(c=>c.sha256)).size,ids.length,'Disjoint authored wave identities');
 return Object.freeze(table);
}
