import json
from pathlib import Path
from PIL import Image, ImageDraw
base=Path('artifacts/misiones-samsung-2026-10-05')
rows=json.loads((base/'ready.json').read_text(encoding='utf-8'))
for file in {p['file'] for r in rows for p in r['photos']}:
    target=base/file
    with Image.open(target) as original:
        if original.format!='JPEG' or max(original.size)>1200:
            rgba=original.convert('RGBA')
            normalized=Image.new('RGB',rgba.size,'white')
            normalized.paste(rgba,mask=rgba.getchannel('A'))
            normalized.thumbnail((1200,1200))
            normalized.save(target,format='JPEG',quality=92,optimize=True)
unique={}
for r in rows:
    unique[(r['model'],r['color'])]=r
items=list(unique.values())
for part in range(0,len(items),16):
    chunk=items[part:part+16]
    sheet=Image.new('RGB',(1200,330*((len(chunk)+3)//4)),'white')
    draw=ImageDraw.Draw(sheet)
    for n,r in enumerate(chunk):
        x=(n%4)*300;y=(n//4)*330
        im=Image.open(base/r['photos'][0]['file']).convert('RGB');im.thumbnail((280,260))
        sheet.paste(im,(x+(300-im.width)//2,y+5))
        draw.text((x+5,y+270),r['model'].replace('Samsung Galaxy ','Galaxy ')+'\n'+r['color']+' / '+r['officialColor'],fill='black')
    sheet.save(base/f'review-{part//16+1}.jpg')
print('Created photo review sheets for',len(items),'model/color combinations')
