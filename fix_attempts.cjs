const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf8');

// Rename the prop attempts to allAttempts
code = code.replace(
  "attempts,\n  settings,",
  "attempts: allAttempts,\n  settings,"
);

// We need to define `attempts`
code = code.replace(
  "const exams = allExams.filter(e => e.teacherId === currentUser.id);",
  "const exams = allExams.filter(e => e.teacherId === currentUser.id);\n  const attempts = allAttempts.filter(a => exams.some(e => e.id === a.examId));"
);

// We need to replace all `attempts` with `allAttempts` inside `onUpdateAttempts` logic...
code = code.replace(/const updated = attempts\.map\(\(att\) =>/g, "const updated = allAttempts.map((att) =>");
code = code.replace(/const newAttempts = attempts\.filter/g, "const newAttempts = allAttempts.filter");

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log("Done");
