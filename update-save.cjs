const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const target1 = `    let finalTrueFalse: { statement: string; answer: 'Benar' | 'Salah' }[] | undefined = undefined;`;
const replacement1 = `    let finalTrueFalse: { statement: string; answer: 'Benar' | 'Salah' }[] | undefined = undefined;
    let finalFillInTheBlanks: string[] | undefined = undefined;
    let finalJumbledWords: string[] | undefined = undefined;
    let finalCorrectOrder: string[] | undefined = undefined;`;
code = code.replace(target1, replacement1);

const target2 = `    } else if (newQuestionType === 'isian') {
      finalCorrectAnswer = newQuestionCorrectAnswer;
    }`;
const replacement2 = `    } else if (newQuestionType === 'isian') {
      finalCorrectAnswer = newQuestionCorrectAnswer;
    } else if (newQuestionType === 'isi_kosong') {
      finalFillInTheBlanks = newQuestionFillInTheBlanks.filter((v) => v.trim().length > 0);
    } else if (newQuestionType === 'susun_kata') {
      finalJumbledWords = newQuestionJumbledWords.filter((v) => v.trim().length > 0);
      finalCorrectOrder = newQuestionCorrectOrder.filter((v) => v.trim().length > 0);
    }`;
code = code.replace(target2, replacement2);

const target3 = `      correctAnswers: finalCorrectAnswers,
      matchingPairs: finalMatchingPairs,
      trueFalseStatements: finalTrueFalse,
      explanation: newQuestionExplanation.trim() || undefined,`;
const replacement3 = `      correctAnswers: finalCorrectAnswers,
      matchingPairs: finalMatchingPairs,
      trueFalseStatements: finalTrueFalse,
      fillInTheBlanks: finalFillInTheBlanks,
      jumbledWords: finalJumbledWords,
      correctOrder: finalCorrectOrder,
      explanation: newQuestionExplanation.trim() || undefined,`;
code = code.replace(target3, replacement3);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
