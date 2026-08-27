async function testMail() {
    console.log('Generating email...');
    const r = await fetch('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
    const [email] = await r.json();
    console.log('Generated:', email);
    
    console.log('Registering on Railway...');
    const res = await fetch('https://phonespot.up.railway.app/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Tester', email, password: 'pwd'})
    });
    
    console.log('Register status:', res.status);
    const data = await res.json();
    console.log('Response body:', data);
    
    console.log('Waiting 10 seconds for email delivery...');
    setTimeout(async () => {
        try {
            const [login, domain] = email.split('@');
            const msgs = await (await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`)).json();
            console.log('Messages received:', msgs.length);
            if (msgs.length > 0) {
                console.log('Subject:', msgs[0].subject);
            } else {
                console.log('NO EMAILS RECEIVED.');
            }
        } catch (e) { console.error('Error fetching emails:', e.message); }
    }, 10000);
}

testMail().catch(console.error);
