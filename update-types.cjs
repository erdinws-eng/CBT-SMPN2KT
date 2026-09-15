const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  /logoUrl\?: string;/,
  "logoUrl?: string;\n  dinasName?: string;\n  kabupatenName?: string;\n  signatureLocation?: string;"
);

fs.writeFileSync('src/types.ts', code);
console.log('Updated types.ts');
