const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

code = code.replace(
  /\{activeTab === 'evaluasi' && 'Evaluasi Soal Essai'\}/,
  "{activeTab === 'evaluasi' && 'Evaluasi Soal'}"
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Heading fixed');
