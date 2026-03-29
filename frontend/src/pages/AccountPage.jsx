import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { api, getToken } from '../apis/client';
import '../styles/pages/account-page.css';

function AccountPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn || !getToken()) {
      navigate('/login');
      return;
    }
    async function load() {
      try {
        const data = await api('GET', '/api/auth/me');
        setUser(data);
      } catch (err) {
        setError(err.message || 'Không tải được thông tin tài khoản');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="account-page__loading">
        <p>Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page__error">
        <p className="account-page__error-text">{error}</p>
        <Link to="/">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="account-page">
      <h1 className="account-page__title">Thông tin tài khoản</h1>
      <div className="account-page__card">
        <div className="account-page__row">
          <div className="account-page__avatar">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              (user?.full_name || user?.email || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="account-page__label">Họ tên</p>
            <p className="account-page__name">{user?.full_name || '—'}</p>
            <p className="account-page__email-label">Email</p>
            <p className="account-page__email">{user?.email || '—'}</p>
          </div>
        </div>
        {user?.is_admin && (
          <p className="account-page__admin-badge">
            Tài khoản quản trị
          </p>
        )}
      </div>
      <div className="account-page__actions">
        <Link to="/profiles" className="account-page__btn account-page__btn--primary">
          Quản lý hồ sơ
        </Link>
        {user?.is_admin && (
          <Link to="/admin" className="account-page__btn account-page__btn--admin">
            Quản trị website
          </Link>
        )}
        <Link to="/" className="account-page__btn account-page__btn--ghost">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default AccountPage;
