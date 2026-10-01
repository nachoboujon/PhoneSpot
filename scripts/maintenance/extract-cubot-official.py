"""Read only selected manufacturer ZIP entries; never extract arbitrary archive paths."""
import json,hashlib
from pathlib import Path
from zipfile import ZipFile
base=Path('artifacts/wholesale-2026-10-01');data=json.loads((base/'extra-assets.json').read_text(encoding='utf-8'))
url='https://cubot.net/public/uploads/smartphones/KINGKONG8.zip'
photos=[]
with ZipFile(base/'kingkong8.zip') as archive:
    for order,number in enumerate(['02','01','03']):
        entry=next(n for n in archive.namelist() if n.startswith('KINGKONG8/') and n.endswith('/'+number+'.png') and n.split('/')[1].encode('cp437').decode('utf-8')=='黑')
        source=url+'#KINGKONG8/Black/'+number+'.png';original=hashlib.sha256(source.encode()).hexdigest()[:20]+'.image'
        (base/'originals'/original).write_bytes(archive.read(entry));photos.append(source)
data['assets']=[a for a in data['assets'] if a['model']!='KingKong 8']
data['assets'].append({'model':'KingKong 8','color':'Negro','officialColor':'Black','source':photos[0],'sources':photos,'page':'https://cubot.net/Support/id/106/cid/20?l=en-us'})
(base/'extra-assets.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Three official CUBOT photos prepared')
