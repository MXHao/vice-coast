import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sha} from './ast.mjs';
import {loadWorld} from './fixture.mjs';
import {runScenario} from './scenarios.mjs';
try {
  const [, , file, scenario, profile] = process.argv;
  assert.ok(file&&['route','campaign'].includes(scenario)&&['desktop','compact'].includes(profile));
  const bytes=await readFile(file);
  const observed=runScenario(loadWorld(bytes,{compact:profile==='compact'}),scenario);
  console.log(JSON.stringify({sha256:sha(bytes),profile,...observed}));
} catch(error) {
  console.error(error.name+': '+error.message);
  console.error(String(error.stack).split('\n').filter(x=>x.length<300).slice(-10).join('\n'));
  process.exitCode=1;
}
