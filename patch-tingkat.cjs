const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

code = code.replace(/Tingkat \/ Jenjang/g, 'Kelas');
code = code.replace(/Tingkat\/Jenjang/g, 'Kelas');

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Done');
