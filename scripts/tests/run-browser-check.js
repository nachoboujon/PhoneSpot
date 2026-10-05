// Keep the development server in the same process as the chosen read-only check.
const path=require('node:path');
const allowed=new Set(['test-storefront-readonly.js','test-commercial-types.js','test-admin-offers-ui.js','test-static-performance.js']);
const target=process.argv[2];if(!allowed.has(target)) throw new Error('Choose an approved isolated browser check.');
process.argv=[process.argv[0],path.join(__dirname,target)];
process.env.VERCEL='1';
process.env.AUDIT_URL=process.env.AUDIT_URL || 'http://localhost:3000';
process.env.AUDIT_OUTPUT=path.resolve(__dirname,'../../artifacts/audit/improvements-2026-10-02/regression');
const server=require('../../server').listen(3000,'127.0.0.1',()=>{server.unref();require(path.join(__dirname,target));});
