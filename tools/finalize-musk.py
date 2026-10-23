"""Rebuild branding metadata, asset SRI, precache and SHA-384 manifests."""
from pathlib import Path
import re,json,hashlib,base64
APP=Path(__file__).resolve().parent.parent/'app'
VERSION='v78-musk-2'
name=re.search(r"name: '([^']+)'",(APP/'vendor/app-config.js').read_text())[1]
m=json.loads((APP/'manifest.json').read_text());m.update(name=name,short_name=name,background_color='#FFFFFF',theme_color='#FFFFFF');(APP/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
s=(APP/'sw.js').read_text();s=re.sub(r"const VERSION = '[^']+'",f"const VERSION = '{VERSION}'",s)
s=s.replace("if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;","if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;\n  // Classic must always use the network, outside the new app cache.\n  if (url.pathname.startsWith(new URL('classic/', self.registration.scope).pathname)) return;") if "new URL('classic/'" not in s else s
pre=json.loads(re.search(r'const PRECACHE = (\[.*?\]);',s)[1]);pre=list(dict.fromkeys(pre+['vendor/app-config.js','DONE_musk1.txt','DONE_lexo.txt','DONE_musk2.txt']))
s=re.sub(r'const PRECACHE = \[.*?\];','const PRECACHE = '+json.dumps(pre)+';',s);(APP/'sw.js').write_text(s)
for root,version in [(APP,VERSION)]:
 for file in ['index.html','essay.html']:
  p=root/file;html=p.read_text()
  def sri(m):
   tag=m[0];asset=root/m[2]
   if not asset.is_file():return tag
   tag=re.sub(r'\s+integrity="[^"]*"|\s+crossorigin="[^"]*"','',tag)
   digest=base64.b64encode(hashlib.sha384(asset.read_bytes()).digest()).decode()
   return tag[:-1]+' integrity="sha384-'+digest+'" crossorigin="anonymous">'
  html=re.sub(r'<(?:script|link)\b[^>]*\b(src|href)="([^"]+\.(?:js|css))"[^>]*>',sri,html)
  p.write_text(html)
 files=[p for p in root.rglob('*') if p.is_file() and 'classic' not in p.relative_to(root).parts and p.name!='hash-manifest.json']
 manifest={'version':version,'algorithm':'SHA-384','files':{str(p.relative_to(root)):hashlib.sha384(p.read_bytes()).hexdigest() for p in sorted(files)}}
 (root/'hash-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Updated branding / SRI / manifest / '+VERSION+' PRECACHE (classic bypass).')
