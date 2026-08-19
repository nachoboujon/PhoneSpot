const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));
files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    
    // Replace href="#" for Terminos
    s = s.replace(/href="[^"]*"\s*(style="[^"]*"\s*>T[é\x65\xC3\xA9]?rminos y Condiciones<\/a>)/gi, 'href="terminos.html" $1');
    s = s.replace(/href="[^"]*"\s*(style="[^"]*"\s*>Garant[í\x69\xC3\xAD]?as<\/a>)/gi, 'href="garantias.html" $1');
    s = s.replace(/href="[^"]*"\s*(style="[^"]*"\s*>Pol[í\x69\xC3\xAD]?ticas de Env[í\x69\xC3\xAD]?o<\/a>)/gi, 'href="terminos.html" $1');

    fs.writeFileSync('public/' + f, s, 'utf8');
});
