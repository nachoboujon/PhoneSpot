// The Supabase client is replaced before server.js loads. No external writes.
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.VERCEL = '1';
process.env.JWT_SECRET = 'offer-api-fixture-secret';
const product = {id: 73, name: 'Equipo de prueba', price: 100, stock: 2, is_offer: false,
    variants: [{color: 'Negro', stock: 2, price: 110}], image_url: '/original.jpg'};
const original = structuredClone(product);
const writes = [];
let missing = false;
let fail = false;
const query = table => {
    assert.equal(table, 'products', 'An offer update must not trigger stock alerts');
    let patch;
    let id;
    let activeOnly = false;
    const chain = {
        update(value) {patch = value; return chain;},
        eq(column, value) {assert.equal(column, 'id'); id = Number(value); return chain;},
        is(column, value) {assert.equal(column, 'archived_at'); assert.equal(value, null); activeOnly = true; return chain;},
        select() {return chain;},
        then(resolve, reject) {
            assert.ok(activeOnly);
            if (fail) return Promise.resolve({data: null, error: {message: 'Fixture failure'}}).then(resolve, reject);
            if (missing || id !== product.id) return Promise.resolve({data: [], error: null}).then(resolve, reject);
            writes.push(structuredClone(patch)); Object.assign(product, patch);
            return Promise.resolve({data: [structuredClone(product)], error: null}).then(resolve, reject);
        }
    };
    return chain;
};
const modulePath = require.resolve('@supabase/supabase-js');
require.cache[modulePath] = {id: modulePath, filename: modulePath, loaded: true, exports: {createClient: () => ({from: query})}};
const app = require('../../server');
async function main() {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/products/`;
    const token = role => jwt.sign({id: 999, role}, process.env.JWT_SECRET, {issuer: 'phonespot', audience: 'phonespot-web'});
    const send = (body, authorization = token('admin'), id = 73) => fetch(base + id, {method: 'PUT',
        headers: {'Content-Type': 'application/json', ...(authorization ? {Authorization: `Bearer ${authorization}`} : {})}, body: JSON.stringify(body)});
    try {
        assert.equal((await send({is_offer: true}, '')).status, 401);
        assert.equal((await send({is_offer: true}, token('client'))).status, 403);
        for (const value of ['true', 'false', 1, null, {}, []]) assert.equal((await send({is_offer: value})).status, 400);
        assert.equal((await send({is_offer: true}, token('admin'), 'abc')).status, 400);
        assert.equal(writes.length, 0);
        for (const is_offer of [true, true, false]) {
            const response = await send({is_offer});
            assert.equal(response.status, 200);
            assert.equal((await response.json()).is_offer, is_offer);
            assert.deepEqual(writes.at(-1), {is_offer});
            assert.deepEqual({...product, is_offer: false}, original);
        }
        missing = true;
        assert.equal((await send({is_offer: true})).status, 404);
        missing = false; fail = true;
        assert.equal((await send({is_offer: true})).status, 500);
        console.log('Offer API: permissions, strict boolean, enable/disable, idempotent retry, missing product, failure and preservation of prices/stock/photos passed. No external writes.');
    } finally {await new Promise(resolve => server.close(resolve));}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
