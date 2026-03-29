import { API_BASE } from '../apis/client';

/**
 * Chuẩn hoá URL media (video/ảnh) từ API: path tương đối → URL đầy đủ.
 *
 * @param {string|null|undefined} url
 * @param {string} [apiBase] Mặc định dùng API_BASE từ client
 * @returns {string|null}
 */
export function resolveMediaUrl(url, apiBase = API_BASE) {
  if (!url || !String(url).trim()) return null;
  const u = String(url).trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return u.startsWith('/') ? `${apiBase}${u}` : `${apiBase}/${u.replace(/^\//, '')}`;
}
