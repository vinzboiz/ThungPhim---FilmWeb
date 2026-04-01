import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, api, getToken, getProfileId } from '../apis/client';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { useHeroBannerModalEffects } from './useHeroBannerModalEffects';

/**
 * State + effects + handlers cho HeroBanner (banner home + modal thông tin).
 */
export function useHeroBanner({ externalModalItem = null, onCloseModal, heroType = 'all', modalOnly = false }) {
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
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [modalMuted, setModalMuted] = useState(true);
  const modalVideoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (modalOnly) return undefined;
    let cancelled = false;
    async function load() {
      try {
        const typeParam = heroType && heroType !== 'all' ? `&type=${encodeURIComponent(heroType)}` : '';
        const url = `${API_BASE}/api/hero/random?t=${Date.now()}${typeParam}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('no trailer');
        const data = await res.json();
        if (!cancelled && data?.trailer_url) {
          setMovie(data);
        }
      } catch {
        // fallback video mặc định
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [heroType, modalOnly]);

  useEffect(() => {
    if (!movie) return undefined;
    const fadeTimer = setTimeout(() => {
      setStartFade(true);
      setShrinkTitle(true);
      setTimeout(() => setShowPlayer(true), 1600);
    }, 2200);
    return () => clearTimeout(fadeTimer);
  }, [movie]);

  const trailerUrl = movie?.trailer_url;
  const videoSrc = trailerUrl ? resolveMediaUrl(trailerUrl) : null;

  const tryPlayHeroVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el || el.tagName !== 'VIDEO') return;
    el.muted = muted;
    el.play().catch(() => {});
  }, [muted]);

  useEffect(() => {
    if (!showPlayer) return;
    tryPlayHeroVideo();
  }, [showPlayer, movie, muted, videoSrc, tryPlayHeroVideo]);

  const shortIntro =
    (movie && movie.short_intro) ||
    (movie && movie.description
      ? movie.description.length > 140
        ? `${movie.description.slice(0, 140)}…`
        : movie.description
      : null);
  const isSeries = movie?.type === 'series';
  const detailPath = movie ? (isSeries ? `/series/${movie.id}` : `/movies/${movie.id}`) : '';
  const modalContent = externalModalItem || (showInfo && movie ? movie : null);
  const isModalOpen = !!(showInfo && movie) || !!externalModalItem;
  const isSeriesModal = modalContent?.type === 'series';

  useEffect(() => {
    if (movie && isSeries && typeof movie.like_count === 'number') setLikeCount(movie.like_count);
  }, [movie, isSeries]);

  useHeroBannerModalEffects({
    externalModalItem,
    modalContent,
    isModalOpen,
    profileId,
    token,
    setUserHasLiked,
    setSelectedSeasonId,
    setInfoLoading,
    setInfoError,
    setInfoData,
    setLikeCount,
    setEpisodes,
    setAddedToWatchlist,
  });

  const useLocalFallback = showPlayer && !videoSrc;

  const handleHeroVideoEnded = () => {
    setHasPlayed(true);
    setShowPlayer(false);
    setStartFade(false);
    setShrinkTitle(false);
  };

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
    const target = modalContent || movie;
    if (!target) return;
    const isSeriesTarget = target.type === 'series';
    if (isSeriesTarget) {
      const filtered = selectedSeasonId
        ? episodes.filter((ep) => String(ep.season_id) === String(selectedSeasonId))
        : episodes;
      const firstEp = filtered.length ? filtered[0] : episodes[0];
      if (firstEp) {
        navigate(`/watch/episode/${firstEp.id}`);
        handleCloseInfo();
      } else {
        navigate(`/series/${target.id}`);
      }
    } else {
      navigate(`/watch/movie/${target.id}`);
      handleCloseInfo();
    }
  };

  const handleGoToDetail = () => {
    if (!movie) return;
    navigate(detailPath);
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
    setUserHasLiked(false);
    setSelectedSeasonId('');
    if (infoData && infoData.id === movie.id && infoData.type === movie.type) {
      return;
    }
    setInfoLoading(true);
    setInfoError('');
    try {
      if (movie.type === 'series') {
        const [detailRes, episodesRes] = await Promise.all([
          fetch(`${API_BASE}/api/series/${movie.id}`).then((r) =>
            r.ok ? r.json() : Promise.reject(new Error('Không tải được chi tiết series')),
          ),
          fetch(`${API_BASE}/api/series/${movie.id}/episodes`).then((r) => (r.ok ? r.json() : [])),
        ]);
        setInfoData({ ...detailRes, type: 'series', genres: detailRes.genres || [] });
        if (typeof detailRes.like_count === 'number') setLikeCount(detailRes.like_count);
        setEpisodes(Array.isArray(episodesRes) ? episodesRes : []);
        const firstSeason = (detailRes.seasons || [])[0];
        if (firstSeason) setSelectedSeasonId(String(firstSeason.id));
      } else {
        const [detailRes, genresRes] = await Promise.all([
          fetch(`${API_BASE}/api/movies/${movie.id}`).then((r) =>
            r.ok ? r.json() : Promise.reject(new Error('Không tải được chi tiết phim')),
          ),
          fetch(`${API_BASE}/api/movies/${movie.id}/genres`).then((r) => (r.ok ? r.json() : [])),
        ]);
        setInfoData({
          ...detailRes,
          type: 'movie',
          genres: Array.isArray(genresRes) ? genresRes : [],
        });
        if (typeof detailRes.like_count === 'number') {
          setLikeCount(detailRes.like_count);
        }
        setEpisodes([]);
      }
    } catch (err) {
      setInfoError(err.message || 'Không tải được thông tin');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
    setUserHasLiked(false);
    setEpisodes([]);
    if (externalModalItem && onCloseModal) onCloseModal();
  };

  const handleToggleModalMute = () => {
    setModalMuted((prev) => !prev);
  };

  const modalTrailerSrc = isModalOpen && modalContent?.trailer_url ? resolveMediaUrl(modalContent.trailer_url) : null;

  useEffect(() => {
    if (!isModalOpen || !modalVideoRef.current || !modalTrailerSrc) return;
    const el = modalVideoRef.current;
    if (el.tagName !== 'VIDEO') return;
    el.muted = modalMuted;
    el.play().catch(() => {});
  }, [isModalOpen, modalTrailerSrc, modalMuted]);

  const seasons = (infoData && infoData.seasons) || [];
  const modalEpisodes = selectedSeasonId
    ? episodes.filter((ep) => String(ep.season_id) === String(selectedSeasonId))
    : episodes;
  const directors =
    infoData && infoData.cast && Array.isArray(infoData.cast)
      ? infoData.cast.filter((c) => String(c.role).toLowerCase() === 'director')
      : [];
  const actors =
    infoData && infoData.cast && Array.isArray(infoData.cast)
      ? infoData.cast.filter((c) => String(c.role).toLowerCase() !== 'director')
      : [];

  const handleToggleWatchlist = async () => {
    const target = modalContent || movie;
    if (!target || !token || !profileId || watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      const isSeriesTarget = target.type === 'series';
      if (addedToWatchlist) {
        const t = isSeriesTarget ? 'series' : 'movie';
        await api('DELETE', `/api/watchlist/${target.id}?profile_id=${profileId}&type=${t}`);
        setAddedToWatchlist(false);
      } else if (isSeriesTarget) {
        await api('POST', '/api/watchlist', {
          profile_id: Number(profileId),
          series_id: Number(target.id),
        });
        setAddedToWatchlist(true);
      } else {
        await api('POST', '/api/watchlist', {
          profile_id: Number(profileId),
          movie_id: Number(target.id),
        });
        setAddedToWatchlist(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleToggleLike = async () => {
    const target = modalContent || movie;
    if (!target || likeLoading || !token || !profileId) return;
    setLikeLoading(true);
    try {
      const isSeriesTarget = target.type === 'series';
      const q = `?profile_id=${profileId}`;
      if (userHasLiked) {
        const res = isSeriesTarget
          ? await api('DELETE', `/api/series/${target.id}/like${q}`)
          : await api('DELETE', `/api/movies/${target.id}/like${q}`);
        if (res && typeof res.like_count === 'number') {
          setLikeCount(res.like_count);
          setUserHasLiked(false);
        }
      } else {
        const body = { profile_id: Number(profileId) };
        const res = isSeriesTarget
          ? await api('POST', `/api/series/${target.id}/like`, body)
          : await api('POST', `/api/movies/${target.id}/like`, body);
        if (res && typeof res.like_count === 'number') {
          setLikeCount(res.like_count);
          setUserHasLiked(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  };

  const detailPathModal = modalContent
    ? modalContent.type === 'series'
      ? `/series/${modalContent.id}`
      : `/movies/${modalContent.id}`
    : detailPath;
  const handleMetaMore = () => {
    if (!modalContent && !movie) return;
    navigate(modalContent ? detailPathModal : detailPath);
  };

  return {
    modalOnly,
    isModalOpen,
    modalContent,
    stage: {
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
      onVideoReady: tryPlayHeroVideo,
    },
    modal: {
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
      episodes,
      selectedSeasonId,
      setSelectedSeasonId,
      seasons,
      modalEpisodes,
      directors,
      actors,
      isSeriesModal,
      handleCloseInfo,
      handlePlay,
      handleToggleWatchlist,
      handleToggleLike,
      handleToggleModalMute,
      handleMetaMore,
      token,
      profileId,
    },
  };
}
