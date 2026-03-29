/** Hiển thị giây dạng mm:ss (dùng intro slider, admin). */
export function formatTime(seconds) {
  const s = Number(seconds);
  if (!isFinite(s) || s < 0) return '00:00';
  const total = Math.floor(s);
  const m = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
