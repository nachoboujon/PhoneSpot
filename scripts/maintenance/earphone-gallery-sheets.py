import json
from pathlib import Path
from PIL import Image,ImageDraw
b=Path('artifacts/earphones-2026-10-01')
data=json.loads((b/'image-manifest.json').read_text(encoding='utf8'))['assets']
groups={}
for a in data: groups.setdefault((a['model'],a['color']),[]).append(a)
rows=sorted(groups.items())
for start in range(0,len(rows),10):
    sheet=Image.new('RGB',(1200,210*min(10,len(rows)-start)),'white');d=ImageDraw.Draw(sheet)
    for ri,((model,color),assets) in enumerate(rows[start:start+10]):
        d.text((8,ri*210),model+' / '+color,fill='black')
        for ci,a in enumerate(sorted(assets,key=lambda a:a['index'])):
            im=Image.open(b/'images'/a['file']).convert('RGBA');im.thumbnail((190,170))
            sheet.paste(im,(ci*200+(190-im.width)//2,ri*210+25),im)
            d.text((ci*200+5,ri*210+195),str(a['index']),fill='black')
    sheet.save(b/f'gallery-sheet-{start//10+1}.jpg')
