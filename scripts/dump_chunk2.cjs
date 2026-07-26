const fs = require('fs');

const html = fs.readFileSync('opencode_page.html', 'utf-8');
const chunks = html.split('<script');

console.log("=== FULL CHUNK 2 ===");
console.log(chunks[2]);
