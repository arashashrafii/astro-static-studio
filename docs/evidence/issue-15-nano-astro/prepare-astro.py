"""Materialize the preserved tiny fixture; never build on the host."""
import json,shutil,subprocess,tarfile,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent
inputs=root/'astro-inputs'
fixture=root/'astro'
fixture.mkdir(exist_ok=False)
for name,body in json.loads((inputs/'fixture-source.json').read_text()).items():
 if name=='package.json':continue
 path=fixture/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(body)
for name in ['package.json','package-lock.json']:shutil.copy2(inputs/name,fixture/name)
subprocess.run(['npm','ci','--ignore-scripts','--omit=optional','--no-audit','--no-fund'],cwd=fixture,check=True)
subprocess.run(['npm','install','--no-save','--ignore-scripts','--force','--omit=optional','--no-audit','--no-fund','@astrojs/compiler-binding-wasm32-wasi@0.5.2'],cwd=fixture,check=True)
with tarfile.open(root/'fixture.tar.gz','w:gz',format=tarfile.GNU_FORMAT) as archive:archive.add(fixture,arcname='fixture')
p=root/'fixture.tar.gz'
print(json.dumps({'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}))
