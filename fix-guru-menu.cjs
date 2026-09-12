const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const targetMenu = `            {/* Menu Evaluasi Soal */}
            <button
              id="menu-sidebar-guru-evaluasi"
              onClick={() => {
                setActiveTab('evaluasi');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer \${
                activeTab === 'evaluasi'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }\`}
              title="Evaluasi Soal Essai"
            >
              <ClipboardCheck className={\`w-5 h-5 shrink-0 \${activeTab === 'evaluasi' ? 'text-slate-900' : 'text-slate-400'}\`} />
              {isSidebarOpen && <span className="truncate">Evaluasi Soal</span>}
            </button>
          </nav>`;

const replaceMenu = `            {/* Menu Evaluasi Soal */}
            <button
              id="menu-sidebar-guru-evaluasi"
              onClick={() => {
                setActiveTab('evaluasi');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer \${
                activeTab === 'evaluasi'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }\`}
              title="Evaluasi Soal Essai"
            >
              <ClipboardCheck className={\`w-5 h-5 shrink-0 \${activeTab === 'evaluasi' ? 'text-slate-900' : 'text-slate-400'}\`} />
              {isSidebarOpen && <span className="truncate">Evaluasi Soal</span>}
            </button>

            {/* Menu Riwayat Siswa */}
            <button
              id="menu-sidebar-guru-riwayat"
              onClick={() => {
                setActiveTab('riwayat_siswa');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer \${
                activeTab === 'riwayat_siswa'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }\`}
              title="Riwayat Ujian Siswa"
            >
              <History className={\`w-5 h-5 shrink-0 \${activeTab === 'riwayat_siswa' ? 'text-slate-900' : 'text-slate-400'}\`} />
              {isSidebarOpen && <span className="truncate">Riwayat Siswa</span>}
            </button>
          </nav>`;

code = code.replace(targetMenu, replaceMenu);
fs.writeFileSync('src/components/GuruPanel.tsx', code);
