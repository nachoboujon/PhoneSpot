"""Resize real manufacturer photos without changing product colors."""
import json, hashlib, re, unicodedata
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageChops
from concurrent.futures import ThreadPoolExecutor
base=Path('artifacts/earphones-2026-10-01')
data=json.loads((base/'downloaded-assets.json').read_text(encoding='utf-8'))
out=base/'images';out.mkdir(exist_ok=True)
previous_path=base/'image-manifest.json'
previous=json.loads(previous_path.read_text(encoding='utf-8'))['assets'] if previous_path.exists() else []
previous_by_file={a['file']:a for a in previous}
def slug(s):
    return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFD',s.replace('+',' plus ')).encode('ascii','ignore').decode().lower()).strip('-')
def prepare(asset):
    name=f"{slug(asset['model'])}-{slug(asset['color'])}-{asset['index']+1}.webp"
    cached=previous_by_file.get(name)
    if cached and cached['original']==asset['original'] and (out/name).exists():
        return {**asset,'file':name,'width':cached['width'],'height':cached['height'],'bytes':cached['bytes']}
    with Image.open(base/'originals'/asset['original']) as raw:
        image=ImageOps.exif_transpose(raw).convert('RGBA')
        if min(image.size)<160: raise ValueError(f'Tiny source {name}: {image.size}')
        # Trim only empty/white canvas supplied by the manufacturer.
        white=Image.new('RGBA',image.size,'white');white.alpha_composite(image)
        difference=ImageChops.difference(white.convert('RGB'),Image.new('RGB',image.size,'white'))
        bounds=difference.convert('L').point(lambda p:255 if p>12 else 0).getbbox()
        if bounds:
            left,top,right,bottom=bounds;pad=max(8,int(max(right-left,bottom-top)*.035))
            image=image.crop((max(0,left-pad),max(0,top-pad),min(image.width,right+pad),min(image.height,bottom+pad)))
        image.thumbnail((1200,1200),Image.Resampling.LANCZOS)
        image.save(out/name,'WEBP',quality=85,method=4)
        return {**asset,'file':name,'width':image.width,'height':image.height,'bytes':(out/name).stat().st_size}
def safe_prepare(asset):
    try: return prepare(asset)
    except Exception as error:
        data['errors'].append({'model':asset['model'],'source':asset['source'],'error':str(error)})
        print('REJECTED',asset['model'],str(error))
        return None
with ThreadPoolExecutor(max_workers=5) as pool:
    assets=[a for a in pool.map(safe_prepare,data['assets']) if a]
manifest={'markupUsd':18,'roundToUsd':10,'stockPerVariant':10,'assets':assets,'errors':data['errors']}
(base/'image-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
masters=sorted([a for a in assets if a['index']==0],key=lambda a:(a['model'],a['color']))
for start in range(0,len(masters),48):
    batch=masters[start:start+48];sheet=Image.new('RGB',(1200,((len(batch)+5)//6)*170),'#f4f4f4');draw=ImageDraw.Draw(sheet)
    for idx,a in enumerate(batch):
        image=Image.open(out/a['file']).convert('RGBA');image.thumbnail((195,130));x=(idx%6)*200;y=(idx//6)*170
        sheet.paste(image,(x+(195-image.width)//2,y),image);draw.text((x+3,y+132),a['model'],fill='black');draw.text((x+3,y+146),a['color'],fill='black')
    sheet.save(base/f'earphone-sheet-{start//48+1}.jpg')
print(f"{len(assets)} verified WebP photos, {sum(a['bytes'] for a in assets)//1024} KiB total")
