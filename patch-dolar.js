const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const target1 = `            Promise.all([
                fetch(\`\${window.API_URL}/api/products/\${productId}\`).then(r => r.json()),
                fetch(\`\${window.API_URL}/api/reviews/\${productId}\`).then(r => r.json()).catch(() => [])
            ]).then(([prod, reviews]) => {`;

const replacement1 = `            Promise.all([
                window.dolarPromise,
                fetch(\`\${window.API_URL}/api/products/\${productId}\`).then(r => r.json()),
                fetch(\`\${window.API_URL}/api/reviews/\${productId}\`).then(r => r.json()).catch(() => [])
            ]).then(([_, prod, reviews]) => {`;

s = s.replace(target1, replacement1);

const target2 = `        fetch(\`\${window.API_URL}/api/products\`)
            .then(r => r.json())
            .then(data => {`;

const replacement2 = `        Promise.all([window.dolarPromise, fetch(\`\${window.API_URL}/api/products\`).then(r => r.json())])
            .then(([_, data]) => {`;

s = s.replace(target2, replacement2);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed dolar promise timing');
