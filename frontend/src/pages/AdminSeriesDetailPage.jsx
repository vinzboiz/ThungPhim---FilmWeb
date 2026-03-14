import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE, getToken } from '../apis/client';

function AdminSeriesDetailPage() {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [seasonNumber, setSeasonNumber] = useState('');
  const [seasonTitle, setSeasonTitle] = useState('');
  const [seasonDesc, setSeasonDesc] = useState('');

  const [epForm, setEpForm] = useState({
    season_id: '',
    episode_number: '',
    title: '',
    description: '',
    duration_minutes: '',
    video_url: '',
    thumbnail_url: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sRes, epsRes] = await Promise.all([
          fetch(`${API_BASE}/api/series/${id}`),
          fetch(`${API_BASE}/api/series/${id}/episodes`),
        ]);
        if (!sRes.ok) throw new Error('Không tải được series');
        const seriesData = await sRes.json();
        const epsData = epsRes.ok ? await epsRes.json() : [];
        if (!cancelled) {
          setSeries(seriesData);
          setSeasons(Array.isArray(seriesData.seasons) ? seriesData.seasons : []);
          setEpisodes(Array.isArray(epsData) ? epsData : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function reloadEpisodes(seasonId) {
    try {
      const url = seasonId
        ? `${API_BASE}/api/series/${id}/episodes?season_id=${seasonId}`
        : `${API_BASE}/api/series/${id}/episodes`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không tải được danh sách tập');
      const data = await res.json();
      setEpisodes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateSeason(e) {
    e.preventDefault();
    setError('');
    const token = getToken();
    if (!token) {
      setError('Cần đăng nhập admin để tạo season');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/series/${id}/seasons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          season_number: Number(seasonNumber),
          title: seasonTitle || null,
          description: seasonDesc || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Tạo season thất bại');
      setSeasons((prev) => [...prev, data]);
      setSeasonNumber('');
      setSeasonTitle('');
      setSeasonDesc('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateEpisode(e) {
    e.preventDefault();
    setError('');
    const token = getToken();
    if (!token) {
      setError('Cần đăng nhập admin để tạo episode');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/series/episodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          series_id: Number(id),
          season_id: epForm.season_id ? Number(epForm.season_id) : null,
          episode_number: epForm.episode_number ? Number(epForm.episode_number) : null,
          title: epForm.title,
          description: epForm.description || null,
          duration_minutes: epForm.duration_minutes ? Number(epForm.duration_minutes) : null,
          thumbnail_url: epForm.thumbnail_url || null,
          video_url: epForm.video_url || null,
          release_date: null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Tạo tập thất bại');
      setEpForm({
        season_id: '',
        episode_number: '',
        title: '',
        description: '',
        duration_minutes: '',
        video_url: '',
        thumbnail_url: '',
      });
      reloadEpisodes(selectedSeasonId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUploadEpisodeVideo(episodeId, file) {
    if (!file) return;
    const token = getToken();
    if (!token) {
      alert('Cần đăng nhập admin để upload video tập');
      return;
    }
    const formData = new FormData();
    formData.append('video', file);
    try {
      const res = await fetch(`${API_BASE}/api/upload/episode-video/${episodeId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload video tập thất bại');
      reloadEpisodes(selectedSeasonId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUploadEpisodeThumbnail(episodeId, file) {
    if (!file) return;
    const token = getToken();
    if (!token) {
      alert('Cần đăng nhập admin để upload ảnh bìa tập');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload ảnh tập thất bại');

      const thumbUrl = data.image_url;
      await fetch(`${API_BASE}/api/series/episodes/${episodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ thumbnail_url: thumbUrl }),
      });

      reloadEpisodes(selectedSeasonId);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div style={{ padding: '24px' }}>Đang tải series...</div>;
  if (error || !series) return <div style={{ padding: '24px', color: 'red' }}>{error || 'Không tìm thấy series'}</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Quản lý series: {series.title}</h1>
        <Link to={`/admin/series/${id}/edit`} style={{ padding: '8px 16px', background: '#e50914', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 500 }}>Sửa series (thông tin + cast)</Link>
      </div>
      <p style={{ color: '#ccc', maxWidth: '800px' }}>{series.description}</p>

      <section style={{ marginTop: '24px', marginBottom: '24px' }}>
        <h2>Seasons</h2>
        <form onSubmit={handleCreateSeason} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="number"
            placeholder="Season number"
            value={seasonNumber}
            onChange={(e) => setSeasonNumber(e.target.value)}
            style={{ width: '120px', padding: '4px 8px' }}
          />
          <input
            type="text"
            placeholder="Tiêu đề (tuỳ chọn)"
            value={seasonTitle}
            onChange={(e) => setSeasonTitle(e.target.value)}
            style={{ flex: 1, padding: '4px 8px' }}
          />
          <input
            type="text"
            placeholder="Mô tả (tuỳ chọn)"
            value={seasonDesc}
            onChange={(e) => setSeasonDesc(e.target.value)}
            style={{ flex: 2, padding: '4px 8px' }}
          />
          <button type="submit" disabled={!seasonNumber} style={{ padding: '4px 12px' }}>
            Thêm season
          </button>
        </form>

        {seasons.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <strong>Chọn season để lọc tập: </strong>
            <select
              value={selectedSeasonId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSeasonId(val);
                reloadEpisodes(val);
              }}
              style={{ marginLeft: '8px', padding: '4px 8px' }}
            >
              <option value="">Tất cả</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  Season {s.season_number} {s.title ? `- ${s.title}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2>Thêm tập mới</h2>
        <form onSubmit={handleCreateEpisode} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
          <label>
            Season
            <select
              value={epForm.season_id}
              onChange={(e) => setEpForm((prev) => ({ ...prev, season_id: e.target.value }))}
              style={{ marginLeft: '8px', padding: '4px 8px' }}
            >
              <option value="">(Không season)</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  Season {s.season_number}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số tập
            <input
              type="number"
              value={epForm.episode_number}
              onChange={(e) => setEpForm((prev) => ({ ...prev, episode_number: e.target.value }))}
            />
          </label>
          <label>
            Tiêu đề *
            <input
              type="text"
              value={epForm.title}
              onChange={(e) => setEpForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>
          <label>
            Mô tả
            <textarea
              value={epForm.description}
              onChange={(e) => setEpForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <label>
            Thời lượng (phút)
            <input
              type="number"
              value={epForm.duration_minutes}
              onChange={(e) => setEpForm((prev) => ({ ...prev, duration_minutes: e.target.value }))}
            />
          </label>
          <label>
            Ảnh bìa (URL hoặc upload phía dưới)
            <input
              type="text"
              value={epForm.thumbnail_url}
              onChange={(e) => setEpForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
            />
          </label>
          <label>
            Video URL (sau khi upload hoặc dán link)
            <input
              type="text"
              value={epForm.video_url}
              onChange={(e) => setEpForm((prev) => ({ ...prev, video_url: e.target.value }))}
              placeholder="/uploads/videos/..."
            />
          </label>
          <label>
            <strong>Chọn file video</strong> — upload lên server, gán vào Video URL
            <input
              type="file"
              accept="video/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const token = getToken();
                if (!token) {
                  alert('Cần đăng nhập admin để upload video');
                  return;
                }
                const formData = new FormData();
                formData.append('video', file);
                try {
                  const res = await fetch(`${API_BASE}/api/upload/video`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data.message || 'Upload video thất bại');
                  setEpForm((prev) => ({ ...prev, video_url: data.video_url }));
                } catch (err) {
                  alert(err.message);
                }
                e.target.value = '';
              }}
              style={{ display: 'block', marginTop: '4px' }}
            />
          </label>
          <label>
            Chọn file ảnh bìa
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const token = getToken();
                if (!token) {
                  alert('Cần đăng nhập admin để upload ảnh bìa');
                  return;
                }
                const formData = new FormData();
                formData.append('image', file);
                try {
                  const res = await fetch(`${API_BASE}/api/upload/image`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data.message || 'Upload ảnh bìa thất bại');
                  setEpForm((prev) => ({ ...prev, thumbnail_url: data.image_url }));
                } catch (err) {
                  alert(err.message);
                }
              }}
            />
          </label>
          <button type="submit" style={{ marginTop: '8px' }}>
            Thêm tập
          </button>
        </form>
      </section>

      <section>
        <h2>Danh sách tập</h2>
        {episodes.length === 0 && <p>Chưa có tập nào.</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>ID</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Season</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Số tập</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Tiêu đề</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Ảnh bìa</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Video</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Upload video</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Upload ảnh</th>
            </tr>
          </thead>
          <tbody>
            {episodes.map((ep) => (
              <tr key={ep.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{ep.id}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{ep.season_id || '-'}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{ep.episode_number || '-'}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{ep.title}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {ep.thumbnail_url ? (
                    <img
                      src={`${API_BASE}${ep.thumbnail_url}`}
                      alt={ep.title}
                      style={{ width: '70px', height: 'auto', borderRadius: '4px' }}
                    />
                  ) : (
                    <span style={{ color: '#999' }}>Chưa có</span>
                  )}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {ep.video_url ? <span style={{ fontSize: '12px' }}>{ep.video_url}</span> : <span style={{ color: '#999' }}>Chưa có</span>}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleUploadEpisodeVideo(ep.id, e.target.files[0])}
                  />
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadEpisodeThumbnail(ep.id, e.target.files[0])}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminSeriesDetailPage;

