const fs = require('fs');
let s = fs.readFileSync('public/style.css', 'utf8');

const rootVars = `
:root {
    --bg-color: #ffffff;
    --text-color: #111111;
    --card-bg: #ffffff;
    --border-color: #eeeeee;
    --header-bg: #ffffff;
    --gray-bg: #f9f9f9;
    --text-muted: #666666;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
}
`;

s = rootVars + s;
fs.writeFileSync('public/style.css', s, 'utf8');
