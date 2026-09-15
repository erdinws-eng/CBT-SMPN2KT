const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Remove the subjectName column from the Guru table
code = code.replace(
  /<th className="py-3 px-4">Mata Pelajaran yang Diampu \(Multi-Mapel\)<\/th>/,
  ``
);

code = code.replace(
  /const teacherSubs: string\[\] =[\s\S]*?;\s*return \(/,
  `return (`
);

code = code.replace(
  /<td className="py-3 px-4">\s*<div className="flex flex-wrap gap-1">\s*\{teacherSubs\.map\(\(subName, i\) => \([\s\S]*?<\/div>\s*<\/td>/,
  ``
);

// Remove from Add Form
code = code.replace(
  /<div className="flex items-center justify-between mb-1\.5">\s*<label className="font-semibold text-slate-700">\s*Mata Pelajaran yang Diampu[\s\S]*?<\/label>[\s\S]*?<\/div>[\s\S]*?<div className="border border-slate-200 rounded-xl p-2\.5 bg-slate-50 max-h-44 overflow-y-auto space-y-1\.5">[\s\S]*?<\/div>/,
  ``
);

// Remove from Edit Form (we have to do this carefully since there are two blocks)
code = code.replace(
  /<div className="flex items-center justify-between mb-1\.5">\s*<label className="font-semibold text-slate-700">\s*Mata Pelajaran yang Diampu[\s\S]*?<\/label>[\s\S]*?<\/div>[\s\S]*?<div className="border border-slate-200 rounded-xl p-2\.5 bg-slate-50 max-h-44 overflow-y-auto space-y-1\.5">[\s\S]*?<\/div>/,
  ``
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Done');
