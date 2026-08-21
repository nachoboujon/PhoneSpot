const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regexSupa = /const supabaseUrl = process\.env\.SUPABASE_URL;\s*const supabaseKey = process\.env\.SUPABASE_KEY;[\s\S]*?const supabase = createClient\(supabaseUrl, supabaseKey\);/;

const newSupa = `const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ ADVERTENCIA: SUPABASE_URL y SUPABASE_KEY no están configurados en las variables de entorno. La base de datos no funcionará.');
}`;

if(s.match(regexSupa)){
    s = s.replace(regexSupa, newSupa);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Fixed Supabase crash on missing env vars');
} else {
    console.log('Regex did not match!');
}
