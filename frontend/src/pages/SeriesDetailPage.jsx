import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE, getToken } from '../apis/client';
import ReviewSection from '../components/ReviewSection';
import '../styles/pages/movie-detail.css';

function resolveVideoSrc(url) {
  if (!url || !String(url).trim()) return null;
  const u = String(url).trim();
  if (u.startsWith('http')) return u;
  return u.startsWith('/') ? `${API_BASE}${u}` : `${API_BASE}/${u.replace(/^\//, '')}`;
}

function SeriesDetailPage() {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [likeCount, setLikeCount] = useState(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const trailerSectionRef = useRef(null);
  const token = getToken();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${API_BASE}/api/series/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/api/series/${id}/episodes`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, eps]) => {
        if (!cancelled) {
          setSeries(s);
          setEpisodes(Array.isArray(eps) ? eps : []);
          if (s && typeof s.like_count === 'number') setLikeCount(s.like_count);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="movie-detail" style={{ padding: '24px' }}>Đang tải...</div>;
  if (error || !series) return <div className="movie-detail" style={{ padding: '24px', color: 'red' }}>{error || 'Không tìm thấy series'}</div>;

  const seasons = series.seasons || [];
  const filteredEpisodes = selectedSeasonId
    ? episodes.filter((ep) => String(ep.season_id) === String(selectedSeasonId))
    : episodes;

  const bannerImg = series.banner_url || series.thumbnail_url;
  const posterSrc = bannerImg ? (String(bannerImg).startsWith('http') ? bannerImg : `${API_BASE}${bannerImg}`) : null;
  const thumbSrc = series.thumbnail_url ? (String(series.thumbnail_url).startsWith('http') ? series.thumbnail_url : `${API_BASE}${series.thumbnail_url}`) : null;
  const trailerSrc = resolveVideoSrc(series.trailer_url);
  const hasTrailer = !!trailerSrc;

  return (
    <div className="movie-detail">
      <nav className="movie-detail-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>›</span>
        <span>{series.title}</span>
      </nav>

      <div
        className="movie-detail-banner"
        style={{ backgroundImage: posterSrc ? `url(${posterSrc})` : undefined }}
      >
        <div className="movie-detail-banner-gradient" />
        <div className="movie-detail-banner-inner">
          <div className="movie-detail-poster">
            {thumbSrc && <img src={thumbSrc} alt={series.title} />}
          </div>
          <div className="movie-detail-info">
            <h1 className="movie-detail-title">{series.title}</h1>
            <p className="movie-detail-meta">
              {series.release_year && <span style={{ marginRight: '12px' }}>{series.release_year}</span>}
              {series.age_rating && <span style={{ marginRight: '12px' }}>{series.age_rating}</span>}
              Phim bộ · Tổng quan
              {likeCount != null && <span style={{ marginLeft: '12px' }}>👍 {likeCount}</span>}
            </p>
            <div className="movie-detail-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {hasTrailer && (
                <button
                  type="button"
                  className="movie-detail-btn movie-detail-btn--secondary"
                  onClick={() => trailerSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  ▶ Trailer
                </button>
              )}
              <button
                type="button"
                className="movie-detail-btn movie-detail-btn--secondary"
                disabled={likeLoading}
                onClick={async () => {
                  if (!token) return;
                  setLikeLoading(true);
                  try {
                    const res = await fetch(`${API_BASE}/api/series/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                    const data = res.ok ? await res.json() : null;
                    if (data && typeof data.like_count === 'number') {
                      setLikeCount(data.like_count);
                      setSeries((prev) => prev ? { ...prev, like_count: data.like_count } : null);
                    }
                  } finally {
                    setLikeLoading(false);
                  }
                }}
              >
                👍 Thích
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="movie-detail-content">
        {hasTrailer && (
          <section className="movie-detail-trailer" ref={trailerSectionRef}>
            <h2>Trailer</h2>
            <video src={trailerSrc} controls style={{ width: '100%', maxHeight: '400px', background: '#000', borderRadius: '4px' }} />
          </section>
        )}

        {series.description && (
          <section style={{ marginBottom: '24px' }}>
            <h2>Nội dung</h2>
            <p style={{ color: '#ccc', lineHeight: 1.6 }}>{series.description}</p>
          </section>
        )}

        {series.cast && series.cast.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2>Diễn viên / Đạo diễn</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {series.cast.map((p) => (
                <Link key={p.id} to={`/persons/${p.id}`} style={{ textDecoration: 'none', color: '#61dafb' }}>
                  <div style={{ textAlign: 'center', width: '80px' }}>
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url.startsWith('http') ? p.avatar_url : `${API_BASE}${p.avatar_url}`}
                        alt={p.name}
                        style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#333', margin: '0 auto' }} />
                    )}
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{p.role}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2>Danh sách tập</h2>
          {seasons.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ marginRight: '8px' }}>Chọn mùa:</label>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #555' }}
              >
                <option value="">Tất cả các mùa</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    Mùa {s.season_number}
                    {s.title ? ` - ${s.title}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {filteredEpisodes.length === 0 ? (
            <p style={{ color: '#888' }}>Chưa có tập nào.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filteredEpisodes.map((ep) => (
                <li key={ep.id} style={{ marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {ep.thumbnail_url && (
                    <img
                      src={ep.thumbnail_url.startsWith('http') ? ep.thumbnail_url : `${API_BASE}${ep.thumbnail_url}`}
                      alt={ep.title}
                      style={{ width: '120px', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <Link to={`/watch/episode/${ep.id}`} style={{ color: '#fff', fontSize: '16px', fontWeight: 500 }}>
                      Tập {ep.episode_number}: {ep.title}
                    </Link>
                    {ep.duration_minutes && <span style={{ marginLeft: '8px', color: '#888', fontSize: '14px' }}>{ep.duration_minutes} phút</span>}
                    {ep.view_count != null && <span style={{ marginLeft: '8px', color: '#888', fontSize: '13px' }}>{ep.view_count} lượt xem</span>}
                    {ep.description && <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '13px', lineHeight: 1.4 }}>{ep.description.slice(0, 120)}{ep.description.length > 120 ? '...' : ''}</p>}
                  </div>
                  <Link to={`/watch/episode/${ep.id}`} className="movie-detail-btn movie-detail-btn--primary" style={{ textDecoration: 'none' }}>
                    Xem
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ReviewSection contentType="series" contentId={id} />
      </div>
    </div>
  );
}

export default SeriesDetailPage;
