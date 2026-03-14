import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE, getToken } from '../apis/client';

function AdminSeriesListPage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAgeRating, setNewAgeRating] = useState('');
  const [newFeatured, setNewFeatured] = useState(false);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/series`);
        if (!res.ok) throw new Error('Không tải được danh sách series');
        const data = await res.json();
        setSeries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Xoá series này và tất cả tập liên quan?')) return;
    const token = getToken();
    if (!token) {
      alert('Cần đăng nhập admin để xoá series');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/series/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Xoá series thất bại');
      setSeries((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleThumbnailFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploadingThumb(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Upload ảnh thất bại');
      }
      const data = await res.json();
      setNewThumbnailUrl(data.image_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingThumb(false);
    }
  }

  async function handleBannerFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploadingThumb(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Upload ảnh banner thất bại');
      }
      const data = await res.json();
      setNewBannerUrl(data.image_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingThumb(false);
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Quản lý phim bộ (Series – Admin)</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          const token = getToken();
          if (!token) {
            setError('Cần đăng nhập admin để tạo series');
            return;
          }
          try {
            const res = await fetch(`${API_BASE}/api/series`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: newTitle,
                description: newDescription || null,
                thumbnail_url: newThumbnailUrl || null,
                banner_url: newBannerUrl || null,
                age_rating: newAgeRating || null,
                is_featured: newFeatured,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Tạo series thất bại');
            setSeries((prev) => [...prev, data]);
            setNewTitle('');
            setNewDescription('');
            setNewThumbnailUrl('');
            setNewBannerUrl('');
            setNewAgeRating('');
            setNewFeatured(false);
          } catch (err) {
            setError(err.message);
          }
        }}
        style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <input
          type="text"
          placeholder="Tên series..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ padding: '6px 8px', minWidth: '200px' }}
          required
        />
        <input
          type="text"
          placeholder="Ảnh bìa (thumbnail URL)"
          value={newThumbnailUrl}
          onChange={(e) => setNewThumbnailUrl(e.target.value)}
          style={{ padding: '6px 8px', minWidth: '220px' }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleThumbnailFileChange}
        />
        <input
          type="text"
          placeholder="Banner ngang URL (dùng cho banner Home)"
          value={newBannerUrl}
          onChange={(e) => setNewBannerUrl(e.target.value)}
          style={{ padding: '6px 8px', minWidth: '220px' }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleBannerFileChange}
        />
        <input
          type="text"
          placeholder="Mô tả ngắn"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          style={{ padding: '6px 8px', minWidth: '220px' }}
        />
        <input
          type="text"
          placeholder="Age rating (vd: 13+)"
          value={newAgeRating}
          onChange={(e) => setNewAgeRating(e.target.value)}
          style={{ padding: '6px 8px', width: '120px' }}
        />
        <label style={{ fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={newFeatured}
            onChange={(e) => setNewFeatured(e.target.checked)}
            style={{ marginRight: '4px' }}
          />
          Featured
        </label>
        <button type="submit" style={{ padding: '6px 12px', cursor: 'pointer' }}>
          + Thêm series mới
        </button>
        {uploadingThumb && <span style={{ fontSize: '12px' }}>Đang upload ảnh bìa...</span>}
      </form>

      {loading && <p>Đang tải danh sách series...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && series.length === 0 && <p>Chưa có series nào.</p>}

      {!loading && series.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>ID</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Ảnh bìa</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Tiêu đề</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Age</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Featured</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.id}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {s.thumbnail_url ? (
                    <img
                      src={`${API_BASE}${s.thumbnail_url}`}
                      alt={s.title}
                      style={{ width: '70px', height: 'auto', borderRadius: '4px' }}
                    />
                  ) : (
                    <span style={{ color: '#888' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.title}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.age_rating || '-'}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.is_featured ? '✓' : ''}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <Link to={`/series/${s.id}`} style={{ marginRight: '8px' }}>Xem</Link>
                  <button type="button" onClick={() => navigate(`/admin/series/${s.id}/edit`)} style={{ marginRight: '8px', cursor: 'pointer' }}>Sửa</button>
                  <button type="button" onClick={() => navigate(`/admin/series/${s.id}`)} style={{ marginRight: '8px', cursor: 'pointer' }}>Quản lý tập</button>
                  <button type="button" onClick={() => handleDelete(s.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminSeriesListPage;

