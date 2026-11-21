export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

const MAX_RAW_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
const TARGET_MAX_DATA_URL_LENGTH = 360 * 1024; // ~270 KB binary equivalent

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file gambar.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar dari perangkat.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Format file gambar tidak valid atau rusak.'));
    img.src = src;
  });
}

export async function compressQuestionImageFile(file: File): Promise<CompressedImageResult> {
  if (!file) {
    throw new Error('File gambar tidak ditemukan.');
  }

  const isImageMime = file.type.startsWith('image/');
  const isImageExt = /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);
  if (!isImageMime && !isImageExt) {
    throw new Error('File harus berupa gambar (PNG, JPG, JPEG, WEBP, atau GIF).');
  }

  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('Ukuran file gambar terlalu besar (maksimal 15 MB).');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(rawDataUrl);

  const origW = img.naturalWidth || img.width || 800;
  const origH = img.naturalHeight || img.height || 600;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser tidak mendukung pemrosesan gambar Canvas.');
  }

  const renderAtScale = (maxDim: number, mime: 'image/webp' | 'image/jpeg', quality: number): { url: string; w: number; h: number } => {
    const scale = Math.min(1, maxDim / Math.max(origW, origH));
    const targetW = Math.max(1, Math.round(origW * scale));
    const targetH = Math.max(1, Math.round(origH * scale));
    canvas.width = targetW;
    canvas.height = targetH;

    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    } else {
      ctx.clearRect(0, 0, targetW, targetH);
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);
    const url = canvas.toDataURL(mime, quality);
    return { url, w: targetW, h: targetH };
  };

  // Cek dukungan WebP pada canvas (beberapa browser lama fallback ke PNG)
  const webpTest = renderAtScale(Math.min(1000, Math.max(origW, origH)), 'image/webp', 0.82);
  const supportsWebp = webpTest.url.startsWith('data:image/webp');
  const preferredMime: 'image/webp' | 'image/jpeg' = supportsWebp ? 'image/webp' : 'image/jpeg';

  const attempts: Array<{ maxDim: number; quality: number }> = [
    { maxDim: 1000, quality: 0.82 },
    { maxDim: 900, quality: 0.72 },
    { maxDim: 760, quality: 0.65 },
    { maxDim: 640, quality: 0.58 },
  ];

  let best = preferredMime === 'image/webp'
    ? webpTest
    : renderAtScale(attempts[0].maxDim, 'image/jpeg', attempts[0].quality);

  for (const attempt of attempts) {
    const current = renderAtScale(attempt.maxDim, preferredMime, attempt.quality);
    best = current;
    if (current.url.length <= TARGET_MAX_DATA_URL_LENGTH) {
      break;
    }
  }

  // Jika gambar asli sudah sangat kecil (< 80 KB) dan berupa PNG/GIF, tidak masalah pakai hasil terkompresi yang lebih kecil
  const finalUrl = best.url.length < rawDataUrl.length || rawDataUrl.length > TARGET_MAX_DATA_URL_LENGTH
    ? best.url
    : rawDataUrl;

  const estimatedBytes = Math.round((finalUrl.length * 3) / 4);
  return {
    dataUrl: finalUrl,
    sizeBytes: estimatedBytes,
    width: best.w,
    height: best.h,
  };
}

export function formatImageSizeLabel(mediaUrl?: string): string {
  if (!mediaUrl) return '';
  if (mediaUrl.startsWith('data:image/')) {
    const base64Part = mediaUrl.split(',')[1] || '';
    const bytes = Math.round((base64Part.length * 3) / 4);
    const kb = Math.max(1, Math.round(bytes / 1024));
    return `Gambar Lokal (~${kb} KB)`;
  }
  return 'Gambar URL Eksternal';
}
