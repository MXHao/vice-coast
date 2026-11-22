# R18 + R19 presentation-source delta

Two consecutive Vice Coast game presentation revisions: R17 (nine first-person entries) → R18 (P90, ten) → R19 (AUG, eleven). This is not a game download, the original base, or a complete copy of the later 56-entry revision. Compact mode remains third person. No deployment is included.

The builder, controller and rendering adapter for each step are the original sources used in its sealed offline reconstruction. Their parser helper retains only the three functions the builders import. The adapters validate and display separately supplied artwork; no artwork, recordings, textures, base game, saves or access credentials are in this directory.

## Required local files

Supply these exact inputs separately. Hashes below are SHA-256 of the file bytes, not of any containing archive.

| Input | SHA-256 |
| --- | --- |
| R17 baseline, 32,122,756 bytes | `87caa135670470900e8bc9b20f1f3fd21141b960f237db7240e07c17f1cd2843` |
| R18 display artwork JSON | `9bb2a14ef85da9845b7f17674f5147060b1b0ab4db0f65a55b57c0bea1c6a775` |
| R19 display artwork JSON | `c6a4fbc5e0b1265b859cf7c3aa959a8977c565b38edcc2263556245aaac6c689` |

Use Node.js v24.22.3 with its bundled Acorn 8.18.0. No package installation is needed. The baseline already contains the game's existing sounds. Do not add these inputs or generated outputs to the repository.

## Offline recovery

Run the following from this directory on Linux, after setting `BASE`, `ART18`, and `ART19` to the absolute paths of the three inputs. The procedure works in a fresh private directory outside this checkout; it does not modify a site or overwrite an existing game.

```sh
set -eu
umask 077
: "${BASE:?}" "${ART18:?}" "${ART19:?}"
check() { test "$(sha256sum < "$1" | cut -d ' ' -f1)" = "$2"; }
h18=9bb2a14ef85da9845b7f17674f5147060b1b0ab4db0f65a55b57c0bea1c6a775
h19=c6a4fbc5e0b1265b859cf7c3aa959a8977c565b38edcc2263556245aaac6c689
check "$BASE" 87caa135670470900e8bc9b20f1f3fd21141b960f237db7240e07c17f1cd2843
check "$ART18" "$h18"
check "$ART19" "$h19"
work=$(mktemp -d)
cp -R r18 r19 "$work/"
mkdir -p "$work/r18/baseline" "$work/r19/baseline" "$work/out"
ln -s "$BASE" "$work/r18/baseline/shared-inline-nine.html"
a="$work/out/manta-unreviewed.html"
b="$work/out/cienaga-private.html"
node --expose-internals "$work/r18/work/build-private.mjs" "$ART18" "$a" "$h18"
check "$a" 06f0be89919ed05f4edeebb10e18879e07e5dd7ff8d7150a9e8051d90a612f5a
ln -s "$a" "$work/r19/baseline/r18-manta.html"
node --expose-internals "$work/r19/work/build-private.mjs" "$ART19" "$b" "$h19"
check "$b" 824a18a400f3d93d1de7a3aaabcc24da59d99ce65c93310982cc4956d523e9a3
printf 'Verified local outputs: %s\n' "$work/out"
```

Expected output sizes: R18, 32,726,099 bytes; R19, 33,303,907 bytes. Each original builder checks its baseline, parses the edited game script and verifies that its source edits invert to the baseline. The output hashes match the earlier independent cold rebuilds. Those checks do not establish live rendering or audio playback quality.
