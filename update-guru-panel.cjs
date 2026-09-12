const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

if (!code.includes("import { motion, AnimatePresence }")) {
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';");
}

const target1 = '            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n              {exams.map((exam) => {';
const replace1 = '            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n              <AnimatePresence mode="popLayout" initial={false}>\n              {exams.map((exam) => {';
code = code.replace(target1, replace1);

const target2 = '                return (\n                  <div\n                    key={exam.id}';
const replace2 = '                return (\n                  <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, backgroundColor: "#fee2e2" }} transition={{ duration: 0.2 }}\n                    key={exam.id}';
code = code.replace(target2, replace2);

const target3 = '                  </div>\n                );\n              })}\n            </div>';
const replace3 = '                  </motion.div>\n                );\n              })}\n              </AnimatePresence>\n            </div>';
code = code.replace(target3, replace3);

const target4 = '              <tbody className="divide-y divide-slate-100">\n                {attemptsForSelectedExam.length === 0 ? (';
const replace4 = '              <tbody className="divide-y divide-slate-100">\n                <AnimatePresence mode="popLayout" initial={false}>\n                {attemptsForSelectedExam.length === 0 ? (';
code = code.replace(target4, replace4);

const target5 = '                ) : (\n                  attemptsForSelectedExam.map((att, idx) => (\n                    <tr key={att.id} className="hover:bg-slate-50 transition">';
const replace5 = '                ) : (\n                  attemptsForSelectedExam.map((att, idx) => (\n                    <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: "#fecaca" }} transition={{ duration: 0.2 }} key={att.id} className="hover:bg-slate-50 transition">';
code = code.replace(target5, replace5);

const target6 = '                        </div>\n                      </td>\n                    </tr>\n                  ))\n                )}\n              </tbody>';
const replace6 = '                        </div>\n                      </td>\n                    </motion.tr>\n                  ))\n                )}\n                </AnimatePresence>\n              </tbody>';
code = code.replace(target6, replace6);

const target7 = '                <tbody className="divide-y divide-slate-100 text-sm">\n                  {attemptsForSelectedExam.length === 0 ? (';
const replace7 = '                <tbody className="divide-y divide-slate-100 text-sm">\n                  <AnimatePresence mode="popLayout" initial={false}>\n                  {attemptsForSelectedExam.length === 0 ? (';
code = code.replace(target7, replace7);

const target8 = '                      return (\n                        <tr key={att.id} className="hover:bg-slate-50 transition">';
const replace8 = '                      return (\n                        <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: "#fecaca" }} transition={{ duration: 0.2 }} key={att.id} className="hover:bg-slate-50 transition">';
code = code.replace(target8, replace8);

const target9 = '                        </tr>\n                      );\n                    })\n                  )}\n                </tbody>';
const replace9 = '                        </motion.tr>\n                      );\n                    })\n                  )}\n                  </AnimatePresence>\n                </tbody>';
code = code.replace(target9, replace9);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
