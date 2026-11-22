import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

assert.equal(process.version, 'v24.22.3', 'Use the exact recorded Node runtime');
const acorn = createRequire(import.meta.url)('internal/deps/acorn/acorn/dist/acorn');
assert.equal(acorn.version, '8.18.0', 'Recorded Acorn parser is part of the pinned runtime');
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const parse = (s, sourceType='script') => acorn.parse(s, {ecmaVersion:2022,sourceType});
export function splitHtml(bytes) {
  const html=bytes.toString('utf8'); assert.ok(Buffer.from(html).equals(bytes),'UTF-8 must round trip');
  const tags=[...html.matchAll(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g)];
  assert.equal(tags.length,2,'R11 app + legal notices');
  assert.ok(tags[0][0].startsWith('<script>'));
  assert.ok(tags[1][0].startsWith('<script type="text/plain" id="third-party-notices">'));
  const from=tags[0].index+'<script>'.length, to=tags[0].index+tags[0][0].length-'</script>'.length;
  return {app:html.slice(from,to), before:html.slice(0,from),after:html.slice(to)};
}
