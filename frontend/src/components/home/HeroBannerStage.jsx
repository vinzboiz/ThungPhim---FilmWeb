import mainBannerVideo from '../../assets/mp4/main_movie_banner.mp4';
import { API_BASE } from '../../apis/client';

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
}) {
  return (
    <section className="hero-banner">
      {!showPlayer && movie && (
        <img
          className={`hero-banner-image${startFade ? ' hero-banner-poster-fade' : ''}`}
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
              onEnded={handleHeroVideoEnded}
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
              onEnded={handleHeroVideoEnded}
            />
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
