const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

async function generate() {
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
                text: '• Simpan file dalam format .docx atau .doc lalu unggah melalui tombol "Impor Word" di menu Bank Soal CBT.',
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

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, 'public', 'template_soal.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully regenerated public/template_soal.docx, size:', buffer.length, 'bytes');
}

generate().catch(console.error);
