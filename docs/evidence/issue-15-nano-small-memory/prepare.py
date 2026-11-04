"""Derive a loader-only trial archive without changing the preserved inputs."""
from pathlib import Path
import tarfile, io, hashlib, json
root = Path(__file__).resolve().parent
original = root.parent / 'issue-15-nano' / 'fixture.tar.gz'
output = root / 'fixture.tar.gz'
if output.exists():
    raise SystemExit('Refusing to overwrite existing trial archive')
changes = []
with tarfile.open(original, 'r:gz') as src, tarfile.open(output, 'w:gz') as dst:
    for member in src:
        f = src.extractfile(member) if member.isfile() else None
        if member.name.endswith('@rolldown/binding-wasm32-wasi/rolldown-binding.wasi.cjs'):
            before = f.read()
            assert before.count(b'initial: 16384,') == 1
            after = before.replace(b'initial: 16384,', b'initial: 1024,')
            changes.append({'path': member.name, 'before': hashlib.sha256(before).hexdigest(), 'after': hashlib.sha256(after).hexdigest()})
            member.size = len(after)
            f = io.BytesIO(after)
        dst.addfile(member, f)
assert len(changes) == 1
(root / 'patch.json').write_text(json.dumps(changes, indent=2))
