import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { API_BASE } from '../apis/client';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { getYouTubeEmbedUrl } from '../utils/youtubeEmbed';
import { useContentDetail } from '../hooks/useContentDetail';
import ReviewSection from '../components/ReviewSection';
import DetailMetaRow from '../components/detail/DetailMetaRow';
import DetailCast from '../components/detail/DetailCast';
import EpisodeList from '../components/detail/EpisodeList';
import DetailSuggestions from '../components/detail/DetailSuggestions';
import ContentDetailHero from '../components/detail/ContentDetailHero';
import ContentDetailToolbar from '../components/detail/ContentDetailToolbar';
import ContentDetailTrailerSection from '../components/detail/ContentDetailTrailerSection';
import HeroBanner from '../components/home/HeroBanner';
import '../styles/pages/movie-detail.css';

function ContentDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const pathname = location.pathname || '';
  const type = pathname.startsWith('/series') ? 'series' : 'movie';

  const [suggestionModalItem, setSuggestionModalItem] = useState(null);

  const detail = useContentDetail(id, type);
  const {
    content,
    episodes,
    countries,
    loading,
    error,
    selectedSeasonId,
    setSelectedSeasonId,
    likeCount,
    likeLoading,
    userHasLiked,
    inWatchlist,
    inFavorite,
    watchlistLoading,
    favoriteLoading,
    toggleWatchlist,
    toggleFavorite,
    toggleSeriesLike,
    trailerSectionRef,
    scrollToTrailer,
    profileId,
    token,
  } = detail;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, pathname]);

  if (loading) return <div className="movie-detail movie-detail__status">Đang tải...</div>;
  if (error || !content) {
    return (
      <div className="movie-detail movie-detail__status movie-detail__status--error">
        {error || (type === 'movie' ? 'Không tìm thấy phim' : 'Không tìm thấy series')}
      </div>
    );
  }

  const title = content.title;
  const bannerImg = content.banner_url || content.thumbnail_url;
  const posterSrc = bannerImg
    ? (String(bannerImg).startsWith('http') ? bannerImg : `${API_BASE}${bannerImg}`)
    : null;
  const thumbSrc = content.thumbnail_url
    ? (String(content.thumbnail_url).startsWith('http') ? content.thumbnail_url : `${API_BASE}${content.thumbnail_url}`)
    : null;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(content.trailer_youtube_url);
  const localTrailerSrc = resolveMediaUrl(content.trailer_url);
  const trailerSrc = youtubeEmbedUrl || localTrailerSrc;
  const hasTrailer = !!trailerSrc;
  const seasons = content.seasons || [];
  const countryName = content.country_code
    ? (countries.find((c) => c.code === content.country_code)?.name || content.country_code)
    : null;

  return (
    <div className="movie-detail">
      <nav className="movie-detail-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>›</span>
        <span>{title}</span>
      </nav>

      <ContentDetailHero
        title={title}
        content={content}
        type={type}
        id={id}
        posterSrc={posterSrc}
        thumbSrc={thumbSrc}
        hasTrailer={hasTrailer}
        likeCount={likeCount}
        userHasLiked={userHasLiked}
        likeLoading={likeLoading}
        profileId={profileId}
        onScrollToTrailer={scrollToTrailer}
        onSeriesLike={() => {
          if (!token || !profileId) return;
          toggleSeriesLike();
        }}
      />

      <ContentDetailToolbar
        type={type}
        token={token}
        profileId={profileId}
        inWatchlist={inWatchlist}
        inFavorite={inFavorite}
        watchlistLoading={watchlistLoading}
        favoriteLoading={favoriteLoading}
        onToggleWatchlist={toggleWatchlist}
        onToggleFavorite={toggleFavorite}
      />

      <div className="movie-detail-content">
        <DetailMetaRow content={content} type={type} countryName={countryName} />

        <section className="detail-info-section">
          <h2 className="detail-info-title">Thông tin bộ phim</h2>
          {content.description && <p className="detail-info-desc">{content.description}</p>}
        </section>

        {hasTrailer && (
          <ContentDetailTrailerSection
            youtubeEmbedUrl={youtubeEmbedUrl}
            localTrailerSrc={localTrailerSrc}
            trailerSectionRef={trailerSectionRef}
          />
        )}

        {type === 'series' && (
          <EpisodeList
            seasons={seasons}
            episodes={episodes}
            selectedSeasonId={selectedSeasonId}
            onSeasonChange={setSelectedSeasonId}
          />
        )}

        <DetailCast cast={content.cast} />

        <ReviewSection contentType={type === 'movie' ? 'movie' : 'series'} contentId={id} initialLimit={10} />
        <DetailSuggestions type={type} contentId={id} onOpenInfo={setSuggestionModalItem} />
      </div>
      <HeroBanner
        modalOnly
        externalModalItem={suggestionModalItem}
        onCloseModal={() => setSuggestionModalItem(null)}
      />
    </div>
  );
}

export default ContentDetailPage;
