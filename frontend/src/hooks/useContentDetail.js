import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE, api, getToken, getProfileId } from '../apis/client';
import { pushClientNotification } from '../utils/notificationsClient';

/**
 * Fetch + trạng thái cho trang chi tiết phim/series (movie-detail).
 */
export function useContentDetail(id, type) {
  const [content, setContent] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [likeCount, setLikeCount] = useState(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorite, setInFavorite] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const trailerSectionRef = useRef(null);

  const profileId = getProfileId();
  const token = getToken();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/countries`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!cancelled) setCountries(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (type === 'movie') {
      fetch(`${API_BASE}/api/movies/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled) setContent(data);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      Promise.all([
        fetch(`${API_BASE}/api/series/${id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/api/series/${id}/episodes`).then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([s, eps]) => {
          if (!cancelled) {
            setContent(s);
            setEpisodes(Array.isArray(eps) ? eps : []);
            if (s && typeof s.like_count === 'number') setLikeCount(s.like_count);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [id, type]);

  useEffect(() => {
    if (type !== 'series' || !id || !profileId || !token) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/api/series/${id}/like-status?profile_id=${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled && data?.user_has_liked === true) setUserHasLiked(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, id, profileId, token]);

  useEffect(() => {
    if (type !== 'movie' || !token || !profileId || !content) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/api/watchlist?profile_id=${profileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!cancelled) {
          setInWatchlist(
            Array.isArray(list) && list.some((w) => String(w.movie_id || w.content_id) === String(id)),
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, token, profileId, content, id]);

  useEffect(() => {
    if (type !== 'movie' || !token || !profileId || !id) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/api/favorites/check?profile_id=${profileId}&movie_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { is_favorite: false }))
      .then((data) => {
        if (!cancelled) setInFavorite(!!data.is_favorite);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, token, profileId, id]);

  const toggleWatchlist = useCallback(async () => {
    if (type !== 'movie' || !token || !profileId) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await api('DELETE', `/api/watchlist/${id}?profile_id=${profileId}`);
        setInWatchlist(false);
      } else {
        await api('POST', '/api/watchlist', { profile_id: profileId, movie_id: Number(id) });
        setInWatchlist(true);
        pushClientNotification('watchlist_add', 'Bạn đã thêm một phim vào danh sách của tôi.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWatchlistLoading(false);
    }
  }, [type, token, profileId, id, inWatchlist]);

  const toggleFavorite = useCallback(async () => {
    if (type !== 'movie' || !token || !profileId) return;
    setFavoriteLoading(true);
    try {
      if (inFavorite) {
        await api('DELETE', `/api/favorites/${id}?profile_id=${profileId}`);
        setInFavorite(false);
      } else {
        await api('POST', '/api/favorites', { profile_id: profileId, movie_id: Number(id) });
        setInFavorite(true);
        pushClientNotification('favorite_add', 'Bạn đã thêm một phim vào danh sách yêu thích.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFavoriteLoading(false);
    }
  }, [type, token, profileId, id, inFavorite]);

  const scrollToTrailer = useCallback(() => {
    trailerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const toggleSeriesLike = useCallback(async () => {
    if (!token || !profileId) return;
    setLikeLoading(true);
    try {
      const url = userHasLiked
        ? `${API_BASE}/api/series/${id}/like?profile_id=${profileId}`
        : `${API_BASE}/api/series/${id}/like`;
      const res = await fetch(url, {
        method: userHasLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: userHasLiked ? undefined : JSON.stringify({ profile_id: Number(profileId) }),
      });
      const data = res.ok ? await res.json() : null;
      if (data && typeof data.like_count === 'number') {
        setLikeCount(data.like_count);
        setUserHasLiked(!!data.user_has_liked);
        setContent((prev) => (prev ? { ...prev, like_count: data.like_count } : null));
      }
    } finally {
      setLikeLoading(false);
    }
  }, [token, profileId, id, userHasLiked]);

  return {
    content,
    setContent,
    episodes,
    countries,
    loading,
    error,
    selectedSeasonId,
    setSelectedSeasonId,
    likeCount,
    setLikeCount,
    likeLoading,
    userHasLiked,
    setUserHasLiked,
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
  };
}
