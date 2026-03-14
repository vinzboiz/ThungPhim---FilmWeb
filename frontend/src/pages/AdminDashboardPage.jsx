import { Link } from 'react-router-dom';

function AdminDashboardPage() {
  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ marginBottom: '16px' }}>Bảng điều khiển Admin</h1>
      <p style={{ marginBottom: '24px', color: '#ccc', maxWidth: '720px' }}>
        Tại đây bạn có thể truy cập nhanh tới tất cả khu vực quản trị: phim lẻ, phim bộ (series / season / tập),
        thể loại, danh sách của người dùng... Các trang bên dưới đều đã hỗ trợ thêm / sửa / xoá và upload file
        (ảnh, banner, video) từ local disk.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <section
          style={{
            borderRadius: '8px',
            padding: '16px',
            background: 'rgba(20, 20, 20, 0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Phim lẻ (Movies)</h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>
            Thêm, sửa, xoá phim lẻ; upload ảnh bìa, banner ngang, trailer và video chính.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/admin/movies" style={{ padding: '6px 12px', background: '#e50914', color: '#fff', borderRadius: '4px' }}>
              Danh sách phim
            </Link>
            <Link to="/admin/movies/new" style={{ padding: '6px 12px', background: '#333', color: '#fff', borderRadius: '4px' }}>
              + Thêm phim mới
            </Link>
          </div>
        </section>

        <section
          style={{
            borderRadius: '8px',
            padding: '16px',
            background: 'rgba(20, 20, 20, 0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Phim bộ (Series)</h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>
            Quản lý phim bộ, seasons và tập phim; upload ảnh bìa series, ảnh và video cho từng tập.
          </p>
          <Link to="/admin/series" style={{ padding: '6px 12px', background: '#e50914', color: '#fff', borderRadius: '4px' }}>
            Quản lý phim bộ
          </Link>
        </section>

        <section
          style={{
            borderRadius: '8px',
            padding: '16px',
            background: 'rgba(20, 20, 20, 0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Diễn viên (Persons)</h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>
            Quản lý thông tin diễn viên, đạo diễn; thêm, sửa, xoá, upload ảnh và tiểu sử.
          </p>
          <Link to="/admin/persons" style={{ padding: '6px 12px', background: '#e50914', color: '#fff', borderRadius: '4px' }}>
            Quản lý diễn viên
          </Link>
        </section>

        <section
          style={{
            borderRadius: '8px',
            padding: '16px',
            background: 'rgba(20, 20, 20, 0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Thể loại (Genres)</h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>
            Thêm, sửa, xoá thể loại và ảnh bìa; dùng để gán cho phim.
          </p>
          <Link to="/admin/genres" style={{ padding: '6px 12px', background: '#e50914', color: '#fff', borderRadius: '4px' }}>
            Quản lý thể loại
          </Link>
        </section>

        {/* Bạn có thể bổ sung thêm các mục quản lý users / profiles sau này */}
      </div>
    </div>
  );
}

export default AdminDashboardPage;

