const fs = require('fs');

// 1. Modify server.js
let s = fs.readFileSync('server.js', 'utf8');
if (!s.includes('module.exports = app')) {
    const listenRegex = /app\.listen\(PORT,\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/;
    const newListen = `if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV) {
    app.listen(PORT, () => {
        console.log(\`Servidor corriendo en http://localhost:\${PORT}\`);
    });
}
module.exports = app;`;
    s = s.replace(listenRegex, newListen);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Modified server.js for Vercel');
}

// 2. Create vercel.json
const vercelConfig = {
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/uploads/(.*)",
      "dest": "/public/uploads/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2), 'utf8');
console.log('Created vercel.json');

