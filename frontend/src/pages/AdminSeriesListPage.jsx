import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE, getToken } from '../apis/client';
import '../styles/pages/admin-common.css';

function AdminSeriesListPage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const seriesRes = await fetch(`${API_BASE}/api/series`);
        if (!seriesRes.ok) throw new Error('Không tải được danh sách series');
        const data = await seriesRes.json();
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

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>Quản lý phim bộ (Series)</h1>
        <Link to="/admin/series/new" className="admin-btn-link">
          + Trang tạo series mới (đầy đủ)
        </Link>
      </div>

      {loading && <p style={{ marginTop: '16px' }}>Đang tải danh sách series...</p>}
      {!loading && error && <p className="admin-msg-error">{error}</p>}

      {!loading && !error && series.length === 0 && <p>Chưa có series nào.</p>}

      {!loading && series.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh bìa</th>
              <th>Tiêu đề</th>
              <th>Năm</th>
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
                <td>
                  <div style={{ fontWeight: 500 }}>{s.title}</div>
                  {s.description && (
                    <div className="admin-td-muted">
                      {s.description.length > 80 ? `${s.description.slice(0, 80)}…` : s.description}
                    </div>
                  )}
                </td>
                <td>{s.release_year || '-'}</td>
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
