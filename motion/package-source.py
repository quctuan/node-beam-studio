"""Package only runnable prototype sources and their handoff; no recursive scan."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent
files = [root / name for name in (
    'index.html', 'style.css', 'app.js', 'wire-interactions.js',
    'connector-feedback.js','wire-motion.js', 'motion-spec.json', 'README.md',
    'DEVELOPER-HANDOFF.md', 'package.json', 'build.mjs', 'package-source.py', 'generate-handoff.py',
)]
files += sorted(f for f in (root / 'assets').iterdir()
                if f.is_file() and not f.is_symlink()
                and f.suffix.lower() in {'.svg', '.png', '.woff2'})
files += sorted((root / 'docs').glob('M*.md'))
version = json.loads((root / 'package.json').read_text())['version']
manifest = {'version': version, 'algorithm': 'SHA256', 'files': {
    f.relative_to(root).as_posix(): hashlib.sha256(f.read_bytes()).hexdigest()
    for f in files
}}
manifest_path = root / 'SOURCE-MANIFEST.json'
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
(root / 'dist' / 'SOURCE-MANIFEST.json').write_bytes(manifest_path.read_bytes())
with zipfile.ZipFile(root / 'dist' / 'fiora-motion-source.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files + [manifest_path]:
        info = zipfile.ZipInfo('fiora-node-motion/' + f.relative_to(root).as_posix(), (2026, 10, 23, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, f.read_bytes())
print(f'Packaged v{version}: {len(files)} source files + manifest')
