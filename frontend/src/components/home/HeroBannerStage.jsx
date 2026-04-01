import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../apis/client';

function resolvePosterUrl(movie) {
  if (!movie) return null;
  if (movie.banner_url) {
    return String(movie.banner_url).startsWith('http') ? movie.banner_url : `${API_BASE}${movie.banner_url}`;
  }
  if (movie.thumbnail_url) {
    return String(movie.thumbnail_url).startsWith('http') ? movie.thumbnail_url : `${API_BASE}${movie.thumbnail_url}`;
  }
  return null;
}

export default function HeroBannerStage({
  movie,
  showPlayer,
  startFade,
  shrinkTitle,
  hasPlayed,
  muted,
  videoRef,
  videoSrc,
  useLocalFallback,
  shortIntro,
  handleToggleMute,
  handleHeroVideoEnded,
  restartSequence,
  handleGoToDetail,
  handleOpenInfo,
  onVideoReady,
}) {
  const posterUrl = useMemo(() => resolvePosterUrl(movie), [movie]);
  /** Không bundle ~20MB MP4 vào chunk đầu — chỉ import khi thật sự phát fallback local */
  const [localFallbackVideoUrl, setLocalFallbackVideoUrl] = useState(null);

  useEffect(() => {
    if (!showPlayer || !useLocalFallback) {
      setLocalFallbackVideoUrl(null);
      return undefined;
    }
    let cancelled = false;
    import('../../assets/mp4/main_movie_banner.mp4').then((m) => {
      if (!cancelled) setLocalFallbackVideoUrl(m.default);
    });
    return () => {
      cancelled = true;
    };
  }, [showPlayer, useLocalFallback]);

  /** Preload poster LCP — bắt đầu tải ảnh sớm ngay khi có URL (trước khi paint <img>) */
  useEffect(() => {
    if (!posterUrl) return undefined;
    const id = 'hero-banner-lcp-preload';
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'preload';
      link.as = 'image';
      document.head.appendChild(link);
    }
    link.href = posterUrl;
    link.setAttribute('fetchpriority', 'high');
    return () => {
      const el = document.getElementById(id);
      if (el?.parentNode) el.parentNode.removeChild(el);
    };
  }, [posterUrl]);

  return (
    <section className="hero-banner">
      {!showPlayer && movie && (
        posterUrl ? (
          <img
            className={`hero-banner-image${startFade ? ' hero-banner-poster-fade' : ''}`}
            src={posterUrl}
            alt=""
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <div
            className={`hero-banner-image hero-banner-image--placeholder${startFade ? ' hero-banner-poster-fade' : ''}`}
            aria-hidden
          />
        )
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
              preload="metadata"
              onCanPlay={onVideoReady}
              onEnded={handleHeroVideoEnded}
            />
          ) : useLocalFallback && localFallbackVideoUrl ? (
            <video
              ref={videoRef}
              className="hero-banner-video"
              src={localFallbackVideoUrl}
              poster={
                movie?.thumbnail_url
                  ? String(movie.thumbnail_url).startsWith('http')
                    ? movie.thumbnail_url
                    : `${API_BASE}${movie.thumbnail_url}`
                  : undefined
              }
              muted={muted}
              playsInline
              preload="metadata"
              onCanPlay={onVideoReady}
              onEnded={handleHeroVideoEnded}
            />
          ) : useLocalFallback ? (
            <div className="hero-banner-video hero-banner-video--loading" aria-hidden />
          ) : null}
        </>
      )}

      <div className="hero-banner-gradient" />

      {movie && (
        <>
          <div className="hero-banner-bottom-right">
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
              <button type="button" className="hero-banner-replay-btn" onClick={restartSequence}>
                ↺ Xem lại
              </button>
            )}
            {movie.age_rating && <span className="hero-banner-age">T{movie.age_rating}</span>}
          </div>

          <div className={`hero-banner-content${shrinkTitle ? ' hero-banner-content--shrink' : ''}`}>
            <h2 className={`hero-banner-title${shrinkTitle ? ' hero-banner-title--shrink' : ''}`}>{movie.title}</h2>
            {shortIntro && (
              <p className={`hero-banner-intro${shrinkTitle ? ' hero-banner-intro--hidden' : ''}`}>{shortIntro}</p>
            )}

            <div className="hero-banner-modal-actions">
              <button type="button" className="hero-banner-btn hero-banner-btn-primary" onClick={handleGoToDetail}>
                Phát
              </button>
              <button type="button" className="hero-banner-btn hero-banner-btn-secondary" onClick={handleOpenInfo}>
                Thông tin khác
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
