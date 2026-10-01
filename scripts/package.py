"""Create a GitHub-ready package without publishing local visual references."""
from pathlib import Path
from html.parser import HTMLParser
import zipfile

project = Path(__file__).resolve().parents[1]
archive = project.parent / 'panchgram-3d-github-ready.zip'
reference_name = 'Fuel and Pol Truck Loading Gantry.png'

class CheckReferences(HTMLParser):
    def handle_starttag(self, tag, attributes):
        for key, value in attributes:
            if key in ('src', 'href') and value and value != './' and not value.startswith(('http', 'data:', '#')):
                assert (project / value).is_file(), f'Missing website file: {value}'

CheckReferences().feed((project / 'index.html').read_text(encoding='utf-8'))
files = sorted(file for file in project.rglob('*') if file.is_file()
    and file.name != reference_name
    and not any(part in ('.git', 'node_modules', '__pycache__', 'Photos') for part in file.relative_to(project).parts))
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
    for file in files:
        output.write(file, file.relative_to(project).as_posix())
with zipfile.ZipFile(archive) as result:
    assert result.testzip() is None
    assert 'index.html' in result.namelist() and '.nojekyll' in result.namelist()
    assert reference_name not in result.namelist()
    assert not any(name.startswith('Photos/') for name in result.namelist())
print(f'Package verified: {len(files)} files; {archive.stat().st_size:,} bytes')
print('Reference images excluded; local originals preserved.')
print(archive)
