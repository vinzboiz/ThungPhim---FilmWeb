import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../apis/client';
import GoogleSignInButton from '../components/GoogleSignInButton';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [full_name, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('POST', '/api/auth/register', { email, password, full_name }, { auth: false });
      await login(email, password);
      navigate('/profiles');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
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
      <h1>Đăng ký</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '16px' }}>
        <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={(e) => setError(e.message)} disabled={loading} />
      </div>
      <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#888', fontSize: 14 }}>hoặc đăng ký bằng email</span>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label>
          Họ tên
          <input
            type="text"
            autoComplete="name"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: '8px' }}
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ display: 'block', width: '100%', padding: '8px' }}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      <p style={{ marginTop: '16px' }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
