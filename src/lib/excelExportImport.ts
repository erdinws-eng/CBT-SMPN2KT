import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import mammoth from 'mammoth';
import { User, Subject, ExamAttempt, Question, QuestionType } from '../types';

// Helper to trigger browser file download from XLSX workbook
export function downloadWorkbook(wb: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(wb, fileName);
}

// 1. SISWA EXCEL IMPORT & EXPORT
export function exportSiswaToExcel(students: User[], fileName = 'Data_Siswa_SMP.xlsx') {
  const data = students.map((s, idx) => ({
    'No': idx + 1,
    'NISN': s.nip_nisn,
    'Nama Lengkap': s.name,
    'Kelas': s.classGrade || '8A',
    'Jenis Kelamin (L/P)': s.gender || 'L',
    'Username CBT': s.username,
    'Password Default': s.password || 'password123',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
  downloadWorkbook(wb, fileName);
}

export function downloadTemplateSiswaExcel() {
  const template = [
    {
      'NISN': '0098472201',
      'Nama Lengkap': 'Muhammad Farhan',
      'Kelas': '8A',
      'Jenis Kelamin (L/P)': 'L',
      'Username CBT': 'farhan8a',
      'Password Default': 'password123',
    },
    {
      'NISN': '0098472202',
      'Nama Lengkap': 'Nabila Salsabila',
      'Kelas': '8A',
      'Jenis Kelamin (L/P)': 'P',
      'Username CBT': 'nabila8a',
      'Password Default': 'password123',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  downloadWorkbook(wb, 'Template_Impor_Siswa.xlsx');
}

export async function parseSiswaExcel(file: File): Promise<User[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  return rows.map((r, i) => ({
    id: 'user_siswa_import_' + Date.now() + '_' + i,
    username: String(r['Username CBT'] || r['Username'] || r['NISN'] || `siswa_${Date.now()}_${i}`).trim(),
    password: String(r['Password Default'] || r['Password'] || 'password123').trim(),
    name: String(r['Nama Lengkap'] || r['Nama'] || 'Siswa Baru').trim(),
    role: 'siswa',
    nip_nisn: String(r['NISN'] || `009${Math.floor(1000000 + Math.random() * 9000000)}`).trim(),
    classGrade: String(r['Kelas'] || '8A').trim().toUpperCase(),
    gender: (String(r['Jenis Kelamin (L/P)'] || r['Gender'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L') as 'L' | 'P',
  }));
}

// 2. GURU EXCEL IMPORT & EXPORT
export function exportGuruToExcel(teachers: User[], fileName = 'Data_Guru_SMP.xlsx') {
  const data = teachers.map((g, idx) => ({
    'No': idx + 1,
    'NIP': g.nip_nisn,
    'Nama Lengkap & Gelar': g.name,
    'Mata Pelajaran Diampu': g.subjectName || '-',
    'Username CBT': g.username,
    'Password': g.password || 'password123',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
  downloadWorkbook(wb, fileName);
}

export function downloadTemplateGuruExcel() {
  const template = [
    {
      'NIP': '198304122007011005',
      'Nama Lengkap & Gelar': 'Nurul Hidayah, S.Pd.',
      'Mata Pelajaran Diampu': 'Bahasa Inggris',
      'Username CBT': 'nurul_inggris',
      'Password': 'password123',
    },
    {
      'NIP': '197911202005021003',
      'Nama Lengkap & Gelar': 'Agus Prabowo, M.Pd.',
      'Mata Pelajaran Diampu': 'Matematika',
      'Username CBT': 'agus_mat',
      'Password': 'password123',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
  downloadWorkbook(wb, 'Template_Impor_Guru.xlsx');
}

export async function parseGuruExcel(file: File): Promise<User[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  return rows.map((r, i) => ({
    id: 'user_guru_import_' + Date.now() + '_' + i,
    username: String(r['Username CBT'] || r['Username'] || `guru_${Date.now()}_${i}`).trim(),
    password: String(r['Password'] || 'password123').trim(),
    name: String(r['Nama Lengkap & Gelar'] || r['Nama'] || 'Guru Baru').trim(),
    role: 'guru',
    nip_nisn: String(r['NIP'] || `1985${Math.floor(10000000000000 + Math.random() * 90000000000000)}`).trim(),
    subjectName: String(r['Mata Pelajaran Diampu'] || r['Mata Pelajaran'] || 'Umum').trim(),
  }));
}

// 3. MATA PELAJARAN EXCEL IMPORT & EXPORT
export function exportMapelToExcel(subjects: Subject[], fileName = 'Data_Mata_Pelajaran_SMP.xlsx') {
  const data = subjects.map((m, idx) => ({
    'No': idx + 1,
    'Kode Mapel': m.code,
    'Nama Mata Pelajaran': m.name,
    'Jenjang Tingkat': m.gradeLevel,
    'Guru Pengampu': m.teacherName || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mata Pelajaran');
  downloadWorkbook(wb, fileName);
}

export function downloadTemplateMapelExcel() {
  const template = [
    {
      'Kode Mapel': 'SEN-8',
      'Nama Mata Pelajaran': 'Seni Budaya',
      'Jenjang Tingkat': '7A, 7B',
      'Guru Pengampu': 'Irma Suryani, S.Sn.',
    },
    {
      'Kode Mapel': 'PJK-8',
      'Nama Mata Pelajaran': 'Pendidikan Jasmani (PJOK)',
      'Jenjang Tingkat': '7A, 7B',
      'Guru Pengampu': 'Hendra Wijaya, S.Pd.',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Mapel');
  downloadWorkbook(wb, 'Template_Impor_Mapel.xlsx');
}

export async function parseMapelExcel(file: File): Promise<Subject[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  return rows.map((r, i) => ({
    id: 'sub_import_' + Date.now() + '_' + i,
    code: String(r['Kode Mapel'] || r['Kode'] || `MAPEL-${i + 1}`).trim().toUpperCase(),
    name: String(r['Nama Mata Pelajaran'] || r['Nama'] || 'Mata Pelajaran').trim(),
    gradeLevel: String(r['Jenjang Tingkat'] || r['Jenjang'] || '7A, 7B').trim(),
    teacherName: r['Guru Pengampu'] ? String(r['Guru Pengampu']).trim() : undefined,
  }));
}

// 4. LAPORAN NILAI SISWA EXCEL EXPORT & IMPORT
export function exportExamResultsToExcel(
  examTitle: string,
  subjectName: string,
  kkm: number,
  attempts: ExamAttempt[],
  fileName?: string
) {
  // Kelompokkan per siswa dan ambil nilai tertinggi (best score)
  const studentMap: Record<string, ExamAttempt> = {};
  attempts.forEach((att) => {
    const key = att.studentId || att.studentNisn || att.studentName;
    if (!studentMap[key]) {
      studentMap[key] = att;
    } else {
      const currentBest = studentMap[key].scorePercentage ?? studentMap[key].totalScore ?? 0;
      const candidateScore = att.scorePercentage ?? att.totalScore ?? 0;
      if (candidateScore > currentBest) {
        studentMap[key] = att;
      }
    }
  });

  const uniqueAttempts = Object.values(studentMap).sort((a, b) => a.studentName.localeCompare(b.studentName));

  const rows = uniqueAttempts.map((att, idx) => {
    const isPassed = att.scorePercentage >= kkm;
    return {
      'No': idx + 1,
      'NISN': att.studentNisn,
      'Nama Siswa': att.studentName,
      'Kelas': att.studentClass,
      'Mata Pelajaran': subjectName,
      'Judul Ujian': examTitle,
      'Skor Diperoleh': att.totalScore,
      'Skor Maksimum': att.maxPossibleScore,
      'Nilai Akhir (Skala 100)': att.scorePercentage,
      'Nilai KKM': kkm,
      'Status Kelulusan': isPassed ? 'TUNTAS' : 'REMEDIAL',
      'Jumlah Pelanggaran': att.violationCount,
      'Status Ujian': att.status === 'violation_disqualified' ? 'DISKUALIFIKASI KECURANGAN' : (att.status === 'submitted' ? 'SELESAI' : 'SEDANG MENGERJAKAN'),
      'Waktu Mulai': att.startedAt ? new Date(att.startedAt).toLocaleString('id-ID') : '-',
      'Waktu Selesai': att.submittedAt ? new Date(att.submittedAt).toLocaleString('id-ID') : '-',
      'Catatan Guru': att.teacherFeedback || '-',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = [
    { wch: 6 }, // No
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama Siswa
    { wch: 8 },  // Kelas
    { wch: 24 }, // Mata Pelajaran
    { wch: 30 }, // Judul Ujian
    { wch: 14 }, // Skor Diperoleh
    { wch: 14 }, // Skor Maksimum
    { wch: 16 }, // Nilai Akhir
    { wch: 10 }, // KKM
    { wch: 14 }, // Status
    { wch: 16 }, // Pelanggaran
    { wch: 20 }, // Status Ujian
    { wch: 20 }, // Waktu Mulai
    { wch: 20 }, // Waktu Selesai
    { wch: 30 }, // Catatan
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
  const safeName = (fileName || `Laporan_Nilai_${examTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  downloadWorkbook(wb, safeName);
}

// 5. IMPORT SOAL DARI EXCEL
export function downloadTemplateSoalExcel() {
  const template = [
    {
      'Tipe Soal': 'pilihan_ganda',
      'Pertanyaan': 'Organel sel penghasil energi pada sel eukariotik adalah...',
      'Tipe Media (image/video/none)': 'none',
      'URL Media': '',
      'Bobot Nilai': 10,
      'Pilihan A': 'Mitokondria',
      'Pilihan B': 'Ribosom',
      'Pilihan C': 'Badan Golgi',
      'Pilihan D': 'Vakuola',
      'Kunci Jawaban': 'A. Mitokondria',
      'Penjelasan': 'Mitokondria merupakan organel tempat respirasi seluler dan pembentukan ATP.',
    },
    {
      'Tipe Soal': 'isian',
      'Pertanyaan': 'Ibukota negara Indonesia yang baru di Kalimantan Timur adalah...',
      'Tipe Media (image/video/none)': 'none',
      'URL Media': '',
      'Bobot Nilai': 10,
      'Pilihan A': '',
      'Pilihan B': '',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': 'Nusantara',
      'Penjelasan': 'IKN berlokasi di wilayah Sepaku, Penajam Paser Utara.',
    },
    {
      'Tipe Soal': 'essay',
      'Pertanyaan': 'Jelaskan perbedaan mendasar antara sel hewan dan sel tumbuhan!',
      'Tipe Media (image/video/none)': 'none',
      'URL Media': '',
      'Bobot Nilai': 20,
      'Pilihan A': '',
      'Pilihan B': '',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': 'Sel tumbuhan memiliki dinding sel dan kloroplas serta vakuola besar.',
      'Penjelasan': 'Rubrik: Keberadaan dinding sel (bobot 10), Kloroplas (bobot 10).',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
  downloadWorkbook(wb, 'Template_Impor_Soal_CBT.xlsx');
}

export async function parseSoalExcel(file: File): Promise<Question[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  return rows.map((r, i) => {
    const rawType = String(r['Tipe Soal'] || 'pilihan_ganda').trim().toLowerCase();
    let type: QuestionType = 'pilihan_ganda';
    if (rawType.includes('kompleks')) type = 'pilihan_ganda_kompleks';
    else if (rawType.includes('isi') || rawType.includes('singkat')) type = 'isian';
    else if (rawType.includes('essay') || rawType.includes('uraian')) type = 'essay';
    else if (rawType.includes('jodoh')) type = 'menjodohkan';
    else if (rawType.includes('benar') || rawType.includes('salah')) type = 'benar_salah';

    const options: string[] = [];
    ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E'].forEach((key, optIdx) => {
      if (r[key]) {
        const letter = String.fromCharCode(65 + optIdx);
        const text = String(r[key]).trim();
        options.push(text.startsWith(letter + '.') ? text : `${letter}. ${text}`);
      }
    });

    const mediaType = (['image', 'video'].includes(String(r['Tipe Media (image/video/none)'] || '').toLowerCase())
      ? String(r['Tipe Media (image/video/none)']).toLowerCase()
      : 'none') as 'image' | 'video' | 'none';

    return {
      id: 'q_import_' + Date.now() + '_' + i,
      type,
      prompt: String(r['Pertanyaan'] || `Pertanyaan nomor ${i + 1}`).trim(),
      points: Number(r['Bobot Nilai']) || 10,
      mediaType,
      mediaUrl: r['URL Media'] ? String(r['URL Media']).trim() : undefined,
      options: options.length > 0 ? options : undefined,
      correctAnswer: r['Kunci Jawaban'] ? String(r['Kunci Jawaban']).trim() : undefined,
      explanation: r['Penjelasan'] ? String(r['Penjelasan']).trim() : undefined,
    };
  });
}

// 6. TEMPLATE SOAL MICROSOFT WORD (.DOCX) DOWNLOAD & PARSER
export async function downloadTemplateSoalWord() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'TEMPLATE FORMAT SOAL UJIAN CBT (MICROSOFT WORD)',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Petunjuk Penulisan Soal CBT:',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• Awali setiap nomor butir soal dengan angka dan titik, contoh: "1. Pertanyaan...", "2. Pertanyaan..."\n',
                size: 20,
              }),
              new TextRun({
                text: '• Pilihan Ganda (PG): Tuliskan opsi diawali huruf dan titik: "A. Opsi...", "B. Opsi...", "C. ...", "D. ...". Kunci: "Kunci: A" (atau "Kunci: B").\n',
                size: 20,
              }),
              new TextRun({
                text: '• Pilihan Ganda Kompleks (PGK): Awali soal dengan [Pilihan Ganda Kompleks], kunci lebih dari satu, contoh: "Kunci: A, C".\n',
                size: 20,
              }),
              new TextRun({
                text: '• Benar-Salah: Awali soal dengan [Benar-Salah], kunci format: "Kunci: Benar" atau "Kunci: Salah".\n',
                size: 20,
              }),
              new TextRun({
                text: '• Menjodohkan: Awali soal dengan [Menjodohkan], lalu tuliskan pasangan dengan tanda sama dengan (=), contoh: "Indonesia = Jakarta".\n',
                size: 20,
              }),
              new TextRun({
                text: '• Isian Singkat: Awali soal dengan [Isian], kunci berupa jawaban kata/frasa singkat, contoh: "Kunci: Nusantara".\n',
                size: 20,
              }),
              new TextRun({
                text: '• Uraian / Esai: Awali soal dengan [Uraian] atau [Essay], kunci berupa pembahasan / rubrik jawaban.\n',
                size: 20,
              }),
              new TextRun({
                text: '• Bobot nilai dan pembahasan dapat ditambahkan opsional: "Bobot: 10", "Pembahasan: ...".\n',
                size: 20,
              }),
              new TextRun({
                text: '• Anda juga dapat menggunakan tabel Word (No | Bentuk Soal | Soal | Opsi A | Opsi B | Opsi C | Opsi D | Kunci | Bobot).',
                size: 20,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: '==================== CONTOH BUTIR SOAL ====================',
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Soal 1: Pilihan Ganda
          new Paragraph({
            children: [
              new TextRun({
                text: '1. [Pilihan Ganda] Organel sel yang berfungsi sebagai tempat berlangsungnya respirasi seluler dan menghasilkan energi dalam bentuk ATP adalah...',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({ children: [new TextRun({ text: 'A. Ribosom', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'B. Mitokondria', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'C. Badan Golgi', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'D. Retikulum Endoplasma', size: 21 })] }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: B',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Pembahasan: Mitokondria sering disebut the powerhouse of cell karena menghasilkan energi seluler ATP.',
                size: 20,
                italics: true,
              }),
            ],
            spacing: { after: 250 },
          }),

          // Soal 2: Pilihan Ganda Kompleks
          new Paragraph({
            children: [
              new TextRun({
                text: '2. [Pilihan Ganda Kompleks] Manakah dari pernyataan di bawah ini yang merupakan ciri-ciri makhluk hidup? (Pilihlah jawaban yang benar)',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({ children: [new TextRun({ text: 'A. Memerlukan nutrisi/makanan', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'B. Mampu berkembang biak (reproduksi)', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'C. Tidak peka terhadap rangsang', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'D. Melakukan ekskresi (pengeluaran zat sisa)', size: 21 })] }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: A, B, D',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 250 },
          }),

          // Soal 3: Benar-Salah
          new Paragraph({
            children: [
              new TextRun({
                text: '3. [Benar-Salah] Danau Toba merupakan danau tekto-vulkanik terbesar di Indonesia yang terbentuk dari letusan supervulkan purba.',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: Benar',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 250 },
          }),

          // Soal 4: Menjodohkan
          new Paragraph({
            children: [
              new TextRun({
                text: '4. [Menjodohkan] Pasangkan organel sel berikut dengan fungsinya masing-masing secara tepat:',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({ children: [new TextRun({ text: 'Mitokondria = Respirasi seluler & pembentukan ATP', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'Ribosom = Tempat sintesis protein', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'Kloroplas = Fotosintesis pada tumbuhan', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'Nukleus = Pusat pengendali aktivitas genetik sel', size: 21 })] }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Bobot: 15',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 80, after: 250 },
          }),

          // Soal 5: Isian Singkat
          new Paragraph({
            children: [
              new TextRun({
                text: '5. [Isian] Ibukota negara Republik Indonesia yang baru dan berlokasi di Kalimantan Timur bernama...',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: Nusantara',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 250 },
          }),

          // Soal 6: Uraian / Essay
          new Paragraph({
            children: [
              new TextRun({
                text: '6. [Uraian] Jelaskan perbedaan mendasar antara sel hewan dan sel tumbuhan beserta fungsi organel kloroplas dalam proses fotosintesis!',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: Sel tumbuhan memiliki dinding sel yang kaku, plastida/kloroplas, dan vakuola berukuran besar. Sedangkan sel hewan tidak memiliki dinding sel dan plastida melainkan memiliki sentriol. Kloroplas berfungsi menangkap energi cahaya matahari untuk fotosintesis.',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Bobot: 20',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Soal_CBT.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 7. DOKUMEN DOC / DOCX / TEXT PARSER UNTUK BANK SOAL
export async function parseDocxTextQuestions(file: File): Promise<Question[]> {
  let html = '';
  let rawText = '';

  if (file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml')) {
    try {
      const buffer = await file.arrayBuffer();
      const htmlRes = await mammoth.convertToHtml({ arrayBuffer: buffer });
      html = htmlRes?.value || '';
      const rawRes = await mammoth.extractRawText({ arrayBuffer: buffer });
      rawText = rawRes?.value || '';
    } catch (e) {
      console.warn('Gagal membaca struktur docx melalui mammoth, fallback ke text():', e);
      rawText = await file.text();
    }
  } else {
    rawText = await file.text();
  }

  // 1. Ekstrak butir soal baik dari tabel maupun teks bebas di dokumen
  let tableQuestions: Question[] = [];
  if (html && html.includes('<table')) {
    tableQuestions = parseHtmlTablesToQuestions(html);
  }

  // 2. Normalisasi dokumen ke baris-baris terstruktur
  const lines = html ? htmlToNormalizedLines(html) : rawTextToNormalizedLines(rawText);

  // 3. Ekstrak butir soal dari teks berurutan
  const textQuestions = parseNormalizedLinesToQuestions(lines);

  // 4. Pilih hasil terbaik: jika teks mendeteksi soal lebih banyak atau sama dan valid, utamakan teks; sebaliknya tabel
  if (textQuestions.length >= tableQuestions.length && textQuestions.length > 0) {
    return textQuestions;
  }
  if (tableQuestions.length > 0) {
    return tableQuestions;
  }
  return textQuestions;
}

// Normalisasi HTML ke array baris terstruktur
function htmlToNormalizedLines(html: string): string[] {
  let processed = html;

  // Konversi <ol> dengan cerdas: bedakan daftar soal (1, 2, 3...) vs daftar pilihan jawaban (A, B, C, D...)
  processed = processed.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    const liMatches = Array.from(inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((m: any) => m[1]);
    if (liMatches.length === 0) return inner;

    const cleanItems = liMatches.map((m: string) => m.replace(/<[^>]+>/g, '').trim());

    // Cek apakah item sudah memiliki nomor soal (misal: "1.", "2)") atau huruf (misal: "A.", "B)")
    const hasExistingNumbers = cleanItems.some((it: string) => /^\d+[\.\)]\s*/.test(it));
    const hasExistingLetters = cleanItems.some((it: string) => /^[A-Ea-e][\.\)\:\-\–\—\s]\s*/.test(it));

    if (hasExistingNumbers || hasExistingLetters) {
      return cleanItems.map((it: string) => `<p>${it}</p>`).join('\n');
    }

    // Jika lebih dari 5 item atau berakhiran '?' / ':' atau kalimat panjang, ini daftar butir pertanyaan
    const isQuestionList =
      cleanItems.length > 5 ||
      cleanItems.some((it: string) => it.length > 70 || it.endsWith('?') || it.endsWith(':') || it.includes('...'));

    if (isQuestionList) {
      return cleanItems.map((it: string, idx: number) => `<p>${idx + 1}. ${it}</p>`).join('\n');
    }

    // Jika 2-5 item pendek, ini adalah daftar opsi pilihan jawaban A, B, C, D...
    return cleanItems.map((it: string, idx: number) => {
      const letter = String.fromCharCode(65 + idx);
      return `<p>${letter}. ${it}</p>`;
    }).join('\n');
  });

  // Konversi <ul> (bulleted list)
  processed = processed.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    const liMatches = Array.from(inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((m: any) => m[1]);
    if (liMatches.length === 0) return inner;
    const cleanItems = liMatches.map((m: string) => m.replace(/<[^>]+>/g, '').trim());

    return cleanItems.map((it: string, idx: number) => {
      if (/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/.test(it)) {
        return `<p>${it}</p>`;
      }
      if (/^\d+[\.\)]\s*/.test(it)) {
        return `<p>${it}</p>`;
      }
      if (cleanItems.length <= 5 && !it.endsWith('?') && it.length < 80) {
        const letter = String.fromCharCode(65 + idx);
        return `<p>${letter}. ${it}</p>`;
      }
      return `<p>${it}</p>`;
    }).join('\n');
  });

  // Konversi tabel baris menjadi paragraf
  processed = processed.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, inner) => {
    return inner.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, (__: string, tdText: string) => `<p>${tdText}</p>`);
  });

  processed = processed.replace(/<br\s*\/?>/gi, '\n');
  processed = processed.replace(/<\/p>/gi, '\n');
  processed = processed.replace(/<\/div>/gi, '\n');
  processed = processed.replace(/<\/h[1-6]>/gi, '\n');
  processed = processed.replace(/<[^>]+>/g, '');

  return rawTextToNormalizedLines(processed);
}

// Normalisasi raw text ke array baris
function rawTextToNormalizedLines(raw: string): string[] {
  const rawLines = raw
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  const normalized: string[] = [];

  for (const line of rawLines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    // Bersihkan karakter bullet di awal jika diikuti nomor soal atau opsi huruf
    trimmed = trimmed.replace(/^[•\*\-\–\—\u2022\u25E6\u2043\u2219]\s*(?=[A-Ea-e\d][\.\)\:\-\–\—\s])/, '');

    // Cek jika nomor soal dan opsi berada dalam satu baris (misal: "1. Soal... A. Opsi 1 B. Opsi 2")
    const qNumMatch = trimmed.match(/^((?:(?:no|soal|nomor)\.?\s*)?\d+[\.\)\:\-]\s+)([\s\S]+)/i);
    if (qNumMatch) {
      const afterNum = qNumMatch[2];
      const firstOptMatch = afterNum.search(/(?:^|\s+|[\t])(?=[A-Ea-e][\.\)\:\-\–\—]|\([A-Ea-e]\)|\[[A-Ea-e]\])/);
      if (firstOptMatch !== -1 && firstOptMatch > 0) {
        const promptPart = afterNum.substring(0, firstOptMatch).trim();
        const optionsPart = afterNum.substring(firstOptMatch).trim();
        normalized.push(qNumMatch[1] + promptPart);
        const subOpts = splitHorizontalOptions(optionsPart);
        normalized.push(...subOpts);
        continue;
      }
    }

    // Cek jika opsi ditulis mendatar (misal: "A. Pilihan 1   B. Pilihan 2   C. ...")
    const optionMatches = trimmed.match(/(?:^|\s+|[\t])(?=[A-Ea-e][\.\)\:\-\–\—]|\([A-Ea-e]\)|\[[A-Ea-e]\])/g);
    if (optionMatches && optionMatches.length >= 2) {
      const subOpts = splitHorizontalOptions(trimmed);
      normalized.push(...subOpts);
    } else {
      normalized.push(trimmed);
    }
  }

  return normalized;
}

// Pemecah opsi mendatar (A. ... B. ...) dan penyeragaman format
function splitHorizontalOptions(str: string): string[] {
  const parts = str
    .split(/(?:^|\s+|[\t])(?=[A-Ea-e][\.\)\:\-\–\—]|\([A-Ea-e]\)|\[[A-Ea-e]\])/)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.map((p, idx) => {
    const clean = p.replace(/^[•\*\-\–\—\u2022\u25E6\u2043\u2219]?\s*/, '').trim();
    const m = clean.match(/^[\(\[]?([A-Ea-e])[\)\]]?[\.\)\:\-\–\—\s]\s*(.*)/);
    if (m) {
      const letter = m[1].toUpperCase();
      const text = m[2].trim();
      return `${letter}. ${text}`;
    }
    const defaultLetter = String.fromCharCode(65 + idx);
    return `${defaultLetter}. ${clean}`;
  });
}

// Parser Tabel Word / HTML
function parseHtmlTablesToQuestions(html: string): Question[] {
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const questions: Question[] = [];
  let tMatch: RegExpExecArray | null;

  while ((tMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tMatch[1];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows: string[][] = [];
    let rMatch: RegExpExecArray | null;

    while ((rMatch = rowRegex.exec(tableContent)) !== null) {
      const rowContent = rMatch[1];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      const cells: string[] = [];
      let cMatch: RegExpExecArray | null;

      while ((cMatch = cellRegex.exec(rowContent)) !== null) {
        const text = cMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\u00A0/g, ' ')
          .trim();
        cells.push(text);
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length < 2) continue;

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    let colType = -1;
    let colPrompt = -1;
    let colA = -1;
    let colB = -1;
    let colC = -1;
    let colD = -1;
    let colE = -1;
    let colOptions = -1;
    let colKey = -1;
    let colPoints = -1;
    let colExplanation = -1;

    headers.forEach((h, idx) => {
      if (h.includes('bentuk') || h.includes('tipe') || h.includes('jenis')) colType = idx;
      else if (h.includes('soal') || h.includes('pertanyaan') || h.includes('butir') || h.includes('deskripsi')) colPrompt = idx;
      else if (/^(?:opsi|pilihan|pil|jawaban)?\s*a[\.\)]?$/i.test(h)) colA = idx;
      else if (/^(?:opsi|pilihan|pil|jawaban)?\s*b[\.\)]?$/i.test(h)) colB = idx;
      else if (/^(?:opsi|pilihan|pil|jawaban)?\s*c[\.\)]?$/i.test(h)) colC = idx;
      else if (/^(?:opsi|pilihan|pil|jawaban)?\s*d[\.\)]?$/i.test(h)) colD = idx;
      else if (/^(?:opsi|pilihan|pil|jawaban)?\s*e[\.\)]?$/i.test(h)) colE = idx;
      else if (h.includes('pilihan') || h.includes('opsi')) colOptions = idx;
      else if (h.includes('kunci') || h.includes('jawaban benar') || h.includes('answer') || h === 'kunci') colKey = idx;
      else if (h.includes('bobot') || h.includes('poin') || h.includes('skor')) colPoints = idx;
      else if (h.includes('pembahasan') || h.includes('penjelasan')) colExplanation = idx;
    });

    // Validasi ketat: abaikan tabel metadata kop sekolah
    const hasQuestionHeaders = colPrompt !== -1 || colKey !== -1 || colA !== -1 || colOptions !== -1 || colType !== -1;
    const isMetadataTable = headers.some((h) =>
      h.includes('nama sekolah') || h.includes('mata pelajaran') || h.includes('tahun ajaran') ||
      h.includes('hari/tanggal') || h.includes('waktu') || h.includes('penyusun')
    );
    if (isMetadataTable && !hasQuestionHeaders) {
      continue;
    }

    if (hasQuestionHeaders || (rows[0].length >= 3 && rows.length >= 2)) {
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (row.length === 0 || row.every((c) => !c)) continue;

        let prompt = colPrompt !== -1 ? row[colPrompt] || '' : row[1] || row[0] || '';
        const rawType = colType !== -1 ? row[colType] || '' : '';
        const key = colKey !== -1 ? row[colKey] || '' : row[row.length - 1] || '';
        const points = colPoints !== -1 ? Number(row[colPoints]) || 10 : 10;
        const explanation = colExplanation !== -1 ? row[colExplanation] || undefined : undefined;

        const options: string[] = [];
        if (colA !== -1 && row[colA]) options.push(`A. ${row[colA].replace(/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/, '')}`);
        if (colB !== -1 && row[colB]) options.push(`B. ${row[colB].replace(/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/, '')}`);
        if (colC !== -1 && row[colC]) options.push(`C. ${row[colC].replace(/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/, '')}`);
        if (colD !== -1 && row[colD]) options.push(`D. ${row[colD].replace(/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/, '')}`);
        if (colE !== -1 && row[colE]) options.push(`E. ${row[colE].replace(/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/, '')}`);

        if (options.length === 0 && colOptions !== -1 && row[colOptions]) {
          const splitOpts = splitHorizontalOptions(row[colOptions]);
          if (splitOpts.length >= 2) {
            options.push(...splitOpts);
          } else {
            const rawSplit = row[colOptions].split('\n').map((s) => s.trim()).filter(Boolean);
            rawSplit.forEach((so, idx) => {
              const letter = String.fromCharCode(65 + idx);
              options.push(so.startsWith(letter + '.') ? so : `${letter}. ${so}`);
            });
          }
        }

        if (options.length === 0 && prompt.includes('\n')) {
          const subLines = prompt.split('\n').map((l) => l.trim()).filter(Boolean);
          const cleanPromptParts: string[] = [];
          for (const sl of subLines) {
            if (/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/.test(sl)) {
              const letter = sl.charAt(0).toUpperCase();
              options.push(`${letter}. ${sl.replace(/^[A-Ea-e][\.\)\:\-\–\—\s]\s*/, '')}`);
            } else {
              cleanPromptParts.push(sl);
            }
          }
          if (options.length > 0) {
            prompt = cleanPromptParts.join(' ');
          }
        }

        const q = buildQuestionModel({
          id: 'q_tbl_' + Date.now() + '_' + questions.length,
          prompt,
          rawType,
          options,
          key,
          points,
          explanation,
        });
        if (q) questions.push(q);
      }
    }
  }

  return questions;
}

// Parser baris-baris teks terstruktur ke soal CBT
function parseNormalizedLinesToQuestions(lines: string[]): Question[] {
  const questions: Question[] = [];
  let currentPrompt = '';
  let currentRawType = '';
  let currentOptions: string[] = [];
  let currentKey = '';
  let currentPoints = 10;
  let currentExplanation = '';
  let candidateOptionLines: string[] = [];
  let defaultSectionType = '';

  const pushCurrent = () => {
    if (currentPrompt.trim()) {
      const isHeader =
        currentOptions.length === 0 &&
        !currentKey &&
        (currentPrompt.toUpperCase().includes('TEMPLATE FORMAT SOAL') ||
          currentPrompt.toUpperCase().includes('PETUNJUK PENULISAN') ||
          currentPrompt.toUpperCase().includes('CONTOH BUTIR SOAL') ||
          currentPrompt.toUpperCase().includes('KEMENTERIAN') ||
          currentPrompt.toUpperCase().includes('DINAS PENDIDIKAN') ||
          currentPrompt.toUpperCase().includes('PENILAIAN AKHIR') ||
          currentPrompt.toUpperCase().includes('ASESMEN SUMATIF') ||
          currentPrompt.toUpperCase().includes('ULANGAN HARIAN'));

      if (!isHeader) {
        // Jika opsi belum terisi dan ada 2-5 baris pendek di bawah pertanyaan, jadikan opsi A, B, C...
        if (currentOptions.length === 0 && candidateOptionLines.length >= 2 && candidateOptionLines.length <= 5) {
          candidateOptionLines.forEach((col, idx) => {
            const letter = String.fromCharCode(65 + idx);
            currentOptions.push(`${letter}. ${col}`);
          });
        }

        const q = buildQuestionModel({
          id: 'q_doc_' + Date.now() + '_' + questions.length,
          prompt: currentPrompt.trim(),
          rawType: currentRawType || defaultSectionType,
          options: currentOptions,
          key: currentKey,
          points: currentPoints,
          explanation: currentExplanation,
        });
        if (q) questions.push(q);
      }
    }

    currentPrompt = '';
    currentRawType = '';
    currentOptions = [];
    currentKey = '';
    currentPoints = 10;
    currentExplanation = '';
    candidateOptionLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Header Bagian (misal: "BAGIAN I: SOAL PILIHAN GANDA", "I. PILIHAN GANDA", "SOAL PILIHAN GANDA", "URAIAN")
    const sectionMatch = trimmed.match(
      /^(?:bagian|bab|kategori|romawi)?\s*[I|V|X|A-E\d]?[\.\:\-\–\s]*\s*(?:soal\s+)?(pilihan\s+ganda\s+kompleks|pilihan\s+ganda|pgk|pg|uraian|essay|esai|benar\s*[-–\s]*\s*salah|menjodohkan|isian)/i
    );
    if (sectionMatch) {
      defaultSectionType = sectionMatch[1].toLowerCase();
      continue;
    }

    // Tipe / Bentuk Soal eksplisit (misal: "Bentuk Soal: Pilihan Ganda", "Tipe Soal: PG", "Jenis Soal: Essay")
    const explicitTypeMatch = trimmed.match(/^(?:bentuk|tipe|jenis)\s+(?:soal)?\s*[:=]\s*(.+)/i);
    if (explicitTypeMatch) {
      currentRawType = explicitTypeMatch[1].trim();
      continue;
    }

    // Bobot / Poin (misal: "Bobot: 15", "Poin: 10", "Skor: 20")
    const pointsMatch = trimmed.match(/^(?:bobot|poin|skor|nilai)\s*[:=]\s*(\d+)/i);
    if (pointsMatch) {
      currentPoints = Number(pointsMatch[1]) || 10;
      continue;
    }

    // Pembahasan / Penjelasan
    const explMatch = trimmed.match(/^(?:pembahasan|penjelasan|rubrik|rubrik penilaian|keterangan)\s*[:=]\s*(.*)/i);
    if (explMatch) {
      currentExplanation = explMatch[1].trim();
      continue;
    }

    // Kunci Jawaban (misal: "Kunci: B", "Kunci Jawaban: A, C", "Jawaban: Nusantara", "Kunci = Benar", "Kunci: B. Ribosom")
    const keyMatch = trimmed.match(/^(?:kunci\s*jawaban|kunci|jawaban\s*benar|jawaban|answer|ans)\s*[:=]\s*(.*)/i);
    if (keyMatch) {
      currentKey = keyMatch[1].trim();
      continue;
    }

    // Nomor Soal Baru (misal: "1. ", "2) ", "No. 1. ", "Soal 1: ", "1: ")
    const numMatch = trimmed.match(/^(?:(?:no|soal|nomor)\.?\s*)?(\d+)[\.\)\:\-]\s*(.*)/i);
    if (numMatch) {
      pushCurrent();
      let textAfterNum = numMatch[2].trim();

      // Cek apakah ada tag bentuk soal di awal pertanyaan seperti "[Pilihan Ganda]" atau "(PG)"
      const tagTypeMatch = textAfterNum.match(/^(\[[^\]]+\]|\([^\)]+\))\s*(.*)/);
      if (tagTypeMatch) {
        const potentialTag = tagTypeMatch[1].replace(/[\[\]\(\)]/g, '').trim();
        if (/pilihan\s*ganda|pg|uraian|essay|esai|benar|salah|jodoh|isian/i.test(potentialTag)) {
          currentRawType = potentialTag;
          textAfterNum = tagTypeMatch[2].trim();
        }
      }

      currentPrompt = textAfterNum;
      continue;
    }

    // Opsi Pilihan Jawaban (misal: "A. ...", "B) ...", "(A) ...", "[A] ...", "• A. ...", "A: ...")
    const optMatch =
      trimmed.match(/^(?:[•\*\-\–\—\u2022\u25E6\u2043\u2219]?\s*)?(?:(?:pilihan|opsi|jawaban|pil)\s+)?([A-Ea-e])[\.\)\:\-\–\—\s]\s*(.*)/i) ||
      trimmed.match(/^(?:[•\*\-\–\—\u2022\u25E6\u2043\u2219]?\s*)?[\(\[]([A-Ea-e])[\)\]]\s*(.*)/i);

    if (optMatch) {
      const letter = optMatch[1].toUpperCase();
      const optText = optMatch[2].trim();

      // Cek jika baris ini berisi beberapa opsi sekaligus secara horizontal (misal: "A. Opsi 1   B. Opsi 2...")
      const hasHorizontalSubOpts = /(?:^|\s+|[\t])(?=[B-Eb-e][\.\)\:\-\–\—]|\([B-Eb-e]\)|\[[B-Eb-e]\])/i.test(optText);
      if (hasHorizontalSubOpts) {
        const allInLine = splitHorizontalOptions(`${letter}. ${optText}`);
        allInLine.forEach((o) => {
          const cleanO = o.trim();
          if (cleanO) currentOptions.push(cleanO);
        });
      } else {
        currentOptions.push(`${letter}. ${optText}`);
      }
      candidateOptionLines = [];
      continue;
    }

    // Jika sedang dalam blok pertanyaan
    if (currentPrompt) {
      if (currentOptions.length === 0 && !currentKey && trimmed.length < 150 && !trimmed.endsWith(':')) {
        candidateOptionLines.push(trimmed);
      } else {
        currentPrompt += ' ' + trimmed;
      }
    }
  }

  pushCurrent();
  return questions;
}

// Konstruktor objek Soal lengkap
function buildQuestionModel({
  id,
  prompt,
  rawType,
  options,
  key,
  points,
  explanation,
}: {
  id: string;
  prompt: string;
  rawType: string;
  options: string[];
  key: string;
  points: number;
  explanation?: string;
}): Question {
  // 1. Ekstrak opsi dari prompt LEBIH DULU jika options kosong atau < 2
  let workingOptions = [...(options || [])];
  let workingPrompt = prompt;

  if (workingOptions.length < 2) {
    const extracted = extractOptionsFromPromptText(workingPrompt);
    if (extracted.options.length >= 2) {
      workingOptions = extracted.options;
      workingPrompt = extracted.prompt;
    }
  }

  // 2. Deteksi tipe soal dengan opsi yang sudah diekstrak
  const finalType = detectQuestionType(rawType, workingOptions, key, workingPrompt);
  let finalOptions = workingOptions && workingOptions.length > 0 ? workingOptions : undefined;
  let finalCorrectAnswer: string | undefined = undefined;
  let finalCorrectAnswers: string[] | undefined = undefined;
  let matchingPairs: { premise: string; match: string }[] | undefined = undefined;
  let trueFalseStatements: { statement: string; answer: 'Benar' | 'Salah' }[] | undefined = undefined;
  let fillInTheBlanks: string[] | undefined = undefined;

  const cleanKey = (key || '').replace(/^[\(\[]/, '').replace(/[\)\]]$/, '').trim();

  if (finalType === 'pilihan_ganda') {
    // Pastikan minimal ada opsi jawaban
    if (!finalOptions || finalOptions.length < 2) {
      finalOptions = ['A. Pilihan A', 'B. Pilihan B', 'C. Pilihan C', 'D. Pilihan D'];
    }

    // Sesuaikan format jawaban benar dengan teks opsi jika ada
    const keyLetterMatch = cleanKey.match(/^[\(\[]?([A-Ea-e])[\)\]]?(?:[\.\)\:\-\–\—\s].*|$)/);
    if (keyLetterMatch && finalOptions && finalOptions.length > 0) {
      const keyLetter = keyLetterMatch[1].toUpperCase();
      const matchedOpt = finalOptions.find(
        (o) => o.toUpperCase().startsWith(keyLetter + '.') || o.toUpperCase().startsWith(keyLetter + ')')
      );
      finalCorrectAnswer = matchedOpt || `${keyLetter}.`;
    } else if (cleanKey) {
      finalCorrectAnswer = cleanKey;
    } else {
      finalCorrectAnswer = finalOptions[0] || 'A.';
    }
  } else if (finalType === 'pilihan_ganda_kompleks') {
    if (!finalOptions || finalOptions.length < 2) {
      finalOptions = ['A. Opsi A', 'B. Opsi B', 'C. Opsi C', 'D. Opsi D'];
    }

    // Jawaban ganda lebih dari satu opsi, misal: "A, C" atau "A; C" atau "A dan C"
    const letters = cleanKey
      .split(/[,;&dan\s]+/)
      .map((s) => s.trim().toUpperCase().charAt(0))
      .filter((c) => /[A-E]/.test(c));

    if (letters.length > 0 && finalOptions) {
      finalCorrectAnswers = letters.map((l) => {
        const found = finalOptions?.find((o) => o.toUpperCase().startsWith(l + '.'));
        return found || l;
      });
      finalCorrectAnswer = finalCorrectAnswers[0];
    } else {
      finalCorrectAnswers = finalOptions ? [finalOptions[0]] : ['A.'];
      finalCorrectAnswer = finalCorrectAnswers[0];
    }
  } else if (finalType === 'benar_salah') {
    const stmts = parseTrueFalseStatementsFromText(workingPrompt);
    if (stmts.length > 1) {
      trueFalseStatements = stmts;
      finalCorrectAnswer = stmts[0].answer;
    } else {
      const isSalah = /salah|false/i.test(cleanKey);
      finalCorrectAnswer = isSalah ? 'Salah' : 'Benar';
    }
  } else if (finalType === 'menjodohkan') {
    matchingPairs = parseMatchingPairsFromText(workingPrompt, options);
    if (!matchingPairs || matchingPairs.length === 0) {
      matchingPairs = [
        { premise: 'Domain 1', match: 'Kodomain 1' },
        { premise: 'Domain 2', match: 'Kodomain 2' },
      ];
    }
  } else if (finalType === 'isian') {
    finalCorrectAnswer = cleanKey || 'Jawaban';
  } else if (finalType === 'isi_kosong') {
    fillInTheBlanks = cleanKey ? cleanKey.split(/[,;]+/).map((s) => s.trim()).filter(Boolean) : ['jawaban'];
  } else if (finalType === 'essay') {
    finalCorrectAnswer = cleanKey || undefined;
  }

  return {
    id,
    type: finalType,
    prompt: workingPrompt.trim(),
    points: points || 10,
    options: finalOptions,
    correctAnswer: finalCorrectAnswer,
    correctAnswers: finalCorrectAnswers,
    matchingPairs,
    trueFalseStatements,
    fillInTheBlanks,
    essayRubric: finalType === 'essay' ? cleanKey : undefined,
    explanation: explanation || undefined,
  };
}

// Deteksi cerdas tipe soal dari tag, opsi, kunci, dan teks soal
function detectQuestionType(
  rawType: string,
  options: string[],
  key: string,
  prompt: string
): QuestionType {
  const norm = (rawType || '').toLowerCase();
  if (
    norm.includes('kompleks') ||
    norm.includes('pgk') ||
    norm.includes('multiple answers') ||
    norm.includes('lebih dari satu')
  ) {
    return 'pilihan_ganda_kompleks';
  }
  if (
    norm.includes('pilihan ganda') ||
    norm.includes('pg') ||
    norm.includes('pilihan tunggal') ||
    norm.includes('multiple choice')
  ) {
    return 'pilihan_ganda';
  }
  if (
    norm.includes('benar') ||
    norm.includes('salah') ||
    norm.includes('b-s') ||
    norm.includes('b/s') ||
    norm.includes('true/false')
  ) {
    return 'benar_salah';
  }
  if (norm.includes('jodoh') || norm.includes('matching') || norm.includes('pasang')) {
    return 'menjodohkan';
  }
  if (norm.includes('isi kosong') || norm.includes('fill in') || norm.includes('melengkapi')) {
    return 'isi_kosong';
  }
  if (norm.includes('susun') || norm.includes('jumble')) {
    return 'susun_kata';
  }
  if (norm.includes('isian') || norm.includes('singkat') || norm.includes('short answer')) {
    return 'isian';
  }
  if (norm.includes('essay') || norm.includes('uraian') || norm.includes('esai')) {
    return 'essay';
  }

  const trimmedKey = (key || '').trim();

  // Kunci berupa beberapa huruf (misal: "A, C" atau "A; C" atau "A dan C")
  if (/^[A-Ea-e]\s*[,;&dan]\s*[A-Ea-e]/i.test(trimmedKey)) {
    return 'pilihan_ganda_kompleks';
  }

  // Kunci diawali huruf pilihan A-E (misal: "A", "B.", "C) Ribosom", "[A]", "(B)", "Kunci: B", "D. Mitokondria")
  if (/^[\(\[]?[A-Ea-e][\)\]]?(?:[\.\)\:\-\–\—\s].*|$)/i.test(trimmedKey)) {
    return 'pilihan_ganda';
  }

  // Jika memiliki minimal 2 opsi jawaban -> otomatis Pilihan Ganda
  if (options && options.length >= 2) {
    return 'pilihan_ganda';
  }

  // Kunci bernilai Benar atau Salah
  if (/^(benar|salah|true|false)$/i.test(trimmedKey)) {
    return 'benar_salah';
  }

  // Pasangan menjodohkan pada teks (berisi tanda = atau ->)
  if (prompt.includes('=') && prompt.split('\n').filter((l) => l.includes('=')).length >= 2) {
    return 'menjodohkan';
  }

  // Isian rumpang / kosong
  if (prompt.includes('[blank]') || prompt.includes('_____')) {
    return 'isi_kosong';
  }

  // Jika kunci adalah kata/frasa pendek (< 40 karakter) dan pertanyaan berupa pertanyaan spesifik
  if (trimmedKey && trimmedKey.length > 0 && trimmedKey.length <= 40 && !trimmedKey.includes('\n')) {
    if (/^(siapakah|apakah|sebutkan satu|berapakah|di mana|kapan)\b/i.test(prompt) || prompt.includes('...')) {
      return 'isian';
    }
  }

  // Default jika tanpa opsi dan tanpa kunci huruf
  return 'essay';
}

// Ekstrak opsi jika tertulis di baris pertanyaan
function extractOptionsFromPromptText(prompt: string): { prompt: string; options: string[] } {
  const match = prompt.search(/(?:^|\s+|[\t\n])(?=[A-Ea-e][\.\)\:\-\–\—]|\([A-Ea-e]\)|\[[A-Ea-e]\])/);
  if (match !== -1 && match > 0) {
    const cleanPrompt = prompt.substring(0, match).trim();
    const optsPart = prompt.substring(match).trim();
    const opts = splitHorizontalOptions(optsPart);
    if (opts.length >= 2) {
      return { prompt: cleanPrompt, options: opts };
    }
  }
  return { prompt, options: [] };
}

// Ekstrak pasangan menjodohkan
function parseMatchingPairsFromText(
  prompt: string,
  options?: string[]
): { premise: string; match: string }[] {
  const pairs: { premise: string; match: string }[] = [];
  const lines = (prompt + '\n' + (options || []).join('\n')).split('\n');
  for (const line of lines) {
    const match = line.match(/^(.+?)\s*(?:=|->|—|~)\s*(.+)$/);
    if (match) {
      const p = match[1].replace(/^\d+[\.\)]\s*/, '').trim();
      const m = match[2].trim();
      if (p && m) pairs.push({ premise: p, match: m });
    }
  }
  return pairs;
}

// Ekstrak pernyataan benar/salah
function parseTrueFalseStatementsFromText(
  prompt: string
): { statement: string; answer: 'Benar' | 'Salah' }[] {
  const stmts: { statement: string; answer: 'Benar' | 'Salah' }[] = [];
  const lines = prompt.split('\n');
  for (const line of lines) {
    const match = line.match(/^(.+?)[\s\:\-\–\(\[]+(benar|salah|true|false)[\)\]]?$/i);
    if (match) {
      const s = match[1].replace(/^[-•\d+\.\)]\s*/, '').trim();
      const ans: 'Benar' | 'Salah' = /salah|false/i.test(match[2]) ? 'Salah' : 'Benar';
      if (s) stmts.push({ statement: s, answer: ans });
    }
  }
  return stmts;
}

