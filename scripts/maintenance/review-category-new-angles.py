import json
from pathlib import Path
from PIL import Image,ImageDraw
base=Path('artifacts/categories-2026-10-02')
assets=json.loads((base/'image-manifest.json').read_text(encoding='utf8'))['assets']
models=["Redmi Pad 2"]
assets=sorted([a for a in assets if a['model'] in models],key=lambda a:(a['model'],a['color'],a.get('configuration',''),a['index']))
for start in range(0,len(assets),48):
    sheet=Image.new('RGB',(1200,1360),'white');draw=ImageDraw.Draw(sheet)
    for pos,a in enumerate(assets[start:start+48]):
        im=Image.open(base/'images'/a['file']).convert('RGBA');im.thumbnail((190,125));x=pos%6*200;y=pos//6*170
        sheet.paste(im,(x+(190-im.width)//2,y),im);draw.text((x+3,y+128),a['model']+' '+a['color'],fill='black');draw.text((x+3,y+143),str(a['index'])+' '+a.get('configuration',''),fill='black')
    sheet.save(base/'research'/f'angles-new-{start//48+1}.jpg')
