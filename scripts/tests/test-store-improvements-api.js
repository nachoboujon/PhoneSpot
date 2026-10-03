// Isolated backend: database and mail are simulated, no external writes.
const assert=require('node:assert/strict');
process.env.VERCEL='1';process.env.JWT_SECRET='fixture-only-secret';
const settings={custom_dollar_rate:1000,shipping_correo:8500,shipping_andreani:12000,free_shipping_threshold:1500000};
const originalFetch=global.fetch;
global.fetch=(url,options)=>String(url).startsWith('https://dolarapi.com/') ? Promise.resolve({ok:true,json:async()=>({venta:995})}) : originalFetch(url,options);
const cart='11111111-1111-4111-8111-111111111111';const key='22222222-2222-4222-8222-222222222222';
let previous=null;let received;let calls=0;let notifications=0;let sessionVersion=0;
const product={id:73,name:'Fixture',category:'celulares',price:100,stock:8,variants:[]};
function from(table){
    const query={};for(const method of ['select','eq','is','gte','order','limit'])query[method]=()=>query;
    const data=()=>table==='users' ? {id:1,email:'fixture@example.invalid',role:'client',session_version:sessionVersion} : table==='products' ? product : table==='orders' ? previous : table==='cart_reservations' ? [{product_id:73,variant_name:'',quantity:3,expires_at:new Date(Date.now()+86400000).toISOString()}] : [];
    query.single=query.maybeSingle=async()=>({data:data(),error:null});query.then=resolve=>Promise.resolve({data:data(),error:null}).then(resolve);
    query.insert=()=>query;return query;
}
const supabase=require.resolve('@supabase/supabase-js');require.cache[supabase]={id:supabase,filename:supabase,loaded:true,exports:{createClient:()=>({from,rpc:async(name,args)=>{
    if(name==='create_store_order'){calls++;received=args;previous={id:123,total:args.p_order.total,total_ars:args.p_order.total_ars,dollar_rate:1000,cart_id:cart,user_id:null,request_hash:args.p_order.request_hash};return {data:{order:previous,replayed:false},error:null};}
    return {data:0,error:null};
},storage:{from:()=>({download:async()=>({data:{text:async()=>JSON.stringify(settings)},error:null})})}})}};
const nodemailer=require.resolve('nodemailer');require.cache[nodemailer]={id:nodemailer,filename:nodemailer,loaded:true,exports:{createTransport:()=>({sendMail:async()=>{notifications++;return {messageId:'fixture'};}})}};
const app=require('../../server');
async function main(){const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
try {
    const body={idempotency_key:key,cart_id:cart,customer_email:'fixture@example.invalid',customer_name:'Fixture buyer',customer_phone:'3447416011',shipping_address:'Fixture street 123',province:'Entre Ríos',zip_code:'1000',shipping_option:'correo_domicilio',shipping_method:'Correo a domicilio',shipping_cost:0,items:[{product_id:73,quantity:3,price:1}]};
    const send=body=>fetch(base+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const response=await send(body);assert.equal(response.status,201,await response.clone().text());
    assert.equal(received.p_owner,null);assert.equal(received.p_order.shipping_cost_ars,8500,'Client shipping cannot override server quote');
    assert.equal(received.p_order.total_ars,293500);assert.equal(received.p_items[0].price,95,'Quantity discount uses trusted price');
    const retry=await send(body);assert.equal(retry.status,200);assert.equal((await retry.json()).orderId,123);assert.equal(calls,1,'Retries must not create another order');
    const changed=await send({...body,customer_name:'Different buyer'});assert.equal(changed.status,409);
    const jwt=require('jsonwebtoken');const token=jwt.sign({id:1,role:'client',sessionVersion:0},process.env.JWT_SECRET,{issuer:'phonespot',audience:'phonespot-web'});
    sessionVersion=1;const revoked=await fetch(base+'/api/me',{headers:{Authorization:'Bearer '+token}});assert.equal(revoked.status,401,'Password reset must invalidate old sessions');
    console.log('Guest checkout, trusted shipping and prices, idempotent retries and session revocation passed.');
}finally{await new Promise(resolve=>server.close(resolve));}}
main().catch(error=>{console.error(error);process.exitCode=1;});
