import json
from pathlib import Path
from PIL import Image,ImageDraw
base=Path('artifacts/categories-2026-10-02')
assets=json.loads((base/'image-manifest.json').read_text(encoding='utf8'))['assets']
assets=sorted([a for a in assets if a['model'].startswith('Cidea')],key=lambda a:(a['model'],a['color'],a['index']))
for start in range(0,len(assets),48):
    sheet=Image.new('RGB',(1200,1360),'white');draw=ImageDraw.Draw(sheet)
    for pos,a in enumerate(assets[start:start+48]):
        im=Image.open(base/'images'/a['file']).convert('RGBA');im.thumbnail((190,135));x=pos%6*200;y=pos//6*170
        sheet.paste(im,(x+(190-im.width)//2,y),im);draw.text((x+3,y+137),a['model']+' '+a['color'],fill='black');draw.text((x+3,y+152),str(a['index'])+' '+a['file'].split('-')[-1],fill='black')
    sheet.save(base/'research'/f'angles-cidea-{start//48+1}.jpg')
