const fs = require('fs');

const harPath = 'c:/Users/psrih/Downloads/daily api/ProxyPin7-26_19_26_32.har';
const harContent = fs.readFileSync(harPath, 'utf8');

console.log("Searching for 'musclesRecoveryStats' in HAR file...");
const pos = harContent.indexOf("musclesRecoveryStats");
if (pos !== -1) {
  console.log("Found 'musclesRecoveryStats' at offset:", pos);
  console.log("Snippet:\n", harContent.substring(pos - 100, pos + 1000));
} else {
  console.log("Searching for 'recovery' in HAR file...");
  const p2 = harContent.indexOf("recovery");
  if (p2 !== -1) {
    console.log("Found 'recovery' at offset:", p2);
    console.log("Snippet:\n", harContent.substring(p2 - 100, p2 + 500));
  } else {
    console.log("Not found in HAR body.");
  }
}
