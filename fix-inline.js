const fs = require('fs');

const css = fs.readFileSync('public/style.css', 'utf8');
if (!css.includes('--text-muted')) {
    let newCss = css.replace('--text-color: #111111;', '--text-color: #111111;\n    --text-muted: #666666;');
    newCss = newCss.replace('--text-color: #ffffff;', '--text-color: #ffffff;\n    --text-muted: #aaaaaa;');
    fs.writeFileSync('public/style.css', newCss, 'utf8');
}

const files = fs.readdirSync('public').filter(f => f.endsWith('.html') || f.endsWith('.js'));

files.forEach(f => {
    let text = fs.readFileSync('public/' + f, 'utf8');
    
    // Exact hex matches to variables
    text = text.replace(/color:\s*#111;?/gi, 'color: var(--text-color);');
    text = text.replace(/color:\s*#222;?/gi, 'color: var(--text-color);');
    text = text.replace(/color:\s*#333;?/gi, 'color: var(--text-color);');
    text = text.replace(/color:\s*#444;?/gi, 'color: var(--text-muted);');
    text = text.replace(/color:\s*#555;?/gi, 'color: var(--text-muted);');
    text = text.replace(/color:\s*#666;?/gi, 'color: var(--text-muted);');
    text = text.replace(/color:\s*#888;?/gi, 'color: var(--text-muted);');
    text = text.replace(/color:\s*#999;?/gi, 'color: var(--text-muted);');
    text = text.replace(/color:\s*black;?/gi, 'color: var(--text-color);');

    // Also background hardcoded grays that might be invisible in dark mode
    text = text.replace(/background:\s*#f9f9f9;?/gi, 'background: var(--gray-bg);');
    text = text.replace(/background-color:\s*#f9f9f9;?/gi, 'background-color: var(--gray-bg);');
    text = text.replace(/background:\s*#f5f5f5;?/gi, 'background: var(--gray-bg);');
    text = text.replace(/background:\s*white;?/gi, 'background: var(--card-bg);');
    text = text.replace(/background-color:\s*white;?/gi, 'background-color: var(--card-bg);');
    text = text.replace(/background:\s*#fff;?/gi, 'background: var(--card-bg);');
    
    // Also border colors
    text = text.replace(/border:\s*1px solid #ccc;?/gi, 'border: 1px solid var(--border-color);');
    text = text.replace(/border:\s*1px solid #ddd;?/gi, 'border: 1px solid var(--border-color);');
    text = text.replace(/border:\s*1px solid #eee;?/gi, 'border: 1px solid var(--border-color);');
    text = text.replace(/border:\s*1px solid #eaeaea;?/gi, 'border: 1px solid var(--border-color);');
    text = text.replace(/border-bottom:\s*1px solid #eee;?/gi, 'border-bottom: 1px solid var(--border-color);');
    text = text.replace(/border-top:\s*1px solid #eee;?/gi, 'border-top: 1px solid var(--border-color);');

    fs.writeFileSync('public/' + f, text, 'utf8');
});
