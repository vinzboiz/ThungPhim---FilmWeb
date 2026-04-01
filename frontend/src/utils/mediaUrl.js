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

/**
 * Gợi ý kích thước cho poster/card (CSS ~280px): srcset + sizes để trình duyệt chọn mức phù hợp.
 * Khi backend chỉ có một URL, vẫn dùng cùng URL với nhiều descriptor (hợp lệ; có thể tái sử dụng cache).
 *
 * @param {string|null} absoluteUrl URL đã resolve đầy đủ
 * @returns {{ src: string, srcSet: string, sizes: string } | null}
 */
export function posterImageResponsiveProps(absoluteUrl) {
  if (!absoluteUrl) return null;
  const u = String(absoluteUrl);
  return {
    src: u,
    srcSet: `${u} 280w, ${u} 560w, ${u} 840w`,
    sizes: '(max-width: 480px) 45vw, (max-width: 1024px) 22vw, 280px',
  };
}
