# R14 · Original touch controls and layout editor
The baseline is R13, git `1da671399840192ff1b823d24831381d87a7f646`.
`tools/touch-splices.mjs` takes compiled R11/R13 source coordinates and guarded
Acorn nodes, returns named insertions, and does not replace game input handlers.
`tools/touch-candidate.mjs` reproduces the immutable prior R13, verifies its pin,
installs the isolated feature and verifies byte-for-byte reversal. Composite
release owners can call its named splice recipe directly in their build.

**Design.** Native walking stick applies analog movement/sprint. The empty right
canvas remains available for looking/target taps. A pink primary sits on the
lower right; equip uses that slot while unarmed until individually placed by
the player. Crouch, swap, reload, proximity-dependent entry and story interaction
retain native availability and tap semantics. Driving has separate large gas
and brake/reverse, separate handbrake and exit, and left-hand steer buttons.
No extra fire mode, automatic aim, weapon mechanics or key bindings.
See the [official CoD Mobile controls overview](https://blog.activision.com/call-of-duty/2019-10/Getting-a-Grip-on-the-Call-of-Duty-Mobile-Controls.html)
for the interaction principles; no borrowed images, brands or HUD asset copies.

**Placement.** Inputs are sized in CSS pixels inside measured `env(safe-area-inset-*)`.
Primary control *edges* (not centers) then get a thumb-comfort margin, additional
to any notch or home-bar inset: e.g. fire in a 667×375 viewport has a 72px
diameter, 57px right gap, 39px bottom gap. On 844×390 with 47px lateral and 21px
bottom safe insets the fire diameter is 71px with 64/39px gaps inside the safe
rectangle (111/60px from the physical edges). On 390×844 with a 34px home bar
only the fire is 75px with 34/61px safe gaps (34/95px physical).
The empty swipe rectangle in the tests is conservative; the transparent deck
and text HUD do not own touches beyond the actual controls.

**Editing.** On coarse-input devices, use 自定义布局 on the title screen or pause
menu. Preview either of the two full-size layouts, select a control by touch
or dropdown, drag, adjust size, move the small toolbar if it covers a target,
cancel, save or restore defaults for the selected mode/orientation. All playable
deck buttons plus story interaction, map and pause are editable. Sound,
fullscreen and the text mission card remain stock utility controls. The editor
uses preview-only nodes, native pause/return/focus semantics, original native SVG
control symbols, and a separate versioned storage key `vc-touch-layout-v1`.
Each orientation and mode has independent normalized centers and sizes;
collision and bounds checks run on settings load, editing and reflow. Bad or
unavailable storage falls back to playability; a failed save applies for the
session and explicitly tells the player. Desktop gameplay/HUD is unchanged.
Native camera, stick and action/pedal pointer captures remain independent.
The layout does not poll each frame or measure the DOM until input mode,
equipment, screen dimensions or editing state changes.

**Offline reproduction on the pinned Node/canvas from the parent README.**
```sh
node --expose-internals --test --test-concurrency=1 tests/touch-*.test.mjs
node --expose-internals tools/touch-candidate.mjs
node tools/touch-proof.mjs
```
The private diagram in `out/touch/hud-proof.svg` is derived from the layout
solver, not a screenshot, hardware reach study, or claim of real phone testing.
The DOM projection uses the compiled vendor Xw controller, canvas listeners,
pause/reset, menu renderer, and click/key dispatch; it is not a CSS/browser engine.
