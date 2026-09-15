const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const regex = /\{activeTab === 'evaluasi' && \([\s\S]*?Evaluasi Hasil Ujian<\/button>\s*<\/div>\s*\)\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const replacement = `{activeTab === 'evaluasi' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Evaluasi Soal
              </h2>
              <p className="text-xs text-slate-500">
                Tinjau ulang jawaban siswa dan sesuaikan nilai setiap soal (termasuk soal Uraian / Essay).
              </p>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar max-w-full">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.title}</option>
                ))}
              </select>

              <select
                value={rekapClassFilter}
                onChange={(e) => setRekapClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {uniqueRekapClasses.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden p-6">
            <div className="space-y-6">
              {/* List students with submitted attempts */}
              {filteredRekapAttempts.filter(a => a.status === 'submitted').length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Belum ada siswa yang menyelesaikan ujian ini.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredRekapAttempts.filter(a => a.status === 'submitted').map((att) => (
                      <div key={att.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">{att.studentName}</h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{att.studentNisn} - {att.studentClass}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEvaluatingAttemptId(att.id);
                            setEvaluatingScores(att.scores || {});
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          <span className="hidden sm:inline">Evaluasi</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </div>
      )}`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/GuruPanel.tsx', code);
  console.log('Evaluasi tab updated');
} else {
  console.log('Regex did not match!');
}
