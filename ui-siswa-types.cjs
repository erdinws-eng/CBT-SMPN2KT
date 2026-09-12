const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

const target = `            {/* TYPE 6: BENAR DAN SALAH */}`;
const replacement = `            {/* TYPE 7: ISI KOSONG */}
            {currentQ?.type === 'isi_kosong' && currentQ.fillInTheBlanks && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">Isilah bagian yang kosong di bawah ini:</p>
                <div className="space-y-3">
                  {currentQ.fillInTheBlanks.map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="font-bold text-indigo-700 w-8">[{idx + 1}]</span>
                      <input
                        type="text"
                        value={(currentAnswer || [])[idx] || ''}
                        onChange={(e) => {
                          const newAns = [...(currentAnswer || [])];
                          newAns[idx] = e.target.value;
                          handleAnswerSelect(currentQ.id, newAns);
                        }}
                        className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder={\`Jawaban bagian [\${idx + 1}]...\`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TYPE 8: SUSUN KATA */}
            {currentQ?.type === 'susun_kata' && currentQ.jumbledWords && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">Susun kata-kata berikut menjadi urutan yang benar:</p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentQ.jumbledWords.map((word, wIdx) => {
                      const isUsed = (currentAnswer || []).includes(word);
                      return (
                        <button
                          key={wIdx}
                          disabled={isUsed}
                          onClick={() => {
                            const newAns = [...(currentAnswer || []), word];
                            handleAnswerSelect(currentQ.id, newAns);
                          }}
                          className={\`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition \${
                            isUsed
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                              : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 cursor-pointer'
                          }\`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-3 border-2 border-dashed border-indigo-200 rounded-lg min-h-[60px] bg-white flex flex-wrap gap-2 items-start">
                    {(currentAnswer || []).map((word: string, aIdx: number) => (
                      <button
                        key={aIdx}
                        onClick={() => {
                          const newAns = (currentAnswer || []).filter((_, idx) => idx !== aIdx);
                          handleAnswerSelect(currentQ.id, newAns);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                        title="Klik untuk menghapus dari susunan"
                      >
                        {word} 
                        <span className="text-[10px] bg-white/20 rounded-full w-4 h-4 inline-flex items-center justify-center ml-1">✕</span>
                      </button>
                    ))}
                    {(!currentAnswer || currentAnswer.length === 0) && (
                      <span className="text-slate-400 text-sm italic py-1.5">Klik kata di atas untuk menyusunnya di sini...</span>
                    )}
                  </div>
                  {currentAnswer && currentAnswer.length > 0 && (
                    <button
                      onClick={() => handleAnswerSelect(currentQ.id, [])}
                      className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                    >
                      Reset Susunan
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TYPE 6: BENAR DAN SALAH */}`;
code = code.replace(target, replacement);

fs.writeFileSync('src/components/SiswaPanel.tsx', code);
