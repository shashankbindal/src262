import sys
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from copy import deepcopy

template, output, name, src, page_no = sys.argv[1:]
reader = PdfReader(template)
page = deepcopy(reader.pages[int(page_no)])
w,h=float(page.mediabox.width),float(page.mediabox.height)
size=min(20,max(15,int(330/max(1,len(name)*.52))))
x=421-(len(name)*size*.52)/2
esc=lambda s:str(s).replace('\\','\\\\').replace('(','\\(').replace(')','\\)')
c=f'BT /F1 {size} Tf {x:.1f} 320 Td ({esc(name)}) Tj ET BT /F1 10 Tf 376 112 Td ({esc(src)}) Tj ET'.encode()
objs=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w} {h}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'.encode(),b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',b'<< /Length '+str(len(c)).encode()+b' >>\nstream\n'+c+b'\nendstream']
pdf=b'%PDF-1.4\n'; offsets=[]
for i,o in enumerate(objs,1): offsets.append(len(pdf)); pdf+=f'{i} 0 obj\n'.encode()+o+b'\nendobj\n'
xref=len(pdf); pdf+=f'xref\n0 {len(objs)+1}\n0000000000 65535 f \n'.encode()+b''.join(f'{o:010d} 00000 n \n'.encode() for o in offsets)+f'trailer << /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF'.encode()
overlay=PdfReader(BytesIO(pdf)).pages[0]; page.merge_page(overlay)
writer = PdfWriter(); writer.add_page(page)
with open(output, 'wb') as f: writer.write(f)
