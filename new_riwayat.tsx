      {activeTab === 'riwayat_siswa' && (() => {
        // Find unique classes for dropdowns across all attempts
        const uniqueClasses = Array.from(new Set(attempts.map(a => a.studentClass).filter(Boolean))).sort();

        // If exam and class are selected, filter attempts for these
        const filteredAttempts = attempts.filter(a =>
          a.status === 'submitted' &&
          a.examId === riwayatSelectedExamId &&
          a.studentClass === riwayatSelectedClass
        ).sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

        // Group by student
        const studentRiwayat = [];
        const studentGroups = {};

        filteredAttempts.forEach(a => {
          if (!studentGroups[a.studentId]) {
            studentGroups[a.studentId] = {
              studentId: a.studentId,
              studentName: a.studentName,
              studentNisn: a.studentNisn,
              studentClass: a.studentClass,
              attempts: []
            };
          }
          studentGroups[a.studentId].attempts.push(a);
        });

        for (const studentId in studentGroups) {
          const group = studentGroups[studentId];
          const bestScore = Math.max(...group.attempts.map(a => a.totalScore || 0));
          const latestAttempt = group.attempts[group.attempts.length - 1];
          studentRiwayat.push({
            ...group,
            totalAttempts: group.attempts.length,
            bestScore,
            passedKkm: latestAttempt.passedKkm
          });
        }
        
        // Filter by search query
        const finalStudentList = studentRiwayat.filter(s =>
            s.studentName.toLowerCase().includes(searchAttemptQuery.toLowerCase()) || 
            s.studentNisn.includes(searchAttemptQuery)
        );

        return (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Riwayat Ujian & Remedial</h2>
              <p className="text-xs text-slate-500">Pilih ujian dan kelas untuk melihat daftar riwayat dan remedial siswa.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                 <select
                   value={riwayatSelectedExamId}
                   onChange={(e) => setRiwayatSelectedExamId(e.target.value)}
                   className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition shadow-xs cursor-pointer min-w-[200px]"
                 >
                   <option value="">-- Pilih Ujian --</option>
                   {exams.map(ex => (
                     <option key={ex.id} value={ex.id}>{ex.title}</option>
                   ))}
                 </select>

                 <select
                   value={riwayatSelectedClass}
                   onChange={(e) => setRiwayatSelectedClass(e.target.value)}
                   className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition shadow-xs cursor-pointer min-w-[150px]"
                 >
                   <option value="">-- Pilih Kelas --</option>
                   {uniqueClasses.map(cls => (
                     <option key={cls} value={cls}>{cls}</option>
                   ))}
                 </select>
              </div>

              {riwayatSelectedExamId && riwayatSelectedClass && (
                <div className="relative max-w-sm w-full sm:w-auto">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari Nama / NISN..."
                    value={searchAttemptQuery}
                    onChange={(e) => setSearchAttemptQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition shadow-xs"
                  />
                </div>
              )}
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {(!riwayatSelectedExamId || !riwayatSelectedClass) ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1">Pilih Filter Ujian dan Kelas</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Untuk melihat daftar riwayat siswa dan aksi melihat percobaan atau menghapus, silakan pilih Ujian dan Kelas di atas terlebih dahulu.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-200 text-slate-500 text-[11px] uppercase font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Siswa</th>
                      <th className="py-3.5 px-5 text-center">Jumlah Percobaan</th>
                      <th className="py-3.5 px-5 text-center">Nilai Tertinggi</th>
                      <th className="py-3.5 px-5 text-center">Status Akhir</th>
                      <th className="py-3.5 px-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <AnimatePresence mode="popLayout" initial={false}>
                    {finalStudentList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                           Tidak ada siswa yang ditemukan untuk kelas ini.
                        </td>
                      </tr>
                    ) : (
                      finalStudentList.map((student) => (
                        <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} key={student.studentId} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5">
                            <div className="font-bold text-slate-900">{student.studentName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{student.studentNisn}</div>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${student.totalAttempts > 1 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                              {student.totalAttempts > 1 ? `${student.totalAttempts} Kali (Remedial)` : '1 Kali'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center font-black text-slate-900">
                            {student.bestScore}
                          </td>
                          <td className="py-3 px-5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${student.passedKkm ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                              {student.passedKkm ? 'Tuntas' : 'Tidak Tuntas'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <button
                              onClick={() => {
                                setSelectedRiwayatStudent({
                                  studentId: student.studentId,
                                  studentName: student.studentName,
                                  studentNisn: student.studentNisn
                                });
                                setIsRiwayatModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                            >
                              Lihat Detail
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
            
            {riwayatSelectedExamId && riwayatSelectedClass && (
              <div className="p-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-200 flex justify-between">
                <span>Menampilkan {finalStudentList.length} siswa</span>
              </div>
            )}
          </div>
        </div>
        );
      })()}
