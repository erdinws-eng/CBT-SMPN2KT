const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

code = code.replace(
  /title="Evaluasi Soal Essai"/,
  'title="Evaluasi Soal"'
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Nav fixed');
