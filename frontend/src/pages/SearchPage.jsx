import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from '../apis/client';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setMovies([]);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/movies/search?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMovies(Array.isArray(data) ? data : []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div style={{ padding: '24px' }}>
      <h1>Tìm kiếm</h1>
      {q && <p>Kết quả cho: &quot;{q}&quot;</p>}
      {loading && <p>Đang tìm...</p>}
      {!loading && q && movies.length === 0 && <p>Không tìm thấy phim nào.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {movies.map((m) => (
          <Link key={m.id} to={`/movies/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid #444', borderRadius: '8px', padding: '8px', backgroundColor: '#111' }}>
              {m.thumbnail_url && (
                <img src={`${API_BASE}${m.thumbnail_url}`} alt={m.title} style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
              )}
              <h3 style={{ margin: '4px 0', fontSize: '14px' }}>{m.title}</h3>
              {m.age_rating && <span style={{ fontSize: '12px', color: '#888' }}>{m.age_rating}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SearchPage;
