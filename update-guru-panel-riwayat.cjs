const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

// 1. Update imports
code = code.replace("Layers,\n} from 'lucide-react';", "Layers,\n  History,\n} from 'lucide-react';");

// 2. Update activeTab state type
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'jadwal' | 'bank_soal' | 'monitoring' | 'rekap' | 'evaluasi'>('dashboard');",
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'jadwal' | 'bank_soal' | 'monitoring' | 'rekap' | 'evaluasi' | 'riwayat_siswa'>('dashboard');"
);

// 3. Add menu item
const evaluasiMenuTarget = `            {/* Menu Evaluasi Soal */}
            <button
              onClick={() => {
                setActiveTab('evaluasi');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer \${
                activeTab === 'evaluasi'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }\`}
              title="Evaluasi Soal Essai"
            >
              <ClipboardCheck className={\`w-5 h-5 shrink-0 \${activeTab === 'evaluasi' ? 'text-slate-900' : 'text-slate-400'}\`} />
              {isSidebarOpen && <span className="truncate">Evaluasi Soal</span>}
            </button>
          </nav>`;

const evaluasiMenuReplacement = `            {/* Menu Evaluasi Soal */}
            <button
              onClick={() => {
                setActiveTab('evaluasi');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer \${
                activeTab === 'evaluasi'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }\`}
              title="Evaluasi Soal Essai"
            >
              <ClipboardCheck className={\`w-5 h-5 shrink-0 \${activeTab === 'evaluasi' ? 'text-slate-900' : 'text-slate-400'}\`} />
              {isSidebarOpen && <span className="truncate">Evaluasi Soal</span>}
            </button>

            {/* Menu Riwayat Siswa */}
            <button
              onClick={() => {
                setActiveTab('riwayat_siswa');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer \${
                activeTab === 'riwayat_siswa'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }\`}
              title="Riwayat Ujian Siswa"
            >
              <History className={\`w-5 h-5 shrink-0 \${activeTab === 'riwayat_siswa' ? 'text-slate-900' : 'text-slate-400'}\`} />
              {isSidebarOpen && <span className="truncate">Riwayat Siswa</span>}
            </button>
          </nav>`;

code = code.replace(evaluasiMenuTarget, evaluasiMenuReplacement);

// 4. Update Header Title
const headerTitleTarget = `{activeTab === 'evaluasi' && 'Evaluasi Soal Essai'}`;
const headerTitleReplacement = `{activeTab === 'evaluasi' && 'Evaluasi Soal Essai'}
                {activeTab === 'riwayat_siswa' && 'Riwayat & Remedial Siswa'}`;
code = code.replace(headerTitleTarget, headerTitleReplacement);


// 5. Add Tab Content
const tabContentTarget = `      {/* TAB 5: EVALUASI SOAL & HASIL UJIAN */}`;

// Pre-calculation logic and UI for Riwayat Siswa
const tabContentReplacement = `      {/* TAB 6: RIWAYAT & REMEDIAL SISWA */}
      {activeTab === 'riwayat_siswa' && (() => {
        // Group attempts to calculate attempt number
        const submittedAttempts = attempts.filter(a => a.status === 'submitted').sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
        const grouped = {};
        submittedAttempts.forEach(a => {
          const key = \`\${a.studentId}_\${a.examId}\`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(a);
        });

        const allRiwayat = [];
        for (const key in grouped) {
          grouped[key].forEach((a, idx) => {
            allRiwayat.push({ ...a, attemptNumber: idx + 1, totalAttempts: grouped[key].length });
          });
        }
        allRiwayat.sort((a,b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime());

        const filteredRiwayat = allRiwayat.filter(a => {
           const matchSearch = a.studentName.toLowerCase().includes(searchAttemptQuery.toLowerCase()) || a.studentNisn.includes(searchAttemptQuery) || a.examTitle.toLowerCase().includes(searchAttemptQuery.toLowerCase());
           const matchClass = selectedClassFilter ? a.studentClass === selectedClassFilter : true;
           return matchSearch && matchClass;
        });

        // Unique classes for filter
        const uniqueClasses = Array.from(new Set(allRiwayat.map(a => a.studentClass).filter(Boolean))).sort();

        return (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Riwayat Ujian & Remedial</h2>
              <p className="text-xs text-slate-500">Pantau seluruh riwayat pengerjaan siswa beserta data remedial.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Nama / NISN / Judul Ujian..."
                  value={searchAttemptQuery}
                  onChange={(e) => setSearchAttemptQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition shadow-xs"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
                 <button
                  onClick={() => setSelectedClassFilter('')}
                  className={\`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer \${!selectedClassFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}\`}
                 >
                   Semua Kelas
                 </button>
                 {uniqueClasses.map(cls => (
                   <button
                    key={cls}
                    onClick={() => setSelectedClassFilter(cls)}
                    className={\`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer \${selectedClassFilter === cls ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}\`}
                   >
                     {cls}
                   </button>
                 ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-200 text-slate-500 text-[11px] uppercase font-extrabold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Waktu Kumpul</th>
                    <th className="py-3.5 px-5">Siswa</th>
                    <th className="py-3.5 px-5">Ujian</th>
                    <th className="py-3.5 px-5 text-center">Percobaan</th>
                    <th className="py-3.5 px-5 text-center">Nilai</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {filteredRiwayat.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                         Tidak ada riwayat ujian yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredRiwayat.map((att) => (
                      <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} key={att.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-5 text-xs">
                          {new Date(att.submittedAt || att.startedAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-5">
                          <div className="font-bold text-slate-900">{att.studentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{att.studentNisn} • {att.studentClass}</div>
                        </td>
                        <td className="py-3 px-5">
                          <div className="font-bold text-indigo-700">{att.examTitle}</div>
                          <div className="text-[10px] text-slate-500">{att.subjectName}</div>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <span className={\`px-2 py-0.5 rounded-full text-[10px] font-black \${att.attemptNumber > 1 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'}\`}>
                            {att.attemptNumber > 1 ? \`Remedial (\${att.attemptNumber - 1})\` : 'Pertama'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center font-black text-slate-900">
                          {att.totalScore}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <span className={\`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold \${att.passedKkm ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}\`}>
                            {att.passedKkm ? 'Tuntas' : 'Tidak Tuntas'}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-200 flex justify-between">
              <span>Menampilkan {filteredRiwayat.length} riwayat</span>
            </div>
          </div>
        </div>
        );
      })}

      {/* TAB 5: EVALUASI SOAL & HASIL UJIAN */}`;

code = code.replace(tabContentTarget, tabContentReplacement);
fs.writeFileSync('src/components/GuruPanel.tsx', code);
