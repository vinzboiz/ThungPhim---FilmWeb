import { Link } from 'react-router-dom';
import { API_BASE } from '../../apis/client';

export default function HeroBannerModalEpisodes({
  modalContent,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  modalEpisodes,
  onCloseInfo,
}) {
  return (
    <div className="hero-banner-modal-episodes">
      <h3 className="hero-banner-modal-episodes-title">Tập</h3>
      {seasons.length > 0 && (
        <div className="hero-banner-modal-season-wrap">
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="hero-banner-modal-season-select"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                Mùa {s.season_number}
                {s.title ? ` - ${s.title}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      {selectedSeasonId && (
        <p className="hero-banner-modal-season-meta">
          {seasons.find((s) => String(s.id) === selectedSeasonId)?.title || ''}
          {modalContent.age_rating && ` • T${modalContent.age_rating}`}
        </p>
      )}
      <ul className="hero-banner-modal-episode-list">
        {modalEpisodes.length === 0 ? (
          <li className="hero-banner-modal-episode-empty">Chưa có tập nào.</li>
        ) : (
          modalEpisodes.map((ep) => (
            <li key={ep.id} className="hero-banner-modal-episode-item">
              <span className="hero-banner-modal-episode-num">{ep.episode_number}</span>
              {ep.thumbnail_url && (
                <img
                  src={ep.thumbnail_url.startsWith('http') ? ep.thumbnail_url : `${API_BASE}${ep.thumbnail_url}`}
                  alt=""
                  className="hero-banner-modal-episode-thumb"
                />
              )}
              <div className="hero-banner-modal-episode-info">
                <Link
                  to={`/watch/episode/${ep.id}`}
                  className="hero-banner-modal-episode-title"
                  onClick={onCloseInfo}
                >
                  {ep.title || `Tập ${ep.episode_number}`}
                </Link>
                {ep.description && (
                  <p className="hero-banner-modal-episode-desc">
                    {ep.description.length > 100 ? `${ep.description.slice(0, 100)}…` : ep.description}
                  </p>
                )}
              </div>
              <span className="hero-banner-modal-episode-duration">
                {ep.duration_minutes != null ? `${ep.duration_minutes}ph` : ''}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
