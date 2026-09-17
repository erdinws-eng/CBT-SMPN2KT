const fs = require('fs');
let content = fs.readFileSync('src/components/GuruPanel.tsx', 'utf8');

const startTag = '{/* IN-APP CONFIRMATION MODAL (NO WINDOW.CONFIRM / IFRAME SAFE) */}';
const startIndex = content.indexOf(startTag);
const endTag = '    </div>\n  );\n}';
const endIndex = content.lastIndexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

const before = content.substring(0, startIndex + startTag.length);
const after = content.substring(endIndex);

const newModal = `
      {/* ========================================================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div
                className={\`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 \${
                  deleteConfirm.type === 'force_submit' || deleteConfirm.type === 'force_submit_all'
                    ? 'bg-amber-100 text-amber-600'
                    : deleteConfirm.type === 'resume_attempt'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-rose-100 text-rose-600'
                }\`}
              >
                {deleteConfirm.type === 'force_submit' || deleteConfirm.type === 'force_submit_all' ? (
                  <Clock className="w-6 h-6 text-amber-600" />
                ) : deleteConfirm.type === 'resume_attempt' ? (
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                ) : (
                  <Trash2 className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                  {deleteConfirm.type === 'force_submit'
                    ? 'Konfirmasi Kumpulkan Ujian Siswa'
                    : deleteConfirm.type === 'force_submit_all'
                    ? 'Kumpulkan Semua Ujian'
                    : deleteConfirm.type === 'reset_attempt'
                    ? 'Reset Ujian Siswa'
                    : deleteConfirm.type === 'resume_attempt'
                    ? 'Lanjutkan Ujian Siswa'
                    : deleteConfirm.type === 'exam'
                    ? 'Konfirmasi Hapus Paket Ujian'
                    : 'Konfirmasi Hapus Butir Soal'}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {deleteConfirm.type === 'force_submit' ? (
                    <>
                      Apakah Anda yakin ingin menghentikan dan memaksa pengumpulan lembar ujian siswa{' '}
                      <strong className="text-slate-900 font-semibold underline decoration-amber-400">"{deleteConfirm.title}"</strong>?
                    </>
                  ) : deleteConfirm.type === 'force_submit_all' ? (
                    <>
                      Apakah Anda yakin ingin memaksa kumpul <strong>SEMUA</strong> ujian yang masih berstatus "Sedang Mengerjakan"?
                    </>
                  ) : deleteConfirm.type === 'reset_attempt' ? (
                    <>
                      Apakah Anda yakin ingin mereset ujian siswa <strong className="text-slate-900 font-semibold underline decoration-rose-400">"{deleteConfirm.title}"</strong>? Seluruh jawaban sebelumnya akan dihapus secara permanen.
                    </>
                  ) : deleteConfirm.type === 'resume_attempt' ? (
                    <>
                      Siswa <strong className="text-slate-900 font-semibold underline decoration-blue-400">"{deleteConfirm.title}"</strong> akan dapat melanjutkan ujian. Jawaban yang sudah diisi tidak akan dihapus.
                    </>
                  ) : (
                    <>
                      Apakah Anda yakin ingin menghapus {deleteConfirm.subtitle || 'data'}{' '}
                      <strong className="text-slate-900 font-semibold underline decoration-rose-400">"{deleteConfirm.title}"</strong>?
                    </>
                  )}
                </p>

                <div
                  className={\`mt-3 p-3 rounded-xl text-[11px] font-medium flex items-center gap-2 border \${
                    deleteConfirm.type === 'force_submit' || deleteConfirm.type === 'force_submit_all'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-800'
                      : deleteConfirm.type === 'resume_attempt'
                      ? 'bg-blue-50/90 border-blue-200 text-blue-800'
                      : 'bg-rose-50/90 border-rose-200 text-rose-700'
                  }\`}
                >
                  <AlertTriangle
                    className={\`w-4 h-4 shrink-0 \${
                      deleteConfirm.type === 'force_submit' || deleteConfirm.type === 'force_submit_all'
                        ? 'text-amber-500' 
                        : deleteConfirm.type === 'resume_attempt'
                        ? 'text-blue-500'
                        : 'text-rose-500'
                    }\`}
                  />
                  <span>
                    {deleteConfirm.type === 'force_submit' || deleteConfirm.type === 'force_submit_all'
                      ? 'Lembar jawaban siswa akan langsung tersimpan & siswa tidak dapat melanjutkan ujian.'
                      : deleteConfirm.type === 'reset_attempt'
                      ? 'Data jawaban siswa akan direset, siswa mengulang dari awal.'
                      : deleteConfirm.type === 'resume_attempt'
                      ? 'Status pelanggaran akan direset menjadi 0, ujian kembali aktif.'
                      : 'Tindakan ini bersifat permanen dan data yang dihapus tidak dapat dipulihkan.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', title: '', type: 'exam' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className={\`px-4 py-2 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition shadow-xs \${
                  deleteConfirm.type === 'force_submit' || deleteConfirm.type === 'force_submit_all'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : deleteConfirm.type === 'resume_attempt'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }\`}
              >
                {deleteConfirm.type === 'force_submit' || deleteConfirm.type === 'force_submit_all' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Ya, Kumpulkan</span>
                  </>
                ) : deleteConfirm.type === 'resume_attempt' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Ya, Lanjutkan</span>
                  </>
                ) : deleteConfirm.type === 'reset_attempt' ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Ya, Reset Ujian</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
`;

fs.writeFileSync('src/components/GuruPanel.tsx', before + newModal + after);
console.log("Replaced modal successfully");
