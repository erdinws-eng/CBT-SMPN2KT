import {
  GraduationCap,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  RotateCcw,
  Sparkles,
  School,
  Database,
} from 'lucide-react';
import { User, UserRole, SchoolSettings } from '../types';
import { getSupabaseConfig } from '../lib/supabase';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onRoleSwitch?: (role: UserRole) => void;
  onResetData?: () => void;
  onOpenSupabaseModal?: () => void;
  settings: SchoolSettings;
  activeView?: 'admin' | 'guru' | 'siswa' | 'login';
}

export default function Navbar({
  currentUser,
  onLogout,
  onSwitchRole,
  onRoleSwitch,
  onResetData,
  onOpenSupabaseModal,
  settings,
}: NavbarProps) {
  if (!currentUser) return null;

  const isSupabaseActive = getSupabaseConfig().isConfigured;

  const handleSwitch = (role: UserRole) => {
    if (onRoleSwitch) onRoleSwitch(role);
    else if (onSwitchRole) onSwitchRole(role);
  };

  const roleColors: Record<UserRole, { bg: string; text: string; label: string }> = {
    admin: { bg: 'bg-rose-100 border-rose-200', text: 'text-rose-700', label: 'Administrator CBT' },
    guru: { bg: 'bg-indigo-100 border-indigo-200', text: 'text-indigo-700', label: 'Guru Mata Pelajaran' },
    siswa: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700', label: 'Siswa Peserta CBT' },
  };

  const roleBadge = roleColors[currentUser.role];

  return (
    <header
      id="main-cbt-navbar"
      className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 min-w-0">
            {settings.logoUrl ? (
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src={settings.logoUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-xs shrink-0">
                <School className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg truncate">
                  {settings.schoolName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  {settings.appName || 'CBT Digital SMP'}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Active Role Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge.bg} ${roleBadge.text}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{roleBadge.label}</span>
              </div>
            </div>

            {/* User Pill */}
            <div className="flex items-center gap-2.5 pl-2 py-1 bg-slate-50 rounded-xl border border-slate-200">
              {currentUser.role === 'guru' ? (
                <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
              ) : currentUser.role === 'siswa' ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              ) : (
                <img
                  src={
                    currentUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-300"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="pr-3 text-left hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {currentUser.role === 'siswa'
                    ? `NISN: ${currentUser.nip_nisn} (${currentUser.classGrade})`
                    : `NIP: ${currentUser.nip_nisn}`}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="btn-logout"
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Keluar dari Sistem"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
