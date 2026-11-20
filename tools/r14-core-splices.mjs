// Assemble only the approved collision/PC look/mobile/graphics extensions.
// All hooks receive the original R11 AST and return zero-width source offsets.
import assert from 'node:assert/strict';
import {sha} from './ast.mjs';
import {CORE_MODULES} from './r14-core-lock.mjs';
import {desktopLookPatches} from './desktop-look-patches.mjs';
import {qualitySplices} from './quality-splices.mjs';
import {touchSplices} from './touch-splices.mjs';

export function r14CoreSplices(app,original,sources){
 assert.ok(sources.roadSolids,'The core profile must include the isolated collision fix');
 for(const [name,rule] of Object.entries(CORE_MODULES)){
   assert.equal(typeof sources[name],'string','Missing complete R14 component: '+name);
   assert.equal(sha(sources[name]),rule.sha256,'Locked author input: '+name);
 }
 // Source-sort is stable. At the shared pause/menu action/title anchors,
 // graphics handles its names first; the touch layer then gets the original
 // or augmented markup and catches only its own namespace before native UI.
 const edits=[
   ...desktopLookPatches({app,original,source:sources.desktopLook}),
   ...qualitySplices(app,original,sources.graphics,sources.walkerIndex),
   ...touchSplices(app,original,sources.touchLayout,sources.touchHUD)
 ];
 const ids=new Set();
 for(const {id,at,text} of edits){
   assert.ok(!ids.has(id),'Duplicate author insertion ID: '+id);ids.add(id);
   assert.ok(Number.isInteger(at)&&at>0&&at<app.length);
   assert.ok(typeof text==='string'&&text.length>0&&!/<\/script/i.test(text));
 }
 return edits;
}
