const fs=require('fs');const base='artifacts/notebooks-2026-10-01';
const extra=[
['hp-fd-jp','https://jp.ext.hp.com/notebooks/personal/hp_15_fd/'],
['hp-dy5009-shop','https://www.hp.com/pe-es/shop/laptop-hp-15-dy5009la-6h9f1la.html'],
['hp-840g8-adorama','https://www.adorama.com/ihp359z6taba.html'],
['hp-fd0133-mega','https://megaeletronicos.com/producto/1455328/notebook-hp-15-fd0131wm-156-intel-core-i3-n305-de-38ghz-8gb-ram256gb-ssd-prata'],
['hp-840g8-nl','https://sit-direct-store.hpcloud.hp.com/nl-nl/shop/products/laptops/hp-elitebook-840-g8-notebook-pc-3g2g3ea-abh'],
['dell-dc16250-blue','https://www.dell.com/en-ca/shop/laptops-ultrabooks/dell-16-laptop/spd/dell-dc16250-laptop/caedc16250pbtohlfc'],
['samsung-book4-ar','https://shop.samsung.com/ar/galaxy-book4--15-6---i5--16-gb--intel-iris-xe---/p'],
['acer-lite-cl','https://www.acer.com/cl-es/laptops/aspire/aspire-lite/pdp/NX.DAKAL.002'],
['dell-7430-retail','https://www.laptoparena.net/dell/laptop-dell-latitude-7430-x3xf4-black-106254'],
['hp-fd2050-retail','https://megaeletronicos.com/producto/1637182/notebook-hp-15-fd2050wm-156-intel-core-ultra-5-225u-8gb-ram512gb-ssd-prata'],
['hp-fa2013-mauri','https://www.mauricomputacion.com.ar/catalogo/26431-notebook-hp-victus-15-fa2013dx-i5-13420h-8gb-512gb-ssd-rtx-3050-15.6-144hz-gris'],
['acer-lite-alt','https://www.acer.com/gb-en/laptops/aspire/aspire-lite/pdp/NX.JR4EK.003'],
['asus-f1502-fr','https://www.asus.com/fr/laptops/for-home/vivobook/vivobook-15-f1502-12th-gen-intel/'],
['dell-dc16250-us','https://www.dell.com/en-us/shop/dell-laptops/dell-16-laptop/spd/dell-dc16250-laptop'],
['dell-dc15255-us','https://www.dell.com/en-us/shop/dell-laptops/dell-15-laptop/spd/dell-dc15255-laptop'],
['dell-d15260-us','https://www.dell.com/en-us/shop/dell-laptops/dell-15-laptop/spd/dell-d15260-laptop'],
['dell-5640-retail','https://www.primeabgb.com/online-price-reviews-india/dell-inspiron-16-5640-intel-core-i7-150u-16-inch-laptop-16gb-ddr5-ram-512gb-ssd-windows-11-ms-office-21-ice-blue-oin5640152801rinu1o/'],
['hp-840g8-jp','https://jp.ext.hp.com/notebooks/business/elitebook_840_g8/'],
['hp-dy5009-hwt','https://hwtcomputers.com/producto/laptop-hp-15-dy5009la-i7-1255u-2/'],
['hp-victus-fa-retail','https://itubia.com/products/hp-victus-15-fa2013dx-gaming-laptop-rtx-3050'],
['samsung-book4-biz','https://www.samsung.com/cl/business/computers/galaxy-book/galaxy-book4-15-6-inch-13th-core-7-16gb-512gb-np750xgj-ks2cl/buy/']
];
const pages=JSON.parse(fs.readFileSync(`${base}/photo-pages.json`));
for(const [key,page]of extra)if(!pages.some(p=>p.key===key))pages.push({key,page,type:/primeabgb|hwtcomputers|itubia/.test(page)?'retailer':'manufacturer'});
fs.writeFileSync(`${base}/photo-pages.json`,JSON.stringify(pages,null,2)+'\n');
