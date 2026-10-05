const assert=require('node:assert/strict');
const business=require('../../public/store-business');
const {productSeo,condition}=require('../../lib/product-seo');
const phone={category:'celulares'};
for(const [quantity,price] of [[1,100],[3,95],[5,93],[10,90]]) assert.equal(business.unitPrice(100,quantity,phone),price);
assert.equal(business.unitPrice(4,10,phone),1);
assert.equal(business.unitPrice(100,10,{category:'accesorios'}),100);
for (const category of ['notebooks', 'tablets', 'audio', 'relojes', 'consolas', 'accesorios', '', undefined]) {
    assert.equal(business.eligible({category, name:'iPhone'}), false);
    assert.equal(business.unitPrice(100,10,{category}),100);
}
assert.equal(business.eligible({category:' Celulares '}),true);
assert.equal(business.eligible(null),false);
const mixedCart = [{category:'celulares',quantity:2}, {category:'notebooks',quantity:10}, {category:'tablets',quantity:5}];
const phoneCount = mixedCart.filter(business.eligible).reduce((sum,item)=>sum+item.quantity,0);
assert.equal(business.discount(phoneCount),0,'Other products must not unlock phone quantity tiers');
mixedCart[0].quantity=3;
const eligibleCount=mixedCart.filter(business.eligible).reduce((sum,item)=>sum+item.quantity,0);
assert.deepEqual(mixedCart.map(item=>business.unitPrice(100,eligibleCount,item)),[95,100,100]);
assert.ok(business.matches({name:'Teléfono Samsung',variants:[{ram:'8GB',capacity:'256GB'}]},'telefono 256'));
assert.equal(condition('Americano'),'https://schema.org/UsedCondition');
assert.equal(condition('Garantía oficial de Apple'),undefined,'Warranty is not proof of new condition');
const seo=productSeo({id:1,name:'iPhone',price:500,stock:4,category:'celulares',description:'',variants:[{color:'Negro',condition:'Americano',price:400,stock:2},{color:'Blanco',condition:'Garantía oficial de Apple',price:500,stock:2}]},'americano');
assert.match(seo.pageUrl,/tipo=americano/);
assert.equal(seo.selected.price,400);
assert.equal(seo.schema['@type'],'ProductGroup');
assert.equal(seo.schema.hasVariant[0].offers.itemCondition,'https://schema.org/UsedCondition');
assert.ok(!seo.schema.hasVariant[1].offers.itemCondition);
console.log('Quantity tiers, search normalization and commercial variant SEO passed.');
