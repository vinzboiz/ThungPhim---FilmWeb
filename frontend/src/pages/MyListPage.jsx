import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../apis/client';
import { getToken, getProfileId } from '../apis/client';
import HomeMovieRow from '../components/home/HomeMovieRow';
import HeroBanner from '../components/home/HeroBanner';

function MyListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
   const [modalItem, setModalItem] = useState(null);
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

  if (!token || !profileId) return null;
  if (loading) return <div style={{ padding: '24px' }}>Đang tải...</div>;

  const mappedItems = items.map((item) => ({
    id: item.movie_id,
    title: item.title,
    thumbnail_url: item.thumbnail_url,
    banner_url: item.banner_url,
    rating: item.rating,
    type: 'movie',
  }));

  return (
    <div style={{ padding: '24px' }}>
      <h1>Danh sách của tôi</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mappedItems.length === 0 && !error && (
        <p>Chưa có phim nào trong danh sách. Vào trang phim và bấm &quot;Thêm vào danh sách của tôi&quot;.</p>
      )}
      {mappedItems.length > 0 && (
        <HomeMovieRow title="Danh sách của tôi" items={mappedItems} onOpenInfo={setModalItem} />
      )}
      <HeroBanner
        modalOnly
        externalModalItem={modalItem}
        onCloseModal={() => setModalItem(null)}
      />
    </div>
  );
}

export default MyListPage;
