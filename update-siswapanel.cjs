const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

const handleStartExamTarget = `  // 1. Enter Exam directly without token
  const handleStartExam = (exam: Exam) => {
    // Check existing attempt
    const existingAttempt = attempts.find(
      (a) => a.examId === exam.id && a.studentId === currentUser.id
    );

    if (existingAttempt && existingAttempt.status === 'submitted' && !exam.allowRetake) {
      alert('Anda sudah menyelesaikan ujian ini dan tidak ada kesempatan remedial.');
      return;
    }

    if (existingAttempt && existingAttempt.status === 'violation_disqualified') {
      alert(
        'Ujian Anda saat ini terkunci karena terdeteksi pelanggaran. Silakan hubungi Pengawas/Guru di ruangan untuk meminta "Reset Ujian Siswa" agar Anda dapat membuka dan mengerjakan ujian kembali.'
      );
      return;
    }`;

const handleStartExamReplacement = `  // 1. Enter Exam directly without token
  const handleStartExam = (exam: Exam) => {
    // Check existing attempts for this exam
    const existingAttempts = attempts.filter(
      (a) => a.examId === exam.id && a.studentId === currentUser.id
    ).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    
    const latestAttempt = existingAttempts.length > 0 ? existingAttempts[existingAttempts.length - 1] : null;

    if (latestAttempt && latestAttempt.status === 'submitted') {
      if (!exam.allowRetake) {
        alert('Anda sudah menyelesaikan ujian ini dan tidak ada kesempatan remedial.');
        return;
      }
      if (existingAttempts.length >= (exam.maxRetakes || 1) + 1) { // 1 initial + maxRetakes
        alert(\`Anda telah mencapai batas maksimal pengerjaan (Total: \${existingAttempts.length} kali).\`);
        return;
      }
    }

    if (latestAttempt && latestAttempt.status === 'violation_disqualified') {
      alert(
        'Ujian Anda saat ini terkunci karena terdeteksi pelanggaran. Silakan hubungi Pengawas/Guru di ruangan untuk meminta "Reset Ujian Siswa" agar Anda dapat membuka dan mengerjakan ujian kembali.'
      );
      return;
    }`;

code = code.replace(handleStartExamTarget, handleStartExamReplacement);

const newAttemptTarget = `    const isRetake = existingAttempt?.status === 'submitted';

    const newAttempt: ExamAttempt = {
      id: existingAttempt?.id || 'att_' + Date.now(),
      examId: exam.id,
      examTitle: exam.title,
      subjectName: exam.subjectName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentNisn: currentUser.nip_nisn,
      studentClass: studentClass,
      answers: (!isRetake && existingAttempt?.answers) ? existingAttempt.answers : {},
      scores: (!isRetake && existingAttempt?.scores) ? existingAttempt.scores : {},
      totalScore: 0,
      maxPossibleScore: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      scorePercentage: 0,
      passedKkm: false,
      totalEarnedPoints: 0,
      totalMaxPoints: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      status: 'in_progress',
      violationCount: isRetake ? 0 : (existingAttempt?.violationCount || 0),
      startedAt: new Date().toISOString(),
      violationLogs: isRetake ? [] : (existingAttempt?.violationLogs || []),
      isGraded: false,
    };`;

const newAttemptReplacement = `    const isRetake = latestAttempt?.status === 'submitted';
    const isResuming = latestAttempt?.status === 'in_progress';

    const newAttempt: ExamAttempt = {
      // If it's a retake, we create a brand NEW attempt ID so we don't overwrite history
      id: (isResuming && latestAttempt) ? latestAttempt.id : 'att_' + Date.now(),
      examId: exam.id,
      examTitle: exam.title,
      subjectName: exam.subjectName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentNisn: currentUser.nip_nisn,
      studentClass: studentClass,
      answers: isResuming ? (latestAttempt?.answers || {}) : {},
      scores: isResuming ? (latestAttempt?.scores || {}) : {},
      totalScore: 0,
      maxPossibleScore: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      scorePercentage: 0,
      passedKkm: false,
      totalEarnedPoints: 0,
      totalMaxPoints: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      status: 'in_progress',
      violationCount: isResuming ? (latestAttempt?.violationCount || 0) : 0,
      startedAt: isResuming ? latestAttempt.startedAt : new Date().toISOString(),
      violationLogs: isResuming ? (latestAttempt?.violationLogs || []) : [],
      isGraded: false,
    };`;

code = code.replace(newAttemptTarget, newAttemptReplacement);

// Fix bug in Riwayat section in SiswaPanel where it assumes 1 attempt per exam
const riwayatTarget = `                      {myExams.map((exam, idx) => {
                        const att = attempts.find((a) => a.examId === exam.id && a.studentId === currentUser.id);
                        if (!att || att.status !== 'submitted') return null;

                        return (
                          <tr key={exam.id} className="hover:bg-slate-50 transition">`;
                          
const riwayatReplacement = `                      {myExams.flatMap((exam) => {
                        const examAttempts = attempts.filter((a) => a.examId === exam.id && a.studentId === currentUser.id && a.status === 'submitted')
                                                     .sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
                        
                        return examAttempts.map((att, attIndex) => (
                          <tr key={att.id} className="hover:bg-slate-50 transition">`;

code = code.replace(riwayatTarget, riwayatReplacement);

// Need to fix the closing braces for riwayat mapping
const riwayatEndTarget = `                            <td className="py-3 px-4 text-center">
                              <span className={\`font-bold px-2.5 py-1 rounded-lg text-[11px] \${att.passedKkm ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}\`}>
                                {att.passedKkm ? 'Tuntas' : 'Remedial'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>`;
const riwayatEndReplacement = `                            <td className="py-3 px-4 text-center">
                              <span className={\`font-bold px-2.5 py-1 rounded-lg text-[11px] \${att.passedKkm ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}\`}>
                                {att.passedKkm ? 'Tuntas' : 'Remedial'}
                              </span>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>`;

code = code.replace(riwayatEndTarget, riwayatEndReplacement);
code = code.replace('<td>{exam.title}</td>', '<td>{exam.title} {examAttempts.length > 1 ? `(Percobaan ${attIndex + 1})` : ""}</td>'); // This is a rough replace, I'll do a regex or exact match
fs.writeFileSync('src/components/SiswaPanel.tsx', code);
