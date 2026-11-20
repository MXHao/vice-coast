# R14 | Static roadside collisions, isolated candidate

The published R13 scene already contains a swept-player chassis and 275 original
colliders. Its visual and physics lists are not the same: exact scene inspection
in both viewport profiles found 14 masonry planting beds, two concrete fountain
basins, several fixed steel shelter parts, and six waterfront rail segments whose
centres generally have no original blocker. All 40 street light bases and 38
signal supports sampled already have original blockers and were not duplicated.

The collision catalog follows the existing 14 rounded masonry caps, two circular
basins, the posts/fixed panels/cases of four bus shelters, and six actual waterfront
rail boards. It retains the 22-metre openings. Low fixed endpoints have measured
footprints; canopies, plants, chairs, art workers, carts and unattached decorative
clutter are not turned into invisible solid walls. Existing warehouse relief is
not treated as a new collision surface. This patch is for the player-controlled
car; it does not change pedestrian or NPC paths or the collision map drawn in HUD.

A guarded source splice extends the stock sweep's earliest-contact query. New
shapes follow the same three chassis stations. Swept discs and true rounded
rectangles keep a thin post from tunnelling and avoid square corner snags. Old
wall contacts win equal-time ties and the native solver still handles skin,
tangential motion, bump sound and response. A second guarded query prevents a
car-to-car separation force from jumping through a new solid. Existing saves
are not rewritten or teleported: an older vehicle already inside a newly solid
footprint can drive toward its nearest exit. There is no new save key or schema.

`npm run build -- r14-collision` builds only the isolated branch candidate.
It does not modify the byte-pinned historical R11, R12, or R13 artifacts.
Square/rounded sweep unit tests and raw insertion reversal are in
`tests/road-solids.test.mjs`. `tools/road-solids-survey.mjs` verifies the chosen
shapes against actual R13 geometry, and `tools/road-collision-qa.mjs` compares
representative approaches, reverses, glancing passes, high-displacement stress
probes, physical gaps and a synthetic overlapping legacy save. Call both tools
with `node --expose-internals`; see argument guards for exact pinned inputs.
Use the existing case replay and `tools/audit-collision.mjs` to check ordinary
route/campaign parity away from the new collisions. All these are deterministic
CPU-only renderer-boundary checks, not browser testing or measured device FPS.
