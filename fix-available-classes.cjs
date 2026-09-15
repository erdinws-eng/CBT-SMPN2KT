const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

// Remove from the IIFE
code = code.replace(
  /\/\/ Get available classes from students\s+const availableClasses = Array\.from\(new Set\(students\.filter\(u => u\.classGrade\)\.map\(u => u\.classGrade as string\)\)\)\.sort\(\);\s+if \(availableClasses\.length === 0\) availableClasses\.push\('7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'\);\s+/,
  ""
);

// Add to the main component scope
code = code.replace(
  /const teacherSubjects = subjects\.filter\(s => s\.teacherName === currentUser\.name\);/,
  `const teacherSubjects = subjects.filter(s => s.teacherName === currentUser.name);\n  const availableClasses = Array.from(new Set(students.filter(u => u.classGrade).map(u => u.classGrade as string))).sort();\n  if (availableClasses.length === 0) availableClasses.push('7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C');`
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Fixed availableClasses scope');
