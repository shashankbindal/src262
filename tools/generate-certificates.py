"""Generate participation certificates from the conference workbook.

Usage:
  python tools/generate-certificates.py --limit 2
  python tools/generate-certificates.py --all

The first page of the supplied PDF is used as the visual template. Adjust
NAME_X/NAME_Y and ID_X/ID_Y below once if the template's blank areas differ.
"""
from argparse import ArgumentParser
from io import BytesIO
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json, subprocess
from copy import deepcopy

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / 'client' / 'Conference Registration Data.xlsx'
TEMPLATE = ROOT / 'client' / 'Of Participation.pdf'
OUTPUT = ROOT / 'outputs' / 'certificates'

# Landscape A4 points. These are intentionally easy to tune for the template.
NAME_X, NAME_Y = 421, 320
ID_X, ID_Y = 421, 112
NAME_SIZE, ID_SIZE = 20, 10
NAME_MAX_WIDTH = 330

def excel_rows():
    with ZipFile(WORKBOOK) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared = [''.join(t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')) for si in root]
        ns = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        candidates=[]
        for name in sorted(n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')):
            xml=ET.fromstring(z.read(name)); parsed=[]
            for row in xml.findall('.//m:row', ns):
                vals=[]
                for c in row.findall('m:c', ns):
                    v=c.find('m:v', ns); value='' if v is None else v.text
                    if c.get('t') == 's': value=shared[int(value)]
                    vals.append(value)
                parsed.append(vals)
            if parsed and 'status' in [str(x).lower() for x in parsed[0]]: candidates.append(parsed)
        rows=candidates[0] if candidates else []
        return rows

def overlay(participant, width, height):
    # Minimal one-page PDF using built-in Helvetica; avoids extra PDF packages.
    def esc(s): return str(s).replace('\\','\\\\').replace('(','\\(').replace(')','\\)')
    # Approximate Helvetica width so the visible name is centered on the page.
    # Keep the name inside the two ornaments (roughly 300pt wide), reducing
    # font size before changing its center position.
    name_len = max(1, len(str(participant['name'])))
    name_size = min(NAME_SIZE, max(15, int(NAME_MAX_WIDTH / (name_len * 0.52))))
    name_width = name_len * name_size * 0.52
    name_x = NAME_X - name_width / 2
    commands = [f'BT /F1 {name_size} Tf {name_x:.1f} {NAME_Y} Td ({esc(participant["name"])}) Tj ET']
    if participant.get('srcId'):
        id_x = ID_X - (len(str(participant['srcId'])) * ID_SIZE * 0.27)
        commands.append(f'BT /F1 {ID_SIZE} Tf {id_x:.1f} {ID_Y} Td ({esc(participant["srcId"])}) Tj ET')
    content=' '.join(commands).encode()
    objs=[b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>', f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'.encode(), b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', b'<< /Length '+str(len(content)).encode()+b' >>\nstream\n'+content+b'\nendstream']
    out=b'%PDF-1.4\n'; offsets=[]
    for i,o in enumerate(objs,1): offsets.append(len(out)); out+=f'{i} 0 obj\n'.encode()+o+b'\nendobj\n'
    xref=len(out); out+=f'xref\n0 {len(objs)+1}\n0000000000 65535 f \n'.encode()+b''.join(f'{x:010d} 00000 n \n'.encode() for x in offsets)+f'trailer << /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF'.encode()
    return PdfReader(BytesIO(out)).pages[0]

def main():
    ap = ArgumentParser()
    ap.add_argument('--limit', type=int, default=2)
    ap.add_argument('--all', action='store_true')
    args = ap.parse_args()
    subprocess.run(['node', str(ROOT/'tools'/'read-registrations.cjs')], cwd=ROOT, check=True)
    people = json.loads((ROOT/'tools'/'registrations.json').read_text())
    if not args.all:
        # Include the longest approved name in the sample so alignment is
        # tested against the difficult case as well as a normal name.
        people = people[:max(0, args.limit - 1)] + ([max(people, key=lambda p: len(str(p.get('name',''))))] if people else [])
    OUTPUT.mkdir(parents=True, exist_ok=True)
    templates = PdfReader(TEMPLATE).pages
    # The template pages follow the institute order in the workbook's
    # Conference Data sheet. Keep this mapping explicit and easy to edit.
    # Page order in the supplied template PDF (confirmed from the visible
    # college-specific footer blocks): NIT, BVRIT, BMSCE, MIT WPU, BITS, ICT,
    # VIT, SVNIT. Match aliases because registrations use inconsistent names.
    institute_keywords = [
        ('NIT', ['NIT ROURKELA', 'NATIONAL INSTITUTE OF TECHNOLOGY']),
        ('BVRIT', ['BVRIT', 'B V RAJU', 'B.V RAJU']),
        ('BMSCE', ['BMSCE', 'B.M.S', 'BMS COLLEGE']),
        ('MIT WPU', ['MIT WPU', 'MIT WORLD']),
        ('BITS', ['BITS', 'BIRLA INSTITUTE']),
        ('ICT', ['ICT MUMBAI', 'ICT']),
        ('VIT', ['VIT', 'VELLORE INSTITUTE']),
        ('SVNIT', ['SVNIT', 'SARDAR VALLABHBHAI']),
    ]
    def template_for(person):
        text = str(person.get('institute', '')).upper()
        for idx, (_, aliases) in enumerate(institute_keywords):
            if any(key in text for key in aliases): return templates[idx]
        return templates[0]
    writer = PdfWriter()
    for person in people:
        template = template_for(person)
        page = deepcopy(template)
        page.merge_page(overlay(person, float(template.mediabox.width), float(template.mediabox.height)))
        writer.add_page(page)
        safe = ''.join(ch for ch in str(person['name']) if ch.isalnum() or ch in ' _-').strip().replace(' ', '_')
        one = PdfWriter(); one.add_page(page)
        with open(OUTPUT / f'{safe}.pdf', 'wb') as f: one.write(f)
    # A sample run is deliberately one page; use --all for a combined batch PDF.
    sample = PdfWriter()
    if people:
        sample.add_page(writer.pages[0])
    with open(OUTPUT / 'sample-certificate.pdf', 'wb') as f: sample.write(f)
    if args.all:
        with open(OUTPUT / 'all-certificates.pdf', 'wb') as f: writer.write(f)
    print(f'Generated {len(people)} certificate(s) in {OUTPUT}')

if __name__ == '__main__': main()
