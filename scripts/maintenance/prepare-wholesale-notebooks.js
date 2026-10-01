// Supplier text remains the specification authority; photos are sourced separately.
const fs = require('node:fs');
const base = 'artifacts/notebooks-2026-10-01';
const source = JSON.parse(fs.readFileSync(`${base}/source-cards.json`, 'utf8'));
// Model, photographed/listed color, RAM, processor. Configuration belongs inside the product.
const definitions = [
['Acer Aspire 15 A15-51M','Gris','16 GB','Intel Core i9-13900H'],
['Acer Aspire 3 A315-24PT','Plata','8 GB','AMD Ryzen 3'],
['Acer Aspire Go 15 AG15-42P','Plata','16 GB','AMD Ryzen 7 7730U'],
['Acer Aspire Go 15 AG15-42P','Gris','16+32 GB (lista del proveedor)','AMD Ryzen 7 5825U'],
['Acer Aspire Go 15 AG15-42P','Plata','32 GB','AMD Ryzen 7 7730U'],
['Acer Aspire Go 15 AG15-72P','Plata','16 GB','Intel Core i9-13900H'],
['Acer Aspire Lite AL15-43P','Plata','16 GB','AMD Ryzen 7 5825U'],
['Acer EtBook Yoga CWI557','Gris','8 GB','Intel Core i3-1315U'],
['Acer Nitro V 15 ANV15-41','Negro','8 GB','AMD Ryzen 5 7535H'],
['Acer Nitro V 15 ANV15-52','Negro','16 GB','Intel Core i5'],
['ASUS Vivobook 15 F1502V','Azul','16 GB','Intel Core i9-13900H'],
['ASUS ROG Strix G16 G615J','Negro','16 GB','Intel Core i7-14650HX'],
['ASUS ROG Strix G16 G614F','Gris','16 GB','AMD Ryzen 9'],
['ASUS TUF Gaming F16 FX607VU','Negro','8 GB','Intel Core i5'],
['ASUS Vivobook Go 15 E1504F','Negro','8 GB','AMD Ryzen 3 7320U'],
['ASUS Vivobook Go 15 E1504F','Negro','16 GB','AMD Ryzen 5 7520U'],
['ASUS Vivobook Go 15 E1504GA','Plata','8 GB','Intel Core i3-N305'],
['ASUS Vivobook 15 X1504VA','Plata','8 GB','Intel Core 3 100U'],
['ASUS Zenbook 14 UX3405C','Negro','8 GB','Intel Core Ultra 7'],
['Audisat X99','Negro','8 GB','Intel N95'],
['Dell 15 DC15250','Negro','8 GB','Intel Core i7-1355U'],
['Dell 15 DC15250','Negro','8 GB','Intel Core i5'],
['Dell 15 DC15250','Negro','16 GB','Intel Core i5-1334U'],
['Dell 15 DC15250','Negro','8 GB','Intel Core i5-1334U'],
['Dell 16 DC16250','Azul','32 GB','Intel Core Ultra 9'],
['Dell 15 DC15255','Negro','8 GB','AMD Ryzen 3'],
['Dell Inspiron 16 5640','Azul','16 GB','Intel Core i7'],
['Dell Latitude 7430','Negro','16 GB','Intel Core i7-1265U'],
['Dell Latitude 7455','Negro','16 GB','Qualcomm Snapdragon'],
['Dell 15 D15260','Negro','16 GB','Intel Core Ultra 5 225U'],
['Dell Alienware 15 DA15265','Negro','16 GB','AMD Ryzen 5 220'],
['Dell Alienware 15 DA15265','Negro','16 GB','AMD Ryzen 7 260'],
['Dell 15 DC15250','Negro','16 GB','Intel Core i5-1334U'],
['HP Laptop 14-dq6105dx','Plata','4 GB','Intel N150'],
['HP Laptop 14-ep0355cl','Plata','16 GB','Intel Core 5 120U'],
['HP Laptop 15-dy5009la','Plata','8 GB','Intel Core i7-1255U'],
['HP Laptop 15-fc0146dx','Plata','8 GB','AMD Ryzen 5 7520U'],
['HP Laptop 15-fd0084wm','Gris','4 GB','Intel N200'],
['HP Laptop 15-fd0133wm','Plata','8 GB','Intel Core i3-N305'],
['HP Laptop 15-fd0150wn','Plata','8 GB','Intel Core 5 120U'],
['HP Laptop 15-fd0153wm','Plata','8 GB','Intel Core i5-1334U'],
['HP Laptop 15-fd0173wm','Plata','8 GB','Intel Core i7-1255U'],
['HP Laptop 15-fd0182wn','Gris','16 GB','Intel Core i7-1355U'],
['HP Laptop 15-fd2050wm','Plata','8 GB','Intel Core Ultra 5 225U'],
['HP Laptop 15t-fd000','Negro','12 GB','Intel Core i7-1355U'],
['HP Laptop 15t-fd200','Negro','8 GB','Intel Core Ultra 5 225U'],
['HP Laptop 17t-cn300','Negro','8 GB','Intel Core i5-1335U'],
['HP EliteBook 840 G8','Plata','16 GB','Intel Core i7 (11.ª generación)'],
['HP EliteBook 850 G7','Plata','8 GB','Intel Core i5 (10.ª generación)'],
['HP Victus 15-fb3113dx','Negro','8 GB','AMD Ryzen 5 7535HS'],
['HP OmniBook 3 15-fn0505nr','Plata','16 GB','AMD Ryzen 5 340'],
['HP Victus 15-fa2013dx','Negro','8 GB','Intel Core i5-13420H'],
['HP Victus 15-fb3093dx','Negro','16 GB','AMD Ryzen 7'],
['Lenovo IdeaPad Slim 3 15IAN8','Gris','4 GB','Intel N100'],
['Lenovo IdeaPad 1 15AMN7','Azul','8 GB','AMD Ryzen 5 7520U'],
['Lenovo IdeaPad Slim 3 15AMN8','Azul','8 GB','AMD Ryzen 5 (40, según proveedor)'],
['Lenovo IdeaPad Flex 5 15ITL05','Gris','8 GB','Intel Core i5-1135G7'],
['Lenovo IdeaPad Pro 5 16IAH10','Gris','32 GB','Intel Core Ultra 9 285H'],
['Lenovo IdeaPad Slim 3 15AMN8','Azul','8 GB','AMD Ryzen 5 (40, según proveedor)'],
['Lenovo IdeaPad Slim 3 15IRU8','Gris','8 GB','Intel Core i5-1334U'],
['Lenovo IdeaPad Slim 3 15IRU8','Plata','16 GB','Intel Core i5-1335U'],
['MSI Cyborg 15 A12VF','Negro','16 GB','Intel Core i7-12650H'],
['MSI Cyborg 15 B2RWFKG','Negro','16 GB','Intel Core 5 210H'],
['MSI Cyborg A15 AI B2HWEKG','Negro','16 GB','AMD Ryzen 7 260'],
['MSI Thin A15 B7VE','Negro','8 GB','AMD Ryzen 5 7535HS'],
['Samsung Galaxy Book4 NP750XGJ','Plata','16 GB','Intel Core i5-1335U']
];
if (source.length !== definitions.length) throw new Error('Incomplete source extraction');
const rows = source.map((card, i) => {
 const [model,color,ram,processor] = definitions[i];
 const text = card.text.replace(/\n/g,' ');
 const wholesaleUsd = Number(text.match(/USD\s+(\d+)/)[1]);
 const capacity = text.match(/-\s*(\d+\s*(?:GB|TB))\s+USD/i)[1].replace(/\s/g,'');
 const screen = text.match(/(\d{2}(?:\.\d)?)\s*[”"]/i)?.[1] || '';
 const touch = /TOUCH|Multi.touch/i.test(text);
 const gpu = text.match(/RTX\s*\d+(?:\/\d+GB|\s+\d+\s*GB)?/i)?.[0] || '';
 return {sourcePage:card.page,sourceIndex:i+1,sourceText:card.text,model,brand:model.split(' ')[0],color,ram,capacity,processor,screen,touch,gpu,os:/W11|WIN 11/i.test(text)?(/PRO/i.test(text)?'Windows 11 Pro':'Windows 11'):'',configuration:[processor,touch?'Pantalla táctil':'',gpu].filter(Boolean).join(' · '),condition:'Nuevo, Caja Sellada',batt:'',stock:10,wholesaleUsd,price:Math.floor((wholesaleUsd+50)/10)*10};
});
const keys=rows.map(r=>[r.model,r.color,r.configuration,r.capacity,r.ram].join('|'));
if(new Set(keys).size!==rows.length)throw new Error('Variant collision');
fs.writeFileSync(`${base}/notebooks.json`,JSON.stringify(rows,null,2)+'\n');
console.log(rows.length,'variants in',new Set(rows.map(r=>r.model)).size,'models; +45 USD, rounded to nearest 10 USD');
