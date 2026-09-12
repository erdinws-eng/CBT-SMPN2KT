import {
  User,
  Subject,
  Exam,
  ExamAttempt,
  SchoolSettings,
  SystemAuditLog,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'cbt_smp_users_v1',
  SUBJECTS: 'cbt_smp_subjects_v1',
  EXAMS: 'cbt_smp_exams_v1',
  ATTEMPTS: 'cbt_smp_attempts_v1',
  SETTINGS: 'cbt_smp_settings_v1',
  AUDIT_LOGS: 'cbt_smp_audit_logs_v1',
  CURRENT_USER: 'cbt_smp_current_user_v1',
};

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  appName: 'SMART CBT PRO',
  schoolName: 'SMP NEGERI 1 TELADAN BANGSA',
  schoolNpsn: '20108923',
  schoolAddress: 'Jl. Pemuda Pendidikan No. 45, Kompleks Ki Hajar Dewantara',
  schoolCity: 'Jakarta Pusat',
  academicYear: '2024/2025',
  semester: 'Genap',
  principalName: 'H. Suryadi Pratama, M.Pd.',
  principalNip: '197204181997021003',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_1',
    username: 'admin',
    password: 'admin123',
    name: 'Budi Santoso, S.Kom',
    role: 'admin',
    nip_nisn: '198205142006041008',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_guru_1',
    username: 'guru',
    password: 'password123',
    name: 'Drs. Bambang Sudarsono, M.Pd.',
    role: 'guru',
    nip_nisn: '197603152003121002',
    subjectName: 'Ilmu Pengetahuan Alam (IPA)',
  },
  {
    id: 'user_guru_2',
    username: 'bu_siti',
    password: 'password123',
    name: 'Siti Rahmawati, S.Pd.',
    role: 'guru',
    nip_nisn: '198506122008012004',
    subjectName: 'Bahasa Indonesia',
  },
  {
    id: 'user_siswa_1',
    username: 'siswa',
    password: 'password123',
    name: 'Ahmad Rizky Pratama',
    role: 'siswa',
    nip_nisn: '0098472190',
    classGrade: '8A',
    gender: 'L',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_siswa_2',
    username: 'dewi',
    password: 'password123',
    name: 'Dewi Anjani',
    role: 'siswa',
    nip_nisn: '0098472191',
    classGrade: '8A',
    gender: 'P',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_siswa_3',
    username: 'bayu',
    password: 'password123',
    name: 'Bayu Setiawan',
    role: 'siswa',
    nip_nisn: '0098472192',
    classGrade: '8B',
    gender: 'L',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_siswa_4',
    username: 'zahra',
    password: 'password123',
    name: 'Zahra Putri Kirana',
    role: 'siswa',
    nip_nisn: '0098472193',
    classGrade: '8A',
    gender: 'P',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub_1', code: 'IPA-8', name: 'Ilmu Pengetahuan Alam (IPA)', gradeLevel: 'SMP Kelas 8', teacherName: 'Drs. Bambang Sudarsono, M.Pd.' },
  { id: 'sub_2', code: 'MAT-8', name: 'Matematika', gradeLevel: 'SMP Kelas 8', teacherName: 'Drs. Bambang Sudarsono, M.Pd.' },
  { id: 'sub_3', code: 'BIN-8', name: 'Bahasa Indonesia', gradeLevel: 'SMP Kelas 8', teacherName: 'Siti Rahmawati, S.Pd.' },
  { id: 'sub_4', code: 'BIG-8', name: 'Bahasa Inggris', gradeLevel: 'SMP Kelas 8', teacherName: 'Nurul Hidayah, S.Pd.' },
  { id: 'sub_5', code: 'PPKN-8', name: 'Pendidikan Pancasila', gradeLevel: 'SMP Kelas 8', teacherName: 'Drs. Bambang Sudarsono, M.Pd.' },
  { id: 'sub_6', code: 'IPS-8', name: 'Ilmu Pengetahuan Sosial (IPS)', gradeLevel: 'SMP Kelas 8', teacherName: 'Siti Rahmawati, S.Pd.' },
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam_ipa_8_pts',
    title: 'Penilaian Tengah Semester (PTS) IPA Terpadu Kelas 8',
    subjectId: 'sub_1',
    subjectName: 'Ilmu Pengetahuan Alam (IPA)',
    teacherId: 'user_guru_1',
    teacherName: 'Drs. Bambang Sudarsono, M.Pd.',
    targetClasses: ['8A', '8B', '8C'],
    startTime: new Date(Date.now() - 3600 * 1000 * 24).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 3600 * 1000 * 72).toISOString().slice(0, 16),
    durationMinutes: 45,
    minSubmitMinutes: 5,
    kkm: 75,
    allowRetake: true,
    maxRetakes: 2,
    releaseScore: true,
    randomizeQuestions: true,
    randomizeOptions: true,
    lockdownBrowser: true,
    maxViolations: 3,
    token: 'IPA8PTS',
    status: 'active',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    questions: [
      {
        id: 'q_1',
        type: 'pilihan_ganda',
        prompt: 'Perhatikan gambar mikroskopis organel sel hewan di bawah ini. Organel yang bertindak sebagai "pabrik energi sel" (tempat respirasi seluler menghasilkan ATP) adalah...',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&auto=format&fit=crop&q=80',
        points: 15,
        options: [
          'A. Mitokondria',
          'B. Badan Golgi',
          'C. Ribosom',
          'D. Retikulum Endoplasma',
        ],
        correctAnswer: 'A. Mitokondria',
        explanation: 'Mitokondria merupakan organel sel penghasil energi dalam bentuk ATP melalui proses respirasi aerobik.',
      },
      {
        id: 'q_2',
        type: 'pilihan_ganda_kompleks',
        prompt: 'Pilihlah DUA atau LEBIH organ tubuh manusia di bawah ini yang terlibat langsung dalam proses pencernaan mekanik maupun kimiawi secara bersamaan! (Pilih semua yang benar)',
        points: 20,
        options: [
          'Mulut (gigi dan enzim ptialin)',
          'Lambung (gerak peristaltik dan enzim pepsin)',
          'Kerongkongan / Esofagus',
          'Rektum',
        ],
        correctAnswers: [
          'Mulut (gigi dan enzim ptialin)',
          'Lambung (gerak peristaltik dan enzim pepsin)',
        ],
        explanation: 'Mulut melakukan pencernaan mekanik (gigi) dan kimiawi (ptialin). Lambung melakukan pencernaan mekanik (otot lambung) dan kimiawi (asam klorida dan pepsin).',
      },
      {
        id: 'q_3',
        type: 'isian',
        prompt: 'Zat makanan yang berfungsi sebagai zat pembangun sel baru, pengganti sel yang rusak, dan komponen utama antibodi pada tubuh manusia adalah...',
        points: 15,
        correctAnswer: 'protein',
        explanation: 'Protein adalah makronutrien pembangun sel dan jaringan tubuh serta pembentuk enzim dan antibodi.',
      },
      {
        id: 'q_4',
        type: 'essay',
        prompt: 'Simak tayangan video edukasi tentang proses filtrasi ginjal berikut, lalu jelaskan 3 tahapan utama pembentukan urin pada nefron ginjal (Filtrasi, Reabsorpsi, Augmentasi) beserta hasil akhirnya!',
        mediaType: 'video',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        points: 25,
        essayRubric: 'Kriteria Penilaian: (1) Menyebutkan proses Filtrasi di glomerulus menghasilkan urin primer (bobot 8), (2) Reabsorpsi di tubulus kontortus proksimal menghasilkan urin sekunder (bobot 8), (3) Augmentasi di tubulus kontortus distal menghasilkan urin sesungguhnya (bobot 9).',
        explanation: '1. Filtrasi (Glomerulus -> Urin Primer), 2. Reabsorpsi (Tubulus Kontortus Proksimal -> Urin Sekunder), 3. Augmentasi (Tubulus Kontortus Distal -> Urin Sesungguhnya).',
      },
      {
        id: 'q_5',
        type: 'menjodohkan',
        prompt: 'Jodohkanlah jenis enzim pencernaan di kolom kiri dengan fungsi spesifiknya yang tepat di kolom kanan:',
        points: 15,
        matchingPairs: [
          { premise: 'Enzim Amilase / Ptialin', match: 'Mengubah zat tepung (amilum) menjadi maltosa' },
          { premise: 'Enzim Pepsin', match: 'Mengubah protein menjadi pepton di lambung' },
          { premise: 'Enzim Lipase', match: 'Menghidrolisis lemak menjadi asam lemak dan gliserol' },
        ],
        explanation: 'Amilase memecah pati, pepsin memecah protein menjadi pepton, lipase memecah trigliserida/lemak.',
      },
      {
        id: 'q_6',
        type: 'benar_salah',
        prompt: 'Tentukan apakah masing-masing pernyataan sains biologi di bawah ini BENAR atau SALAH:',
        points: 10,
        trueFalseStatements: [
          { statement: 'Sel tumbuhan memiliki kloroplas dan dinding sel dari selulosa, sedangkan sel hewan tidak memilikinya.', answer: 'Benar' },
          { statement: 'Getah empedu dihasilkan oleh pankreas untuk membunuh kuman penyakit di usus besar.', answer: 'Salah' },
          { statement: 'Zat tepung akan berubah warna menjadi biru kehitaman saat diuji dengan larutan Lugol (Iodin).', answer: 'Benar' },
        ],
        explanation: 'Getah empedu dihasilkan oleh hati (liver), bukan pankreas, berfungsi mengemulsikan lemak.',
      },
    ],
  },
  {
    id: 'exam_mat_8_sumatif',
    title: 'Asesmen Sumatif Matematika Kelas 8 - Teorema Pythagoras',
    subjectId: 'sub_2',
    subjectName: 'Matematika',
    teacherId: 'user_guru_1',
    teacherName: 'Drs. Bambang Sudarsono, M.Pd.',
    targetClasses: ['8A', '8B'],
    startTime: new Date(Date.now() - 3600 * 1000 * 12).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 3600 * 1000 * 96).toISOString().slice(0, 16),
    durationMinutes: 60,
    minSubmitMinutes: 10,
    kkm: 70,
    allowRetake: false,
    maxRetakes: 1,
    releaseScore: true,
    randomizeQuestions: true,
    randomizeOptions: true,
    lockdownBrowser: true,
    maxViolations: 3,
    token: 'MAT8SMP',
    status: 'active',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    questions: [
      {
        id: 'q_mat_1',
        type: 'pilihan_ganda',
        prompt: 'Sebuah segitiga siku-siku memiliki panjang sisi penyiku berturut-turut 6 cm dan 8 cm. Berapakah panjang sisi miring (hipotenusa) segitiga tersebut?',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
        points: 25,
        options: ['A. 10 cm', 'B. 12 cm', 'C. 14 cm', 'D. 16 cm'],
        correctAnswer: 'A. 10 cm',
        explanation: 'c^2 = a^2 + b^2 = 6^2 + 8^2 = 36 + 64 = 100 -> c = 10 cm.',
      },
      {
        id: 'q_mat_2',
        type: 'pilihan_ganda_kompleks',
        prompt: 'Manakah dari kelompok tiga bilangan berikut yang merupakan Tripel Pythagoras? (Pilih semua yang benar)',
        points: 25,
        options: [
          '3, 4, 5',
          '5, 12, 13',
          '7, 24, 25',
          '6, 9, 12',
        ],
        correctAnswers: ['3, 4, 5', '5, 12, 13', '7, 24, 25'],
        explanation: '6^2 + 9^2 = 36 + 81 = 117 != 12^2 (144), jadi 6, 9, 12 bukan tripel pythagoras.',
      },
      {
        id: 'q_mat_3',
        type: 'isian',
        prompt: 'Sebuah tangga dengan panjang 13 meter disandarkan pada tembok. Jika jarak ujung bawah tangga ke tembok adalah 5 meter, berapakah tinggi ujung tangga dari tanah (dalam meter)? Tuliskan angkanya saja.',
        points: 25,
        correctAnswer: '12',
        explanation: 't = akar(13^2 - 5^2) = akar(169 - 25) = akar(144) = 12 meter.',
      },
      {
        id: 'q_mat_4',
        type: 'benar_salah',
        prompt: 'Tentukan kebenaran dari pernyataan segitiga siku-siku berikut:',
        points: 25,
        trueFalseStatements: [
          { statement: 'Pada segitiga siku-siku sama kaki dengan sisi siku a, panjang sisi miringnya selalu a√2.', answer: 'Benar' },
          { statement: 'Segitiga dengan sisi 8, 15, dan 17 adalah segitiga tumpul.', answer: 'Salah' },
        ],
        explanation: '8^2 + 15^2 = 64 + 225 = 289 = 17^2, maka segitiga tersebut adalah segitiga siku-siku tepat.',
      },
    ],
  },
];

