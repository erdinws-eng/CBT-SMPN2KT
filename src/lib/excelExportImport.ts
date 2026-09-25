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
  const rows = attempts.map((att, idx) => {
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
                text: '• Awali setiap nomor butir soal dengan angka dan tanda titik, contoh: "1. Pertanyaan...", "2. Pertanyaan..."\n',
                size: 20,
              }),
              new TextRun({
                text: '• Untuk Pilihan Ganda: tuliskan pilihan jawaban diawali huruf kapital dan titik: "A. Pilihan...", "B. Pilihan...", "C. ...", "D. ...", "E. ..."\n',
                size: 20,
              }),
              new TextRun({
                text: '• Kunci jawaban ditulis di baris baru di bawah pilihan dengan format: "Kunci: A" (atau "Kunci: B", dsb).\n',
                size: 20,
              }),
              new TextRun({
                text: '• Untuk Soal Esai / Uraian: tulis pertanyaan soal, lalu di baris berikutnya tulis "Kunci: [pembahasan / kata kunci jawaban]".\n',
                size: 20,
              }),
              new TextRun({
                text: '• Simpan file dalam format .docx lalu unggah melalui tombol "Impor Word" di menu Bank Soal CBT.',
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

          // Soal 1
          new Paragraph({
            children: [
              new TextRun({
                text: '1. Organel sel yang berfungsi sebagai tempat berlangsungnya respirasi seluler dan menghasilkan energi dalam bentuk ATP adalah...',
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
            spacing: { before: 80, after: 250 },
          }),

          // Soal 2
          new Paragraph({
            children: [
              new TextRun({
                text: '2. Danau Toba terbentuk akibat letusan gunung berapi supervulkanik purba yang sangat dahsyat ribuan tahun lalu yang kemudian amblas dan terisi air. Danau dengan proses pembentukan seperti ini diklasifikasikan sebagai danau jenis...',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({ children: [new TextRun({ text: 'A. Danau Tektonik murni', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'B. Danau Vulkanik kepundan', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'C. Danau Tekto-Vulkanik', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'D. Danau Karst (Dolina)', size: 21 })] }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: C',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 250 },
          }),

          // Soal 3
          new Paragraph({
            children: [
              new TextRun({
                text: '3. Perhatikan faktor-faktor berikut: suhu lingkungan, konsentrasi reaktan, penambahan katalis, dan luas permukaan bidang sentuh. Faktor yang dapat mempercepat terjadinya laju reaksi kimia adalah...',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({ children: [new TextRun({ text: 'A. Suhu dan luas permukaan bidang sentuh saja', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'B. Konsentrasi dan penambahan katalis saja', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'C. Semua faktor di atas dapat mempercepat laju reaksi', size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: 'D. Hanya suhu yang berpengaruh terhadap energi aktivasi', size: 21 })] }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: C',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 250 },
          }),

          // Soal 4
          new Paragraph({
            children: [
              new TextRun({
                text: '4. Jelaskan perbedaan mendasar antara sel hewan dan sel tumbuhan beserta fungsi organel kloroplas dalam proses fotosintesis!',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: Sel tumbuhan memiliki dinding sel yang kaku, plastida/kloroplas, dan vakuola berukuran besar. Sedangkan sel hewan tidak memiliki dinding sel dan plastida melainkan memiliki sentriol. Kloroplas berfungsi menangkap energi cahaya matahari untuk mengubah CO2 dan H2O menjadi glukosa dan oksigen.',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 250 },
          }),

          // Soal 5
          new Paragraph({
            children: [
              new TextRun({
                text: '5. Sebutkan dan berikan contoh konkret penerapan nilai kemanusiaan yang adil dan beradab (Sila ke-2 Pancasila) di lingkungan sekolah!',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kunci: Menghargai hak asasi sesama teman tanpa membeda-bedakan suku, agama, dan latar belakang, tidak melakukan perundungan (bullying), serta bersikap saling tolong-menolong ketika ada warga sekolah yang tertimpa musibah.',
                bold: true,
                color: '15803D',
                size: 21,
              }),
            ],
            spacing: { before: 80, after: 200 },
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
  let text = '';
  if (file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml')) {
    try {
      const buffer = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = res?.value || '';
    } catch (e) {
      console.warn('Gagal membaca struktur docx melalui mammoth, fallback ke text():', e);
      text = await file.text();
    }
  } else {
    text = await file.text();
  }

  // Support standard Indonesian school question text format:
  // "1. Pertanyaan... A. ... B. ... Kunci: A"
  const lines = text.split('\n');
  const questions: Question[] = [];
  let currentPrompt = '';
  let currentOptions: string[] = [];
  let currentKey = '';
  let currentPoints = 10;

  const pushCurrent = () => {
    if (currentPrompt.trim()) {
      // Abaikan header judul petunjuk jika tidak ada opsi & kunci
      const isHeader = currentOptions.length === 0 && !currentKey && (
        currentPrompt.toUpperCase().includes('TEMPLATE') ||
        currentPrompt.toUpperCase().includes('PETUNJUK') ||
        currentPrompt.toUpperCase().includes('CONTOH BUTIR SOAL')
      );
      if (!isHeader) {
        questions.push({
          id: 'q_doc_' + Date.now() + '_' + questions.length,
          type: currentOptions.length > 0 ? 'pilihan_ganda' : 'essay',
          prompt: currentPrompt.trim(),
          options: currentOptions.length > 0 ? currentOptions : undefined,
          correctAnswer: currentKey || (currentOptions.length > 0 ? currentOptions[0] : undefined),
          points: currentPoints,
        });
      }
    }
    currentPrompt = '';
    currentOptions = [];
    currentKey = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if new numbered question like "1. ", "2) "
    if (/^\d+[\.\)]\s+/.test(trimmed)) {
      pushCurrent();
      currentPrompt = trimmed.replace(/^\d+[\.\)]\s+/, '');
    } else if (/^[A-Ea-e][\.\)]\s+/.test(trimmed)) {
      currentOptions.push(trimmed.toUpperCase().charAt(0) + '. ' + trimmed.replace(/^[A-Ea-e][\.\)]\s+/, ''));
    } else if (/^(kunci|jawaban|kunci jawaban):/i.test(trimmed)) {
      currentKey = trimmed.replace(/^(kunci|jawaban|kunci jawaban):\s*/i, '').trim();
    } else {
      currentPrompt += ' ' + trimmed;
    }
  }
  pushCurrent();

  return questions;
}
