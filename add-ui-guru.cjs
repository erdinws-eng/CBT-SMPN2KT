const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const target = `              {newQuestionType === 'essay' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rubrik / Pedoman Penilaian Uraian</label>
                  <textarea
                    rows={2}
                    value={newQuestionExplanation}
                    onChange={(e) => setNewQuestionExplanation(e.target.value)}
                    placeholder="Kriteria penilaian jawaban siswa..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}`;

const replacement = `              {newQuestionType === 'essay' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rubrik / Pedoman Penilaian Uraian</label>
                  <textarea
                    rows={2}
                    value={newQuestionExplanation}
                    onChange={(e) => setNewQuestionExplanation(e.target.value)}
                    placeholder="Kriteria penilaian jawaban siswa..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              {newQuestionType === 'isi_kosong' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-700">Kunci Jawaban Bagian yang Kosong:</label>
                      <p className="text-[11px] text-slate-500">Tulis teks dengan [kosong1], [kosong2] di pertanyaan, dan isi kuncinya di bawah.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewQuestionFillInTheBlanks([...newQuestionFillInTheBlanks, ''])}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px]"
                    >
                      + Tambah Kosong
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newQuestionFillInTheBlanks.map((ans, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="font-bold text-indigo-700">[{idx + 1}]</span>
                        <input
                          type="text"
                          value={ans}
                          onChange={(e) => {
                            const arr = [...newQuestionFillInTheBlanks];
                            arr[idx] = e.target.value;
                            setNewQuestionFillInTheBlanks(arr);
                          }}
                          className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newQuestionType === 'susun_kata' && (
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700">Daftar Kata (Acak Otomatis di Siswa):</label>
                    <p className="text-[11px] text-slate-500">Ketik kata-kata dengan urutan yang BENAR di sini. Sistem akan mengacaknya untuk siswa.</p>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Ketik kata-kata dipisahkan dengan enter atau spasi (Misal: Ibu pergi ke pasar)"
                    value={newQuestionCorrectOrder.join(' ')}
                    onChange={(e) => {
                       const words = e.target.value.split(/\\s+/).filter(Boolean);
                       setNewQuestionCorrectOrder(words);
                       setNewQuestionJumbledWords([...words].sort(() => Math.random() - 0.5));
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
                    Kata: {newQuestionCorrectOrder.length > 0 ? newQuestionCorrectOrder.join(' • ') : '-'}
                  </div>
                </div>
              )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/GuruPanel.tsx', code);
