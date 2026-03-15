import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE, getToken } from '../apis/client';
import '../styles/pages/admin-common.css';

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
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newGenreIds, setNewGenreIds] = useState([]);
  const [countries, setCountries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [seriesRes, countriesRes, genresRes] = await Promise.all([
          fetch(`${API_BASE}/api/series`),
          fetch(`${API_BASE}/api/countries`),
          fetch(`${API_BASE}/api/genres`),
        ]);
        if (!seriesRes.ok) throw new Error('Không tải được danh sách series');
        const data = await seriesRes.json();
        setSeries(Array.isArray(data) ? data : []);
        const cData = countriesRes.ok ? await countriesRes.json() : [];
        setCountries(Array.isArray(cData) ? cData : []);
        const gData = genresRes.ok ? await genresRes.json() : [];
        setGenres(Array.isArray(gData) ? gData : []);
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
    <div className="admin-page">
      <h1>Quản lý phim bộ (Series – Admin)</h1>
      <form
        className="admin-form-row"
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
                country_code: newCountryCode || null,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Tạo series thất bại');
            if (data.id && newGenreIds.length > 0) {
              const genRes = await fetch(`${API_BASE}/api/series/${data.id}/genres`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ genre_ids: newGenreIds }),
              });
              if (!genRes.ok) {
                const gErr = await genRes.json().catch(() => ({}));
                throw new Error(gErr.message || 'Gán thể loại thất bại');
              }
            }
            setSeries((prev) => [...prev, data]);
            setNewTitle('');
            setNewDescription('');
            setNewThumbnailUrl('');
            setNewBannerUrl('');
            setNewAgeRating('');
            setNewCountryCode('');
            setNewGenreIds([]);
            setNewFeatured(false);
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <input
          type="text"
          placeholder="Tên series..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="admin-input"
          required
        />
        <input
          type="text"
          placeholder="Ảnh bìa (thumbnail URL)"
          value={newThumbnailUrl}
          onChange={(e) => setNewThumbnailUrl(e.target.value)}
          className="admin-input admin-input--wide"
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
          className="admin-input admin-input--wide"
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
          className="admin-input admin-input--wide"
        />
        <input
          type="text"
          placeholder="Age rating (vd: 13+)"
          value={newAgeRating}
          onChange={(e) => setNewAgeRating(e.target.value)}
          className="admin-input admin-input--short"
        />
        <label className="admin-form-label" style={{ display: 'block', marginTop: '8px' }}>
          Quốc gia sản xuất
          <select
            value={newCountryCode}
            onChange={(e) => setNewCountryCode(e.target.value)}
            className="admin-input"
            style={{ display: 'block', marginTop: '4px', padding: '8px', minWidth: '200px' }}
          >
            <option value="">-- Chọn quốc gia --</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="admin-form-label" style={{ display: 'block', marginTop: '8px' }}>
          Thể loại
          <select
            multiple
            value={newGenreIds.map(String)}
            onChange={(e) => setNewGenreIds(Array.from(e.target.selectedOptions, (o) => Number(o.value)))}
            className="admin-input"
            style={{ display: 'block', marginTop: '4px', padding: '8px', minWidth: '200px', minHeight: '80px' }}
            title="Giữ Ctrl để chọn nhiều"
          >
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: '#888' }}>Giữ Ctrl (Cmd) để chọn nhiều thể loại</span>
        </label>
        <label className="admin-label-inline">
          <input
            type="checkbox"
            checked={newFeatured}
            onChange={(e) => setNewFeatured(e.target.checked)}
          />
          Featured
        </label>
        <button type="submit" className="admin-btn-submit">
          + Thêm series mới
        </button>
        {uploadingThumb && <span className="admin-upload-hint">Đang upload ảnh bìa...</span>}
      </form>

      {loading && <p>Đang tải danh sách series...</p>}
      {error && <p className="admin-msg-error">{error}</p>}

      {!loading && !error && series.length === 0 && <p>Chưa có series nào.</p>}

      {!loading && series.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh bìa</th>
              <th>Tiêu đề</th>
              <th>Age</th>
              <th>Featured</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>
                  {s.thumbnail_url ? (
                    <img
                      src={`${API_BASE}${s.thumbnail_url}`}
                      alt=""
                      className="admin-thumb"
                    />
                  ) : (
                    <span className="admin-td-muted">—</span>
                  )}
                </td>
                <td>{s.title}</td>
                <td>{s.age_rating || '-'}</td>
                <td>{s.is_featured ? '✓' : ''}</td>
                <td>
                  <Link to={`/series/${s.id}`} className="admin-btn-link">Xem</Link>
                  <button type="button" onClick={() => navigate(`/admin/series/${s.id}/edit`)} className="admin-btn-link">Sửa</button>
                  <button type="button" onClick={() => navigate(`/admin/series/${s.id}`)} className="admin-btn-link">Quản lý tập</button>
                  <button type="button" onClick={() => handleDelete(s.id)} className="admin-btn-danger">Xoá</button>
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

