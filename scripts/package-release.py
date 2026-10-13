from pathlib import Path
import json, hashlib, zipfile
root=Path(__file__).resolve().parent.parent
dist=root/'dist'
manifest=json.loads((dist/'release.json').read_text(encoding='utf-8'))
for item in manifest['files']:
    file=(dist/item['path']).resolve()
    assert file.is_relative_to(dist.resolve())
    assert hashlib.sha256(file.read_bytes()).hexdigest()==item['sha256']
out=root/'.local'/'releases'
out.mkdir(parents=True,exist_ok=True)
target=out/f"baseball-road-{manifest['version']}.zip"
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as package:
    for file in sorted(dist.rglob('*')):
        if file.is_file(): package.write(file,file.relative_to(dist).as_posix())
with zipfile.ZipFile(target) as package:
    assert package.testzip() is None
    assert '.nojekyll' in package.namelist()
    assert not any(n.startswith(('tests/','legacy/','node_modules/')) for n in package.namelist())
print(json.dumps({'zip':str(target),'version':manifest['version'],'sourceCommit':manifest['sourceCommit'],'files':len(manifest['files'])+2,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()},indent=2))
