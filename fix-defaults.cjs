const fs = require('fs');

function replaceInFile(path, replacements) {
  let code = fs.readFileSync(path, 'utf-8');
  for (const [from, to] of replacements) {
    code = code.replace(from, to);
  }
  fs.writeFileSync(path, code);
}

replaceInFile('src/components/AdminPanel.tsx', [
  [/gradeLevel: '7A, 7B'/g, "gradeLevel: ''"]
]);

console.log('Fixed default gradeLevel to empty');
