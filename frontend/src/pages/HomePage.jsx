import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, getProfileId, getToken } from '../apis/client';
import HeroBanner from '../components/home/HeroBanner.jsx';
import '../styles/pages/home.css';

function MovieCard({ movie }) {
  return (
    <div className="card">
      {movie.thumbnail_url && (
        <img
          src={`${API_BASE}${movie.thumbnail_url}`}
          alt={movie.title}
          style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }}
        />
      )}
      <h3 className="card-title">{movie.title}</h3>
      {movie.age_rating && (
        <span className="card-badge">{movie.age_rating}</span>
      )}
      {movie.description && (
        <p style={{ fontSize: '14px' }} className="text-muted">
          {movie.description.length > 80 ? movie.description.slice(0, 80) + '...' : movie.description}
        </p>
      )}
      <Link to={`/movies/${movie.id}`} className="link-accent">
        Xem chi tiết
      </Link>
    </div>
  );
}

function HomePage() {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [continueList, setContinueList] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const profileId = getProfileId();
  const token = getToken();
  const isLoggedIn = !!token;
  const trendingRowRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [moviesRes, trendingRes, seriesRes] = await Promise.all([
          fetch(`${API_BASE}/api/movies`).then((r) => r.json()),
          fetch(`${API_BASE}/api/movies/trending`).then((r) => r.json()),
          fetch(`${API_BASE}/api/series`).then((r) => r.json()),
        ]);
        setMovies(Array.isArray(moviesRes) ? moviesRes : []);
        setTrending(Array.isArray(trendingRes) ? trendingRes : []);
        setFeatured((Array.isArray(moviesRes) ? moviesRes : []).filter((m) => m.is_featured));
        setSeries(Array.isArray(seriesRes) ? seriesRes : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!profileId || !token) {
      setContinueList([]);
      setWatchlist([]);
      setHistory([]);
      return;
    }
    const authHeader = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/api/watch/continue?profile_id=${profileId}`, { headers: authHeader }).then((r) => (r.ok ? r.json() : {})),
      fetch(`${API_BASE}/api/watchlist?profile_id=${profileId}`, { headers: authHeader }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/watch/history?profile_id=${profileId}`, { headers: authHeader }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([continueData, watchlistData, historyData]) => {
        const list = [];
        if (continueData.movies) list.push(...continueData.movies.map((m) => ({ ...m, movie_id: m.id })));
        if (continueData.episodes) list.push(...continueData.episodes.map((e) => ({ ...e, movie_id: e.id, title: e.title, thumbnail_url: e.thumbnail_url, progress_seconds: e.progress_seconds, isEpisode: true, series_id: e.series_id })));
        setContinueList(list);
        setWatchlist(Array.isArray(watchlistData) ? watchlistData : []);
        setHistory(Array.isArray(historyData) ? historyData : []);
      })
      .catch(() => {
        setContinueList([]);
        setWatchlist([]);
        setHistory([]);
      });
  }, [profileId, token]);

  const scrollTrending = (direction) => {
    const el = trendingRowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <div className="home-root">
      <HeroBanner />
      <h1>Trang chủ</h1>

      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isLoggedIn && !profileId && (
        <section className="alert-warning">
          <strong>Chưa chọn profile.</strong> Tạo hoặc chọn profile để lưu <strong>danh sách yêu thích</strong>, <strong>lịch sử xem</strong> và <strong>tiếp tục xem</strong> theo từng profile.
          <Link to="/profiles" style={{ display: 'inline-block', marginTop: '8px', fontWeight: 'bold' }}>→ Tạo / Chọn profile</Link>
        </section>
      )}

      {featured.length > 0 && (
        <section className="section">
          <h3>Nổi bật</h3>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {featured.slice(0, 5).map((movie) => (
              <div key={movie.id} style={{ minWidth: '200px' }}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>
      )}

      {profileId && continueList.length > 0 && (
        <section className="section">
          <h3>Phim đang xem / Tiếp tục xem</h3>
          <div className="section-grid">
            {continueList.map((item) => (
              <div key={item.isEpisode ? `ep-${item.id}` : item.movie_id} style={{ minWidth: '160px' }}>
                {item.isEpisode ? (
                  <div className="card">
                    {item.thumbnail_url && (
                      <img src={`${API_BASE}${item.thumbnail_url}`} alt={item.title} style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                    )}
                    <h3 style={{ margin: '4px 0' }}>{item.title}</h3>
                    <Link to={`/watch/episode/${item.id}`} className="link-accent">
                      Xem tiếp
                    </Link>
                    {item.progress_seconds > 0 && (
                      <p style={{ fontSize: '12px' }} className="text-muted">
                        Đã xem {Math.floor(item.progress_seconds)} giây
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <MovieCard movie={{ ...item, id: item.movie_id }} />
                    {item.progress_seconds > 0 && (
                      <p style={{ fontSize: '12px', color: '#888' }}>Đã xem {Math.floor(item.progress_seconds)} giây</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {profileId && watchlist.length > 0 && (
        <section className="section">
          <h3>Danh sách yêu thích</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Theo profile hiện tại. <Link to="/my-list">Xem tất cả →</Link></p>
          <div className="section-grid">
            {watchlist.slice(0, 6).map((item) => (
              <div key={item.movie_id} className="card">
                {item.thumbnail_url && (
                  <img src={`${API_BASE}${item.thumbnail_url}`} alt={item.title} style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                )}
                <h3 style={{ margin: '4px 0', fontSize: '14px' }}>{item.title}</h3>
                <Link to={`/movies/${item.movie_id}`} className="link-accent">
                  Xem chi tiết
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {profileId && history.length > 0 && (
        <section className="section">
          <h3>Lịch sử xem</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Theo profile hiện tại. <Link to="/history">Xem tất cả →</Link></p>
          <div className="section-grid-small">
            {history.slice(0, 6).map((item) => (
              <div key={`${item.type}-${item.content_id}-${item.id}`} className="card">
                {item.thumbnail_url && (
                  <img src={`${API_BASE}${item.thumbnail_url}`} alt={item.title} style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                )}
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>{item.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="section">
          <h3>Xu hướng</h3>
          <div className="home-row">
            <button
              type="button"
              className="home-row-arrow"
              onClick={() => scrollTrending(-1)}
            >
              ‹
            </button>
            <div className="home-row-track" ref={trendingRowRef}>
              {trending.map((movie) => (
                <div key={movie.id} className="home-row-item">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="home-row-arrow home-row-arrow-right"
              onClick={() => scrollTrending(1)}
            >
              ›
            </button>
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section className="section">
          <h3>Phim bộ</h3>
          <div className="section-grid">
            {series.map((s) => (
              <div key={s.id} className="card">
                {s.thumbnail_url && (
                  <img src={`${API_BASE}${s.thumbnail_url}`} alt={s.title} style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                )}
                <h3 style={{ margin: '4px 0' }}>{s.title}</h3>
                {s.age_rating && <span className="card-badge">{s.age_rating}</span>}
                <Link
                  to={`/series/${s.id}`}
                  className="link-accent"
                  style={{ display: 'block', marginTop: '8px' }}
                >
                  Xem chi tiết
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3>Mới thêm</h3>
        {!loading && !error && movies.length === 0 && (
          <p>Chưa có phim nào. Vào Add Movie để thêm.</p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
