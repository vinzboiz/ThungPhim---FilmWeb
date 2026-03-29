import { API_BASE } from '../../apis/client';

export default function AdminEditMovieCastSection({
  cast,
  persons,
  addActorIds,
  setAddActorIds,
  addDirectorIds,
  setAddDirectorIds,
  addingActors,
  addingDirectors,
  handleAddActors,
  handleAddDirectors,
  handleRemoveCast,
}) {
  return (
    <fieldset className="admin-fieldset">
      <legend>Diễn viên &amp; Đạo diễn</legend>
      <div className="admin-cast-grid">
        <div className="admin-cast-col">
          <h4>Diễn viên</h4>
          <div>
            {cast
              .filter((c) => c.role === 'actor')
              .map((c) => (
                <div key={c.id} className="admin-cast-row">
                  {c.avatar_url && (
                    <img
                      src={c.avatar_url.startsWith('http') ? c.avatar_url : `${API_BASE}${c.avatar_url}`}
                      alt=""
                      className="admin-cast-avatar"
                    />
                  )}
                  <span className="admin-cast-name">{c.name}</span>
                  <button type="button" className="admin-cast-remove" onClick={() => handleRemoveCast(c.id)}>
                    Xoá
                  </button>
                </div>
              ))}
            {cast.filter((c) => c.role === 'actor').length === 0 && (
              <span className="admin-cast-muted">Chưa có</span>
            )}
          </div>
          <div className="admin-cast-picker">
            {persons
              .filter((p) => p.person_type !== 'director' && !cast.some((c) => c.id === p.id))
              .map((p) => {
                const checked = addActorIds.includes(p.id);
                return (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setAddActorIds((prev) =>
                          e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                        );
                      }}
                    />
                    {p.name}
                  </label>
                );
              })}
            {persons.filter((p) => p.person_type !== 'director' && !cast.some((c) => c.id === p.id)).length ===
              0 && <span className="admin-cast-muted">Không còn diễn viên nào để thêm.</span>}
          </div>
          <button type="button" className="admin-btn-submit" onClick={handleAddActors} disabled={!addActorIds.length || addingActors}>
            {addingActors ? 'Đang thêm...' : 'Thêm diễn viên đã chọn'}
          </button>
        </div>
        <div className="admin-cast-col">
          <h4>Đạo diễn</h4>
          <div>
            {cast
              .filter((c) => c.role === 'director')
              .map((c) => (
                <div key={c.id} className="admin-cast-row">
                  {c.avatar_url && (
                    <img
                      src={c.avatar_url.startsWith('http') ? c.avatar_url : `${API_BASE}${c.avatar_url}`}
                      alt=""
                      className="admin-cast-avatar"
                    />
                  )}
                  <span className="admin-cast-name">{c.name}</span>
                  <button type="button" className="admin-cast-remove" onClick={() => handleRemoveCast(c.id)}>
                    Xoá
                  </button>
                </div>
              ))}
            {cast.filter((c) => c.role === 'director').length === 0 && (
              <span className="admin-cast-muted">Chưa có</span>
            )}
          </div>
          <div className="admin-cast-picker">
            {persons
              .filter((p) => p.person_type === 'director' && !cast.some((c) => c.id === p.id))
              .map((p) => {
                const checked = addDirectorIds.includes(p.id);
                return (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setAddDirectorIds((prev) =>
                          e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                        );
                      }}
                    />
                    {p.name}
                  </label>
                );
              })}
            {persons.filter((p) => p.person_type === 'director' && !cast.some((c) => c.id === p.id)).length ===
              0 && <span className="admin-cast-muted">Không còn đạo diễn nào để thêm.</span>}
          </div>
          <button
            type="button"
            className="admin-btn-submit"
            onClick={handleAddDirectors}
            disabled={!addDirectorIds.length || addingDirectors}
          >
            {addingDirectors ? 'Đang thêm...' : 'Thêm đạo diễn đã chọn'}
          </button>
        </div>
      </div>
    </fieldset>
  );
}
