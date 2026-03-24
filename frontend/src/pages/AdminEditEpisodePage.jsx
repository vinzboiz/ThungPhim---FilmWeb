import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE, getToken, normalizeUploadError } from '../apis/client';

function AdminEditEpisodePage() {
  const { id: seriesId, episodeId } = useParams();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    season_id: '',
    episode_number: '',
    title: '',
    description: '',
    duration_minutes: '',
    thumbnail_url: '',
    video_url: '',
  });
  const [seasons, setSeasons] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideoOverlay, setUploadingVideoOverlay] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [epRes, seriesRes] = await Promise.all([
          fetch(`${API_BASE}/api/series/${seriesId}/episodes`).then((r) => (r.ok ? r.json() : [])),
          fetch(`${API_BASE}/api/series/${seriesId}`).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (!cancelled && Array.isArray(epRes)) {
          const ep = epRes.find((e) => String(e.id) === String(episodeId));
          if (ep) {
            setEpisode(ep);
            setForm({
              season_id: ep.season_id != null ? String(ep.season_id) : '',
              episode_number: ep.episode_number != null ? String(ep.episode_number) : '',
              title: ep.title || '',
              description: ep.description || '',
              duration_minutes: ep.duration_minutes != null ? String(ep.duration_minutes) : '',
              thumbnail_url: ep.thumbnail_url || '',
              video_url: ep.video_url || '',
            });
          } else {
            setError('Không tìm thấy tập');
          }
        }
        if (!cancelled && seriesRes && Array.isArray(seriesRes.seasons)) {
          setSeasons(seriesRes.seasons);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, [seriesId, episodeId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/series/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          season_id: form.season_id ? Number(form.season_id) : null,
          episode_number: form.episode_number ? Number(form.episode_number) : null,
          title: form.title,
          description: form.description || null,
          duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
          thumbnail_url: form.thumbnail_url || null,
          video_url: form.video_url || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Cập nhật thất bại');
      }
      setMessage('Đã lưu tập.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadFile(file, field, type) {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append(type === 'video' ? 'video' : 'image', file);
      if (type === 'video') {
        setUploadingVideoOverlay(true);
      }
      const res = await fetch(`${API_BASE}/api/upload/${type === 'video' ? 'video' : 'image'}`, {
        method: 'POST',
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload thất bại');
      const url = type === 'video' ? data.video_url : data.image_url;
      setForm((prev) => ({ ...prev, [field]: url }));
    } catch (err) {
      setError(normalizeUploadError(err));
    } finally {
      setUploading(false);
      if (type === 'video') {
        setTimeout(() => {
          setUploadingVideoOverlay(false);
        }, 3000);
      }
    }
  }

  if (loading) return <div style={{ padding: '24px', color: '#fff' }}>Đang tải...</div>;
  if (error && !episode) return <div style={{ padding: '24px', color: '#f44' }}>{error}</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', color: '#fff', position: 'relative' }}>
      {uploadingVideoOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#181818',
              padding: '16px 24px',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
            }}
          >
            Đang upload video tập, vui lòng đợi trong giây lát...
          </div>
        </div>
      )}
      <div style={{ marginBottom: '16px' }}>
        <Link to={`/admin/series/${seriesId}`} style={{ color: '#e50914' }}>← Quay lại series</Link>
      </div>
      <h1>Sửa tập #{episodeId}</h1>
      {message && <p style={{ color: '#0f0' }}>{message}</p>}
      {error && <p style={{ color: '#f44' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label>
          Season
          <select name="season_id" value={form.season_id} onChange={handleChange} style={{ display: 'block', marginTop: '4px', padding: '8px' }}>
            <option value="">(Không chọn)</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>Season {s.season_number} {s.title ? `- ${s.title}` : ''}</option>
            ))}
          </select>
        </label>
        <label>
          Số tập
          <input type="number" name="episode_number" value={form.episode_number} onChange={handleChange} style={{ padding: '8px', width: '80px' }} />
        </label>
        <label>
          Tiêu đề *
          <input type="text" name="title" value={form.title} onChange={handleChange} required style={{ display: 'block', width: '100%', padding: '8px' }} />
        </label>
        <label>
          Mô tả
          <textarea name="description" value={form.description} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '8px', minHeight: 60 }} />
        </label>
        <label>
          Thời lượng (phút)
          <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} min="1" max="300" style={{ padding: '8px', width: '80px' }} />
        </label>
        <label>
          Ảnh bìa (URL)
          <input type="text" name="thumbnail_url" value={form.thumbnail_url} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '8px' }} />
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'thumbnail_url', 'image')} disabled={uploading} style={{ marginTop: '4px' }} />
        </label>
        <label>
          Video URL
          <input type="text" name="video_url" value={form.video_url} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '8px' }} />
          <input type="file" accept="video/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'video_url', 'video')} disabled={uploading} style={{ marginTop: '4px' }} />
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" style={{ padding: '8px 16px' }}>Lưu</button>
          <button type="button" onClick={() => navigate(`/admin/series/${seriesId}`)} style={{ padding: '8px 16px' }}>Hủy</button>
        </div>
      </form>
    </div>
  );
}

export default AdminEditEpisodePage;
