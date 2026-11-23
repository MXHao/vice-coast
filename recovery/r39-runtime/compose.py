#!/usr/bin/env python3
"""Reconstruct and verify the R39 static file tree from the exact R38 release."""
import argparse
import hashlib
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent
R38 = {
    "index.html": "9b95774afe01af62e414c5792345a1820a85eca191ea033ed104d7bf40dac52b",
    **{f"assets/r38-art-{n}-{h}.js": h for n, h in enumerate((
        "5d65b2ded64d72b7c196308dbda730be027b384d22fa2ea0409d68a2f3adbdcd",
        "48b194547dc387e2fc8e32b3dd5a52f4945f97bf02a056e36b3ade0b7a4b7c2b",
    ))},
}
GAME = "28c02bd67edb236da95a2e2b9e84a058a1c9935fa517b625ff4310ee24970536"
STYLE = "c6f56aacda1f8d45ff237984991602707d686fb177df82708b85e6ddf297da7b"
R39 = {
    "index.html": "adae085322eddfb5cdacf762b00fcf5313ac7da2b7be2bff37c1c64722df3d37",
    f"assets/game-{GAME}.js": GAME,
    f"assets/layout-{STYLE}.css": STYLE,
}
# SHA-256 over all 55 sorted, LF-terminated, relative assets/view-*.txt paths.
# Each path also contains the SHA-256 of that file's exact bytes.
VIEWS = "6aaab0f24964696483500f2e8e9214e24a94d8dd1f000a27280f0f3030d28298"


def files(root):
    if not root.is_dir() or root.is_symlink():
        raise ValueError("expected a regular directory")
    out = set()
    for p in root.rglob("*"):
        if p.is_symlink() or not (p.is_file() or p.is_dir()):
            raise ValueError("unexpected symlink or non-regular file")
        if p.is_file():
            out.add(p.relative_to(root).as_posix())
    return out


def check(root, expected):
    if files(root) != set(expected):
        raise ValueError("unexpected file set")
    for name, wanted in expected.items():
        with (root/name).open("rb") as f:
            if hashlib.file_digest(f, "sha256").hexdigest() != wanted:
                raise ValueError("SHA-256 mismatch for " + name)


def verify(root):
    views = sorted(files(root) - R39.keys())
    names = "".join(name + "\n" for name in views).encode("ascii")
    if len(views) != 55 or hashlib.sha256(names).hexdigest() != VIEWS:
        raise ValueError("optional file set differs from R39")
    extras = {}
    for name in views:
        m = re.fullmatch(r"assets/view-([0-9a-f]{64})\.txt", name)
        if not m:
            raise ValueError("unexpected view filename")
        extras[name] = m[1]
    check(root, {**R39, **extras})


def build(base, out):
    check(base, R38)
    if out.exists() or out.is_symlink():
        raise ValueError("choose a new output directory")
    if not out.parent.is_dir():
        raise ValueError("output parent must already exist")
    if out.resolve().is_relative_to(base.resolve()) or out.resolve().is_relative_to(HERE):
        raise ValueError("choose an output outside the source and input directories")
    with tempfile.TemporaryDirectory(prefix=".r39-", dir=out.parent) as tmp:
        w = Path(tmp)
        a, b, c = (w/(k + ".html") for k in ("01-economy", "02-racing", "03-view"))
        packed = w/"packed"
        # Keep release order: economy -> racing -> first-person -> loading.
        for cmd in (
            [sys.executable, HERE/"economy/patch.py", base/"index.html", a],
            ["node", HERE/"racing/patch.cjs", a, b],
            [sys.executable, HERE/"first-person/patch.py", b, c, "--composed"],
            [sys.executable, HERE/"loading/pack.py", "--base", base,
             "--merged-index", c, "--out", packed],
        ):
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
        check(base, R38)
        verify(packed/"dist")
        # copytree refuses to replace an existing output; nothing else is copied.
        shutil.copytree(packed/"dist", out)
        verify(out)


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    sub = cli.add_subparsers(dest="action", required=True)
    make = sub.add_parser("build", help="write a new local release directory")
    make.add_argument("base", type=Path)
    make.add_argument("out", type=Path)
    sub.add_parser("verify", help="check all 58 release files").add_argument("dist", type=Path)
    args = cli.parse_args()
    if args.action == "verify":
        verify(args.dist)
    else:
        build(args.base, args.out)
    print("R39: 58 release files verified (3 core + 55 optional).")
