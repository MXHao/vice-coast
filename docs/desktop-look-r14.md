# R14 | Desktop mouse look

This is a source-only input extension over the exact R13 capsule. It does not
change the existing R11/R13 build recipes or the immutable R11 input. A combined
builder passes the original R11 app and its checked AST plus the snapshot
of src/desktop-look.mjs to tools/desktop-look-patches.mjs. Merge the four
returned insertions with the release's other original-coordinate insertions
using a stable ordering at shared coordinates. Record all inserted UTF-16/UTF-8
ranges and verify complete R11 reversal. Removing only the input insertions
from the desktop-only qualification output restores exact R13.

- In an active fine-pointer/hover desktop game, a trusted click on the existing
  toolbar's new 鼠标视角 button, or Enter/Space while focused on that specific
  button, requests standard Pointer Lock. No gameplay canvas click, menu,
  touch or unrelated control ever requests it. No preference is persisted.
- Pointer-locked relative movement uses the original orbit and walk-angle fields,
  the native vertical bounds, and the native camera. It does not steer the
  vehicle. The original recenter is held only while the game owns the lock.
- Escape first releases capture; use Escape again to pause. J/M and the
  existing panels release immediately. Focus loss/visibility change, page
  hide, a coarser active pointer or replacing the game also release.
- Aiming remains native: arm normally, then a deliberate left press/release
  under lock fires at the crosshair through the exact existing centre-shot
  argument path. No stale pending press survives a release. Unlocked inputs
  (including touch, drag, cursor-targeted fire and keyboard) retain native paths.
- Without support the original drag remains available. If an embed/host denies
  lock or a request times out, the toolbar says 拖动可用; only a new deliberate
  activation retries. No site permission or iframe policy is changed.

Tests are simulated trusted event delivery, no-render CPU fixture replays
and byte-reversal checks. They establish packet handling and compatibility with
the exact native movement/menu/save paths, not any platform's actual grants,
physical mouse feel, browser event order or fullscreen integration.
