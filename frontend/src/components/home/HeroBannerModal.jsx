import { API_BASE } from '../../apis/client';
import HeroBannerModalEpisodes from './HeroBannerModalEpisodes';

export default function HeroBannerModal({
  modalContent,
  modalVideoRef,
  modalTrailerSrc,
  modalMuted,
  infoData,
  infoLoading,
  infoError,
  likeCount,
  userHasLiked,
  addedToWatchlist,
  watchlistLoading,
  likeLoading,
  seasons,
  modalEpisodes,
  directors,
  actors,
  isSeriesModal,
  selectedSeasonId,
  setSelectedSeasonId,
  handleCloseInfo,
  handlePlay,
  handleToggleWatchlist,
  handleToggleLike,
  handleToggleModalMute,
  handleMetaMore,
  token,
  profileId,
}) {
  return (
    <div className="hero-banner-overlay" onClick={handleCloseInfo}>
      <div className="hero-banner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hero-banner-modal-header">
          <button type="button" className="hero-banner-close-btn" onClick={handleCloseInfo}>
            ✕
          </button>
        </div>
        <div className="hero-banner-modal-scroll">
          <div className="hero-banner-modal-top">
            {modalTrailerSrc ? (
              <video
                ref={modalVideoRef}
                className="hero-banner-modal-video"
                src={modalTrailerSrc}
                muted={modalMuted}
                playsInline
                loop
                poster={
                  modalContent?.banner_url || modalContent?.thumbnail_url
                    ? String(modalContent.banner_url || modalContent.thumbnail_url).startsWith('http')
                      ? modalContent.banner_url || modalContent.thumbnail_url
                      : `${API_BASE}${modalContent.banner_url || modalContent.thumbnail_url}`
                    : undefined
                }
              />
            ) : (
              <img
                className="hero-banner-modal-video-poster"
                src={
                  modalContent.banner_url || modalContent.thumbnail_url
                    ? String(modalContent.banner_url || modalContent.thumbnail_url).startsWith('http')
                      ? modalContent.banner_url || modalContent.thumbnail_url
                      : `${API_BASE}${modalContent.banner_url || modalContent.thumbnail_url}`
                    : ''
                }
                alt=""
                width={1280}
                height={720}
                decoding="async"
              />
            )}
            <div className="hero-banner-modal-top-gradient" />
            <div className="hero-banner-modal-top-overlay">
              <h2 className="hero-banner-modal-title">{modalContent.title}</h2>
              <div className="hero-banner-modal-actions hero-banner-modal-actions--top">
                <button type="button" className="hero-banner-btn hero-banner-btn-primary" onClick={handlePlay}>
                  ▶ Phát
                </button>
                <button
                  type="button"
                  className={`hero-banner-btn hero-banner-btn-icon hero-banner-btn-watchlist ${addedToWatchlist ? 'hero-banner-btn-watchlist--active' : ''}`}
                  onClick={handleToggleWatchlist}
                  disabled={watchlistLoading || !token || !profileId}
                  title={addedToWatchlist ? 'Xóa khỏi danh sách' : 'Thêm vào danh sách'}
                >
                  +
                </button>
                <button
                  type="button"
                  className={`hero-banner-btn hero-banner-btn-icon hero-banner-btn-like ${userHasLiked ? 'hero-banner-btn-like--active' : ''}`}
                  onClick={handleToggleLike}
                  disabled={likeLoading || !token || !profileId}
                  title={userHasLiked ? 'Bỏ thích' : 'Thích'}
                >
                  👍
                </button>
                <button
                  type="button"
                  className="hero-banner-btn hero-banner-btn-icon"
                  onClick={handleToggleModalMute}
                  aria-label={modalMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                >
                  {modalMuted ? '🔇' : '🔊'}
                </button>
              </div>
              {likeCount != null && <span className="hero-banner-modal-like-count">Lượt thích: {likeCount}</span>}
            </div>
          </div>

          <div className="hero-banner-modal-body">
            <div className="hero-banner-modal-info">
              <div className="hero-banner-modal-info-left">
                {infoLoading && <p className="hero-banner-modal-loading">Đang tải thông tin...</p>}
                {infoError && <p className="hero-banner-modal-error">{infoError}</p>}
                {infoData && (
                  <>
                    <div className="hero-banner-modal-meta-row">
                      {infoData.release_year != null && <span>{infoData.release_year}</span>}
                      {isSeriesModal && seasons.length > 0 && <span>{seasons.length} mùa</span>}
                      {!isSeriesModal && infoData.duration_minutes != null && (
                        <span>{infoData.duration_minutes} phút</span>
                      )}
                      {modalContent?.age_rating && (
                        <span className="hero-banner-modal-age">T{modalContent.age_rating}</span>
                      )}
                    </div>
                    <p className="hero-banner-modal-desc">
                      {(infoData.description || modalContent?.description || '').slice(0, 280)}
                      {((infoData.description || modalContent?.description) || '').length > 280 ? '…' : ''}
                    </p>
                  </>
                )}
              </div>
              <div className="hero-banner-modal-info-right">
                {actors.length > 0 && (
                  <div className="hero-banner-meta-section">
                    <strong>Diễn viên:</strong> {actors.slice(0, 3).map((c) => c.name).join(', ')}
                    {actors.length > 3 && (
                      <span className="hero-banner-meta-more" onClick={handleMetaMore}>
                        thêm
                      </span>
                    )}
                  </div>
                )}
                {Array.isArray(infoData?.genres) && infoData.genres.length > 0 && (
                  <div className="hero-banner-meta-section">
                    <strong>Thể loại:</strong> {infoData.genres.slice(0, 3).map((g) => g.name).join(', ')}
                    {infoData.genres.length > 3 && (
                      <span className="hero-banner-meta-more" onClick={handleMetaMore}>
                        thêm
                      </span>
                    )}
                  </div>
                )}
                {directors.length > 0 && (
                  <div className="hero-banner-meta-section">
                    <strong>Đạo diễn:</strong> {directors.map((d) => d.name).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {isSeriesModal && (
              <HeroBannerModalEpisodes
                modalContent={modalContent}
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                setSelectedSeasonId={setSelectedSeasonId}
                modalEpisodes={modalEpisodes}
                onCloseInfo={handleCloseInfo}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
