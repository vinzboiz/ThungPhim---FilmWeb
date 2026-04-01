import { memo } from 'react';
import { Link } from 'react-router-dom';
import { posterImageResponsiveProps, resolveMediaUrl } from '../../utils/mediaUrl';

function MovieCard({ movie }) {
  const thumb = resolveMediaUrl(movie.thumbnail_url);
  const imgProps = posterImageResponsiveProps(thumb);

  return (
    <div className="card">
      {imgProps && (
        <img
          alt=""
          className="card-img"
          width={400}
          height={225}
          decoding="async"
          loading="lazy"
          {...imgProps}
        />
      )}
      <h3 className="card-title">{movie.title}</h3>
      {movie.age_rating && (
        <span className="card-badge">{movie.age_rating}</span>
      )}
      {movie.description && (
        <p className="card-description text-muted">
          {movie.description.length > 80 ? movie.description.slice(0, 80) + '...' : movie.description}
        </p>
      )}
      <Link to={`/movies/${movie.id}`} className="link-accent">
        Xem chi tiết
      </Link>
    </div>
  );
}

export default memo(MovieCard);
