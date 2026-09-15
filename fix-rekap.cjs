const fs = require('fs');
let code = fs.readFileSync('src/components/RekapPrintModal.tsx', 'utf-8');

const regex = /\{\/\* EXAM META GRID \*\/\}[\s\S]*?<\/div>\s*(?=\{\/\* TABLE OF RECAP RESULTS)/;

const replacement = `{/* EXAM META GRID */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <div className="grid grid-cols-[100px_10px_1fr] sm:grid-cols-[120px_10px_1fr] gap-x-2 gap-y-2">
              <span className="text-slate-500 font-medium">Mata Pelajaran</span>
              <span className="text-slate-500">:</span>
              <strong className="text-slate-900">{exam.subjectName}</strong>
              
              <span className="text-slate-500 font-medium">Judul Ujian</span>
              <span className="text-slate-500">:</span>
              <strong className="text-slate-900">{exam.title}</strong>

              <span className="text-slate-500 font-medium">Kelas Sasaran</span>
              <span className="text-slate-500">:</span>
              <strong className="text-slate-900">{exam.targetClasses.join(', ')}</strong>
            </div>
            
            <div className="grid grid-cols-[110px_10px_1fr] sm:grid-cols-[130px_10px_1fr] gap-x-2 gap-y-2">
              <span className="text-slate-500 font-medium">Guru Pengampu</span>
              <span className="text-slate-500">:</span>
              <strong className="text-slate-900">{exam.teacherName}</strong>

              <span className="text-slate-500 font-medium">Nilai KKM</span>
              <span className="text-slate-500">:</span>
              <strong className="text-slate-900">{kkm}</strong>

              <span className="text-slate-500 font-medium">Tanggal Cetak</span>
              <span className="text-slate-500">:</span>
              <strong className="text-slate-900">
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>
          `;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/RekapPrintModal.tsx', code);
  console.log('Fixed alignment in RekapPrintModal');
} else {
  console.log('Regex did not match.');
}
