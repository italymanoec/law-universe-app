"""Shell-1: sync product name, SRI, precache list, SW version and SHA-384 manifest for the new app (classic untouched)."""
from pathlib import Path
import re, json, hashlib, base64

APP = Path(__file__).resolve().parent.parent / 'app'
VERSION = 'v79-shell-1'
sri = lambda p: 'sha384-' + base64.b64encode(hashlib.sha384(p.read_bytes()).digest()).decode()

name = re.search(r"name: '([^']+)'", (APP / 'vendor/app-config.js').read_text())[1]

# Manifest and static name (no runtime placeholder left in any page).
m = json.loads((APP / 'manifest.json').read_text())
m.update(name=name, short_name=name, background_color='#FFFFFF', theme_color='#FFFFFF',
         description='律師・司法官考試：申論題的爭點與法條、選擇題 2,502 題，可離線使用。')
(APP / 'manifest.json').write_text(json.dumps(m, ensure_ascii=False, indent=2) + '\n')
for page in ['index.html', 'essay.html']:
    p = APP / page
    html = p.read_text()
    html = re.sub(r'<title>[^<]*</title>', f'<title>{name}</title>', html)
    html = re.sub(r'(name="apple-mobile-web-app-title" content=")[^"]*"', rf'\g<1>{name}"', html)
    html = re.sub(r'(<div class="appname" id="appName">)[^<]*<', rf'\g<1>{name}<', html)
    assert '{{APP_NAME}}' not in html
    p.write_text(html)

# Question files are loaded on demand; pin each one with SRI inside lexo.js.
js = APP / 'vendor/lexo.js'
qb = {f.stem: sri(f) for f in sorted((APP / 'qb').glob('*.js'))}
s = js.read_text()
s = re.sub(r'const QB_SRI = \{.*?\};', 'const QB_SRI = ' + json.dumps(qb) + ';', s, flags=re.S)
js.write_text(s)

# SRI on every local script/stylesheet in index.html (after lexo.js is final).
p = APP / 'index.html'
def tag_sri(mt):
    tag, asset = mt[0], APP / mt[2]
    if not asset.is_file():
        return tag
    tag = re.sub(r'\s+integrity="[^"]*"|\s+crossorigin="[^"]*"', '', tag)
    return tag[:-1] + f' integrity="{sri(asset)}" crossorigin="anonymous">'
p.write_text(re.sub(r'<(?:script|link)\b[^>]*\b(src|href)="([^"]+\.(?:js|css))"[^>]*>', tag_sri, p.read_text()))

# Service worker: new version, precache exactly what the new app needs.
pre = ['index.html', 'essay.html', 'manifest.json', 'vendor/app-config.js', 'vendor/lexo.js', 'pwa/lexo.css',
       'data/essay_packs.json', 'data/DONE_data.txt'] + [f'qb/{k}.js' for k in qb] + \
      sorted(str(f.relative_to(APP)) for f in (APP / 'icons').glob('*.png')) + ['DONE_shell1.txt']
for f in pre:
    assert (APP / f).is_file(), f
w = (APP / 'sw.js').read_text()
w = re.sub(r"const VERSION = '[^']+'", f"const VERSION = '{VERSION}'", w)
w = re.sub(r'const PRECACHE = \[.*?\];', 'const PRECACHE = ' + json.dumps(pre) + ';', w)
w = re.sub(r'// neuron-8:[^\n]*\n|// shell-1:[^\n]*\n', '// shell-1: tabbed app shell; no 3D globe, hive tutorial or old styles.\n', w)
(APP / 'sw.js').write_text(w)

files = [f for f in APP.rglob('*') if f.is_file() and 'classic' not in f.relative_to(APP).parts and f.name != 'hash-manifest.json']
manifest = {'version': VERSION, 'algorithm': 'SHA-384',
            'files': {str(f.relative_to(APP)): hashlib.sha384(f.read_bytes()).hexdigest() for f in sorted(files)}}
(APP / 'hash-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'{name}: SRI, QB_SRI ({len(qb)}), PRECACHE ({len(pre)}), {VERSION}, hash-manifest ({len(files)} files).')
