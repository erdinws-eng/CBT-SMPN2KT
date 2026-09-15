const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

code = code.replace(
  /<td className="py-3 px-4">\s*<div className="flex flex-wrap gap-1\.5">\s*\{teacherSubs\.map\(\(sub, sIdx\) => \([\s\S]*?<\/div>\s*<\/td>/g,
  ""
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Fixed teacherSubs error');
