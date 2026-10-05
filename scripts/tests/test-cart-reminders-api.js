// All provider/database calls are fixtures, including dotenv credentials.
const assert=require('node:assert/strict');const jwt=require('jsonwebtoken');
process.env.VERCEL='1';process.env.JWT_SECRET='fixture-only-secret';process.env.CART_REMINDERS_ENABLED='true';
process.env.CART_REMINDER_CRON_SECRET='fixture-cron-secret-with-more-than-32-chars';process.env.RESEND_API_KEY='fixture';
const originalFetch=global.fetch;
global.fetch=(url,options)=>String(url).startsWith('https://dolarapi.com/') ? Promise.resolve({ok:true,json:async()=>({venta:1000})}) : originalFetch(url,options);
let received,ownerConflict=false;
const modulePath=require.resolve('@supabase/supabase-js');
require.cache[modulePath]={id:modulePath,filename:modulePath,loaded:true,exports:{createClient:()=>({
    from:()=>{let id;const q={select:()=>q,eq:(_column,value)=>{id=value;return q;},single:async()=>({data:{id,role:'client',session_version:0},error:null})};return q;},
    rpc:async(name,args)=>{received={name,args};return {data:name==='claim_cart_reminders'?[]:true,error:ownerConflict?{message:'Carrito asociado a otro cliente'}:null};},
    storage:{from:()=>({download:async()=>({data:null,error:{message:'Fixture settings unavailable'}})})}
})}};
const {reminderEmail}=require('../../lib/cart-reminders');const app=require('../../server');
async function main(){const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const base='http://127.0.0.1:'+server.address().port;
const cart='11111111-1111-4111-8111-111111111111';
const session=id=>jwt.sign({id,role:'client',sessionVersion:0},process.env.JWT_SECRET,{issuer:'phonespot',audience:'phonespot-web'});
const post=(body={},token=session(1))=>fetch(base+'/api/cart/'+cart+'/reminder',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
try{
    assert.equal((await post({},'')).status,401);
    assert.equal((await post({enabled:'yes'})).status,400);
    const response=await post();assert.equal(response.status,200);assert.equal((await response.json()).enabled,true);
    assert.deepEqual(received.args,{p_cart_id:cart,p_user_id:1,p_enabled:null});
    await post({enabled:false});assert.equal(received.args.p_enabled,false);
    ownerConflict=true;assert.equal((await post()).status,409);ownerConflict=false;
    const mail=reminderEmail({id:'fixture',cart_id:cart,user_id:1,payload:{email:'fixture@example.invalid',expires_at:new Date(Date.now()+60000).toISOString(),items:[]}}, {publicAppUrl:base,jwtSecret:process.env.JWT_SECRET});
    const token=new URL(mail.html.match(/href="([^"]+)/)[1]).searchParams.get('reminder');
    const restore=(token,id=1)=>fetch(base+'/api/cart-reminders/restore?token='+encodeURIComponent(token),{headers:{Authorization:'Bearer '+session(id)}});
    assert.deepEqual(await (await restore(token)).json(),{cart_id:cart});assert.equal((await restore(token,2)).status,403);
    assert.equal((await restore(session(1))).status,410,'A login token is not a cart restoration token');
    const expired=jwt.sign({purpose:'cart-reminder',cart,sub:'1',exp:1},process.env.JWT_SECRET,{issuer:'phonespot',audience:'phonespot-cart-reminder'});
    assert.equal((await restore(expired)).status,410);
    const cron=secret=>fetch(base+'/api/internal/cart-reminders',{method:'POST',headers:{Authorization:'Bearer '+secret}});
    assert.equal((await cron('wrong')).status,401);assert.equal((await cron('é'.repeat(44))).status,401);
    const result=await cron(process.env.CART_REMINDER_CRON_SECRET);assert.equal(result.status,200);assert.equal((await result.json()).sent,0);
    console.log('Reminder API authentication, preference validation, cart ownership, restoration expiry and scheduler protection passed.');
}finally{await new Promise(resolve=>server.close(resolve));}}
main().catch(error=>{console.error(error);process.exitCode=1;});
