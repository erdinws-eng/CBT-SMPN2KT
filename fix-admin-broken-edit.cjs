const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Fix the Edit form
code = code.replace(
  /\{\/\* Multi-Mapel Edit Selector \*\/\}\s*<div>[\s\S]*?mata pelajaran\s*<\/div>\s*<\/div>/,
  ""
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Fixed syntax in AdminPanel Edit Form');
