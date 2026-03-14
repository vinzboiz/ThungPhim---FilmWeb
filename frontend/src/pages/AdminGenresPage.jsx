import { useEffect, useState } from 'react';
import { api, API_BASE, getToken } from '../apis/client';

function AdminGenresPage() {
  const [genres, setGenres] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/genres`);
        if (!res.ok) throw new Error('Không tải được danh sách thể loại');
        const data = await res.json();
        setGenres(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const token = getToken();
    if (!token) {
      setError('Cần đăng nhập admin để thao tác genres');
      return;
    }
    try {
      const payload = {
        name,
        description: description || null,
        thumbnail_url: thumbnailUrl || null,
      };

      if (editId) {
        const updated = await api('PUT', `/api/genres/${editId}`, payload);
        setGenres((prev) => prev.map((g) => (g.id === editId ? updated : g)));
      } else {
        const created = await api('POST', '/api/genres', payload);
        setGenres((prev) => [...prev, created]);
      }
      setName('');
      setDescription('');
      setThumbnailUrl('');
      setEditId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleThumbnailFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploading(true);
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
      setThumbnailUrl(data.image_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Xoá thể loại này?')) return;
    try {
      await api('DELETE', `/api/genres/${id}`);
      setGenres((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(genre) {
    setEditId(genre.id);
    setName(genre.name);
    setDescription(genre.description || '');
    setThumbnailUrl(genre.thumbnail_url || '');
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Quản lý thể loại (Admin)</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}
      >
        <input
          type="text"
          placeholder="Tên thể loại..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '8px' }}
        />
        <textarea
          placeholder="Mô tả (tuỳ chọn)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: '8px', minHeight: '60px' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailFileChange}
          />
          <input
            type="text"
            placeholder="Ảnh bìa (thumbnail URL)..."
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            style={{ padding: '8px' }}
          />
          {uploading && <span style={{ fontSize: '12px' }}>Đang upload ảnh...</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button type="submit" disabled={!name.trim()} style={{ padding: '8px 16px' }}>
            {editId ? 'Cập nhật' : 'Thêm mới'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setName('');
                setDescription('');
                setThumbnailUrl('');
              }}
              style={{ padding: '8px 12px' }}
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {loading && <p>Đang tải...</p>}
      {!loading && genres.length === 0 && <p>Chưa có thể loại nào.</p>}

      {!loading && genres.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>ID</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Tên</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Mô tả</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Ảnh bìa</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {genres.map((g) => (
              <tr key={g.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{g.id}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{g.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                  {g.description || <span style={{ color: '#888' }}>—</span>}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {g.thumbnail_url ? (
                    <img
                      src={`${API_BASE}${g.thumbnail_url}`}
                      alt={g.name}
                      style={{ width: '60px', height: 'auto', borderRadius: '4px' }}
                    />
                  ) : (
                    <span style={{ color: '#888' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminGenresPage;

