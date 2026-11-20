# R15 recovered fictional art (source only)

This is a public-only reconstruction from retained author source, not the original R15 Git history or the game. It preserves 28 complete nonfunctional in-game render silhouettes and the detached display adapter. The design coordinates are arbitrary illustration units; there are no operating mechanisms or manufacturing data. The checkpoint snippets are historical source evidence, not separate runnable builds. No full external roster, assets, audio, camera captures, save data or gameplay is included.

To check geometry against the retained mesh fingerprints, pass a trusted, locally installed Three.js revision 180 module, or use the repo-root exact R14 fixture:

```sh
node recovery/r15-art/armory/proof/verify-art.mjs geometry /path/to/three.module.js
node --expose-internals recovery/r15-art/armory/proof/verify-art.mjs native tools/fixture.mjs out/r14-core/index.html
```

From the repo root, build the latter input with Node v24.22.3 using `npm run build -- r14-core` and the authorized byte-pinned `vendor/R11.html` documented at `vendor/README.md`. R14 output must hash to `7ed80caf9069d86873deb9321cb18ccb18ef497a7f67ab4080d12b21683bb084` (7,174,829 bytes). The native fixture uses the root README's exact local canvas dependency, without rendering to a browser.
