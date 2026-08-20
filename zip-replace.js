const fs = require('fs');

let orig = fs.readFileSync('original_script.js', 'utf16le');
let cur = fs.readFileSync('public/script.js', 'utf8');

const origMatches = [];
orig.split('\n').forEach(l => {
    const m = l.match(/document\.(getElementById|querySelector)\('[^']+'\)\.(style|classList|innerText|innerHTML|src|value|addEventListener)/g);
    if (m) origMatches.push(...m);
});

console.log('Found', origMatches.length, 'original matches');

const curMatches = [];
cur.split('\n').forEach(l => {
    // Look for `document.getElementById('').` followed by `.` or `=` or `(` or `add` or `remove` or `display`
    const m = l.match(/document\.(getElementById|querySelector)\(''\)(?:\.\.[a-zA-Z]+|\.\(|(?:\.\s*=))/g) || l.match(/document\.(getElementById|querySelector)\(''\)\.[a-zA-Z0-9_]+/g);
    // Actually, I know EXACTLY how they look from the grep:
    // document.getElementById('')..display
    // document.getElementById('')..add
    // document.getElementById('')..remove
    // document.getElementById('').('click'
    // document.getElementById('').=this.src
    // document.getElementById('').
    
    // Let's just find `document.getElementById('')` and replace the WHOLE line?
    // No, there are lines with multiple matches (e.g. name + lastname).
});

// Since there are 54 exactly, let's just replace them sequentially.
// The regex to match the corrupted part:
// `document\.getElementById\(''\)(?:\.\.[a-zA-Z]+|\.\(|\.\s*=|.)`
// Let's try:
let matchIndex = 0;
cur = cur.replace(/document\.(getElementById|querySelector)\(''\)(?:\.\.[a-zA-Z]+|\.\(|\.\s*=|.)/g, (match) => {
    // Wait, if it matches `document.getElementById('').=`, I need to replace it with `document.getElementById('id').value=`!
    // But `origMatches[i]` is just `document.getElementById('id').value`.
    // So if the corrupt match included `=`, I should return `origMatches[i] + '='`.
    let suffix = '';
    if (match.endsWith('=')) suffix = '=';
    else if (match.endsWith('(')) suffix = '(';
    else if (match.endsWith(' ')) suffix = ' '; // if it was just `. `
    
    // Actually, let's look at what was stripped:
    // `document.getElementById('id').style` -> `document.getElementById('')..` -> matched as `document.getElementById('')..display`, we want to replace with `document.getElementById('id').style.display`.
    // Let's just write a custom replacer.
});
