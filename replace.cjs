const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

const startTag = "{/* TYPE 5: MENJODOHKAN (Pemetaan Fungsi Matematika f: A -> B) */}";
const endTag = "{/* TYPE 6: BENAR DAN SALAH */}";

const startIdx = code.indexOf(startTag);
const endIdx = code.indexOf(endTag);

if (startIdx === -1 || endIdx === -1) {
  console.log("Failed to find tags");
  process.exit(1);
}

const replacement = `            {/* TYPE 5: MENJODOHKAN (Pemetaan Fungsi Matematika f: A -> B) */}
            {currentQ?.type === 'menjodohkan' && currentQ.matchingPairs && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                    f
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                      Pemetaan Relasi Fungsi Matematika (f: A ➔ B)
                    </h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                      1. Klik salah satu butir di <strong>Himpunan A (Domain)</strong> hingga aktif bersinar.<br />
                      2. Klik pilihan pasangannya di <strong>Himpunan B (Kodomain)</strong> untuk memetakan.<br />
                      3. Pada bagian A boleh memetakan ke bagian B lebih dari satu pemetaan.<br />
                      4. Untuk reset pasangannya, cukup klik lagi bulatan pemetaan yang ada di A.
                    </p>
                  </div>
                </div>

                {/* Status Pemetaan Sedang Aktif */}
                {selectedDomainItem && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-pulse">
                    <span className="font-semibold">
                      Domain Terpilih: <strong className="text-indigo-700">"{selectedDomainItem}"</strong> ➔ Silakan klik target pasangannya di Himpunan B!
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDomainItem(null)}
                      className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}

                {/* Diagram Dua Kolom Himpunan A dan B */}
                <Xwrapper>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Himpunan A (Domain / Soal) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-indigo-200">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-100">
                        <span className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                            A
                          </span>
                          <span>Himpunan A (Domain / Butir Soal)</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          {currentQ.matchingPairs.length} Elemen
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {currentQ.matchingPairs.map((pair, pIdx) => {
                          const currentPairs = currentAnswer || {};
                          const mappedArr = Array.isArray(currentPairs[pair.premise]) 
                            ? currentPairs[pair.premise] 
                            : (currentPairs[pair.premise] ? [currentPairs[pair.premise]] : []);
                          
                          const isSelected = selectedDomainItem === pair.premise;
                          const isMapped = mappedArr.length > 0;
                          
                          return (
                            <div
                              key={pIdx}
                              onClick={() => setSelectedDomainItem(isSelected ? null : pair.premise)}
                              className={\`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 select-none \${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300 shadow-md scale-[1.01]'
                                  : isMapped
                                  ? 'bg-white text-slate-900 border-indigo-300 shadow-2xs hover:border-indigo-400'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                              }\`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={\`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 \${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                                  }\`}
                                >
                                  a\${pIdx + 1}
                                </span>
                                <span className="font-semibold text-xs truncate" title={pair.premise}>
                                  {pair.premise}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 z-10">
                                <span
                                  id={\`domain-\${pIdx}\`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isMapped) {
                                      // Click bulatan pemetaan untuk reset pasangan ini
                                      const copy = { ...currentPairs };
                                      delete copy[pair.premise];
                                      handleAnswerSelect(currentQ.id, copy);
                                      if (isSelected) setSelectedDomainItem(null);
                                    } else {
                                      setSelectedDomainItem(isSelected ? null : pair.premise);
                                    }
                                  }}
                                  className={\`w-3 h-3 rounded-full border-2 cursor-pointer transition-colors \${
                                    isSelected
                                      ? 'bg-amber-300 border-white ring-2 ring-amber-300'
                                      : isMapped
                                      ? 'bg-emerald-500 border-emerald-600'
                                      : 'bg-slate-200 border-slate-400 hover:bg-slate-300'
                                  }\`}
                                  title={isMapped ? 'Klik bulatan ini untuk mereset pasangan' : 'Klik untuk memilih'}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Himpunan B (Kodomain / Pilihan Jawaban) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-emerald-200">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-100">
                        <span className="font-black text-xs text-emerald-950 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                            B
                          </span>
                          <span>Himpunan B (Kodomain / Pilihan Jawaban)</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Target Pemetaan
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {currentQ.matchingPairs.map((pair, pIdx) => {
                          const targetMatch = pair.match;
                          const currentPairs = currentAnswer || {};
                          
                          // Cari tahu premise apa saja yang memetakan ke target ini
                          const mappedFromPremises = Object.keys(currentPairs).filter(prem => {
                             const ans = currentPairs[prem];
                             return Array.isArray(ans) ? ans.includes(targetMatch) : ans === targetMatch;
                          });
                          const isMappedToThis = mappedFromPremises.length > 0;
                          
                          // Cek apakah target ini sudah dipetakan oleh domain yang sedang aktif
                          const isActiveDomainMappedHere = selectedDomainItem && (
                            Array.isArray(currentPairs[selectedDomainItem]) 
                               ? currentPairs[selectedDomainItem].includes(targetMatch)
                               : currentPairs[selectedDomainItem] === targetMatch
                          );

                          return (
                            <div
                              key={pIdx}
                              onClick={() => {
                                if (selectedDomainItem) {
                                  const ans = currentPairs[selectedDomainItem];
                                  let newArr = Array.isArray(ans) ? [...ans] : (ans ? [ans] : []);
                                  
                                  if (newArr.includes(targetMatch)) {
                                    newArr = newArr.filter(v => v !== targetMatch);
                                  } else {
                                    newArr.push(targetMatch);
                                  }
                                  
                                  handleAnswerSelect(currentQ.id, {
                                    ...currentPairs,
                                    [selectedDomainItem]: newArr,
                                  });
                                } else {
                                  alert(
                                    'Pilih butir soal di Himpunan A (kolom kiri) terlebih dahulu sebelum memetakan ke jawaban ini!'
                                  );
                                }
                              }}
                              className={\`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 select-none \${
                                selectedDomainItem
                                  ? 'bg-white hover:bg-emerald-50 text-slate-900 border-emerald-300 hover:border-emerald-500 ring-1 ring-emerald-200 shadow-2xs hover:scale-[1.01]'
                                  : isMappedToThis
                                  ? 'bg-white text-slate-900 border-emerald-300 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }\`}
                            >
                              <div className="flex items-center gap-2 min-w-0 z-10">
                                <span id={\`match-\${pIdx}\`} className={\`w-3 h-3 rounded-full border-2 shrink-0 \${isActiveDomainMappedHere ? 'bg-amber-300 border-amber-500' : 'bg-slate-200 border-slate-400'}\`} />
                                <span className="w-5 h-5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                  b\${pIdx + 1}
                                </span>
                                <span className="font-semibold text-xs truncate" title={targetMatch}>
                                  {targetMatch}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Render panah pemetaan */}
                    {Object.entries(currentAnswer || {}).flatMap(([prem, matches]) => {
                      const arr = Array.isArray(matches) ? matches : [matches];
                      return arr.map(matchVal => {
                        const premIdx = currentQ.matchingPairs.findIndex(p => p.premise === prem);
                        const matchIdx = currentQ.matchingPairs.findIndex(p => p.match === matchVal);
                        if (premIdx === -1 || matchIdx === -1) return null;
                        
                        // Menambahkan sedikit variasi warna berdasarkan index domain
                        const colors = ['#4f46e5', '#059669', '#ea580c', '#db2777', '#0284c7', '#7c3aed'];
                        const arrowColor = colors[premIdx % colors.length];
                        
                        return (
                          <Xarrow
                            key={\`\${prem}-\${matchVal}\`}
                            start={\`domain-\${premIdx}\`}
                            end={\`match-\${matchIdx}\`}
                            color={arrowColor}
                            strokeWidth={3}
                            path="smooth"
                            startAnchor="right"
                            endAnchor="left"
                            headSize={4}
                            curveness={0.8}
                          />
                        );
                      });
                    })}
                  </div>
                </Xwrapper>

                {/* Himpunan Pasangan Terurut Output */}
                <div className="p-3.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      Himpunan Pasangan Terurut: f = &#123; (a, b) &#125;
                    </span>
                    {Object.keys(currentAnswer || {}).length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAnswerSelect(currentQ.id, {})}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Reset Semua Pasangan
                      </button>
                    )}
                  </div>

                  {Object.keys(currentAnswer || {}).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">
                      Belum ada pemetaan yang dibuat. Klik elemen di Himpunan A lalu klik pasangannya di Himpunan B.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(currentAnswer || {}).flatMap(([prem, matches], eIdx) => {
                        const arr = Array.isArray(matches) ? matches : [matches];
                        return arr.map((matchVal, mIdx) => (
                          <span
                            key={\`\${eIdx}-\${mIdx}\`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-indigo-200 text-indigo-900 rounded-xl text-xs font-medium shadow-2xs"
                          >
                            <strong className="text-indigo-700 font-bold">{prem}</strong>
                            <span className="text-slate-400 font-bold">➔</span>
                            <span className="font-semibold">{String(matchVal)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const copy = { ...currentAnswer };
                                const ansArr = Array.isArray(copy[prem]) ? copy[prem] : [copy[prem]];
                                const filtered = ansArr.filter(v => v !== matchVal);
                                if (filtered.length === 0) {
                                  delete copy[prem];
                                } else {
                                  copy[prem] = filtered;
                                }
                                handleAnswerSelect(currentQ.id, copy);
                              }}
                              className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                              title="Hapus pasangan relasi ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ));
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/components/SiswaPanel.tsx', code);
console.log("Successfully replaced matching block!");
