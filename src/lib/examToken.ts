import { Exam } from '../types';

export type TokenRotationInterval = 0 | 5 | 10 | 15;

const TOKEN_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Menghasilkan kode token acak 6 karakter yang mudah dibaca (tanpa huruf/angka mirip seperti O/0/I/1/L).
 */
export function generateRandomTokenCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += TOKEN_CHARSET.charAt(Math.floor(Math.random() * TOKEN_CHARSET.length));
  }
  return out;
}

/**
 * Hash deterministik sederhana namun kuat untuk menghasilkan token rotasi yang identik
 * di seluruh browser (Guru & Siswa) pada slot waktu yang sama tanpa perlu tulis DB tiap 5 menit.
 */
function computeRotatingTokenFromSlot(seed: string, slot: number): string {
  const input = `${seed}::slot::${slot}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + ((h1 >>> 5) & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }

  let token = '';
  let combined = (h1 >>> 0) ^ ((h2 >>> 0) << 1);
  for (let i = 0; i < 6; i++) {
    const mixed = Math.abs((combined + i * 2654435761) ^ (h2 >>> (i * 3)));
    token += TOKEN_CHARSET[mixed % TOKEN_CHARSET.length];
    combined = Math.imul(combined ^ 0x45d9f3b, 0x27d4eb2d) >>> 0;
  }
  return token;
}

export interface ExamTokenState {
  requiresToken: boolean;
  activeToken: string;
  previousToken: string;
  isWithinGracePeriod: boolean;
  intervalMinutes: number;
  remainingSeconds: number;
}

export function getExamTokenState(
  exam: Pick<Exam, 'id' | 'token' | 'tokenRotationMinutes'>,
  nowMs = Date.now()
): ExamTokenState {
  const rawBase = (exam.token || '').trim().toUpperCase();
  const intervalMinutes = Number(exam.tokenRotationMinutes || 0);

  if (intervalMinutes > 0) {
    const periodMs = intervalMinutes * 60 * 1000;
    const slot = Math.floor(nowMs / periodMs);
    const elapsedInSlotMs = nowMs - slot * periodMs;
    const remainingSeconds = Math.max(0, Math.ceil(((slot + 1) * periodMs - nowMs) / 1000));
    const seed = `${exam.id}:${rawBase && rawBase !== 'DIRECT' ? rawBase : 'CBTSECURE'}`;

    return {
      requiresToken: true,
      activeToken: computeRotatingTokenFromSlot(seed, slot),
      previousToken: computeRotatingTokenFromSlot(seed, Math.max(0, slot - 1)),
      isWithinGracePeriod: elapsedInSlotMs < 15000, // toleransi 15 detik saat transisi pergantian token
      intervalMinutes,
      remainingSeconds,
    };
  }

  if (rawBase && rawBase !== 'DIRECT') {
    return {
      requiresToken: true,
      activeToken: rawBase,
      previousToken: rawBase,
      isWithinGracePeriod: false,
      intervalMinutes: 0,
      remainingSeconds: 0,
    };
  }

  return {
    requiresToken: false,
    activeToken: '',
    previousToken: '',
    isWithinGracePeriod: false,
    intervalMinutes: 0,
    remainingSeconds: 0,
  };
}

export function verifyExamToken(
  exam: Pick<Exam, 'id' | 'token' | 'tokenRotationMinutes'>,
  inputToken: string,
  nowMs = Date.now()
): boolean {
  const state = getExamTokenState(exam, nowMs);
  if (!state.requiresToken) return true;
  const cleaned = (inputToken || '').trim().toUpperCase();
  if (!cleaned) return false;
  if (cleaned === state.activeToken) return true;
  if (state.isWithinGracePeriod && cleaned === state.previousToken) return true;
  return false;
}

export function formatTokenCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
