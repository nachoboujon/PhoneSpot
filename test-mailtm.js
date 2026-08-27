async function test() {
    console.log('Getting domains...');
    const r1 = await fetch('https://api.mail.tm/domains');
    const domains = (await r1.json())['hydra:member'];
    const domain = domains[0].domain;
    
    const account = 'test' + Date.now() + '@' + domain;
    const password = 'password123';
    
    console.log('Creating account:', account);
    const r2 = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({address: account, password})
    });
    console.log(r2.status);
    
    console.log('Getting token...');
    const r3 = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({address: account, password})
    });
    const token = (await r3.json()).token;
    
    console.log('Registering on Railway...');
    const r4 = await fetch('https://phonespot.up.railway.app/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Real Tester', email: account, password: 'pwd'})
    });
    console.log('Register response:', r4.status, await r4.text());
    
    console.log('Waiting 10s for email...');
    setTimeout(async () => {
        const r5 = await fetch('https://api.mail.tm/messages', {
            headers: {'Authorization': 'Bearer ' + token}
        });
        const msgs = (await r5.json())['hydra:member'];
        console.log('Messages:', msgs.length);
        if (msgs.length > 0) {
            console.log('Subject:', msgs[0].subject);
        }
    }, 10000);
}

test().catch(console.error);
