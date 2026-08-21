const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regexGetAll = /app\.get\('\/api\/products', async \(req, res\) => \{[\s\S]*?res\.json\(data\);[\s\S]*?\}\);/m;
s = s.replace(regexGetAll, (match) => {
    return match.replace('res.json(data);', `
        data.forEach(p => {
            if (p.variants && typeof p.variants === 'string') {
                try { p.variants = JSON.parse(p.variants); } catch(e) { p.variants = []; }
            }
        });
        res.json(data);
    `);
});

const regexGetOne = /app\.get\('\/api\/products\/:id', async \(req, res\) => \{[\s\S]*?res\.json\(data\);[\s\S]*?\}\);/m;
s = s.replace(regexGetOne, (match) => {
    return match.replace('res.json(data);', `
        if (data.variants && typeof data.variants === 'string') {
            try { data.variants = JSON.parse(data.variants); } catch(e) { data.variants = []; }
        }
        res.json(data);
    `);
});

fs.writeFileSync('server.js', s, 'utf8');
console.log('Fixed variants parsing');
