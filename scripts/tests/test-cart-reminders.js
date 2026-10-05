// Isolated mail and database fixtures: no external messages or writes.
const assert=require('node:assert/strict');
const jwt=require('jsonwebtoken');
const {reminderEmail,reminderAudience,createCartReminderRunner}=require('../../lib/cart-reminders');
const options={publicAppUrl:'https://example.invalid',jwtSecret:'fixture-only-secret'};
const job={id:'delivery-1',cart_id:'11111111-1111-4111-8111-111111111111',user_id:42,lease_token:'lease-1',payload:{
    email:'fixture@example.invalid',name:'<Cliente>',expires_at:new Date(Date.now()+1800000).toISOString(),
    items:[{name:'<script>alert(1)</script>',variant_name:'Negro & Blanco',quantity:2}]
}};
async function main(){
    const mail=reminderEmail(job,options);
    assert(!mail.html.includes('<script>'));assert(mail.html.includes('&lt;Cliente&gt;'));
    assert(mail.html.includes('Negro &amp; Blanco'));assert(mail.html.includes('Cantidad: 2'));
    assert.deepEqual(reminderEmail(job,options),mail,'Retry email and idempotency key must remain identical');
    const token=new URL(mail.html.match(/href="([^"]+)/)[1].replaceAll('&amp;','&')).searchParams.get('reminder');
    const payload=jwt.verify(token,options.jwtSecret,{issuer:'phonespot',audience:reminderAudience});
    assert.equal(payload.sub,'42');assert.equal(payload.cart,job.cart_id);assert.equal(payload.exp,Math.floor(Date.parse(job.payload.expires_at)/1000));
    assert.throws(()=>jwt.verify(token,options.jwtSecret,{audience:'phonespot-web'}));
    let valid=true,accepted=false,sends=0;const finished=[];
    const db={rpc:async(name,args)=>({data:name==='claim_cart_reminders'?[job]:name==='validate_cart_reminder'?valid:(finished.push(args),true),error:null})};
    const run=createCartReminderRunner({...options,db,sendEmail:async(to,subject,html,settings)=>{sends++;assert.equal(settings.idempotencyKey,mail.idempotencyKey);return accepted;}});
    assert.deepEqual(await run(),{sent:0,failed:1,skipped:0});assert.equal(finished[0].p_sent,false);
    accepted=true;assert.deepEqual(await run(),{sent:1,failed:0,skipped:0});assert.equal(finished[1].p_sent,true);
    valid=false;assert.deepEqual(await run(),{sent:0,failed:0,skipped:1});assert.equal(sends,2,'Consumed reservations must not receive mail');
    let release;const blocked=new Promise(resolve=>{release=resolve;});
    const concurrent=createCartReminderRunner({...options,db:{rpc:async()=>{await blocked;return {data:[],error:null};}},sendEmail:async()=>true});
    const first=concurrent();assert.equal((await concurrent()).busy,true);release();await first;
    console.log('Reminder content, token scope, retries, cancelled reservations and concurrent runner passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
