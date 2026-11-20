# Vice Coast | R12 and R13 additive editions

This repository contains authored R12 and R13 modules and a reproducible build adapter
over the exact previously delivered standalone R11 HTML. It does not reconstruct,
replace, or claim to possess the original R11 source. The build never edits that
baseline. Standalone output and test evidence are local-only by default.

## Reproduce locally

1. Install the authorized original R11 as `vendor/R11.html` using the byte pin in
   [vendor/README.md](vendor/README.md). A sanitized source-only Git backup still
   deliberately requires this independently retained original file.
2. Use Node **v24.22.3**. Its built-in Acorn is **8.18.0**, checked at execution.
   The scripts use `--expose-internals` to load the pinned parser without installation.
   `npm run build` (or `npm run build -- r12`) reproduces the delivered R12 in
   `out/index.html` with metadata at `out/build.json`. `npm run build -- r13`
   builds the separately pinned R13 in `out/r13/index.html`, leaving R12 intact.
   Each recipe validates its exact artifact byte count and hash. The R12 capsule
   contains the historical bridge/activity and shares the pinned unchanged skyline.
3. To run the full `npm test` suite, use the preinstalled **@napi-rs/canvas 0.1.100**
   or install that exact version from the npm registry in a development checkout:
   `npm install --no-save --package-lock=false @napi-rs/canvas@0.1.100`.
   The suite includes a native-scene check, and this same dependency supplies
   the original 2D label painter in the CPU-only replay and census tools.
   It is not needed by `npm run build`. Neither build nor tests use a browser or WebGL.
   `node --expose-internals tools/census.mjs` prints original scene evidence.

`src/skyline.mjs` and `src/activity.mjs` are the self-contained authoring modules. Their exact authored bytes are recorded
in art-lock.json and checked by the release build.
Each exports `createArt({THREE, actors})` returning a detached native Group
and optionally a presentation-only `update({elapsed,eye})`. Other local named
helper exports are supported for tests but not exposed in runtime. No imports,
DOM/storage/network, wall/vehicle actors, original scene traversal, or ambient
wall-clock/random dependency. Write new geometry/materials only. The bridge gives
its activity layer checked factory-and-pose access to detached clone actors; shared
vendor geometry, textures and materials must not be modified. Skyline is static
and has no actor allocation permission. Keep additions off play corridors.

The adapter checks the full vendor and app hashes, game class, startup/render
anchor shapes/cardinalities, and the native renderer-compatible bindings. It inserts
only a private bridge declaration, one late-bootstrap mount and one pre-render
tick. Removing these three tagged byte ranges restores the exact vendor script
and complete HTML. The mount is after existing map/traffic/save loading and
the static reflection capture, but before the simulation clock; added art is not
in that original cube probe. Engine motion, routes, physics, storage and original
actors remain unchanged by design. Tests and static evidence do not establish GPU,
browser persistence, lighting or frame-rate parity.

## Publication hygiene

The source tree intentionally excludes private vendor/game HTML, generated output,
assets contained in the vendor, tool logs, captured user data, real saved games,
credentials and account/library identifiers. Do not add them to a source backup.
The live file, old repository and external site are independent from this adapter.

The original HTML embeds its own third-party notices (including Three.js,
licensed typefaces and the reported CC0 MakeHuman adaptations). The build
preserves that notice block byte for byte and does not extract or redistribute
those assets in this source-only tree. This repository does not grant new
redistribution rights to the vendor or its components.

## Longer offline behavior checks

These are simulated keyboard/interaction sequences in the exact compiled game
under a renderer stub with an in-memory save store, not real browsing, graphics,
user files or benchmarking. Debug output and saved bytes are synthetic fixtures.

For an isolated framework demonstration `node --expose-internals tools/smoke-build.mjs`
generates an internal test artifact with one geometry fixture and one actively
posed detached character. For exact comparisons, first build the desired pinned outputs. Example comparing original R11 with R12:

```sh
mkdir -p evidence
for layout in desktop compact; do
  node --expose-internals tools/replay-run.mjs vendor/R11.html route "$layout" > "evidence/baseline-$layout.json"
  node --expose-internals tools/replay-run.mjs out/index.html route "$layout" > "evidence/candidate-$layout.json"
  node --expose-internals tools/audit.mjs "evidence/baseline-$layout.json" "evidence/candidate-$layout.json"
done
node --expose-internals tools/replay-run.mjs vendor/R11.html campaign desktop > evidence/baseline-campaign.json
node --expose-internals tools/replay-run.mjs out/index.html campaign desktop > evidence/candidate-campaign.json
node --expose-internals tools/audit.mjs evidence/baseline-campaign.json evidence/candidate-campaign.json
```

The campaign scenario plays the mission sequence, then branches from a save
earned in the replay and reopens each ending. The audit requires exact vendor
identity, matched original gameplay and byte-identical serialized writes within
the fixture; it allows the new presentation groups, not gameplay changes.

For R13 parity use the same command recipes with `out/index.html` as the
baseline and `out/r13/index.html` as the candidate. Both full route profiles
and the campaign stay comparable; the reports reject any difference in
engine snapshots, save bytes, notices shown on screen, panels, sound calls,
and fixture frame counters. To audit migration from the historical hosted v8,
run `node --expose-internals tools/site-compat.mjs <authorized-v8-html> out/r13/index.html <CPU-R11-campaign-json>`.
This projects the exact v8 serializer into an in-memory store and uses the
native R13 restore path, never real player save files, a browser, or telemetry.

## R12 art

- The skyline groups add different massing to distant districts and stand-off
  shading to selected repeated upper façades; the original city meshes and
  street/collision footprint remain in place.
- The activity group adds six non-interactive performers in market pockets and
  recessed receiving positions, with time-driven tasks and lightweight
  camera-distance gating. These are presentation-only actors, not citizens on
  the traffic, encounter, inventory, or save systems.
- Browser/runtime testing is intentionally excluded. Offline source/geometry
  and save/route testing can verify the bridge boundary and scene composition,
  not real GPU behavior or whole-game art parity.


## R13 revisions

- The Las Olas market adds one animated stock mover and a grounded wheeled
  produce cart in a recessed market apron. Representative native foot-camera
  stills make the task readable; in the passing chase camera it remains a
  peripheral enrichment, not a crowd redesign. Existing quay activity stays.
- Selected Dock Road lots get individual loading bays, roller doors, gutters,
  awnings, split office glazing, and small geometric working signs. The update
  changes nearby frontage, not the amount of playable road or usable interiors.
- Both additions are presentation only. They receive neither prior scene
  objects nor input, collision or storage authority. Fixed CPU views use the
  original projected scene and camera with neutral substitute lighting; they
  do not establish GPU behavior, runtime lighting, or whole-game quality parity.
