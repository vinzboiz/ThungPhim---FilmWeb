export default function ContentDetailToolbar({
  type,
  token,
  profileId,
  inWatchlist,
  inFavorite,
  watchlistLoading,
  favoriteLoading,
  onToggleWatchlist,
  onToggleFavorite,
}) {
  return (
    <div className="movie-detail-toolbar">
      {type === 'movie' && token && profileId && (
        <>
          <button
            type="button"
            className={`movie-detail-toolbar-btn ${inWatchlist ? 'active' : ''}`}
            onClick={onToggleWatchlist}
            disabled={watchlistLoading}
          >
            + Danh sách phát
          </button>
          <button
            type="button"
            className={`movie-detail-toolbar-btn ${inFavorite ? 'active' : ''}`}
            onClick={onToggleFavorite}
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
  );
}
