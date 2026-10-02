const fs=require('fs'),base='artifacts/earphones-2026-10-01';
const sets=JSON.parse(fs.readFileSync(`${base}/photo-sets.json`));
function add(model,color,page,sources,officialColor=color){const old=sets.findIndex(s=>s.model===model&&s.color===color);if(old>=0)sets.splice(old,1);sets.push({model,color,page,officialColor,sourceType:'manufacturer',sources});}
const p='https://www.jbl.com.au/true-wireless/ENDURANCE-PEAK-4.html?dwvar_ENDURANCE-PEAK-4_color=Black%20%2F%20Lime-GLOBAL-Current';
const jbl='https://www.jbl.com.ar/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/';
add('JBL Endurance Peak 4','Negro',p,[jbl+'dw55d88ca5/01.LS_JBL_Endurance_Peak_4_Product_Image_Hero_Black_Lime.png',jbl+'dw3479fc39/LS_JBL_Endurance_Peak_4_Product_Image_Earbuds_Black%26Lime.png',jbl+'dw1eead6a3/LS_JBL_Endurance_Peak_4_Product_Image_Case_Front_Black%26Lime.png'].map(u=>u+'?sw=1200&sh=1200'),'Black / Lime');
add('Samsung Type-C','Negro','https://shop.samsung.com/latin/cac/sv/type-c-earphones-eo-ic100bbegww-1.html',['eo-ic100_001_dynamic_black_thumb_2.png','eo-ic100_006_dynamic4_black_4.png'].map(f=>'https://shop.samsung.com/latin/cac/pub/media/catalog/product/e/o/'+f));
for(const [color,official]of [['Blanco','White'],['Negro','MidnightBlack']]){
 const page='https://www.playstation.com/en-gb/accessories/pulse-explore-wireless-earbuds/product/midnight-black/';
 const asset=`https://gmedia.playstation.com/is/image/SIEPDC/Pulse-Explore-Earbuds-${official}`;
 add('Sony PULSE Explore',color,page,[asset+'-01-1x1-01-28feb26$en',asset+'-01-28x9-01-28feb26$en',asset+'-03-28x9-01-28feb26$en',asset+'-04-28x9-01-28feb26$en'].map(u=>u+'?wid=1200&fmt=png-alpha'),official);
}
const colors={Blanco:'#eeeeeb',Negro:'#25262a',Rojo:'#c7434b',Azul:'#334f8b',Celeste:'#92bdcc',Turquesa:'#256e83',Lavanda:'#8d7ab9',Morado:'#9780bc',Rosa:'#d9a3b2'};
for(const s of sets){if(!s.rgb)s.rgb=colors[s.color];if(s.model==='JBL Tune Flex 2'&&s.color==='Celeste')s.rgb='#256e83';if(s.model==='JBL Soundgear Clips'&&s.color==='Azul')s.rgb='#39429c';}
if(sets.length!==41)throw Error(`Missing color gallery: ${sets.length}`);
// Discard alternate exports of the same front view, reviewed in the contact sheets.
for(const s of sets){
 if(['JBL Tune 520BT','JBL Tune 720BT','JBL Tune 770NC'].includes(s.model))s.sources=s.sources.filter((_,i)=>i!==2);
 if(s.model==='JBL Tune 520C')s.sources=s.sources.filter((_,i)=>i!==4);
 if(s.model==='Sony PULSE Explore')s.sources=s.sources.filter((_,i)=>i!==1);
}
fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(sets,null,2)+'\n');
fs.writeFileSync(`${base}/pending-photos.json`,'[]\n');console.log('41 manufacturer color galleries selected');
