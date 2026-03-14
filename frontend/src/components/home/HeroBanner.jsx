import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mainBannerVideo from '../../assets/mp4/main_movie_banner.mp4';
import { API_BASE, api, getToken, getProfileId } from '../../apis/client';
import '../../styles/components/hero-banner.css';

/**
 * Chuẩn hoá trailer_url từ DB thành URL video đầy đủ (local).
 */
function resolveVideoSrc(trailerUrl) {
  if (!trailerUrl || !String(trailerUrl).trim()) return null;
  const url = String(trailerUrl).trim();
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return `${API_BASE}/${url.replace(/^\//, '')}`;
}

function HeroBanner() {
  const videoRef = useRef(null);
  const [movie, setMovie] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [startFade, setStartFade] = useState(false);
  const [shrinkTitle, setShrinkTitle] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [muted, setMuted] = useState(true);
  const profileId = getProfileId();
  const token = getToken();
  const [showInfo, setShowInfo] = useState(false);
  const [infoData, setInfoData] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [likeCount, setLikeCount] = useState(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const navigate = useNavigate();

  // Random 1 phim hoặc series có trailer (banner trang chủ)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = `${API_BASE}/api/hero/random?t=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('no trailer');
        const data = await res.json();
        if (!cancelled && data?.trailer_url) {
          setMovie(data);
        }
      } catch {
        // bỏ qua lỗi, sẽ dùng fallback video mặc định
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

// 0–3s: chỉ hiện ảnh bìa + intro; 3–5s: ảnh bìa mờ dần, intro ẩn, title thu nhỏ; sau 5s mount video
  useEffect(() => {
    if (!movie) return;
    const fadeTimer = setTimeout(() => {
      setStartFade(true);
      setShrinkTitle(true);
      setTimeout(() => setShowPlayer(true), 2000);
    }, 3000);
    return () => clearTimeout(fadeTimer);
  }, [movie]);

  // MP4 local: gọi play() sau khi show, sync muted state
  useEffect(() => {
    if (!showPlayer || !videoRef.current) return;
    const el = videoRef.current;
    if (el.tagName !== 'VIDEO') return;
    el.muted = muted;
    el.play().catch(() => {});
  }, [showPlayer, movie, muted]);

  const trailerUrl = movie?.trailer_url;
  const videoSrc = trailerUrl ? resolveVideoSrc(trailerUrl) : null;
  const shortIntro =
    (movie && movie.short_intro) ||
    (movie && movie.description
      ? movie.description.length > 140
        ? `${movie.description.slice(0, 140)}…`
        : movie.description
      : null);
  const isSeries = movie?.type === 'series';
  const detailPath = movie ? (isSeries ? `/series/${movie.id}` : `/movies/${movie.id}`) : '';

  // Đồng bộ likeCount từ hero item (series có like_count từ API)
  useEffect(() => {
    if (movie && isSeries && typeof movie.like_count === 'number') setLikeCount(movie.like_count);
  }, [movie, isSeries]);

  // Kiểm tra đã trong watchlist chưa (movie hoặc series)
  useEffect(() => {
    if (!token || !profileId || !movie) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/watchlist?profile_id=${profileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (cancelled) return;
        const inList = Array.isArray(list) && list.some(
          (item) => (item.type === 'movie' && Number(item.content_id) === Number(movie.id))
            || (item.type === 'series' && Number(item.content_id) === Number(movie.id))
        );
        setAddedToWatchlist(!!inList);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, profileId, movie?.id, movie?.type]);

  // Không có trailer hợp lệ -> luôn dùng file MP4 mặc định
  const useLocalFallback = showPlayer && !videoSrc;

  const restartSequence = () => {
    setHasPlayed(false);
    setShowPlayer(true);
    setStartFade(false);
    setShrinkTitle(false);
    const v = videoRef.current;
    if (v && v.tagName === 'VIDEO') {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const handlePlay = () => {
    if (!movie) return;
    navigate(isSeries ? `/series/${movie.id}` : `/movies/${movie.id}`);
  };

  const handleToggleMute = () => {
    const v = videoRef.current;
    setMuted((prev) => {
      const next = !prev;
      if (v && v.tagName === 'VIDEO') {
        v.muted = next;
      }
      return next;
    });
  };

  const handleOpenInfo = async () => {
    if (!movie) return;
    setShowInfo(true);
    if (infoData && infoData.id === movie.id && infoData.type === movie.type) return;
    setInfoLoading(true);
    setInfoError('');
    try {
      if (movie.type === 'series') {
        const detailRes = await fetch(`${API_BASE}/api/series/${movie.id}`).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error('Không tải được chi tiết series'))
        );
        setInfoData({ ...detailRes, type: 'series', genres: [] });
        if (typeof detailRes.like_count === 'number') setLikeCount(detailRes.like_count);
      } else {
        const [detailRes, genresRes] = await Promise.all([
          fetch(`${API_BASE}/api/movies/${movie.id}`).then((r) =>
            r.ok ? r.json() : Promise.reject(new Error('Không tải được chi tiết phim'))
          ),
          fetch(`${API_BASE}/api/movies/${movie.id}/genres`).then((r) =>
            r.ok ? r.json() : []
          ),
        ]);
        setInfoData({
          ...detailRes,
          type: 'movie',
          genres: Array.isArray(genresRes) ? genresRes : [],
        });
        if (typeof detailRes.like_count === 'number') {
          setLikeCount(detailRes.like_count);
        }
      }
    } catch (err) {
      setInfoError(err.message || 'Không tải được thông tin');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
  };

  const handleAddToWatchlist = async () => {
    if (!movie || !token || !profileId || watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      if (isSeries) {
        await api('POST', '/api/watchlist', {
          profile_id: Number(profileId),
          series_id: Number(movie.id),
        });
      } else {
        await api('POST', '/api/watchlist', {
          profile_id: Number(profileId),
          movie_id: Number(movie.id),
        });
      }
      setAddedToWatchlist(true);
    } catch (err) {
      console.error(err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleLike = async () => {
    if (!movie || likeLoading) return;
    setLikeLoading(true);
    try {
      if (isSeries) {
        const res = await api('POST', `/api/series/${movie.id}/like`);
        if (res && typeof res.like_count === 'number') {
          setLikeCount(res.like_count);
        } else {
          setLikeCount((prev) => (prev == null ? 1 : prev + 1));
        }
      } else {
        const res = await api('POST', `/api/movies/${movie.id}/like`);
        if (res && typeof res.like_count === 'number') {
          setLikeCount(res.like_count);
        } else {
          setLikeCount((prev) => (prev == null ? 1 : prev + 1));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleMetaMore = () => {
    if (!movie) return;
    navigate(detailPath);
  };

  return (
    <section className="hero-banner">
      {/* Ảnh bìa hiển thị ngay lập tức; sau 3s bắt đầu fade 2s, rồi trailer xuất hiện */}
      {!showPlayer && movie && (
        <img
          className={`hero-banner-image${
            startFade ? ' hero-banner-poster-fade' : ''
          }`}
          src={
            movie.banner_url
              ? String(movie.banner_url).startsWith('http')
                ? movie.banner_url
                : `${API_BASE}${movie.banner_url}`
              : movie.thumbnail_url
                ? String(movie.thumbnail_url).startsWith('http')
                  ? movie.thumbnail_url
                  : `${API_BASE}${movie.thumbnail_url}`
                : mainBannerVideo
          }
          alt={movie.title}
        />
      )}

      {showPlayer && (
        <>
          {videoSrc ? (
            <video
              ref={videoRef}
              className="hero-banner-video"
              src={videoSrc}
              muted={muted}
              playsInline
              onEnded={() => {
                setHasPlayed(true);
                setShowPlayer(false);
                setStartFade(false);
                setShrinkTitle(false);
              }}
            />
          ) : useLocalFallback ? (
            <video
              ref={videoRef}
              className="hero-banner-video"
              src={mainBannerVideo}
              poster={
                movie?.thumbnail_url
                  ? String(movie.thumbnail_url).startsWith('http')
                    ? movie.thumbnail_url
                    : `${API_BASE}${movie.thumbnail_url}`
                  : undefined
              }
              muted={muted}
              playsInline
              onEnded={() => {
                setHasPlayed(true);
                setShowPlayer(false);
                setStartFade(false);
                setShrinkTitle(false);
              }}
            />
          ) : null}
        </>
      )}

      <div className="hero-banner-gradient" />

      {movie && (
        <>


          {/* Góc phải dưới: nhãn tuổi + nút mute khi đang phát + nút xem lại sau khi trailer đã chạy xong */}
          <div className="hero-banner-bottom-right">
            {movie.age_rating && (
              <span className="hero-banner-age">
                T{movie.age_rating}
              </span>
            )}
            {showPlayer && (
              <button
                type="button"
                className="hero-banner-mute-btn"
                onClick={handleToggleMute}
                aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
            )}
            {!showPlayer && hasPlayed && (
              <button
                type="button"
                className="hero-banner-replay-btn"
                onClick={restartSequence}
              >
                ↺ Xem lại
              </button>
            )}
          </div>

          <div
            className={`hero-banner-content${
              shrinkTitle ? ' hero-banner-content--shrink' : ''
            }`}
          >
            <h2
              className={`hero-banner-title${
                shrinkTitle ? ' hero-banner-title--shrink' : ''
              }`}
            >
              {movie.title}
            </h2>
            {shortIntro && (
              <p
                className={`hero-banner-intro${
                  shrinkTitle ? ' hero-banner-intro--hidden' : ''
                }`}
              >
                {shortIntro}
              </p>
            )}

            <div className="hero-banner-modal-actions">
              <button
                type="button"
                className="hero-banner-btn hero-banner-btn-primary"
                onClick={handlePlay}
              >
                Phát
              </button>
              <button
                type="button"
                className="hero-banner-btn hero-banner-btn-secondary"
                onClick={handleOpenInfo}
              >
                Thông tin khác
              </button>
            </div>
          </div>
        </>
      )}

      {showInfo && movie && (
        <div className="hero-banner-overlay" onClick={handleCloseInfo}>
          <div
            className="hero-banner-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hero-banner-modal-header">
              <button
                type="button"
                className="hero-banner-close-btn"
                onClick={handleCloseInfo}
              >
                ✕
              </button>
            </div>
            <div className="hero-banner-modal-body">
              <div className="hero-banner-modal-left">
                {movie.thumbnail_url && (
                  <img
                    src={
                      String(movie.thumbnail_url).startsWith('http')
                        ? movie.thumbnail_url
                        : `${API_BASE}${movie.thumbnail_url}`
                    }
                    alt={movie.title}
                  />
                )}
                <div className="hero-banner-modal-actions">
                  <button
                    type="button"
                    className="hero-banner-btn hero-banner-btn-primary"
                    onClick={handlePlay}
                  >
                    Phát
                  </button>
                  <button
                    type="button"
                    className="hero-banner-btn hero-banner-btn-secondary"
                    onClick={handleAddToWatchlist}
                    disabled={watchlistLoading}
                  >
                    {addedToWatchlist ? 'Đã thêm' : '+'} Danh sách
                  </button>
                  <button
                    type="button"
                    className="hero-banner-btn hero-banner-btn-secondary"
                    onClick={handleLike}
                    disabled={likeLoading}
                  >
                    👍
                  </button>
                </div>
                <div className="hero-banner-like-count">
                  {likeCount != null && `Lượt thích: ${likeCount}`}
                </div>
                {infoData && (
                  <div className="hero-banner-modal-meta">
                    {infoData.release_year != null && <span>{infoData.release_year}</span>}
                    {!isSeries && infoData.duration_minutes != null && (
                      <span>{`${infoData.duration_minutes} phút`}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="hero-banner-modal-right">
                {infoLoading && (
                  <p style={{ color: '#999', fontSize: '14px' }}>
                    Đang tải thông tin...
                  </p>
                )}
                {infoError && (
                  <p style={{ color: 'red', fontSize: '14px' }}>{infoError}</p>
                )}
                <p className="hero-banner-desc-long">
                  {(infoData && infoData.description) || movie.description}
                </p>
                {infoData && (
                  <>
                    {Array.isArray(infoData.cast) &&
                      infoData.cast.length > 0 && (
                        <div className="hero-banner-meta-section">
                          <strong>Diễn viên:</strong>{' '}
                          {infoData.cast
                            .slice(0, 3)
                            .map((c) => c.name)
                            .join(', ')}
                          {infoData.cast.length > 3 && (
                            <span
                              className="hero-banner-meta-more"
                              onClick={handleMetaMore}
                            >
                              khác
                            </span>
                          )}
                        </div>
                      )}
                    {Array.isArray(infoData.genres) &&
                      infoData.genres.length > 0 && (
                        <div className="hero-banner-meta-section">
                          <strong>Thể loại:</strong>{' '}
                          {infoData.genres
                            .slice(0, 3)
                            .map((g) => g.name)
                            .join(', ')}
                          {infoData.genres.length > 3 && (
                            <span
                              className="hero-banner-meta-more"
                              onClick={handleMetaMore}
                            >
                              khác
                            </span>
                          )}
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HeroBanner;
