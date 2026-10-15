const assert = require('node:assert/strict');
const {catalogCandidates, catalogFacets, dimension} = require('../../public/store-business');
const phones = [{name:'Samsung Galaxy',brand:'Samsung',category:'celulares',variants:[
    {ram:'8 GB',capacity:'128GB',price:200,stock:0,condition:'Nuevo'},
    {ram:'12GB',capacity:'256 GB',price:300,stock:2,condition:'Nuevo'}
]}];
const products = [...phones,{name:'Lenovo IdeaPad',brand:'Lenovo',category:'notebooks',variants:[{ram:'8GB',capacity:'512GB',price:500,stock:1}]},
    {name:'Lattafa Khamrah',brand:'Lattafa',category:'perfumes',variants:[{capacity:'100 ml',price:30,stock:10}]}];
assert.equal(dimension('8 GB'),'8GB');
assert.equal(dimension('100ML'),'100 ml');
assert.equal(catalogCandidates(phones[0],{ram:'8GB',capacity:'256GB'}).length,0,'Never combine different variants');
assert.equal(catalogCandidates(phones[0],{ram:'12 GB',capacity:'256GB',stock:true}).length,1);
assert.equal(catalogCandidates(phones[0],{ram:'8GB',stock:true}).length,0,'Respect variant stock');
assert.equal(catalogCandidates(phones[0],{min:250,max:350,rate:1}).length,1);
assert.deepEqual(catalogFacets(products,{categories:['notebooks']},'brands').map(x=>x.value),['lenovo']);
assert.deepEqual(catalogFacets(products,{categories:['perfumes']},'ram'),[]);
assert.deepEqual(catalogFacets(products,{categories:['celulares'],ram:'8GB'},'capacity').map(x=>x.value),['128GB']);
assert.deepEqual(catalogFacets(products,{categories:['celulares'],brands:['samsung']},'brands').map(x=>x.value),['samsung']);
assert.equal(catalogFacets(phones,{},'conditions')[0].count,1,'Count products, not variant duplicates');
assert.equal(catalogCandidates(phones[0],{offer:true}).length,0);
assert.equal(catalogCandidates({...phones[0],commercial_type:'americano'},{conditions:['nuevo']}).length,0);
assert.equal(catalogCandidates(phones[0],{query:'Samsung 256GB'}).length,1,'Storage searches accept spaces in the source');
assert.equal(catalogCandidates(phones[0],{query:'Samsung 256'}).length,1);
console.log('Catalog filters: passed');
