import { useParams, useNavigate } from 'react-router-dom';
import { useAdminEditMovie } from '../hooks/useAdminEditMovie';
import AdminEditMovieFormFields from '../components/admin/AdminEditMovieFormFields';
import AdminEditMovieIntroSection from '../components/admin/AdminEditMovieIntroSection';
import AdminEditMovieCastSection from '../components/admin/AdminEditMovieCastSection';
import '../styles/pages/admin-common.css';
import '../styles/pages/admin-edit-movie-page.css';

function AdminEditMoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vm = useAdminEditMovie(id);

  if (vm.loading) {
    return (
      <div className="admin-page admin-edit-movie-page">
        <p className="admin-page-loading">Đang tải thông tin phim...</p>
      </div>
    );
  }

  return (
    <div className="admin-page admin-page--narrow admin-edit-movie-page">
      <h1>Chỉnh sửa phim #{id}</h1>
      {vm.message && <p className="admin-msg-success">{vm.message}</p>}
      {vm.error && <p className="admin-msg-error">{vm.error}</p>}
      <form onSubmit={vm.handleSubmit} className="admin-form-stack">
        <AdminEditMovieFormFields
          form={vm.form}
          countries={vm.countries}
          genres={vm.genres}
          genreIds={vm.genreIds}
          setGenreIds={vm.setGenreIds}
          handleChange={vm.handleChange}
          handleThumbnailFileChange={vm.handleThumbnailFileChange}
          handleBannerFileChange={vm.handleBannerFileChange}
          handleTrailerFileChange={vm.handleTrailerFileChange}
          handleVideoFileChange={vm.handleVideoFileChange}
        />

        <AdminEditMovieIntroSection
          form={vm.form}
          setForm={vm.setForm}
          introVideoRef={vm.introVideoRef}
          introPreviewDuration={vm.introPreviewDuration}
          setIntroPreviewDuration={vm.setIntroPreviewDuration}
        />

        <AdminEditMovieCastSection
          cast={vm.cast}
          persons={vm.persons}
          addActorIds={vm.addActorIds}
          setAddActorIds={vm.setAddActorIds}
          addDirectorIds={vm.addDirectorIds}
          setAddDirectorIds={vm.setAddDirectorIds}
          addingActors={vm.addingActors}
          addingDirectors={vm.addingDirectors}
          handleAddActors={vm.handleAddActors}
          handleAddDirectors={vm.handleAddDirectors}
          handleRemoveCast={vm.handleRemoveCast}
        />

        <div className="admin-form-actions">
          <button type="submit">Lưu thay đổi</button>
          <button type="button" onClick={() => navigate('/admin/movies')}>
            Quay lại danh sách
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminEditMoviePage;
