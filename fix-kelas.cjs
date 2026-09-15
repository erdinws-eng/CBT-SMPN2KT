const fs = require('fs');

function replaceInFile(path, replacements) {
  let code = fs.readFileSync(path, 'utf-8');
  for (const [from, to] of replacements) {
    code = code.replace(from, to);
  }
  fs.writeFileSync(path, code);
}

replaceInFile('src/components/AdminPanel.tsx', [
  [/gradeLevel: 'SMP Kelas 8'/g, "gradeLevel: '7A, 7B'"]
]);

replaceInFile('src/components/GuruPanel.tsx', [
  [/gradeLevel: 'SMP Kelas 8'/g, "gradeLevel: '7A, 7B'"]
]);

replaceInFile('src/lib/storage.ts', [
  [/gradeLevel: 'SMP Kelas 8'/g, "gradeLevel: '7A, 7B'"]
]);

replaceInFile('src/components/SupabaseConfigModal.tsx', [
  [/'SMP Kelas 8'/g, "'7A, 7B'"]
]);

replaceInFile('src/lib/excelExportImport.ts', [
  [/'SMP Kelas 8'/g, "'7A, 7B'"]
]);

console.log('Fixed SMP Kelas 8 -> 7A, 7B');
