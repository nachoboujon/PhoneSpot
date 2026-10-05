// Fixtures only: real providers and production data are never written.
const assert=require('node:assert/strict');const jwt=require('jsonwebtoken');
const {classifyDevice,deviceVisits}=require('../../lib/site-analytics');
process.env.VERCEL='1';process.env.JWT_SECRET='device-analytics-fixture';
const originalFetch=global.fetch;global.fetch=(url,options)=>String(url).startsWith('https://dolarapi.com/')?Promise.resolve({ok:true,json:async()=>({venta:1000})}):originalFetch(url,options);
let role='client',inserted,fail=false,reads=0;
function from(table){
    const filters={};const q={select:()=>q,eq:(key,value)=>{filters[key]=value;return q;},gte:()=>q,in:()=>q,order:()=>q,limit:()=>q,
        single:async()=>({data:{id:1,role,session_version:0},error:null}),
        insert:async(rows)=>{inserted=rows[0];return {error:null};},
        then(resolve){reads++;const visit=filters['metadata->>visit_start']==='true';const device=filters['metadata->>device_type'];return Promise.resolve({data:[],count:visit?({mobile:12000,tablet:20,desktop:80}[device]??12103):77,error:fail?{message:'Fixture database error'}:null}).then(resolve);}};
    return q;
}
const modulePath=require.resolve('@supabase/supabase-js');require.cache[modulePath]={id:modulePath,filename:modulePath,loaded:true,exports:{createClient:()=>({from,storage:{from:()=>({download:async()=>({data:null,error:{message:'Fixture'}})})}})}};
const app=require('../../server');
async function main(){
    for(const [ua,hint,result] of [['iPhone Mobile',undefined,'mobile'],['Android Mobile',undefined,'mobile'],['Android',undefined,'tablet'],['iPad',undefined,'tablet'],['Macintosh','tablet','tablet'],['Macintosh',undefined,'desktop'],['Windows NT',undefined,'desktop'],['Linux X11',undefined,'desktop'],['Googlebot',undefined,'unknown'],['',undefined,'unknown'],['iPhone Mobile','desktop','mobile']])assert.equal(classifyDevice(ua,hint),result);
    const counts=await deviceVisits({from},new Date().toISOString());assert.equal(counts.total,12103);assert.deepEqual(counts.devices,{mobile:12000,tablet:20,desktop:80,unknown:3});
    fail=true;await assert.rejects(deviceVisits({from},new Date().toISOString()));fail=false;
    const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
    const token=jwt.sign({id:1,role:'admin',sessionVersion:0},process.env.JWT_SECRET,{issuer:'phonespot',audience:'phonespot-web'});
    const admin=auth=>fetch(base+'/api/admin/analytics',{headers:auth?{Authorization:'Bearer '+auth}:{}});
    try {
        const previousReads=reads;assert.equal((await admin()).status,401);assert.equal((await admin(token)).status,403,'A forged/stale admin claim cannot override the database role');assert.equal(reads,previousReads);
        role='admin';const response=await admin(token);assert.equal(response.status,200);assert.equal((await response.json()).visits.devices.mobile,12000);
        const event=body=>fetch(base+'/api/events',{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Mozilla iPhone Mobile'},body:JSON.stringify(body)});
        assert.equal((await event({event_type:'page_view',page_path:'/index.html',visit_start:true,device_type:'desktop',email:'private@example.invalid',metadata:{secret:'private'}})).status,204);
        assert.deepEqual(inserted.metadata,{device_type:'mobile',visit_start:true});assert.equal(inserted.page_path,'/index.html');
        await event({event_type:'page_view',visit_start:'true'});assert.equal(inserted.metadata.visit_start,false);
        await event({event_type:'search',query_length:4,visit_start:true});assert.deepEqual(inserted.metadata,{query_length:4});
        console.log('Device classification, complete counts, failure handling, private admin access and sanitized collection passed.');
    }finally{await new Promise(r=>server.close(r));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
