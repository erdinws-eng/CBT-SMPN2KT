const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf8');

// Rename the prop exams to allExams
code = code.replace(
  "exams,\n  subjects,",
  "exams: allExams,\n  subjects,"
);

// We need to define `exams` as `allExams.filter(e => e.teacherId === currentUser.id)`
code = code.replace(
  "const [isSidebarOpen, setIsSidebarOpen] = useState(true);",
  "const exams = allExams.filter(e => e.teacherId === currentUser.id);\n  const [isSidebarOpen, setIsSidebarOpen] = useState(true);"
);

// We need to replace all `exams` with `allExams` ONLY inside `onUpdateExams` logic...
// Let's see the cases:

code = code.replace(
  "const updatedExams = exams.map((ex) =>",
  "const updatedExams = allExams.map((ex) =>"
);
// wait, there are multiple `const updatedExams = exams.map((ex) =>`
// replace all globally
code = code.replace(/const updatedExams = exams\.map\(\(ex\) =>/g, "const updatedExams = allExams.map((ex) =>");

code = code.replace(
  "const updated = exams.filter((e) => e.id !== examId);",
  "const updated = allExams.filter((e) => e.id !== examId);"
);

code = code.replace(
  "const updated = exams.map((ex) => {",
  "const updated = allExams.map((ex) => {"
);

code = code.replace(
  "onUpdateExams(exams.map((ex) => (ex.id === selectedExam.id ? updatedExam : ex)));",
  "onUpdateExams(allExams.map((ex) => (ex.id === selectedExam.id ? updatedExam : ex)));"
);

code = code.replace(
  "onUpdateExams([createdExam, ...exams]);",
  "onUpdateExams([createdExam, ...allExams]);"
);

code = code.replace(
  "const target = exams.find((e) => e.id === examId);",
  "const target = allExams.find((e) => e.id === examId);"
);
// replace all globally
code = code.replace(/const target = exams\.find\(\(e\) => e\.id === examId\);/g, "const target = allExams.find((e) => e.id === examId);");

code = code.replace(
  "const updated = exams.map((e) =>",
  "const updated = allExams.map((e) =>"
);
// globally
code = code.replace(/const updated = exams\.map\(\(e\) =>/g, "const updated = allExams.map((e) =>");

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log("Done");
