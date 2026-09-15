const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

code = code.replace(
  /        settings=\{settings\}\n      \/>/,
  '        settings={settings}\n        teacherNip={currentUser.nip_nisn}\n      />'
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Passed teacherNip to RekapPrintModal in GuruPanel');
