import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, API_BASE, getToken } from '../apis/client';

function AdminEditMoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    short_intro: '',
    description: '',
    release_year: '',
    duration_minutes: '',
    thumbnail_url: '',
    banner_url: '',
    trailer_url: '',
    video_url: '',
    rating: '',
    age_rating: '',
    country_code: '',
    is_featured: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [cast, setCast] = useState([]);
  const [persons, setPersons] = useState([]);
  const [addActorIds, setAddActorIds] = useState([]);
  const [addDirectorIds, setAddDirectorIds] = useState([]);
  const [addingActors, setAddingActors] = useState(false);
  const [addingDirectors, setAddingDirectors] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [movieRes, castRes, countriesRes, personsRes] = await Promise.all([
          fetch(`${API_BASE}/api/movies/${id}`),
          fetch(`${API_BASE}/api/movies/${id}/cast`),
          fetch(`${API_BASE}/api/countries`),
          fetch(`${API_BASE}/api/persons`),
        ]);
        if (!movieRes.ok) throw new Error('Không tải được thông tin phim');
        const data = await movieRes.json();
        setForm({
          title: data.title || '',
          short_intro: data.short_intro || '',
          description: data.description || '',
          release_year: data.release_year || '',
          duration_minutes: data.duration_minutes || '',
          thumbnail_url: data.thumbnail_url || '',
          banner_url: data.banner_url || '',
          trailer_url: data.trailer_url || '',
          video_url: data.video_url || '',
          rating: data.rating || '',
          age_rating: data.age_rating || '',
          country_code: data.country_code || '',
          is_featured: !!data.is_featured,
        });
        const castData = castRes.ok ? await castRes.json() : [];
        setCast(Array.isArray(castData) ? castData : []);
        const countriesData = countriesRes.ok ? await countriesRes.json() : [];
        setCountries(Array.isArray(countriesData) ? countriesData : []);
        const personsData = personsRes.ok ? await personsRes.json() : [];
        setPersons(Array.isArray(personsData) ? personsData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleAddActors() {
    if (!addActorIds.length) return;
    setError('');
    setAddingActors(true);
    const token = getToken();
    for (const personId of addActorIds) {
      try {
        const res = await fetch(`${API_BASE}/api/movies/${id}/cast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ person_id: Number(personId), role: 'actor' }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || 'Thêm diễn viên thất bại');
        }
        const p = persons.find((x) => x.id === Number(personId));
        setCast((prev) => [...prev, { id: p?.id, name: p?.name, avatar_url: p?.avatar_url, role: 'actor' }]);
      } catch (err) {
        setError(err.message);
        break;
      }
    }
    setAddActorIds([]);
    setAddingActors(false);
  }

  async function handleAddDirectors() {
    if (!addDirectorIds.length) return;
    setError('');
    setAddingDirectors(true);
    const token = getToken();
    for (const personId of addDirectorIds) {
      try {
        const res = await fetch(`${API_BASE}/api/movies/${id}/cast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ person_id: Number(personId), role: 'director' }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || 'Thêm đạo diễn thất bại');
        }
        const p = persons.find((x) => x.id === Number(personId));
        setCast((prev) => [...prev, { id: p?.id, name: p?.name, avatar_url: p?.avatar_url, role: 'director' }]);
      } catch (err) {
        setError(err.message);
        break;
      }
    }
    setAddDirectorIds([]);
    setAddingDirectors(false);
  }

  async function handleRemoveCast(personId) {
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/movies/${id}/cast/${personId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Xoá cast thất bại');
      setCast((prev) => prev.filter((c) => c.id !== personId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadVideoToServer(file, fieldToSet) {
    setError('');
    setMessage('Đang upload video...');
    const formData = new FormData();
    formData.append('video', file);
    const res = await fetch(`${API_BASE}/api/upload/video`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Upload video thất bại');
    }
    const data = await res.json();
    setForm((prev) => ({ ...prev, [fieldToSet]: data.video_url }));
    setMessage('Upload video thành công.');
  }

  async function handleVideoFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadVideoToServer(file, 'video_url');
    } catch (err) {
      setError(err.message);
    }
    e.target.value = '';
  }

  async function handleTrailerFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadVideoToServer(file, 'trailer_url');
    } catch (err) {
      setError(err.message);
    }
    e.target.value = '';
  }

  async function handleThumbnailFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setMessage('Đang upload ảnh bìa...');
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
      setForm((prev) => ({ ...prev, thumbnail_url: data.image_url }));
      setMessage('Upload ảnh bìa thành công.');
    } catch (err) {
      setError(err.message);
    }
    e.target.value = '';
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleBannerFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setMessage('Đang upload ảnh banner...');
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
      setForm((prev) => ({ ...prev, banner_url: data.image_url }));
      setMessage('Upload ảnh banner thành công. Đường dẫn đã được gán vào Banner URL.');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Cần đăng nhập với tài khoản admin');
      }
      await api(
        'PUT',
        `/api/movies/${id}`,
        {
          ...form,
          release_year: form.release_year ? Number(form.release_year) : null,
          duration_minutes: form.duration_minutes
            ? Number(form.duration_minutes)
            : null,
          rating: form.rating ? Number(form.rating) : null,
        },
        { auth: true },
      );
      setMessage('Đã cập nhật phim.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: '24px' }}>Đang tải thông tin phim...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Chỉnh sửa phim #{id}</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <label>
          Tiêu đề *
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Giới thiệu ngắn (hiện trên banner)
          <input
            type="text"
            name="short_intro"
            maxLength={255}
            value={form.short_intro}
            onChange={handleChange}
          />
        </label>
        <label>
          Mô tả
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </label>
        <label>
          Năm phát hành
          <input
            type="number"
            name="release_year"
            value={form.release_year}
            onChange={handleChange}
          />
        </label>
        <label>
          Thời lượng (phút)
          <input
            type="number"
            name="duration_minutes"
            value={form.duration_minutes}
            onChange={handleChange}
          />
        </label>
        <label>
          Ảnh bìa (chọn file từ máy)
          <input type="file" accept="image/*" onChange={handleThumbnailFileChange} />
        </label>
        <label>
          Thumbnail URL
          <input
            type="text"
            name="thumbnail_url"
            value={form.thumbnail_url}
            onChange={handleChange}
          />
        </label>
        <label>
          Banner ngang URL (ảnh dùng cho banner Home)
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerFileChange}
          />
        </label>
        <label>
          Đường dẫn Banner ngang
          <input
            type="text"
            name="banner_url"
            value={form.banner_url}
            onChange={handleChange}
          />
        </label>
        <fieldset style={{ border: '1px solid #444', padding: '12px', marginBottom: '8px' }}>
          <legend>Trailer</legend>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Chọn file từ máy — upload lên server, gán vào Trailer URL
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handleTrailerFileChange}
            />
          </label>
          <label>
            Trailer URL
            <input
              type="text"
              name="trailer_url"
              value={form.trailer_url}
              onChange={handleChange}
            />
          </label>
        </fieldset>
        <fieldset style={{ border: '1px solid #444', padding: '12px', marginBottom: '8px' }}>
          <legend>Video chính</legend>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Chọn file video — gán vào Video URL
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
            />
          </label>
          <label>
            Video URL
            <input
              type="text"
              name="video_url"
              value={form.video_url}
              onChange={handleChange}
            />
          </label>
        </fieldset>
        <label>
          Rating (VD: 8.5)
          <input
            type="number"
            step="0.1"
            name="rating"
            value={form.rating}
            onChange={handleChange}
          />
        </label>
        <label>
          Age rating (VD: 13+)
          <input
            type="text"
            name="age_rating"
            value={form.age_rating}
            onChange={handleChange}
          />
        </label>
        <label>
          Quốc gia sản xuất
          <select name="country_code" value={form.country_code} onChange={handleChange} style={{ padding: '8px', width: '100%' }}>
            <option value="">-- Chọn quốc gia --</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>
        <fieldset style={{ border: '1px solid #444', padding: '12px', marginBottom: '8px' }}>
          <legend>Diễn viên &amp; Đạo diễn</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>Diễn viên</h4>
              <div style={{ marginBottom: '10px' }}>
                {cast.filter((c) => c.role === 'actor').map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {c.avatar_url && (
                      <img src={c.avatar_url.startsWith('http') ? c.avatar_url : `${API_BASE}${c.avatar_url}`} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <span style={{ fontSize: '13px' }}>{c.name}</span>
                    <button type="button" onClick={() => handleRemoveCast(c.id)} style={{ marginLeft: 'auto', color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Xoá</button>
                  </div>
                ))}
                {cast.filter((c) => c.role === 'actor').length === 0 && <span style={{ color: '#888', fontSize: '13px' }}>Chưa có</span>}
              </div>
              <select
                multiple
                value={addActorIds.map(String)}
                onChange={(e) => setAddActorIds(Array.from(e.target.selectedOptions, (o) => Number(o.value)))}
                style={{ padding: '6px', width: '100%', minHeight: '72px', marginBottom: '6px' }}
                title="Giữ Ctrl/Cmd để chọn nhiều"
              >
                {persons
                  .filter((p) => p.person_type !== 'director' && !cast.some((c) => c.id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
              <button type="button" onClick={handleAddActors} disabled={!addActorIds.length || addingActors} style={{ padding: '6px 12px' }}>
                {addingActors ? 'Đang thêm...' : 'Thêm diễn viên'}
              </button>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>Đạo diễn</h4>
              <div style={{ marginBottom: '10px' }}>
                {cast.filter((c) => c.role === 'director').map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {c.avatar_url && (
                      <img src={c.avatar_url.startsWith('http') ? c.avatar_url : `${API_BASE}${c.avatar_url}`} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <span style={{ fontSize: '13px' }}>{c.name}</span>
                    <button type="button" onClick={() => handleRemoveCast(c.id)} style={{ marginLeft: 'auto', color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Xoá</button>
                  </div>
                ))}
                {cast.filter((c) => c.role === 'director').length === 0 && <span style={{ color: '#888', fontSize: '13px' }}>Chưa có</span>}
              </div>
              <select
                multiple
                value={addDirectorIds.map(String)}
                onChange={(e) => setAddDirectorIds(Array.from(e.target.selectedOptions, (o) => Number(o.value)))}
                style={{ padding: '6px', width: '100%', minHeight: '72px', marginBottom: '6px' }}
                title="Giữ Ctrl/Cmd để chọn nhiều"
              >
                {persons
                  .filter((p) => p.person_type === 'director' && !cast.some((c) => c.id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
              <button type="button" onClick={handleAddDirectors} disabled={!addDirectorIds.length || addingDirectors} style={{ padding: '6px 12px' }}>
                {addingDirectors ? 'Đang thêm...' : 'Thêm đạo diễn'}
              </button>
            </div>
          </div>
        </fieldset>
        <label>
          <input
            type="checkbox"
            name="is_featured"
            checked={form.is_featured}
            onChange={handleChange}
          />
          {' '}
          Featured (hiển thị nổi bật)
        </label>

        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button type="submit">Lưu thay đổi</button>
          <button
            type="button"
            onClick={() => navigate('/admin/movies')}
          >
            Quay lại danh sách
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminEditMoviePage;

