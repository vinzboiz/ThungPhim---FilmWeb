import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../apis/client';
import { API_BASE, getToken, getProfileId } from '../apis/client';

function MyListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = getToken();
  const profileId = getProfileId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!profileId) {
      navigate('/profiles');
      return;
    }
    api('GET', `/api/watchlist?profile_id=${profileId}`)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, profileId, navigate]);

  async function remove(movieId) {
    try {
      await api('DELETE', `/api/watchlist/${movieId}?profile_id=${profileId}`);
      setItems((prev) => prev.filter((m) => m.movie_id !== movieId));
    } catch (err) {
      console.error(err);
    }
  }

  if (!token || !profileId) return null;
  if (loading) return <div style={{ padding: '24px' }}>Đang tải...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h1>Danh sách của tôi</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {items.length === 0 && !error && <p>Chưa có phim nào trong danh sách. Vào trang phim và bấm "Thêm vào danh sách của tôi".</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {items.map((item) => (
          <div key={item.movie_id} style={{ border: '1px solid #444', borderRadius: '8px', padding: '8px', backgroundColor: '#111' }}>
            {item.thumbnail_url && (
              <img
                src={`${API_BASE}${item.thumbnail_url}`}
                alt={item.title}
                style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }}
              />
            )}
            <h3 style={{ margin: '4px 0', fontSize: '14px' }}>{item.title}</h3>
            <Link to={`/movies/${item.movie_id}`} style={{ fontSize: '12px', color: '#61dafb' }}>Xem</Link>
            <button type="button" onClick={() => remove(item.movie_id)} style={{ marginLeft: '8px', fontSize: '12px' }}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyListPage;
