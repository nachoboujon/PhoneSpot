import json,re,hashlib,urllib.request
from pathlib import Path
from PIL import Image,ImageDraw
from concurrent.futures import ThreadPoolExecutor
base=Path('artifacts/categories-2026-10-02');out=base/'research'/'cidea';out.mkdir(exist_ok=True)
products=json.loads((base/'research/cidea-catalog.json').read_text())
ids=['cm516','cm936','cm78','cm817','cm824','cm88','cm89']
candidates=[p for p in products if any(re.search(i+r'(?!\d)',p['page'],re.I) for i in ids) and p['images']]
def download(pair):
    idx,p=pair;file=out/f'{idx}.jpg'
    try:
        if not file.exists(): file.write_bytes(urllib.request.urlopen(p['images'][0],timeout=15).read())
        im=Image.open(file);im.thumbnail((180,140));return idx,im.copy()
    except Exception as e:print(idx,str(e));return idx,None
results=list(ThreadPoolExecutor(max_workers=6).map(download,enumerate(candidates)))
for start in range(0,len(results),48):
    sheet=Image.new('RGB',(1200,1360),'white');draw=ImageDraw.Draw(sheet)
    for pos,(idx,im) in enumerate(results[start:start+48]):
        x=pos%6*200;y=pos//6*170
        if im:sheet.paste(im,(x+(190-im.width)//2,y))
        draw.text((x,y+142),str(idx)+' '+next(i for i in ids if re.search(i+r'(?!\d)',candidates[idx]['page'],re.I)),fill='black')
    sheet.save(out/f'sheet-{start//48+1}.jpg')
(out/'candidates.json').write_text(json.dumps(candidates,indent=2))
print(len(candidates),'candidate pages')
