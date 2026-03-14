import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { api } from '../apis/client';

function ProfileSelectPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const { token, setProfileId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    async function load() {
      try {
        const data = await api('GET', '/api/profiles');
        setProfiles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, navigate]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const created = await api('POST', '/api/profiles', { name: name.trim() });
      setProfiles((prev) => [...prev, created]);
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handleSelect(profile) {
    setProfileId(profile.id, profile.name);
    navigate('/');
  }

  if (!token) return null;
  if (loading) return <div style={{ padding: '24px' }}>Đang tải...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Chọn profile</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        {profiles.map((p) => (
          <div
            key={p.id}
            style={{
              border: '2px solid #444',
              borderRadius: '8px',
              padding: '16px',
              minWidth: '120px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{p.avatar || '👤'}</div>
            <div style={{ fontWeight: 'bold' }}>{p.name}</div>
            <button
              type="button"
              onClick={() => handleSelect(p)}
              style={{ marginTop: '8px' }}
            >
              Chọn
            </button>
          </div>
        ))}
      </div>

      <h2>Thêm profile mới</h2>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên profile (vd: Bố, Mẹ)"
          style={{ padding: '8px', flex: 1 }}
        />
        <button type="submit" disabled={creating || !name.trim()}>
          {creating ? 'Đang tạo...' : 'Tạo'}
        </button>
      </form>
    </div>
  );
}

export default ProfileSelectPage;
