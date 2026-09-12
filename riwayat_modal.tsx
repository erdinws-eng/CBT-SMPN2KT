      {/* MODAL RIWAYAT & REMEDIAL */}
      {isRiwayatModalOpen && selectedRiwayatStudent && (() => {
        const studentAttempts = attempts.filter(a => 
          a.status === 'submitted' && 
          a.examId === riwayatSelectedExamId &&
          a.studentId === selectedRiwayatStudent.studentId
        ).sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

        return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Detail Riwayat & Remedial Siswa</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedRiwayatStudent.studentName} ({selectedRiwayatStudent.studentNisn})</p>
              </div>
              <button onClick={() => setIsRiwayatModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {studentAttempts.map((att, idx) => (
                <div key={att.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {idx === 0 ? 'Percobaan Pertama' : `Percobaan Remedial Ke-${idx}`}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Waktu Mulai: {new Date(att.startedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-xs text-slate-500">
                      Waktu Kumpul: {att.submittedAt ? new Date(att.submittedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Nilai</span>
                      <span className="text-xl font-black text-slate-900">{att.totalScore}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${att.passedKkm ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {att.passedKkm ? 'Tuntas' : 'Tidak Tuntas'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                         if(confirm('Apakah Anda yakin ingin menghapus data percobaan ujian ini?')) {
                            const newAttempts = attempts.filter(a => a.id !== att.id);
                            onUpdateAttempts(newAttempts);
                            // If it was the last attempt, close modal
                            if (studentAttempts.length === 1) {
                                setIsRiwayatModalOpen(false);
                            }
                         }
                      }}
                      className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition cursor-pointer shrink-0"
                      title="Hapus Percobaan"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsRiwayatModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
        );
      })()}

