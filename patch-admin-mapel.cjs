const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Get available classes from students
code = code.replace(
  /const filteredSubjects = subjects/g,
  `// Get available classes from students
  const availableClasses = Array.from(new Set(users.filter(u => u.role === 'siswa' && u.classGrade).map(u => u.classGrade as string))).sort();
  if (availableClasses.length === 0) availableClasses.push('7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C');

  const filteredSubjects = subjects`
);

// We need to change the <select> for "Tingkat / Jenjang" to checkboxes.
const mapelCheckboxesNew = `
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Kelas / Sasaran (Pilih satu atau lebih)</label>
                  <div className="flex flex-wrap gap-2">
                    {availableClasses.map(cls => {
                      const currentGrades = newMapel.gradeLevel ? newMapel.gradeLevel.split(', ') : [];
                      return (
                        <label key={cls} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                          <input 
                            type="checkbox" 
                            className="rounded text-rose-600 focus:ring-rose-500"
                            checked={currentGrades.includes(cls)}
                            onChange={(e) => {
                              const updated = e.target.checked 
                                ? [...currentGrades, cls]
                                : currentGrades.filter(c => c !== cls);
                              setNewMapel({ ...newMapel, gradeLevel: updated.join(', ') });
                            }}
                          />
                          <span className="text-xs font-semibold text-slate-700">{cls}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
`;

// Find the block in Add Mapel
code = code.replace(
  /<div>\s*<label className="block font-semibold text-slate-700 mb-1">Tingkat \/ Jenjang<\/label>\s*<select[\s\S]*?<\/select>\s*<\/div>/,
  mapelCheckboxesNew
);

const mapelCheckboxesEdit = `
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Kelas / Sasaran (Pilih satu atau lebih)</label>
                  <div className="flex flex-wrap gap-2">
                    {availableClasses.map(cls => {
                      const currentGrades = editMapelForm.gradeLevel ? editMapelForm.gradeLevel.split(', ') : [];
                      return (
                        <label key={cls} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                          <input 
                            type="checkbox" 
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                            checked={currentGrades.includes(cls)}
                            onChange={(e) => {
                              const updated = e.target.checked 
                                ? [...currentGrades, cls]
                                : currentGrades.filter(c => c !== cls);
                              setEditMapelForm({ ...editMapelForm, gradeLevel: updated.join(', ') });
                            }}
                          />
                          <span className="text-xs font-semibold text-slate-700">{cls}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
`;

// Find the block in Edit Mapel
code = code.replace(
  /<div>\s*<label className="block font-semibold text-slate-700 mb-1">Tingkat \/ Jenjang<\/label>\s*<select[\s\S]*?<\/select>\s*<\/div>/,
  mapelCheckboxesEdit
);

// We need to change grid-cols-2 to something else because col-span-2 is used for checkboxes, or let's keep grid-cols-2 and move checkboxes below.
// Let's modify the grid to just stack them if it's broken.
code = code.replace(
  /<div className="grid grid-cols-2 gap-3">\s*<div>\s*<label className="block font-semibold text-slate-700 mb-1">Kode Mapel<\/label>/g,
  `<div className="grid grid-cols-1 md:grid-cols-2 gap-3">\n                <div>\n                  <label className="block font-semibold text-slate-700 mb-1">Kode Mapel</label>`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Patched AdminPanel.tsx mapel forms');