export const INITIAL_ATTEMPTS: ExamAttempt[] = [
  {
    id: 'att_dewi_ipa',
    examId: 'exam_ipa_8_pts',
    examTitle: 'Penilaian Tengah Semester (PTS) IPA Terpadu Kelas 8',
    subjectName: 'Ilmu Pengetahuan Alam (IPA)',
    studentId: 'user_siswa_2',
    studentName: 'Dewi Anjani',
    studentNisn: '0098472191',
    studentClass: '8A',
    startedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    submittedAt: new Date(Date.now() - 3600 * 1000 * 4.4).toISOString(),
    answers: {
      q_1: 'A. Mitokondria',
      q_2: ['Mulut (gigi dan enzim ptialin)', 'Lambung (gerak peristaltik dan enzim pepsin)'],
      q_3: 'protein',
      q_4: '1. Filtrasi di glomerulus menghasilkan urin primer. 2. Reabsorpsi di tubulus kontortus proksimal menyerap zat berguna menghasilkan urin sekunder. 3. Augmentasi di tubulus distal menambahkan zat sisa menghasilkan urin sejati yang siap dikeluarkan.',
      q_5: {
        'Enzim Amilase / Ptialin': 'Mengubah zat tepung (amilum) menjadi maltosa',
        'Enzim Pepsin': 'Mengubah protein menjadi pepton di lambung',
        'Enzim Lipase': 'Menghidrolisis lemak menjadi asam lemak dan gliserol',
      },
      q_6: {
        0: 'Benar',
        1: 'Salah',
        2: 'Benar',
      },
    },
    scores: {
      q_1: 15,
      q_2: 20,
      q_3: 15,
      q_4: 25,
      q_5: 15,
      q_6: 10,
    },
    totalScore: 100,
    maxPossibleScore: 100,
    scorePercentage: 100,
    passedKkm: true,
    status: 'submitted',
    violationCount: 0,
    violationLogs: [],
    teacherFeedback: 'Luar biasa! Pemahaman konsep biologi sel dan sistem organ sangat matang.',
    isGraded: true,
  },
  {
    id: 'att_bayu_ipa',
    examId: 'exam_ipa_8_pts',
    examTitle: 'Penilaian Tengah Semester (PTS) IPA Terpadu Kelas 8',
    subjectName: 'Ilmu Pengetahuan Alam (IPA)',
    studentId: 'user_siswa_3',
    studentName: 'Bayu Setiawan',
    studentNisn: '0098472192',
    studentClass: '8B',
    startedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    submittedAt: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString(),
    answers: {
      q_1: 'A. Mitokondria',
      q_2: ['Mulut (gigi dan enzim ptialin)'],
      q_3: 'lemak', // salah
      q_4: 'Tahapan pembentukan urin ada penyaringan, penyerapan kembali dan pengeluaran.',
      q_5: {
        'Enzim Amilase / Ptialin': 'Mengubah zat tepung (amilum) menjadi maltosa',
        'Enzim Pepsin': 'Mengubah protein menjadi pepton di lambung',
        'Enzim Lipase': 'Mengubah protein menjadi pepton di lambung',
      },
      q_6: {
        0: 'Benar',
        1: 'Benar', // salah
        2: 'Benar',
      },
    },
    scores: {
      q_1: 15,
      q_2: 10,
      q_3: 0,
      q_4: 15,
      q_5: 10,
      q_6: 6,
    },
    totalScore: 56,
    maxPossibleScore: 100,
    scorePercentage: 56,
    passedKkm: false,
    status: 'submitted',
    violationCount: 1,
    violationLogs: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 2.8).toISOString(),
        reason: 'Peringatan 1: Siswa beralih tab atau meminimalkan jendela ujian.',
      },
    ],
    teacherFeedback: 'Nilai belum mencapai KKM (75). Silakan pelajari kembali bab enzim dan zat makanan untuk remedial.',
    isGraded: true,
  },
];

