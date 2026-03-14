import { useEffect, useState } from 'react';
import { api, API_BASE, getToken } from '../apis/client';

function AdminAddMoviePage() {
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
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [gRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/api/genres`),
          fetch(`${API_BASE}/api/countries`),
        ]);
        if (gRes.ok) {
          const data = await gRes.json();
          setGenres(Array.isArray(data) ? data : []);
        }
        if (cRes.ok) {
          const data = await cRes.json();
          setCountries(Array.isArray(data) ? data : []);
        }
      } catch {
        // bỏ qua lỗi
      }
    }
    load();
  }, []);

  async function uploadVideoToServer(file, fieldToSet) {
    setError('');
    setMessage('Đang upload...');
    const formData = new FormData();
    formData.append('video', file);
    const res = await fetch(`${API_BASE}/api/upload/video`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Upload thất bại');
    }
    const data = await res.json();
    setForm((prev) => ({ ...prev, [fieldToSet]: data.video_url }));
    return data.video_url;
  }

  async function handleVideoFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadVideoToServer(file, 'video_url');
      setMessage('Upload video chính thành công. Đường dẫn đã gán vào Video URL.');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    e.target.value = '';
  }

  /** Trailer: file video/audio từ máy → lưu cùng thư mục uploads/videos, gán vào trailer_url */
  async function handleTrailerFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadVideoToServer(file, 'trailer_url');
      setMessage('Upload trailer thành công. Đường dẫn đã gán vào Trailer URL.');
    } catch (err) {
      console.error(err);
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
      setMessage('Upload ảnh thành công. Đường dẫn đã được gán vào Thumbnail URL.');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
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

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const created = await api('POST', '/api/movies', {
        ...form,
        release_year: form.release_year ? Number(form.release_year) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        rating: form.rating ? Number(form.rating) : null,
      }, { auth: false });

      const movieId = created.id || created.insertId;

      // nếu chọn genres và có token admin → set genres cho movie
      const token = getToken();
      if (movieId && token && selectedGenreIds.length > 0) {
        await api('POST', `/api/movies/${movieId}/genres`, { genre_ids: selectedGenreIds });
      }

      setMessage(`Đã thêm phim với ID ${movieId || ''}`);
      setForm({
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
      setSelectedGenreIds([]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Thêm phim mới (Admin đơn giản)</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <fieldset style={{ border: '1px solid #444', padding: '12px', marginBottom: '8px' }}>
          <legend>Ảnh bìa (poster)</legend>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <strong>Chọn file ảnh</strong> — upload lên server
            <input type="file" accept="image/*" onChange={handleThumbnailFileChange} style={{ display: 'block', marginTop: '4px' }} />
          </label>
          <label>
            Thumbnail URL (sau khi upload hoặc dán link)
            <input type="text" name="thumbnail_url" value={form.thumbnail_url} onChange={handleChange} placeholder="/uploads/images/..." style={{ display: 'block', width: '100%', padding: '6px', marginTop: '4px' }} />
          </label>
        </fieldset>
        <fieldset style={{ border: '1px solid #444', padding: '12px', marginBottom: '8px' }}>
          <legend>Banner ngang (ảnh nền trang chi tiết / Home)</legend>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <strong>Chọn file ảnh banner</strong>
            <input type="file" accept="image/*" onChange={handleBannerFileChange} style={{ display: 'block', marginTop: '4px' }} />
          </label>
          <label>
            Banner URL
            <input type="text" name="banner_url" value={form.banner_url} onChange={handleChange} placeholder="/uploads/images/..." style={{ display: 'block', width: '100%', padding: '6px', marginTop: '4px' }} />
          </label>
        </fieldset>
        <fieldset style={{ border: '1px solid #444', padding: '12px', marginBottom: '8px' }}>
          <legend>Trailer</legend>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Chọn file từ máy — upload lên server, gán vào Trailer URL
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handleTrailerFileChange}
            />
            <span style={{ display: 'block', fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Muốn phim xuất hiện ở banner trang chủ, bắt buộc phải upload file (MP4/MP3…) tại đây.
              Link YouTube chỉ dùng để xem ở trang chi tiết, KHÔNG dùng cho banner.
            </span>
          </label>
          <label>
            Trailer URL (YouTube hoặc đường dẫn đã upload)
            <input
              type="text"
              name="trailer_url"
              value={form.trailer_url}
              onChange={handleChange}
              placeholder="https://youtube.com/... hoặc /uploads/videos/..."
            />
          </label>
        </fieldset>
        <fieldset style={{ border: '1px solid #444', padding: '12px', marginBottom: '8px' }}>
          <legend>Video phim (video chính)</legend>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <strong>Chọn file video</strong> — upload lên server, gán vào Video URL
            <input type="file" accept="video/*" onChange={handleVideoFileChange} style={{ display: 'block', marginTop: '4px' }} />
          </label>
          <label>
            Video URL (sau khi upload hoặc dán link)
            <input type="text" name="video_url" value={form.video_url} onChange={handleChange} placeholder="/uploads/videos/..." style={{ display: 'block', width: '100%', padding: '6px', marginTop: '4px' }} />
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
          <select name="country_code" value={form.country_code} onChange={handleChange} style={{ display: 'block', padding: '8px', width: '100%' }}>
            <option value="">-- Chọn quốc gia --</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>
        {genres.length > 0 && (
          <fieldset style={{ border: '1px solid #444', padding: '8px' }}>
            <legend>Thể loại</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {genres.map((g) => (
                <label key={g.id} style={{ fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={selectedGenreIds.includes(g.id)}
                    onChange={(e) => {
                      setSelectedGenreIds((prev) =>
                        e.target.checked
                          ? [...prev, g.id]
                          : prev.filter((id) => id !== g.id)
                      );
                    }}
                  />{' '}
                  {g.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label>
          <input
            type="checkbox"
            name="is_featured"
            checked={form.is_featured}
            onChange={handleChange}
          />
          Featured (hiển thị nổi bật)
        </label>
        <button type="submit" style={{ marginTop: '12px' }}>
          Lưu phim
        </button>
      </form>
    </div>
  );
}

export default AdminAddMoviePage;

