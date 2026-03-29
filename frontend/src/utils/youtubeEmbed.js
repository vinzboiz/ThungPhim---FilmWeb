/** Trả về URL embed YouTube hoặc null nếu không parse được. */
export function getYouTubeEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  const url = String(rawUrl).trim();
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const parts = u.pathname.split('/');
      const id = parts[parts.length - 1];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtu.be')) {
      const parts = u.pathname.split('/');
      const id = parts[parts.length - 1];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}