export const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
    userName: 'Budi Santoso, S.Kom',
    role: 'admin',
    action: 'Inisialisasi Sistem',
    details: 'Konfigurasi database master siswa, guru, dan jadwal semester genap.',
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    userName: 'Drs. Bambang Sudarsono, M.Pd.',
    role: 'guru',
    action: 'Pembuatan Bank Soal',
    details: 'Membuat paket soal PTS IPA Terpadu Kelas 8 (6 butir soal multimedia).',
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 3600 * 1000 * 4.4).toISOString(),
    userName: 'Dewi Anjani',
    role: 'siswa',
    action: 'Submit Ujian CBT',
    details: 'Menyelesaikan PTS IPA Kelas 8 dengan skor 100 (Nilai Sempurna).',
  },
];

// Helper Local Storage Operations
export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    // Pastikan akun default admin selalu memiliki kata sandi admin123
    let hasUpdated = false;
    const updated = parsed.map((u) => {
      if (u.username.toLowerCase() === 'admin' && u.password !== 'admin123') {
        hasUpdated = true;
        return { ...u, password: 'admin123' };
      }
      return u;
    });
    if (hasUpdated) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getStoredSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
      return INITIAL_SUBJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUBJECTS;
  }
}

export function saveStoredSubjects(subjects: Subject[]) {
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
}

