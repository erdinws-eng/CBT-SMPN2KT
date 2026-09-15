const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

// Remove from the IIFE
code = code.replace(
  /const teacherSubjects = subjects\.filter\(s => s\.teacherName === currentUser\.name\);\s*/,
  ""
);

// Add to the main component scope
code = code.replace(
  /const isSupabaseActive = getSupabaseConfig\(\)\.isConfigured;/,
  "const isSupabaseActive = getSupabaseConfig().isConfigured;\n  const teacherSubjects = subjects.filter(s => s.teacherName === currentUser.name);"
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Fixed teacherSubjects scope');
