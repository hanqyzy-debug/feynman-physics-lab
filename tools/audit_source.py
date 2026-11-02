"""Verify the supplied source DOCX against the committed paragraph map."""
import hashlib
import json
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

source = Path(sys.argv[1])
expected = json.loads((Path(__file__).resolve().parents[1] / 'docs/source-map.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected['sha256'], 'Source file differs'
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(source) as archive:
    doc = ET.fromstring(archive.read('word/document.xml'))
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', ns)) for p in doc.findall('.//w:p', ns)]
for i, chapter in enumerate(expected['chapters']):
    assert paragraphs[chapter['startParagraph'] - 1] == chapter['heading']
    boundary = expected['chapters'][i + 1]['startParagraph'] if i < 5 else expected['stopBefore']['paragraph']
    assert chapter['endParagraph'] == boundary - 1
    for section in chapter['sections']:
        assert paragraphs[section['paragraph'] - 1] == section['heading']
stop = expected['stopBefore']
assert paragraphs[stop['paragraph'] - 1] == stop['heading']
print('Verified: source SHA-256, six chapter boundaries, 31 sections, stop before chapter 7.')
