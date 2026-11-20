# R13 | Dock Road working frontage

This isolated edit adds the static, detached warehouse art factory in
src/warehouse.mjs. It builds upon the byte-pinned R12 view of the city without
editing the vendor byte stream, the R12 skyline or activity, the bridge,
storage, maps, collisions or movement. The compositor owns integration into the
release build. No external fonts, textures, dependencies or actor factories are
used. Tiny lettering is original, deterministic geometry.

The street composition proceeds across the transshipment store's 22 m base,
metal awning and joined office glazing, Carrier Repair's two adjoining faces
and stepped individual bay shades, the smaller west-facing supply office, and
the distinct packing frontage before the eastbound turn. Each shelter is
attached, not a new freestanding street obstacle. Closed dock shutters and a
continuous stained dock base represent function without implying accessible
interiors. No part of the relief under 3.70 m projects more than 0.317 m from its
existing perimeter; anything projecting beyond 0.34 m hangs at or above 3.75 m.
All four existing lot attachments were measured on verified native R11/R12
geometry and stay out of the traffic corridor.

The native test checks the old 275 collision boxes and save trace by retaining
the existing world and attaching the warehouse group; it also exercises finite
geometry, deterministic buffers and exact site bounds. Build/replay instructions
are in the repository README. Fixed-asset review is under the existing
non-rendering CPU fixture, with archived native chase poses, standard materials
and the same traffic for both variants. It is not a browser, GPU, or performance
test. Diagnostic renders, exact private input HTML and all local test evidence
stay outside the source tree.
