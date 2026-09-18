const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf8');

// Insert myExams
code = code.replace(
  "const [isSidebarOpen, setIsSidebarOpen] = useState(true);",
  "const myExams = exams.filter(e => e.teacherId === currentUser.id);\n  const [isSidebarOpen, setIsSidebarOpen] = useState(true);"
);

// Replace initial state usage
code = code.replace(
  "const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');",
  "const [selectedExamId, setSelectedExamId] = useState<string>(myExams[0]?.id || '');"
);
code = code.replace(
  "const [riwayatSelectedExamId, setRiwayatSelectedExamId] = useState<string>(exams[0]?.id || '');",
  "const [riwayatSelectedExamId, setRiwayatSelectedExamId] = useState<string>(myExams[0]?.id || '');"
);

// Replace selectedExam derived state
code = code.replace(
  "const selectedExam = exams.find((e) => e.id === (selectedExamId || riwayatSelectedExamId)) || exams[0];",
  "const selectedExam = myExams.find((e) => e.id === (selectedExamId || riwayatSelectedExamId)) || myExams[0];"
);

// We need to carefully replace rendering loops. 
// A safer approach: I will just use `const myExams = exams.filter(...)` and rename the `exams` prop to `allExams`, and rename `myExams` to `exams`.
// Then for onUpdateExams I can just use `allExams`.
