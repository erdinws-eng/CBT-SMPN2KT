const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

code = code.replace(
  /users\.filter\(u => u\.role === 'siswa' && u\.classGrade\)/g,
  "students.filter(u => u.classGrade)"
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Fixed users -> students in GuruPanel');
