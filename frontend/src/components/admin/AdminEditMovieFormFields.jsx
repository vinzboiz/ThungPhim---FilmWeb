export default function AdminEditMovieFormFields({
  form,
  countries,
  genres,
  genreIds,
  setGenreIds,
  handleChange,
  handleThumbnailFileChange,
  handleBannerFileChange,
  handleTrailerFileChange,
  handleVideoFileChange,
}) {
  return (
    <>
      <label className="admin-form-label">
        Tiêu đề *
        <input type="text" name="title" value={form.title} onChange={handleChange} required />
      </label>
      <label className="admin-form-label">
        Giới thiệu ngắn (hiện trên banner)
        <input type="text" name="short_intro" maxLength={255} value={form.short_intro} onChange={handleChange} />
      </label>
      <label className="admin-form-label">
        Mô tả
        <textarea name="description" value={form.description} onChange={handleChange} />
      </label>
      <label className="admin-form-label">
        Năm phát hành
        <input type="number" name="release_year" value={form.release_year} onChange={handleChange} />
      </label>
      <label className="admin-form-label">
        Thời lượng (phút)
        <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} />
      </label>
      <label className="admin-form-label">
        Ảnh bìa (chọn file từ máy)
        <input type="file" accept="image/*" onChange={handleThumbnailFileChange} />
      </label>
      <label className="admin-form-label">
        Thumbnail URL
        <input type="text" name="thumbnail_url" value={form.thumbnail_url} onChange={handleChange} />
      </label>
      <label className="admin-form-label">
        Banner ngang URL (ảnh dùng cho banner Home)
        <input type="file" accept="image/*" onChange={handleBannerFileChange} />
      </label>
      <label className="admin-form-label">
        Đường dẫn Banner ngang
        <input type="text" name="banner_url" value={form.banner_url} onChange={handleChange} />
      </label>

      <fieldset className="admin-fieldset">
        <legend>Trailer</legend>
        <label>
          Chọn file từ máy — upload lên server, gán vào Trailer URL (dùng cho Hero banner)
          <input type="file" accept="video/*,audio/*" onChange={handleTrailerFileChange} />
        </label>
        <label className="admin-form-label">
          Trailer URL (local, dùng cho Hero)
          <input type="text" name="trailer_url" value={form.trailer_url} onChange={handleChange} />
        </label>
        <label className="admin-form-label">
          Trailer YouTube URL (trang chi tiết)
          <input
            type="text"
            name="trailer_youtube_url"
            value={form.trailer_youtube_url}
            onChange={handleChange}
            placeholder="https://youtube.com/..."
          />
        </label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Video chính</legend>
        <label>
          Chọn file video — gán vào Video URL
          <input type="file" accept="video/*" onChange={handleVideoFileChange} />
        </label>
        <label className="admin-form-label">
          Video URL
          <input type="text" name="video_url" value={form.video_url} onChange={handleChange} />
        </label>
      </fieldset>

      <label className="admin-form-label">
        Rating (VD: 8.5)
        <input type="number" step="0.1" name="rating" value={form.rating} onChange={handleChange} />
      </label>

      <label className="admin-form-label">
        Age rating (VD: 13+)
        <input type="text" name="age_rating" value={form.age_rating} onChange={handleChange} />
      </label>
      <label className="admin-form-label">
        Quốc gia sản xuất
        <select name="country_code" value={form.country_code} onChange={handleChange} className="admin-select-country">
          <option value="">-- Chọn quốc gia --</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {genres.length > 0 && (
        <fieldset className="admin-fieldset">
          <legend>Thể loại</legend>
          <div className="admin-genre-checkboxes">
            {genres.map((g) => (
              <label key={g.id}>
                <input
                  type="checkbox"
                  checked={genreIds.includes(g.id)}
                  onChange={(e) => {
                    setGenreIds((prev) => (e.target.checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)));
                  }}
                />
                {g.name}
              </label>
            ))}
          </div>
          <span className="admin-fieldset-hint">Chọn nhiều thể loại cho phim</span>
        </fieldset>
      )}

      <label className="admin-label-inline">
        <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
        {' '}
        Featured (hiển thị nổi bật)
      </label>
    </>
  );
}
