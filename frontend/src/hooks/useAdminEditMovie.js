import { useEffect, useRef, useState, useCallback } from 'react';
import { api, API_BASE, getToken, normalizeUploadError } from '../apis/client';

const initialForm = {
  title: '',
  short_intro: '',
  description: '',
  release_year: '',
  duration_minutes: '',
  thumbnail_url: '',
  banner_url: '',
  trailer_url: '',
  trailer_youtube_url: '',
  video_url: '',
  rating: '',
  age_rating: '',
  country_code: '',
  is_featured: false,
  intro_start_seconds: '',
  intro_end_seconds: '',
};

export function useAdminEditMovie(id) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genreIds, setGenreIds] = useState([]);
  const [cast, setCast] = useState([]);
  const [persons, setPersons] = useState([]);
  const [addActorIds, setAddActorIds] = useState([]);
  const [addDirectorIds, setAddDirectorIds] = useState([]);
  const [addingActors, setAddingActors] = useState(false);
  const [addingDirectors, setAddingDirectors] = useState(false);
  const introVideoRef = useRef(null);
  const [introPreviewDuration, setIntroPreviewDuration] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [movieRes, castRes, countriesRes, personsRes, genresRes] = await Promise.all([
          fetch(`${API_BASE}/api/movies/${id}`),
          fetch(`${API_BASE}/api/movies/${id}/cast`),
          fetch(`${API_BASE}/api/countries`),
          fetch(`${API_BASE}/api/persons`),
          fetch(`${API_BASE}/api/genres`),
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
          trailer_youtube_url: data.trailer_youtube_url || '',
          video_url: data.video_url || '',
          rating: data.rating || '',
          age_rating: data.age_rating || '',
          country_code: data.country_code || '',
          is_featured: !!data.is_featured,
          intro_start_seconds: data.intro_start_seconds ?? '',
          intro_end_seconds: data.intro_end_seconds ?? '',
        });
        const castData = castRes.ok ? await castRes.json() : [];
        setCast(Array.isArray(castData) ? castData : []);
        const countriesData = countriesRes.ok ? await countriesRes.json() : [];
        setCountries(Array.isArray(countriesData) ? countriesData : []);
        const personsData = personsRes.ok ? await personsRes.json() : [];
        setPersons(Array.isArray(personsData) ? personsData : []);
        setGenreIds(Array.isArray(data.genres) ? data.genres.map((g) => g.id) : []);
        const gData = genresRes.ok ? await genresRes.json() : [];
        setGenres(Array.isArray(gData) ? gData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleAddActors = useCallback(async () => {
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
  }, [addActorIds, id, persons]);

  const handleAddDirectors = useCallback(async () => {
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
  }, [addDirectorIds, id, persons]);

  const handleRemoveCast = useCallback(async (personId) => {
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
  }, [id]);

  const uploadVideoToServer = useCallback(async (file, fieldToSet) => {
    const token = getToken();
    if (!token) {
      setError('Cần đăng nhập admin để upload video');
      throw new Error('Cần đăng nhập admin để upload video');
    }
    setError('');
    setMessage('Đang upload video...');
    const formData = new FormData();
    formData.append('video', file);
    const res = await fetch(`${API_BASE}/api/upload/video`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Upload video thất bại.');
    }
    const data = await res.json();
    setForm((prev) => ({ ...prev, [fieldToSet]: data.video_url }));
    setMessage('Upload video thành công.');
  }, []);

  const handleVideoFileChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await uploadVideoToServer(file, 'video_url');
      } catch (err) {
        setError(err.message);
      }
      e.target.value = '';
    },
    [uploadVideoToServer],
  );

  const handleTrailerFileChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await uploadVideoToServer(file, 'trailer_url');
      } catch (err) {
        setError(normalizeUploadError(err));
      }
      e.target.value = '';
    },
    [uploadVideoToServer],
  );

  const uploadImage = useCallback(async (file, field) => {
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('Cần đăng nhập admin để upload ảnh');
        return;
      }
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Upload ảnh thất bại');
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, [field]: data.image_url }));
      if (field === 'banner_url') {
        setMessage('Upload ảnh banner thành công. Đường dẫn đã được gán vào Banner URL.');
      } else {
        setMessage('Upload ảnh bìa thành công.');
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleThumbnailFileChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await uploadImage(file, 'thumbnail_url');
      e.target.value = '';
    },
    [uploadImage],
  );

  const handleBannerFileChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await uploadImage(file, 'banner_url');
      e.target.value = '';
    },
    [uploadImage],
  );

  const handleSubmit = useCallback(
    async (e) => {
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
            duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
            rating: form.rating ? Number(form.rating) : null,
            intro_start_seconds:
              form.intro_start_seconds === '' || form.intro_start_seconds == null
                ? null
                : Number(form.intro_start_seconds),
            intro_end_seconds:
              form.intro_end_seconds === '' || form.intro_end_seconds == null
                ? null
                : Number(form.intro_end_seconds),
          },
          { auth: true },
        );
        await api(
          'POST',
          `/api/movies/${id}/genres`,
          {
            genre_ids: genreIds.map((g) => Number(g)).filter((g) => g > 0),
          },
          { auth: true },
        );
        setMessage('Đã cập nhật phim.');
      } catch (err) {
        setError(err.message);
      }
    },
    [form, genreIds, id],
  );

  return {
    form,
    setForm,
    message,
    error,
    loading,
    countries,
    genres,
    genreIds,
    setGenreIds,
    cast,
    persons,
    addActorIds,
    setAddActorIds,
    addDirectorIds,
    setAddDirectorIds,
    addingActors,
    addingDirectors,
    introVideoRef,
    introPreviewDuration,
    setIntroPreviewDuration,
    handleChange,
    handleAddActors,
    handleAddDirectors,
    handleRemoveCast,
    handleVideoFileChange,
    handleTrailerFileChange,
    handleThumbnailFileChange,
    handleBannerFileChange,
    handleSubmit,
  };
}
