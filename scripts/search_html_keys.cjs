const fs = require('fs');

const html = fs.readFileSync('opencode_page.html', 'utf-8');

console.log("HTML File Size:", html.length);

// Search for any script tag at the bottom of HTML
const matches = html.split('<script');
matches.forEach((chunk, i) => {
  console.log(`\n=== CHUNK ${i} ===`);
  console.log(chunk.substring(0, 1500));
});
