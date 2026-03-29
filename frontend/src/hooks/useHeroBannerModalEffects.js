import { useEffect } from 'react';
import { API_BASE } from '../apis/client';

/**
 * Load chi tiết khi mở từ suggestion row + sync like + watchlist cho modal HeroBanner.
 */
export function useHeroBannerModalEffects({
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
}) {
  useEffect(() => {
    if (!externalModalItem) return undefined;
    let cancelled = false;
    setUserHasLiked(false);
    setSelectedSeasonId('');
    setInfoLoading(true);
    setInfoError('');
    const type = externalModalItem.type === 'series' ? 'series' : 'movie';
    const load = async () => {
      try {
        if (type === 'series') {
          const [detailRes, episodesRes] = await Promise.all([
            fetch(`${API_BASE}/api/series/${externalModalItem.id}`).then((r) =>
              r.ok ? r.json() : Promise.reject(new Error('Không tải được chi tiết series')),
            ),
            fetch(`${API_BASE}/api/series/${externalModalItem.id}/episodes`).then((r) => (r.ok ? r.json() : [])),
          ]);
          if (!cancelled) {
            setInfoData({ ...detailRes, type: 'series', genres: detailRes.genres || [] });
            if (typeof detailRes.like_count === 'number') setLikeCount(detailRes.like_count);
            setEpisodes(Array.isArray(episodesRes) ? episodesRes : []);
            const firstSeason = (detailRes.seasons || [])[0];
            if (firstSeason) setSelectedSeasonId(String(firstSeason.id));
          }
        } else {
          const [detailRes, genresRes] = await Promise.all([
            fetch(`${API_BASE}/api/movies/${externalModalItem.id}`).then((r) =>
              r.ok ? r.json() : Promise.reject(new Error('Không tải được chi tiết phim')),
            ),
            fetch(`${API_BASE}/api/movies/${externalModalItem.id}/genres`).then((r) => (r.ok ? r.json() : [])),
          ]);
          if (!cancelled) {
            setInfoData({
              ...detailRes,
              type: 'movie',
              genres: Array.isArray(genresRes) ? genresRes : [],
            });
            if (typeof detailRes.like_count === 'number') setLikeCount(detailRes.like_count);
            setEpisodes([]);
          }
        }
      } catch (err) {
        if (!cancelled) setInfoError(err.message || 'Không tải được thông tin');
      } finally {
        if (!cancelled) setInfoLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [
    externalModalItem,
    setUserHasLiked,
    setSelectedSeasonId,
    setInfoLoading,
    setInfoError,
    setInfoData,
    setLikeCount,
    setEpisodes,
  ]);

  useEffect(() => {
    if (!modalContent || !profileId || !token) return undefined;
    const type = modalContent.type === 'series' ? 'series' : 'movie';
    const url = `${API_BASE}/api/${type === 'series' ? 'series' : 'movies'}/${modalContent.id}/like-status?profile_id=${profileId}`;
    let cancelled = false;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled && data) {
          if (typeof data.like_count === 'number') setLikeCount(data.like_count);
          if (data.user_has_liked === true) setUserHasLiked(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, modalContent, profileId, token, setLikeCount, setUserHasLiked]);

  useEffect(() => {
    if (!token || !profileId || !modalContent) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/api/watchlist?profile_id=${profileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (cancelled) return;
        const inList =
          Array.isArray(list) &&
          list.some(
            (item) =>
              (item.type === 'movie' && Number(item.content_id) === Number(modalContent.id)) ||
              (item.type === 'series' && Number(item.content_id) === Number(modalContent.id)),
          );
        setAddedToWatchlist(!!inList);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, profileId, modalContent, setAddedToWatchlist]);
}
