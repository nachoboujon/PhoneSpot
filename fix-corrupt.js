const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// The file is corrupted at line 9, so let's just truncate it at the correct end and fix the top manually.
const lines = s.split('\n');

// Find the correct end of the file. It's 2154 lines. But wait, if I prepended something, it's longer.
// Actually, I can just slice the original working file from a backup? I don't have one.
// The rest of the file was injected at line 9.
// So lines 1 to 8 are correct.
// Then line 9 is `    return '` followed by the rest of the file.
// The actual file starts again somewhere.
