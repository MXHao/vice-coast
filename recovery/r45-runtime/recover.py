"""Offline, byte-locked recovery of the R45 public static tree. Python 3.9+."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
# (leaf count, byte count, SHA-256 of sorted SHA256SUMS, SHA-256 of index.html)
LOCKS = {
    'R39': (58, 65383272, '43feb10a4a04844690945951664204d86a10d9613edf62ceeb24c7bc9a3ba1cb',
            'adae085322eddfb5cdacf762b00fcf5313ac7da2b7be2bff37c1c64722df3d37'),
    'R44': (59, 74128866, '84ed68dddd213ed3426743cc669a51a37760f734451f8fc7bc2004bbb8fc5575',
            'e461d84010471088d9cf6ca9b99c66f9979711773c6b57f8957447bec1ac613a'),
    'R45': (60, 74311392, '487bd69f12af519dd3f767118d6f17988272ff2c41ea62f24686f25be06c2a35',
            'f11a0bd83570c72f15af7ef3a35b63e563952d60641cbbd82a21fb9c620bbfc7'),
}
ART = {'hero': 'd08167aa6170fdff41c70172c329a7693388ffd90fe8dea0be4ef088aea64e85',
       'crouch': 'c8d001e365522b44a1964684c62e5db0475d8cacb1edcced285d0fa79f5e96e2'}
M_RE = re.compile(r'^const M=(\{[^\n\r]+\});$', re.M)


def need(ok, msg):
    if not ok:
        raise ValueError(msg)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def read(p):
    need(not p.is_symlink() and p.is_file(), f'not a regular file: {p.name}')
    return p.read_bytes()


def read_tree(base):
    need(not base.is_symlink() and base.is_dir(), 'missing distribution directory')
    need({p.name for p in base.iterdir()} == {'assets', 'index.html'}, 'unexpected distribution root')
    folder = base / 'assets'
    need(not folder.is_symlink() and folder.is_dir(), 'bad assets directory')
    tree = {'index.html': read(base / 'index.html')}
    for f in folder.iterdir():
        need(re.fullmatch(r'[a-z]+-[0-9a-f]{64}\.(js|css|txt)', f.name), 'unexpected asset name')
        tree['assets/' + f.name] = read(f)
    return tree


def verify(tree, version):
    sums = ''.join(sha(b) + '  ' + n + '\n' for n, b in sorted(tree.items()))
    got = (len(tree), sum(map(len, tree.values())), sha(sums.encode()), sha(tree['index.html']))
    need(got == LOCKS[version], version + ': file inventory, size, or digest mismatch')
    return got


def once(text, a, b):
    need(text.count(a) == 1, 'ambiguous or missing source seam')
    return text.replace(a, b, 1)


def spec(kind, data):
    h = sha(data)
    return dict(p=f'assets/{kind}-{h}.js', bytes=len(data), sha=h,
                sri='sha256-' + base64.b64encode(bytes.fromhex(h)).decode(), mime='js')


def set_manifest(html, manifest):
    (m,) = M_RE.finditer(html)
    return html[:m.start(1)] + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + html[m.end(1):]


def source(name):
    return read(HERE / (name + '.js')).decode('utf-8')


def build(base, art, dest):
    need(not art.is_symlink() and art.is_dir(), 'missing public asset directory')
    need(not dest.is_symlink() and not dest.exists() and dest.parent.is_dir(), 'output must be a new directory')
    need(not any(dest.resolve().is_relative_to(p.resolve()) for p in (base, art, HERE)),
         'choose an output outside the inputs and recipe')
    tree = read_tree(base)
    verify(tree, 'R39')
    html = tree['index.html'].decode()
    (m,) = M_RE.finditer(html)
    manifest = json.loads(m[1])
    game = tree.pop(manifest['game']['p']).decode('utf-8')
    assets = {}
    for name, h in ART.items():
        b = read(art / f'{name}-{h}.js')
        need(sha(b) == h, f'incorrect {name} asset')
        assets[name] = b
    need(assets['crouch'].endswith(source('r45-adapter').encode() + b'\n})();\n'),
         'crouch accessory adapter mismatch')
    # R44. Inject presentation logic only, preserving the R39 motion/controller paths.
    player = source('r44-player')
    game = once(game, 'var G0=class', source('r44-gait') + '\n' + player + '\nvar G0=class')
    game = once(game, '__vcR16FootJump.clear(this);this.keys.clear()',
                '__vcR16FootJump.clear(this);__vcR44Player.reset(this);this.keys.clear()')
    a = 'this.walkPhase+=Math.PI*2*D/Ps(this.footPace,this.crouched),!__vcR16JumpStep&&C>.18'
    b = ('const __vcR44GaitStep=__vcR44Player.motion(this,t,e,C,!__vcR16FootJump.air(this),__vcR16JumpStep,di(a.x,a.z));'
         'this.walkPhase+=Math.PI*2*D/Ps(this.footPace,this.crouched),!__vcR44GaitStep&&!__vcR16JumpStep&&C>.18')
    game = once(game, a, b)
    payload = game.encode()
    manifest.update(game=spec('game', payload), hero=spec('hero', assets['hero']))
    tree[manifest['game']['p']], tree[manifest['hero']['p']] = payload, assets['hero']
    html = set_manifest(html, manifest)
    a = 'let state=null,noRetry=false,attemptNumber=0;'
    html = once(html, a, source('r44-boot') + '\n' + a)
    html = once(html, ' claimBoot(script){', ' loadHero:loadR44Hero,\n claimBoot(script){')
    html = once(html, '<title>热湾狂飙 · 静默频率 | VICE COAST</title>', '<title>热湾狂飙 · R44 新男主离线试玩</title>')
    html = once(html, '<i></i> 剧情篇章</div>', '<i></i> R44 新男主离线试玩</div>')
    hint = '自由漫游 → F 下车 · W 移动 · Shift 冲刺 · 空格跳跃'
    html = once(html, '<p class="premise">直播前，洛拉的证词母带失踪了。</p>', '<p class="premise">' + hint + '</p>')
    a = 'id="third-party-notices">'
    html = once(html, a, a + '\nR44 new player base: Blender Studio Human Base Meshes (CC0 1.0), '
                'https://www.blender.org/download/demo-files/#assets\n'
                'R44 movement source: Quaternius Universal Animation Library 1 (CC0 1.0), '
                'https://quaternius.itch.io/universal-animation-library\n\n')
    tree['index.html'] = html.encode()
    verify(tree, 'R44')
    # R45. Replace the player integration, expose gait phase, add lazy crouch loading.
    del tree[manifest['game']['p']]
    game = once(game, player, source('r45-stance') + '\n' + source('r45-player'))
    a = 'return Object.freeze({step,reset});\n  }\n  global.VCGaitR44'
    b = ('return Object.freeze({step,reset,readPhase:()=>phase,alignPhase:p=>{phase=fract(p);},'
         'locomotionPhase:(name,p)=>sampleGait(weightsFor.indexOf(name),p)});\n  }\n  global.VCGaitR44')
    payload = once(game, a, b).encode()
    manifest.update(game=spec('game', payload), crouch=spec('crouch', assets['crouch']))
    tree[manifest['game']['p']], tree[manifest['crouch']['p']] = payload, assets['crouch']
    html = set_manifest(html, manifest)
    html = once(html, ' loadHero:loadR44Hero,', ' loadCrouch:loadR45Crouch,\n loadHero:loadR44Hero,')
    html = once(html, 'let localHero;', source('r45-boot') + '\nlet localHero;')
    a = 'R44 新男主离线试玩'
    need(html.count(a) == 2, 'unexpected title/menu labels')
    html = html.replace(a, 'R45 男主蹲姿试玩版')
    html = once(html, hint, hint + '；蹲走：轻点 Ctrl，松开后再按 W')
    tree['index.html'] = html.encode()
    verify(tree, 'R45')
    dest.mkdir()
    (dest / 'assets').mkdir()
    for n, data in tree.items():
        with (dest / n).open('xb') as f:
            f.write(data)
    return verify(read_tree(dest), 'R45')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='action', required=True)
    b = commands.add_parser('build')
    for name in ('r39', 'public_assets', 'out'):
        b.add_argument(name, type=Path)
    commands.add_parser('verify').add_argument('dist', type=Path)
    args = parser.parse_args()
    try:
        out = build(args.r39, args.public_assets, args.out) if args.action == 'build' else verify(read_tree(args.dist), 'R45')
    except (OSError, ValueError) as err:
        parser.exit(1, f'Error: {err}\n')
    print(f'R45: {out[0]} files / {out[1]} bytes / SHA256SUMS {out[2]}')


if __name__ == '__main__':
    main()
