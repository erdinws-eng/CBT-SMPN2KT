import { Printer, X, FileSpreadsheet, Award } from 'lucide-react';
import { Exam, ExamAttempt, SchoolSettings } from '../types';

interface RekapPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  attempts: ExamAttempt[];
  settings: SchoolSettings;
}

export default function RekapPrintModal({
  isOpen,
  onClose,
  exam,
  attempts,
  settings,
}: RekapPrintModalProps) {
  if (!isOpen || !exam) return null;

  const kkm = exam.kkm || 75;
  const passedCount = attempts.filter((a) => a.scorePercentage >= kkm).length;
  const failedCount = attempts.length - passedCount;
  const passRate = attempts.length > 0 ? Math.round((passedCount / attempts.length) * 100) : 0;
  const averageScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.scorePercentage, 0) / attempts.length)
      : 0;

  return (
    <div
      id="rekap-print-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div
        id="rekap-print-container"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Modal Top Bar (Hidden during printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base sm:text-lg">
              Pratinjau Cetak Lembar Rekapitulasi Nilai Ujian CBT
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="btn-trigger-print-rekap"
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-rekap-sheet" className="p-8 sm:p-12 text-slate-900 bg-white max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* KOP SURAT SEKOLAH */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 flex items-center gap-4">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-full h-full border-2 border-slate-800 rounded-full font-black text-xs text-center flex items-center justify-center p-1">
                  LOGO SEKOLAH
                </div>
              )}
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                PEMERINTAH KOTA / KABUPATEN PENDIDIKAN
              </h2>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
                {settings.schoolName}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {settings.schoolAddress} • {settings.schoolCity} • NPSN: {settings.schoolNpsn}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Tahun Ajaran: {settings.academicYear} | Semester: {settings.semester}
              </p>
            </div>
          </div>

          {/* DOCUMENT TITLE */}
          <div className="text-center mb-6">
            <h3 className="text-base sm:text-lg font-black uppercase underline tracking-wider">
              DAFTAR REKAPITULASI NILAI ASESMEN COMPUTER-BASED TEST (CBT)
            </h3>
          </div>

          {/* EXAM META GRID */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <div>
              <span className="text-slate-500 font-medium">Mata Pelajaran: </span>
              <strong className="text-slate-900">{exam.subjectName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Guru Pengampu: </span>
              <strong className="text-slate-900">{exam.teacherName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Judul Ujian: </span>
              <strong className="text-slate-900">{exam.title}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Kriteria Ketuntasan Minimal (KKM): </span>
              <strong className="text-slate-900">{kkm}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Kelas Sasaran: </span>
              <strong className="text-slate-900">{exam.targetClasses.join(', ')}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tanggal Cetak: </span>
              <strong className="text-slate-900">
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>

          {/* TABLE OF RECAP RESULTS (NISN and KELAS explicitly separated) */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 uppercase font-black border-b border-slate-400">
                  <th className="p-2.5 border border-slate-400 text-center w-10">NO</th>
                  <th className="p-2.5 border border-slate-400 text-center w-28">NISN</th>
                  <th className="p-2.5 border border-slate-400">Nama Siswa</th>
                  <th className="p-2.5 border border-slate-400 text-center w-16">Kelas</th>
                  <th className="p-2.5 border border-slate-400 text-center w-16">KKM</th>
                  <th className="p-2.5 border border-slate-400 text-center w-20">Nilai Akhir</th>
                  <th className="p-2.5 border border-slate-400 text-center w-28">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 border border-slate-400">
                      Belum ada siswa yang menyelesaikan ujian ini.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att, idx) => {
                    const isPassed = att.scorePercentage >= kkm;
                    return (
                      <tr key={att.id} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300 text-center font-bold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-slate-300 font-mono text-center font-semibold">
                          {att.studentNisn}
                        </td>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">
                          {att.studentName}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-semibold text-slate-700">
                          {att.studentClass}
                        </td>
                        <td className="p-2 border border-slate-300 text-center text-slate-600">
                          {kkm}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-black text-sm">
                          {att.scorePercentage}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-bold">
                          {isPassed ? (
                            <span className="text-emerald-800">TUNTAS</span>
                          ) : (
                            <span className="text-rose-700">REMEDIAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* SIGNATURE SECTION */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-6 break-inside-avoid">
            <div className="text-center">
              <p className="text-slate-500 mb-1">Mengetahui,</p>
              <p className="font-bold text-slate-800 mb-16">Kepala {settings.schoolName}</p>
              <p className="font-bold text-slate-900 underline text-sm">{settings.principalName}</p>
              <p className="text-slate-500 font-mono">NIP. {settings.principalNip}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 mb-1">
                {settings.schoolCity},{' '}
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="font-bold text-slate-800 mb-16">Guru Mata Pelajaran</p>
              <p className="font-bold text-slate-900 underline text-sm">{exam.teacherName}</p>
              <p className="text-slate-500 font-mono">NIP. -</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
