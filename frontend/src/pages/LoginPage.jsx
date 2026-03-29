import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import GoogleSignInButton from '../components/GoogleSignInButton';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'locked') {
      setError('Tài khoản đã bị khóa. Liên hệ quản trị viên.');
    } else if (reason === 'expired') {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/profiles');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSuccess = useCallback(
    async (credential) => {
      setError('');
      setLoading(true);
      try {
        await loginWithGoogle(credential);
        navigate('/profiles');
      } catch (err) {
        setError(err.message || 'Đăng nhập Google thất bại');
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, navigate]
  );

  return (
    <div style={{ padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Đăng nhập</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: '8px' }}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: '8px' }}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#888', fontSize: 14 }}>hoặc</span>
      </div>
      <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={(e) => setError(e.message)} disabled={loading} />
      <p style={{ marginTop: '16px' }}>
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </div>
  );
}

export default LoginPage;
