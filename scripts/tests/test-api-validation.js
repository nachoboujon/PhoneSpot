// Isolated API checks: no database, SMTP or storage requests leave this process.
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.VERCEL = '1';
process.env.JWT_SECRET = 'fixture-secret-for-api-tests';
const settings = {shipping_correo: 0, shipping_andreani: 0};
const mutations = [];
const query = table => {
    const chain = {};
    for (const method of ['select', 'eq', 'is', 'order', 'limit']) chain[method] = () => chain;
    chain.single = chain.maybeSingle = async () => ({data: table === 'users' ? {email: 'audit@example.invalid'} : null, error: null});
    chain.insert = chain.update = chain.delete = () => {mutations.push(table); throw new Error('Unexpected database write in validation test');};
    return chain;
};
const supabaseModule = require.resolve('@supabase/supabase-js');
require.cache[supabaseModule] = {id: supabaseModule, filename: supabaseModule, loaded: true, exports: {createClient: () => ({
    from: query, rpc: async () => ({data: 0, error: null}),
    storage: {from: () => ({download: async () => ({data: {text: async () => JSON.stringify(settings)}, error: null})})}
})}};
const app = require('../../server');

async function main() {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        assert.equal((await fetch(base + '/api/products/abc')).status, 400);
        assert.equal((await fetch(base + '/api/products/999999')).status, 404);
        assert.equal((await fetch(base + '/api/events', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{invalid'})).status, 400);
        assert.equal((await fetch(base + '/api/events', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: 'x'.repeat(1024 * 1024)})})).status, 413);
        const quote = await fetch(base + '/api/shipping/quote', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({zip_code: '1000'})});
        const rates = await quote.json();
        assert.ok(rates.success);
        assert.ok(rates.options.every(option => option.cost === 0), 'A configured zero shipping price must remain zero');
        const token = jwt.sign({id: 999999, role: 'client'}, process.env.JWT_SECRET, {issuer: 'phonespot', audience: 'phonespot-web'});
        const response = await fetch(base + '/api/orders', {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify({
            customer_email: 'audit@example.invalid', customer_name: 'Cliente de prueba', customer_phone: '3447416011',
            shipping_address: 'Calle Prueba 123', province: 'Entre Ríos', cart_id: '11111111-1111-4111-8111-111111111111',
            items: [{product_id: 73, quantity: 1.9}]
        })});
        assert.equal(response.status, 400, 'Fractional quantities must be rejected, not rounded down');
        const adminToken = jwt.sign({id: 999999, role: 'admin'}, process.env.JWT_SECRET, {issuer: 'phonespot', audience: 'phonespot-web'});
        for (const body of [{stock: 1.9}, {variants: [null]}, {variants: [{stock: -1}]}, {variants: [{price: 'Infinity', stock: 1}]}, {variants: '{invalid'}]) {
            const invalid = await fetch(base + '/api/products/73', {method: 'PUT', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}`}, body: JSON.stringify(body)});
            assert.equal(invalid.status, 400, `Invalid admin input must not update stock: ${JSON.stringify(body)}`);
        }
        assert.deepEqual(mutations, []);
        const transport = require('nodemailer').createTransport({streamTransport: true, buffer: true});
        const mail = await transport.sendMail({from: 'audit@example.invalid', to: 'buyer@example.invalid', subject: 'Pedido de prueba', html: '<p>Pedido registrado, envío a confirmar.</p>'});
        assert.ok(mail.message.includes(Buffer.from('Pedido registrado')));
        console.log('API validation, zero shipping prices and email rendering passed without external writes.');
    } finally {await new Promise(resolve => server.close(resolve));}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
