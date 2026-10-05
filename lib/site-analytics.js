const deviceTypes=['mobile','tablet','desktop'];
function classifyDevice(userAgent,hint) {
    const ua=String(userAgent || '').slice(0,1000);
    if (/bot|crawler|spider|curl|wget/i.test(ua)) return 'unknown';
    if (/iPad|Tablet|PlayBook|Kindle|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
    // iPadOS can advertise itself as a Mac; only use the touch hint for that case.
    if (/Macintosh/i.test(ua) && hint==='tablet') return 'tablet';
    if (/Mobi|iPhone|iPod|Windows Phone/i.test(ua)) return 'mobile';
    if (/Windows|Macintosh|X11|Linux|CrOS/i.test(ua)) return 'desktop';
    return 'unknown';
}
async function deviceVisits(db,since) {
    const count=()=>db.from('site_events').select('*',{count:'exact',head:true})
        .eq('event_type','page_view').eq('metadata->>visit_start','true').gte('created_at',since);
    const results=await Promise.all([count(),...deviceTypes.map(device=>count().eq('metadata->>device_type',device))]);
    const failed=results.find(result=>result.error);if(failed)throw failed.error;
    const devices=Object.fromEntries(deviceTypes.map((device,index)=>[device,results[index+1].count || 0]));
    const total=results[0].count || 0;
    devices.unknown=Math.max(0,total-Object.values(devices).reduce((sum,value)=>sum+value,0));
    return {total,devices};
}
module.exports={classifyDevice,deviceVisits};
