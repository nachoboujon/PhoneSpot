import json
from pathlib import Path
import pdfplumber

base = Path('artifacts/categories-2026-10-02')
base.mkdir(parents=True, exist_ok=True)
for category, filename in [('tablets','TABLETS MAYORISTA.pdf'),('speakers','PARLANTES MAYORISTA.pdf'),('watches','SMARTWATCH MAYORISTA.pdf'),('consoles','PRODUCTOS GAMER MAYORISTA.pdf')]:
    cards = []
    with pdfplumber.open(Path('C:/Users/Nacho/Downloads') / filename) as pdf:
        for page_number, page in enumerate(pdf.pages, 1):
            for word in page.extract_words():
                if word['text'] != 'USD':
                    continue
                column = round((word['x0'] - 100) / 150.75)
                left = 30 + 150.75 * column
                text = page.crop((left,max(0,word['top']-85),left+140.75,word['bottom']+3)).extract_text()
                cards.append({'page':page_number,'column':column,'priceTop':word['top'],'text':text})
    cards.sort(key=lambda c:(c['page'],round(c['priceTop']/5),c['column']))
    (base / f'{category}-source.json').write_text(json.dumps(cards,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(category, len(cards))
