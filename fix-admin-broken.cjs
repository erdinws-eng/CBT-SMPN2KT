const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Fix the Add form
code = code.replace(
  /\{\/\* Multi-Mapel Selector \*\/\}\s*<div>[\s\S]*?mata pelajaran\s*<\/div>\s*<\/div>/,
  ""
);

// We need to also clean up any remaining broken parts. Let's see what is near the edit form.
// Actually, let's just find the exact string that is causing the issue and remove it.

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Fixed syntax in AdminPanel');
