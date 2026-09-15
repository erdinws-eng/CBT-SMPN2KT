const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

const regex2 = /<div>\s*<label className="block font-bold text-slate-700 mb-1">Kota \/ Kabupaten<\/label>([\s\S]*?)<\/div>/;
const replacement2 = `<div>
                <label className="block font-bold text-slate-700 mb-1">Kota / Kabupaten</label>$1</div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tempat Tanda Tangan</label>
                <input
                  type="text"
                  value={localSettings.signatureLocation || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, signatureLocation: e.target.value })}
                  placeholder="Contoh: Kotabaru"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>`;

if (regex2.test(code)) {
  code = code.replace(regex2, replacement2);
  fs.writeFileSync('src/components/AdminPanel.tsx', code);
  console.log('Updated AdminPanel settings form with signatureLocation');
} else {
  console.log('Regex 2 did not match');
}
