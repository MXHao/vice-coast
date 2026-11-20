# R15 recovered showroom (public-only source)

This source reconstruction is not the historical R15 Git state or a release. It keeps the authored room, four original cosmetic preview samples and one P92 inventory-only purchase using in-game credits. It has no equip, firing or other combat integration. The full external roster, protected data, optional audio payload and private exporter are deliberately absent. This cannot reproduce the private prototype byte for byte. Silence is expected in the public-only audition panel. The audio unit tests use locally generated zero buffers and stub audio, not playable samples.

From the repository root, use Node v24.22.3 and the authorized exact R11 input as documented under `vendor/README.md`:

```sh
npm run build -- r14-core
node --expose-internals recovery/r15-shop/tools/build-replacement.mjs
node --expose-internals recovery/r15-shop/tools/build-replacement.mjs --probe
node --test recovery/r15-shop/tests/state-audio.test.mjs
node --expose-internals --test recovery/r15-shop/tests/native.test.mjs
```

The build requires exact R14 at `out/r14-core/index.html` with SHA-256 `7ed80caf9069d86873deb9321cb18ccb18ef497a7f67ab4080d12b21683bb084`, 7,174,829 bytes. The native tests use the root README's pinned local canvas dependency and synthetic saves. No Browser, GPU, device, FPS or release claim.
