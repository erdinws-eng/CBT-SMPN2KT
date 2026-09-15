const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

const regex = /<label className="block font-bold text-slate-700 mb-1">Nama Aplikasi CBT<\/label>([\s\S]*?)<div className="grid grid-cols-1 md:grid-cols-2 gap-4">/m;

const replacement = `<label className="block font-bold text-slate-700 mb-1">Nama Aplikasi CBT</label>$1<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Dinas (Kop Surat Baris 1)</label>
                <input
                  type="text"
                  value={localSettings.dinasName || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, dinasName: e.target.value })}
                  placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kabupaten (Kop Surat Baris 2)</label>
                <input
                  type="text"
                  value={localSettings.kabupatenName || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, kabupatenName: e.target.value })}
                  placeholder="Contoh: PEMERINTAH KABUPATEN KOTABARU"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/AdminPanel.tsx', code);
  console.log('Updated AdminPanel settings form with dinas and kabupaten');
} else {
  console.log('Regex did not match for dinas/kabupaten');
}
