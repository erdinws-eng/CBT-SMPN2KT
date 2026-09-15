const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const regex = /<div>\s*<label className="block font-bold text-slate-700 mb-1">Kelas Sasaran \(Pilih satu atau lebih\)<\/label>\s*<div className="flex flex-wrap gap-2">\s*\{availableClasses\.map\(cls => \(\s*<label key=\{cls\} className="flex items-center gap-1\.5 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1\.5 rounded-lg hover:bg-slate-100">\s*<input \s*type="checkbox" \s*className="rounded text-indigo-600 focus:ring-indigo-500"\s*checked=\{newExamForm\.targetClasses\.includes\(cls\)\}\s*onChange=\{\(e\) => \{\s*const current = newExamForm\.targetClasses \|\| \[\];\s*const updated = e\.target\.checked \s*\? \[\.\.\.current, cls\]\s*: current\.filter\(c => c !== cls\);\s*setNewExamForm\(\{ \.\.\.newExamForm, targetClasses: updated \}\);\s*\}\}\s*\/>\s*<span className="text-xs font-semibold text-slate-700">\{cls\}<\/span>\s*<\/label>\s*\)\)\}\s*<\/div>\s*<\/div>/g;

if (regex.test(code)) {
  code = code.replace(regex, "");
  fs.writeFileSync('src/components/GuruPanel.tsx', code);
  console.log('Fixed double Kelas Sasaran block');
} else {
  console.log('Regex did not match.');
}
