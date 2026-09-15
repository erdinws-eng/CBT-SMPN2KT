const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

// The block to remove
const targetRegex = /<div>\s*<label className="block font-bold text-slate-700 mb-1\.5">\s*Variasi Tipe Soal yang Disertakan:\s*<\/label>\s*<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">[\s\S]*?<\/div>\s*<\/div>\s*(?=<div className="pt-4 border-t border-slate-100 flex justify-end gap-2">)/;

code = code.replace(targetRegex, "");

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Removed Variasi Tipe Soal');
