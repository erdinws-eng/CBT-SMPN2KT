const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const targetState = "  const [selectedClassFilter, setSelectedClassFilter] = useState('');";
const replaceState = `  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [riwayatSelectedExamId, setRiwayatSelectedExamId] = useState<string>('');
  const [riwayatSelectedClass, setRiwayatSelectedClass] = useState<string>('');
  const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);
  const [selectedRiwayatStudent, setSelectedRiwayatStudent] = useState<{studentId: string, studentName: string, studentNisn: string} | null>(null);`;

code = code.replace(targetState, replaceState);
fs.writeFileSync('src/components/GuruPanel.tsx', code);
