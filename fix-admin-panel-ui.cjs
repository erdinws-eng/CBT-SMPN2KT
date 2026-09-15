const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Fix required in Add Guru Modal
const regexAdd = /<div>\s*<label className="block font-semibold text-slate-700 mb-1">NIP \(18 Digit\)<\/label>\s*<input\s*type="text"\s*placeholder="198305122008012009"\s*value=\{newGuru\.nip_nisn\}\s*onChange=\{\(e\) => setNewGuru\(\{ \.\.\.newGuru, nip_nisn: e\.target\.value \}\)\}\s*className="w-full p-2\.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"\s*required\s*\/>\s*<\/div>/g;

const replacementAdd = `<div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    placeholder="198305122008012009 (Boleh Kosong)"
                    value={newGuru.nip_nisn}
                    onChange={(e) => setNewGuru({ ...newGuru, nip_nisn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>`;

code = code.replace(regexAdd, replacementAdd);

// Fix required in Edit Guru Modal
const regexEdit = /<div>\s*<label className="block font-semibold text-slate-700 mb-1">NIP \(18 Digit\)<\/label>\s*<input\s*type="text"\s*value=\{editGuruForm\.nip_nisn\}\s*onChange=\{\(e\) => setEditGuruForm\(\{ \.\.\.editGuruForm, nip_nisn: e\.target\.value \}\)\}\s*className="w-full p-2\.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"\s*required\s*\/>\s*<\/div>/g;

const replacementEdit = `<div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    placeholder="198305122008012009 (Boleh Kosong)"
                    value={editGuruForm.nip_nisn}
                    onChange={(e) => setEditGuruForm({ ...editGuruForm, nip_nisn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>`;

code = code.replace(regexEdit, replacementEdit);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Fixed UI forms');
