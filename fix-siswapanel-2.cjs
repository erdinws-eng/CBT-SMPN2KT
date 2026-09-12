const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

// 1. Remove Submit Button from navigation on last question
const submitBtnBlockTarget = `            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Kumpulkan Ujian</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}`;

const submitBtnBlockReplacement = `            {!isLastQuestion && (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}`;

code = code.replace(submitBtnBlockTarget, submitBtnBlockReplacement);

// 2. Add useEffect to watch for Guru resets
const effectWatchTarget = `  // 4. Update Answer for current question`;
const effectWatchReplacement = `  // Watch for Guru resets from attempts prop
  useEffect(() => {
    if (activeExam && currentAttempt) {
      const globalAttempt = attempts.find(a => a.id === currentAttempt.id);
      if (globalAttempt) {
        // If answers were cleared globally (i.e. Guru reset), but local still has them
        if (Object.keys(globalAttempt.answers).length === 0 && Object.keys(userAnswers).length > 0) {
          // Reset the local state to match the clean attempt
          setUserAnswers({});
          setCurrentAttempt(globalAttempt);
          setCurrentQuestionIndex(0);
          setRemainingSeconds(activeExam.durationMinutes * 60);
          setElapsedMinutes(0);
          setViolationCount(0);
          setViolationWarningModal(null);
          setDoubtQuestions({});
        } else if (globalAttempt.status === 'in_progress' && currentAttempt.status === 'violation_disqualified') {
          // If status was reset but maybe userAnswers is empty anyway
          setCurrentAttempt(globalAttempt);
          setViolationCount(0);
          setViolationWarningModal(null);
        }
      }
    }
  }, [attempts, activeExam, currentAttempt, userAnswers]);

  // 4. Update Answer for current question`;

code = code.replace(effectWatchTarget, effectWatchReplacement);

fs.writeFileSync('src/components/SiswaPanel.tsx', code);
