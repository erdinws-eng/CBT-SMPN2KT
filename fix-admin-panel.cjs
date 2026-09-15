const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Fix handleAddGuru
code = code.replace(
  /if \(!newGuru\.name \|\| !newGuru\.nip_nisn\) return;/,
  'if (!newGuru.name) return;\n    const finalNip = newGuru.nip_nisn || "-";\n    const nipSuffix = newGuru.nip_nisn ? newGuru.nip_nisn.slice(-4) : Date.now().toString().slice(-4);'
);

code = code.replace(
  /nip_nisn: newGuru\.nip_nisn,/,
  'nip_nisn: finalNip,'
);

code = code.replace(
  /username: newGuru\.username \|\| `guru_\$\{newGuru\.nip_nisn\.slice\(-4\)\}`,/,
  'username: newGuru.username || `guru_${nipSuffix}`,'
);

// Fix handleSaveEditGuru
code = code.replace(
  /const subjectDisplayName = selectedSubs\.length > 0 \? selectedSubs\.join\(\', \'\) : \'Umum\';\n\s*const updated = users\.map\(\(u\) => \{/,
  'const subjectDisplayName = selectedSubs.length > 0 ? selectedSubs.join(\', \') : \'Umum\';\n    const finalNipEdit = editGuruForm.nip_nisn || "-";\n    const nipSuffixEdit = editGuruForm.nip_nisn ? editGuruForm.nip_nisn.slice(-4) : Date.now().toString().slice(-4);\n\n    const updated = users.map((u) => {'
);

code = code.replace(
  /nip_nisn: editGuruForm\.nip_nisn,/,
  'nip_nisn: finalNipEdit,'
);

code = code.replace(
  /username: editGuruForm\.username \|\| `guru_\$\{editGuruForm\.nip_nisn\.slice\(-4\)\}`,/,
  'username: editGuruForm.username || `guru_${nipSuffixEdit}`,'
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Fixed logic handlers');
