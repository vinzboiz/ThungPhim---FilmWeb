import { Link } from 'react-router-dom';

export default function ContentDetailHero({
  title,
  content,
  type,
  id,
  posterSrc,
  thumbSrc,
  hasTrailer,
  likeCount,
  userHasLiked,
  likeLoading,
  profileId,
  onScrollToTrailer,
  onSeriesLike,
}) {
  return (
    <div
      className="movie-detail-banner"
      style={{ backgroundImage: posterSrc ? `url(${posterSrc})` : undefined }}
    >
      <div className="movie-detail-banner-gradient" />
      <div className="movie-detail-banner-inner">
        <div className="movie-detail-poster">
          {thumbSrc && <img src={thumbSrc} alt={title} />}
        </div>
        <div className="movie-detail-info">
          <h1 className="movie-detail-title">{title}</h1>
          <p className="movie-detail-meta">
            {content.release_year && <span className="movie-detail-meta__gap-right">{content.release_year}</span>}
            {content.age_rating && <span className="movie-detail-meta__gap-right">{content.age_rating}</span>}
            {type === 'movie' ? 'Phim lẻ' : 'Phim bộ'}
            {content.view_count != null && (
              <span className="movie-detail-meta__gap-left">{content.view_count} lượt xem</span>
            )}
            {type === 'series' && likeCount != null && (
              <span className="movie-detail-meta__gap-left">👍 {likeCount}</span>
            )}
          </p>
          <div className="movie-detail-actions">
            {hasTrailer && (
              <button
                type="button"
                className="movie-detail-btn movie-detail-btn--secondary"
                onClick={onScrollToTrailer}
              >
                ▶ Trailer
              </button>
            )}
            {type === 'movie' && content.video_url && (
              <Link to={`/watch/movie/${id}`} className="movie-detail-btn movie-detail-btn--primary">
                ▶ Xem phim
              </Link>
            )}
            {type === 'series' && (
              <button
                type="button"
                className={`movie-detail-btn movie-detail-btn--secondary movie-detail-btn-like ${userHasLiked ? 'movie-detail-btn-like--active' : ''}`}
                disabled={likeLoading || !profileId}
                title={userHasLiked ? 'Bỏ thích' : 'Thích'}
                onClick={onSeriesLike}
              >
                👍 Thích
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
