import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../providers/AuthContext';
import { getProfileName } from '../../apis/client';
import logoNetflix from '../../assets/logo/Netflix_Logo_PMS.png';
import '../../styles/components/header.css';

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { isLoggedIn, logout } = useAuth();
  const profileName = getProfileName();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/login');
  }

  return (
    <header className={`app-header${scrolled || !isHome ? ' app-header--scrolled' : ''}`}>
      <nav className="app-header-nav">
        <div className="header-left">
          <Link to="/" className="app-link-brand">
            <img src={logoNetflix} alt="ThungPhim" className="header-logo" />
          </Link>
          <Link to="/">Trang chủ</Link>
          <Link to="/">Series</Link>
          <Link to="/">Phim</Link>
          <Link to="/">Mới &amp; phổ biến</Link>
          <Link to="/my-list">Danh sách của tôi</Link>
          <Link to="/favorites">Yêu thích</Link>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="app-button"
            aria-label="Tìm kiếm"
            onClick={() => navigate('/search')}
          >
            🔍
          </button>
          <button
            type="button"
            className="app-button"
            aria-label="Thông báo"
          >
            🔔
          </button>
          <div className="header-avatar-wrap" ref={menuRef}>
            <button
              type="button"
              className="header-avatar"
              title={profileName || 'Tài khoản'}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menu tài khoản"
            >
              {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
            </button>
            {menuOpen && (
              <div className="header-avatar-menu">
                <Link
                  to="/account"
                  className="header-avatar-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  Thông tin tài khoản
                </Link>
                <Link
                  to="/profiles"
                  className="header-avatar-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  Quản lý hồ sơ
                </Link>
                {isLoggedIn && (
                  <Link
                    to="/admin"
                    className="header-avatar-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    Quản trị website
                  </Link>
                )}
                {isLoggedIn ? (
                  <button
                    type="button"
                    className="header-avatar-menu-item header-avatar-menu-item--logout"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="header-avatar-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;

