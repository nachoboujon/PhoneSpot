const fs = require('fs');

const hexMap = {
    '#2e8b57': '#555555',
    '#27ae60': '#666666',
    '#1e6b40': '#333333',
    'rgba(46, 139, 87': 'rgba(85, 85, 85',
    'rgba(46,139,87': 'rgba(85,85,85'
};

const replaceColors = (content) => {
    let result = content;
    for (const [green, gray] of Object.entries(hexMap)) {
        // Create regex with global and case-insensitive flags
        const regex = new RegExp(green.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        result = result.replace(regex, gray);
    }
    return result;
};

// Also read all files in public
const files = fs.readdirSync('public').filter(f => f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css'));

files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    const newContent = replaceColors(s);
    if (newContent !== s) {
        fs.writeFileSync('public/' + f, newContent, 'utf8');
    }
});

console.log('Colors replaced!');
