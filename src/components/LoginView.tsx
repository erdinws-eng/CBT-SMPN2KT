import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { User, SchoolSettings } from '../types';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  settings: SchoolSettings;
  onOpenSupabaseModal?: () => void;
}

export default function LoginView({
  users,
  onLoginSuccess,
  settings,
}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage('Silakan masukkan Username dan Password.');
      return;
    }

    // Dukungan akun bawaan admin (username: admin, password: admin123)
    if (trimmedUser === 'admin' && trimmedPass === 'admin123') {
      setIsLoading(true);
      const adminUser = users.find((u) => u.username.toLowerCase() === 'admin');
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(
          adminUser
            ? { ...adminUser, password: 'admin123' }
            : {
                id: 'user_admin_1',
                username: 'admin',
                password: 'admin123',
                name: 'Administrator CBT',
                role: 'admin',
                nip_nisn: '198205142006041008',
              }
        );
      }, 250);
      return;
    }

    setIsLoading(true);

    // Cari pengguna berdasarkan username atau NIP/NISN
    const found = users.find(
      (u) =>
        u.username.toLowerCase() === trimmedUser ||
        (u.nip_nisn && u.nip_nisn.toLowerCase() === trimmedUser)
    );

    if (!found) {
      setIsLoading(false);
      setErrorMessage('Akun dengan Username tersebut tidak ditemukan.');
      return;
    }

    // Validasi kata sandi (cocokkan password atau fallback password default jika baru dibuat)
    const expectedPassword = found.password || 'password123';
    if (expectedPassword !== trimmedPass) {
      setIsLoading(false);
      setErrorMessage('Password yang Anda masukkan salah. Silakan coba kembali.');
      return;
    }

    // Login Berhasil
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(found);
    }, 250);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 select-none">
      {/* Ambient Lighting / Glow Orbs for Modern Fresh Atmosphere */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card - Centered, Clean, No Clutter */}
      <div className="w-full flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 transition-all">
          {/* Logo, Nama Aplikasi, & Nama Sekolah */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.schoolName}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <GraduationCap className="w-16 h-16 text-indigo-600" />
              )}
            </div>

            {/* Nama Aplikasi */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {settings.appName || 'SMART CBT PRO'}
            </h1>

            {/* Nama Sekolah */}
            <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">
              {settings.schoolName || 'SMP NEGERI 1 CERDAS MANDIRI'}
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium animate-fadeIn">
                {errorMessage}
              </div>
            )}

            {/* Input Username */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Masuk */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-70 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sistem'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Minimalis */}
      <footer className="w-full py-4 text-center text-[11px] text-slate-400 relative z-10">
        © {new Date().getFullYear()} {settings.schoolName || 'SMP NEGERI 1 CERDAS MANDIRI'} • Sistem CBT
      </footer>
    </div>
  );
}
