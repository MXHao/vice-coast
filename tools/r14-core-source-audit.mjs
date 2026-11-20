// Byte-pinned artifact guard, no browser, external URLs or user data reads.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {R13_ARTIFACT} from './versions.mjs';
import {R14_CORE_ARTIFACT} from './r14-core-lock.mjs';
import {sha,splitHtml,parse,query,slice} from './ast.mjs';

const [a,b]=process.argv.slice(2);
assert.ok(a&&b,'Pass exact R13 and R14 core HTML');
const before=await readFile(a),after=await readFile(b);
assert.equal(sha(before),R13_ARTIFACT.sha256);assert.equal(sha(after),R14_CORE_ARTIFACT.sha256);
const P=splitHtml(before),Q=splitHtml(after);
assert.equal(P.before,Q.before);assert.equal(P.after,Q.after,'Assets and public notices outside the original app are exact');
function witness(bytes,app){
 const whole=String(bytes),tree=parse(app);
 const inline=[...new Set([...whole.matchAll(/data:(image|font)\/[\w.+-]+;base64,([\w+/=]+)/g)]
  .map(([,kind,body])=>kind+':'+sha(Buffer.from(body,'base64'))))].sort();
 const executableURLs=query(tree,n=>n.type==='Literal'&&typeof n.value==='string'&&/^(?:https?|wss?):\/\//i.test(n.value))
  .map(({node:n})=>n.value).sort();
 const networkNames=['fetch','sendBeacon','WebSocket','EventSource','XMLHttpRequest','RTCPeerConnection'];
 const net=query(tree,n=>['CallExpression','NewExpression','ImportExpression'].includes(n.type)&&
    (n.type==='ImportExpression'||networkNames.includes(n.callee?.name??n.callee?.property?.name)))
    .map(({node:n})=>slice(app,n)).sort();
 for(const p of [/\bsk-(?:proj-|svcacct-)?[\w-]{22,}/, /\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{30,}/,
  /-----BEGIN (?:EC |RSA |OPENSSH )?PRIVATE KEY-----/, /(?:sediment:\/\/|libfile_|appgprj_|\/workspace\/scratch\/|\/home\/agent\/\.codex\/)/]){
  assert.doesNotMatch(whole,p);
 }
 return {inline,executableURLs,net};
}
const original=witness(before,P.app),candidate=witness(after,Q.app);
assert.deepEqual(candidate,original,'No change to bundled assets, external addresses or network instructions');
assert.deepEqual(candidate.net,[],'No executable network entrypoints in the playable bundle');
assert.ok(Q.app.includes('vice-coast-drive-v1'),'Existing local progress key');
for(const k of ['vice-coast-graphics-v1','vc-touch-layout-v1'])assert.ok(!P.app.includes(k)&&Q.app.includes(k),'Only opt-in device-local new settings');
assert.doesNotMatch(Q.app,/__vcR14Civic|__vcR14Armory/);
console.log(JSON.stringify({sourceBaseline:R13_ARTIFACT.sha256,core:R14_CORE_ARTIFACT.sha256,
 originalInlineImages:candidate.inline.filter(x=>x.startsWith('image:')).length,
 originalInlineFonts:candidate.inline.filter(x=>x.startsWith('font:')).length,
 executableNetworkEntrypoints:candidate.net.length,unchangedNotices:sha(P.after)},null,2));
