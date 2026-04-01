import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import { Link, useSearchParams, useLocation, useParams } from 'react-router-dom';
import { API_BASE, getProfileId, getToken } from '../apis/client';
import '../styles/pages/home.css';
import HeroBanner from '../components/home/HeroBanner.jsx';
import HomeMovieRow from '../components/home/HomeMovieRow.jsx';
import HomeDeferredSection from '../components/home/HomeDeferredSection.jsx';

/** Chỉ dùng trên Home khi `?q=` — tách chunk, giảm JS ban đầu khi không search */
const HomeSearchSection = lazy(() => import('../components/home/HomeSearchSection.jsx'));

const homeLazyFallback = <div className="home-lazy-fallback" aria-hidden />;

/** mode: all | series | movies | featured (từ pathname hoặc /browse/:type) */
function getModeFromPath(pathname, browseType) {
  if (pathname === '/series' || browseType === 'series') return 'series';
  if (pathname === '/movies' || browseType === 'movies') return 'movies';
  if (pathname === '/browse/new' || pathname === '/new' || browseType === 'new') return 'featured';
  return 'all';
}

function HomePage() {
  const { pathname } = useLocation();
  const { type: browseType } = useParams();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const mode = useMemo(() => getModeFromPath(pathname, browseType), [pathname, browseType]);
  const [modalItem, setModalItem] = useState(null);
  const [topRating, setTopRating] = useState([]);
  const [newMovies, setNewMovies] = useState([]);
  const [genreRows, setGenreRows] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [continueList, setContinueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const profileId = getProfileId();
  const token = getToken();
  const isLoggedIn = !!token;
  const isSearchMode = q.length > 0;

  const heroType = useMemo(
    () =>
      mode === 'movies'
        ? 'movie'
        : mode === 'series'
          ? 'series'
          : mode === 'featured'
            ? 'featured'
            : 'all',
    [mode],
  );
  const apiType = useMemo(
    () => (mode === 'movies' ? 'movie' : mode === 'series' ? 'series' : ''),
    [mode],
  );
  const apiFeatured = useMemo(() => (mode === 'featured' ? '1' : ''), [mode]);

  const handleCloseModal = useCallback(() => setModalItem(null), []);
  const handleOpenInfo = useCallback((item) => setModalItem(item), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  /**
   * Trên mạng chậm, trì hoãn vài trăm ms để hero + ảnh poster LCP không tranh băng thông
   * với 3 API + hàng loạt thumbnail (giảm LCP kéo dài).
   */
  useEffect(() => {
    if (isSearchMode) return undefined;
    let cancelled = false;
    const run = async () => {
      try {
        const tr = apiType ? `&type=${apiType}` : '';
        const tf = apiFeatured ? `&featured=${apiFeatured}` : '';
        const [topRes, trendingRes, genresRes] = await Promise.all([
          fetch(`${API_BASE}/api/movies/top-rating?limit=10${tr}${tf}`).then((r) => r.json()),
          fetch(`${API_BASE}/api/movies/trending?limit=20${tr}${tf}`).then((r) => r.json()),
          fetch(`${API_BASE}/api/genres/top-with-movies?limit=5${apiType ? `&type=${apiType}` : ''}${apiFeatured ? `&featured=${apiFeatured}` : ''}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        startTransition(() => {
          setTopRating(Array.isArray(topRes) ? topRes : []);
          setNewMovies(Array.isArray(trendingRes) ? trendingRes.slice(0, 10) : []);
          setGenreRows(Array.isArray(genresRes) ? genresRes : []);
        });
      } catch (err) {
        if (!cancelled) {
          startTransition(() => setError(err.message));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const delayMs = 380;
    const timer = setTimeout(run, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isSearchMode, mode, apiType, apiFeatured]);

  useEffect(() => {
    if (!profileId || !token) {
      setContinueList([]);
      setFavorites([]);
      return undefined;
    }
    let cancelled = false;
    const authHeader = { Authorization: `Bearer ${token}` };
    const timer = setTimeout(() => {
      Promise.all([
        fetch(`${API_BASE}/api/watch/continue?profile_id=${profileId}`, { headers: authHeader }).then((r) => (r.ok ? r.json() : {})),
        fetch(`${API_BASE}/api/favorites?profile_id=${profileId}`, { headers: authHeader }).then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([continueData, favoritesData]) => {
          if (cancelled) return;
          const list = [];
          if (continueData.movies) {
            list.push(...continueData.movies.map((m) => ({ ...m, type: 'movie' })));
          }
          if (continueData.episodes) {
            list.push(...continueData.episodes.map((e) => ({ ...e, type: 'episode' })));
          }
          setContinueList(list.slice(0, 10));
          const favs = Array.isArray(favoritesData) ? favoritesData : [];
          setFavorites(
            favs.slice(0, 10).map((f) => ({
              id: f.movie_id,
              title: f.title,
              thumbnail_url: f.thumbnail_url,
              type: 'movie',
            }))
          );
        })
        .catch(() => {
          if (!cancelled) {
            setContinueList([]);
            setFavorites([]);
          }
        });
    }, 720);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [profileId, token]);

  const topRowTitle = useMemo(
    () =>
      mode === 'series' ? 'Top rating series' : mode === 'featured' ? 'Nổi bật' : 'Top rating phim',
    [mode],
  );
  const newRowTitle = useMemo(
    () =>
      mode === 'series'
        ? 'Series mới'
        : mode === 'movies'
          ? 'Phim mới'
          : mode === 'featured'
            ? 'Mới & phổ biến'
            : 'Phim mới',
    [mode],
  );

  return (
    <div className="home-root">
      {!isSearchMode && (
        <HeroBanner
          externalModalItem={modalItem}
          onCloseModal={handleCloseModal}
          heroType={heroType}
        />
      )}

      {isSearchMode && (
        <Suspense fallback={homeLazyFallback}>
          <HomeSearchSection query={q} />
        </Suspense>
      )}

      {!isSearchMode && (
        <div className="home-content">
          {loading && <p>Đang tải...</p>}
          {error && <p className="home-error">{error}</p>}

          {isLoggedIn && !profileId && (
            <section className="alert-warning">
              <strong>Chưa chọn profile.</strong> Tạo hoặc chọn profile để lưu <strong>danh sách yêu thích</strong>, <strong>lịch sử xem</strong> và <strong>tiếp tục xem</strong> theo từng profile.
              <Link to="/profiles">→ Tạo / Chọn profile</Link>
            </section>
          )}

          <HomeMovieRow title={topRowTitle} items={topRating} onOpenInfo={handleOpenInfo} />
          <HomeMovieRow title={newRowTitle} items={newMovies} onOpenInfo={handleOpenInfo} />
          {genreRows.map((row) => (
            <HomeDeferredSection key={row.genre?.id} minHeight={300}>
              <HomeMovieRow
                title={row.genre?.name || 'Thể loại'}
                items={row.movies || []}
                onOpenInfo={handleOpenInfo}
              />
            </HomeDeferredSection>
          ))}
          {isLoggedIn && profileId && (
            <HomeDeferredSection minHeight={620}>
              <HomeMovieRow title="Yêu thích" items={favorites} onOpenInfo={handleOpenInfo} />
              <HomeMovieRow title="Đang xem" items={continueList} onOpenInfo={handleOpenInfo} />
            </HomeDeferredSection>
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;