export function getStoredExams(): Exam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(INITIAL_EXAMS));
      return INITIAL_EXAMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXAMS;
  }
}

export function saveStoredExams(exams: Exam[]) {
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
}

export function getStoredAttempts(): ExamAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(INITIAL_ATTEMPTS));
      return INITIAL_ATTEMPTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ATTEMPTS;
  }
}

export function saveStoredAttempts(attempts: ExamAttempt[]) {
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
}

export function getStoredSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SCHOOL_SETTINGS));
      return INITIAL_SCHOOL_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SCHOOL_SETTINGS;
  }
}

export function saveStoredSettings(settings: SchoolSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStoredAuditLogs(): SystemAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function addAuditLog(userName: string, role: string, action: string, details: string) {
  const logs = getStoredAuditLogs();
  const newLog: SystemAuditLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    userName,
    role,
    action,
    details,
  };
  const updated = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  return updated;
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
}

export function resetToDemoData() {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(INITIAL_EXAMS));
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(INITIAL_ATTEMPTS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SCHOOL_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
}

// Aliases for clean App.tsx access
export const getInitialUsers = getStoredUsers;
export const getInitialSubjects = getStoredSubjects;
export const getInitialExams = getStoredExams;
export const getInitialAttempts = getStoredAttempts;
export const getInitialSettings = getStoredSettings;
export const getAuditLogs = getStoredAuditLogs;
export const saveUsers = saveStoredUsers;
export const saveSubjects = saveStoredSubjects;
export const saveExams = saveStoredExams;
export const saveAttempts = saveStoredAttempts;
export const saveSettings = saveStoredSettings;
export const saveAuditLogs = (logs: SystemAuditLog[]) =>
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));

