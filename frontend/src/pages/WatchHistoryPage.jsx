import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getToken, getProfileId } from '../apis/client';
import '../styles/pages/watch-history.css';

function WatchHistoryPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
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
    fetch(`${API_BASE}/api/watch/history?profile_id=${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [token, profileId, navigate]);

  if (!token || !profileId) return null;
  if (loading) return <div className="watch-history__loading">Đang tải...</div>;

  const openPopup = (item) => (e) => {
    e.preventDefault();
    const isEpisode = item.type === 'episode' && item.series_id;
    const path = isEpisode ? `/watch/episode/${item.content_id}` : `/movies/${item.content_id}`;
    setPopup({ item, path });
  };

  const handleContinue = () => {
    if (popup) {
      navigate(popup.path);
      setPopup(null);
    }
  };

  const handleFromStart = () => {
    if (popup) {
      navigate(popup.path, { state: { fromStart: true } });
      setPopup(null);
    }
  };

  return (
    <div className="watch-history">
      <h1>Lịch sử xem</h1>
      <p className="watch-history__intro">Theo profile hiện tại. Bấm vào phim/tập để chọn xem tiếp hay xem từ đầu.</p>
      {list.length === 0 && <p>Chưa có lịch sử xem.</p>}
      <div className="watch-history__grid">
        {list.map((item) => {
          const isEpisode = item.type === 'episode' && item.series_id;
          return (
            <div key={`${item.type}-${item.content_id}-${item.id}`} className="watch-history__card">
              {item.thumbnail_url && (
                <img src={`${API_BASE}${item.thumbnail_url}`} alt={item.title} className="watch-history__thumb" />
              )}
              <div className="watch-history__title">{item.title}</div>
              <div className="watch-history__meta">
                {item.type === 'episode' ? 'Tập phim' : 'Phim'} · {item.progress_seconds ? `Đã xem ${Math.floor(item.progress_seconds)} giây` : ''}
              </div>
              <button
                type="button"
                onClick={openPopup(item)}
                className="watch-history__action"
              >
                {isEpisode ? 'Xem tiếp' : 'Xem'}
              </button>
            </div>
          );
        })}
      </div>

      {popup && (
        <div
          className="watch-history__overlay"
          onClick={() => setPopup(null)}
          role="presentation"
        >
          <div
            className="watch-history__dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="popup-title"
          >
            <h2 id="popup-title" className="watch-history__dialog-title">Bạn muốn xem tiếp hay xem từ đầu?</h2>
            <p className="watch-history__dialog-text">{popup.item?.title}</p>
            <div className="watch-history__dialog-actions">
              <button type="button" onClick={handleFromStart} className="watch-history__btn">
                Xem từ đầu
              </button>
              <button type="button" onClick={handleContinue} className="watch-history__btn watch-history__btn--primary">
                Xem tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchHistoryPage;
