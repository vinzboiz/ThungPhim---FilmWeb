import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../apis/client';
import { API_BASE, getToken, getProfileId } from '../apis/client';
import ReviewSection from '../components/ReviewSection';
import '../styles/pages/movie-detail.css';

function resolveVideoSrc(url) {
  if (!url || !String(url).trim()) return null;
  const u = String(url).trim();
  if (u.startsWith('http')) return u;
  return u.startsWith('/') ? `${API_BASE}${u}` : `${API_BASE}/${u.replace(/^\//, '')}`;
}

function MovieDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const fromStart = location.state?.fromStart === true;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorite, setInFavorite] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const trailerSectionRef = useRef(null);
  const videoSectionRef = useRef(null);
  const initialProgressApplied = useRef(false);
  const profileId = getProfileId();
  const token = getToken();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/movies/${id}`);
        if (!res.ok) throw new Error('Không tìm thấy phim');
        const data = await res.json();
        if (!cancelled) setMovie(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (fromStart || !token || !profileId || !id) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/watch/progress?profile_id=${profileId}&movie_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { progress_seconds: 0 }))
      .then((data) => {
        if (!cancelled && data && data.progress_seconds > 0) setSavedProgress(data.progress_seconds);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [fromStart, token, profileId, id]);

  useEffect(() => {
    if (!token || !profileId || !movie) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/watchlist?profile_id=${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!cancelled) setInWatchlist(Array.isArray(list) && list.some((w) => String(w.movie_id || w.content_id) === String(id)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, profileId, movie, id]);

  useEffect(() => {
    if (!token || !profileId || !id) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/favorites/check?profile_id=${profileId}&movie_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { is_favorite: false }))
      .then((data) => {
        if (!cancelled) setInFavorite(!!data.is_favorite);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, profileId, id]);

  const toggleFavorite = useCallback(async () => {
    if (!token || !profileId) return;
    setFavoriteLoading(true);
    try {
      if (inFavorite) {
        await api('DELETE', `/api/favorites/${id}?profile_id=${profileId}`);
        setInFavorite(false);
      } else {
        await api('POST', '/api/favorites', { profile_id: profileId, movie_id: Number(id) });
        setInFavorite(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFavoriteLoading(false);
    }
  }, [token, profileId, id, inFavorite]);

  const scrollToTrailer = useCallback(() => {
    trailerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToVideo = useCallback(() => {
    (videoSectionRef.current || trailerSectionRef.current)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const toggleWatchlist = useCallback(async () => {
    if (!token || !profileId) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await api('DELETE', `/api/watchlist/${id}?profile_id=${profileId}`);
        setInWatchlist(false);
      } else {
        await api('POST', '/api/watchlist', { profile_id: profileId, movie_id: Number(id) });
        setInWatchlist(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWatchlistLoading(false);
    }
  }, [token, profileId, id, inWatchlist]);

  const saveProgress = useCallback(
    (seconds) => {
      if (!token || !profileId || (seconds !== 0 && !seconds)) return;
      fetch(`${API_BASE}/api/watch/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_id: profileId,
          movie_id: Number(id),
          progress_seconds: Math.floor(seconds),
        }),
      }).catch(() => {});
    },
    [token, profileId, id]
  );

  const lastSaved = useRef(0);
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = Math.floor(v.currentTime);
    if (t - lastSaved.current >= 10) {
      lastSaved.current = t;
      saveProgress(t);
    }
  }, [saveProgress]);

  const handlePause = useCallback(() => {
    if (videoRef.current) saveProgress(Math.floor(videoRef.current.currentTime));
  }, [saveProgress]);

  const handleSeeked = useCallback(() => {
    if (initialProgressApplied.current && videoRef.current) {
      saveProgress(Math.floor(videoRef.current.currentTime));
    }
  }, [saveProgress]);

  const applySavedProgressOnce = useCallback(() => {
    if (initialProgressApplied.current) return;
    const v = videoRef.current;
    if (fromStart) {
      if (v) {
        v.currentTime = 0;
        if (token && profileId) saveProgress(0);
      }
      initialProgressApplied.current = true;
      return;
    }
    if (savedProgress <= 0) return;
    if (!v || v.readyState < 1) return;
    const duration = v.duration;
    const start = isFinite(duration) && duration > 0 && duration > savedProgress
      ? Math.min(savedProgress, duration - 1)
      : savedProgress;
    v.currentTime = start;
    initialProgressApplied.current = true;
  }, [savedProgress, fromStart, token, profileId, saveProgress]);

  const handleVideoLoaded = useCallback(() => {
    applySavedProgressOnce();
  }, [applySavedProgressOnce]);

  const handleVideoKeyDown = useCallback((e) => {
    const v = videoRef.current;
    if (!v) return;
    if (e.key === ' ') {
      e.preventDefault();
      v.paused ? v.play() : v.pause();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      v.currentTime = Math.max(0, v.currentTime - 10);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const d = v.duration;
      v.currentTime = isFinite(d) && d > 0 ? Math.min(d, v.currentTime + 10) : v.currentTime + 10;
    }
  }, []);

  if (loading) return <div className="movie-detail" style={{ padding: '24px' }}>Đang tải...</div>;
  if (error || !movie) return <div className="movie-detail" style={{ padding: '24px', color: 'red' }}>{error || 'Không tìm thấy phim'}</div>;

  const bannerImg = movie.banner_url || movie.thumbnail_url;
  const posterSrc = bannerImg ? (String(bannerImg).startsWith('http') ? bannerImg : `${API_BASE}${bannerImg}`) : null;
  const trailerSrc = resolveVideoSrc(movie.trailer_url);
  const hasTrailer = !!trailerSrc;

  return (
    <div className="movie-detail">
      <nav className="movie-detail-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>›</span>
        <span>{movie.title}</span>
      </nav>

      <div
        className="movie-detail-banner"
        style={{ backgroundImage: posterSrc ? `url(${posterSrc})` : undefined }}
      >
        <div className="movie-detail-banner-gradient" />
        <div className="movie-detail-banner-inner">
          <div className="movie-detail-poster">
            {movie.thumbnail_url && (
              <img
                src={String(movie.thumbnail_url).startsWith('http') ? movie.thumbnail_url : `${API_BASE}${movie.thumbnail_url}`}
                alt={movie.title}
              />
            )}
          </div>
          <div className="movie-detail-info">
            <h1 className="movie-detail-title">{movie.title}</h1>
            <p className="movie-detail-meta">
              {movie.title} ({movie.release_year || '—'})
              {movie.view_count != null && <span style={{ marginLeft: '12px' }}>{movie.view_count} lượt xem</span>}
            </p>
            <div className="movie-detail-actions">
              {hasTrailer && (
                <button type="button" className="movie-detail-btn movie-detail-btn--secondary" onClick={scrollToTrailer}>
                  ▶ Trailer
                </button>
              )}
              <button
                type="button"
                className="movie-detail-btn movie-detail-btn--primary"
                onClick={scrollToVideo}
              >
                ▶ Xem phim
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="movie-detail-toolbar">
        {token && profileId && (
          <>
            <button
              type="button"
              className={`movie-detail-toolbar-btn ${inWatchlist ? 'active' : ''}`}
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
            >
              + Danh sách phát
            </button>
            <button
              type="button"
              className={`movie-detail-toolbar-btn ${inFavorite ? 'active' : ''}`}
              onClick={toggleFavorite}
              disabled={favoriteLoading}
            >
              ❤ Yêu thích
            </button>
          </>
        )}
        <button type="button" className="movie-detail-toolbar-btn" disabled title="Chức năng sẽ có sau">
          Chia sẻ
        </button>
      </div>

      <div className="movie-detail-content">
        {hasTrailer && (
          <section className="movie-detail-trailer" ref={trailerSectionRef}>
            <h2>Trailer</h2>
            <video src={trailerSrc} controls style={{ width: '100%', maxHeight: '400px', background: '#000', borderRadius: '4px' }} />
          </section>
        )}

        {movie.video_url && (
          <section ref={videoSectionRef} style={{ marginBottom: '24px' }}>
            <h2>Xem phim</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
              Nhấn vào vùng video rồi dùng: Space (phát/tạm dừng), ← → (tua 10 giây).
            </p>
            <div
              ref={videoWrapRef}
              tabIndex={0}
              role="button"
              onClick={() => videoWrapRef.current?.focus()}
              onKeyDown={handleVideoKeyDown}
              style={{ outline: 'none' }}
            >
              <video
                ref={videoRef}
                controls
                style={{ width: '100%', maxHeight: '400px', backgroundColor: '#000', borderRadius: '4px' }}
                src={`${API_BASE}${movie.video_url}`}
                onLoadedMetadata={handleVideoLoaded}
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePause}
                onSeeked={handleSeeked}
              />
            </div>
          </section>
        )}

        {movie.description && (
          <section style={{ marginBottom: '24px' }}>
            <h2>Nội dung</h2>
            <p style={{ color: '#ccc', lineHeight: 1.6 }}>{movie.description}</p>
          </section>
        )}

        {movie.cast && movie.cast.length > 0 && (
          <section>
            <h2>Diễn viên / Đạo diễn</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {movie.cast.map((p) => (
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

        <ReviewSection contentType="movie" contentId={id} />
      </div>
    </div>
  );
}

export default MovieDetailPage;
