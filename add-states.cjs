const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const hookEnd = `  const [newMatchingPairs, setNewMatchingPairs] = useState<{ premise: string; match: string }[]>([
    { premise: '', match: '' },
    { premise: '', match: '' },
  ]);`;

const newStates = `  const [newQuestionFillInTheBlanks, setNewQuestionFillInTheBlanks] = useState<string[]>(['']);
  const [newQuestionJumbledWords, setNewQuestionJumbledWords] = useState<string[]>(['']);
  const [newQuestionCorrectOrder, setNewQuestionCorrectOrder] = useState<string[]>([]);`;

code = code.replace(hookEnd, hookEnd + '\n' + newStates);
fs.writeFileSync('src/components/GuruPanel.tsx', code);
