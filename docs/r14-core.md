# R14 core | Local qualification capsule

`npm run build -- r14-core` builds the exact local integrated edition to
`out/r14-core/index.html`. It remains separate from hosted R13. The default
build re-creates the pinned R12 and `npm run build -- r13` re-creates the
byte-exact previously hosted R13 and its metadata.

- [Roadside collisions](road-solids-r14.md): player-only native swept response for
  audited rigid objects, no change to pedestrian/camera paths or save schema.
- [Graphics](r14-graphics.md): Highest keeps R13 scene assets/settings. Balanced
  and Smooth reduce pixel or shadow workloads by choice, with an exact
  walker-obstacle query index. Offline operation counts are not measured FPS.
- [Desktop look](desktop-look-r14.md): explicit mouse-look button, safe
  drag fallback and Escape release. Pause never holds the cursor.
- [Touch HUD](touch-r14.md): separate walking/driving and orientation-specific
  thumb layouts, customizable from pause, with existing game progress isolated
  from the UI preferences.

All four extensions are inserted at checked AST anchors in the privately retained
original R11. Each isolated extension is reversible independently; removing the
four restores exact R13. No new street activity or interior is included. All
testing is CPU-only with synthetic state, fixture input and renderer/DOM
boundaries, not browser compatibility tests or device benchmarks.

The current source tree contains only authored modules, reproducible fixtures and
docs. Runtime art payloads are exactly the preceding authorized R13 assets and
notices, not a newly licensed dependency. Do not add generated output, captured
logs, diagnostics, user progress or the private R11 artifact to a source backup.
