const fs = require('fs');

const orig = fs.readFileSync('original_script.js', 'utf16le'); // Wait, git show might be utf8! Let's check!
// Actually PowerShell `>` creates UTF16LE.
