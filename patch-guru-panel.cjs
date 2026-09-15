const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

// Filter subjects for the current teacher
code = code.replace(
  /const filteredPackages = exams/g,
  `// Get available classes from students
  const availableClasses = Array.from(new Set(users.filter(u => u.role === 'siswa' && u.classGrade).map(u => u.classGrade as string))).sort();
  if (availableClasses.length === 0) availableClasses.push('7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C');

  // Filter subjects for current teacher
  const teacherSubjects = subjects.filter(s => s.teacherName === currentUser.name);

  const filteredPackages = exams`
);

// Replace mapping over `subjects` to `teacherSubjects` in Create Exam Modal
code = code.replace(
  /\{subjects\.map\(\(s\) => \(\s*<option key=\{s\.id\} value=\{s\.id\}>\s*\{s\.name\} \(\{s\.code\}\)\s*<\/option>\s*\)\)\}/g,
  `{teacherSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}`
);

// Add targetClasses checkboxes to Create Exam modal
const createExamTargetClassesHtml = `
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas Sasaran (Pilih satu atau lebih)</label>
                <div className="flex flex-wrap gap-2">
                  {availableClasses.map(cls => (
                    <label key={cls} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        checked={newExamForm.targetClasses.includes(cls)}
                        onChange={(e) => {
                          const current = newExamForm.targetClasses || [];
                          const updated = e.target.checked 
                            ? [...current, cls]
                            : current.filter(c => c !== cls);
                          setNewExamForm({ ...newExamForm, targetClasses: updated });
                        }}
                      />
                      <span className="text-xs font-semibold text-slate-700">{cls}</span>
                    </label>
                  ))}
                </div>
              </div>
`;

code = code.replace(
  /<div className="grid grid-cols-2 gap-3">\s*<div>\s*<label className="block font-bold text-slate-700 mb-1">Waktu Mulai<\/label>/,
  createExamTargetClassesHtml + '\n              <div className="grid grid-cols-2 gap-3">\n                <div>\n                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai</label>'
);

// Add targetClasses checkboxes to Edit Exam modal
const editExamTargetClassesHtml = `
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas Sasaran (Pilih satu atau lebih)</label>
                <div className="flex flex-wrap gap-2">
                  {availableClasses.map(cls => (
                    <label key={cls} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        checked={editExamForm.targetClasses?.includes(cls)}
                        onChange={(e) => {
                          const current = editExamForm.targetClasses || [];
                          const updated = e.target.checked 
                            ? [...current, cls]
                            : current.filter(c => c !== cls);
                          setEditExamForm({ ...editExamForm, targetClasses: updated });
                        }}
                      />
                      <span className="text-xs font-semibold text-slate-700">{cls}</span>
                    </label>
                  ))}
                </div>
              </div>
`;

// There are multiple instances, so let's be careful. Let's find the edit modal specifically.
code = code.replace(
  /editExamForm\.subjectId\}\s*onChange=\{\(e\) => setEditExamForm\(\{ \.\.\.editExamForm, subjectId: e\.target\.value \}\)\}\s*className="w-full p-2\.5 bg-slate-50 border border-slate-300 rounded-xl"\s*>\s*\{teacherSubjects\.map\(\(s\) => \(\s*<option key=\{s\.id\} value=\{s\.id\}>\s*\{s\.name\} \(\{s\.code\}\)\s*<\/option>\s*\)\)\}\s*<\/select>\s*<\/div>/,
  `editExamForm.subjectId}
                  onChange={(e) => setEditExamForm({ ...editExamForm, subjectId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  {teacherSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>\n` + editExamTargetClassesHtml
);

// Fix initial empty targetClasses
code = code.replace(
  /targetClasses: \['8A', '8B'\]/g,
  `targetClasses: []`
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Patched GuruPanel.tsx');
