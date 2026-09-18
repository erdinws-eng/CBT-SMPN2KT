const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf8');

code = code.replace(/const updated = attempts\.map/g, "const updated = allAttempts.map");

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log("Done");
