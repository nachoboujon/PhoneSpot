"""Extract the source cards and JPEGs from the supplied wholesale PDF.

Run with the bundled Codex Python runtime, which includes pdfplumber.
This script only prepares local data; import-iphone-list.js publishes it.
"""

import json
import re
import sys
from pathlib import Path

import pdfplumber


source = Path(sys.argv[1])
output = Path(sys.argv[2])
images_dir = output.parent / "iphone-list-images"
images_dir.mkdir(parents=True, exist_ok=True)

cards = []
with pdfplumber.open(source) as pdf:
    for page_number, page in enumerate(pdf.pages, 1):
        photos = [image for image in page.images if abs(image["width"] - 80) < 0.01 and abs(image["height"] - 80) < 0.01]
        photos.sort(key=lambda image: (round(image["top"]), image["x0"]))
        for index, photo in enumerate(photos):
            row, col = divmod(index, 5)
            next_top = photos[index + 5]["top"] if index + 5 < len(photos) else page.height - 20
            left = 40 + 151 * col
            right = min(left + 146, page.width)
            block = page.crop((left, photo["bottom"], right, next_top))
            raw = block.extract_text() or ""
            prices = re.findall(r"USD\s*(\d+(?:[.,]\d+)?)", raw)
            if len(prices) != 1:
                raise ValueError(f"Page {page_number} card {index + 1}: expected one price, found {prices}: {raw!r}")
            image_name = f"iphone-p{page_number:02d}-{index + 1:02d}.jpg"
            image_bytes = photo["stream"].get_data()
            (images_dir / image_name).write_bytes(image_bytes)
            cards.append({
                "page": page_number,
                "card": index + 1,
                "battery": "100%" if page_number <= 5 else "80%",
                "raw": raw,
                "wholesale_usd": float(prices[0].replace(",", ".")),
                "image": image_name,
            })

output.write_text(json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {len(cards)} cards, {len(cards)} photos -> {output}")
