const API_BASE = 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('token');
}

function getProfileId() {
  return localStorage.getItem('profileId');
}

function getProfileName() {
  return localStorage.getItem('profileName') || '';
}

function getProfileAvatar() {
  return localStorage.getItem('profileAvatar') || '';
}

function setProfileInfo(profileId, profileName, profileAvatar) {
  if (profileId != null) {
    localStorage.setItem('profileId', String(profileId));
    localStorage.setItem('profileName', profileName || '');
    localStorage.setItem('profileAvatar', profileAvatar || '');
  } else {
    localStorage.removeItem('profileId');
    localStorage.removeItem('profileName');
    localStorage.removeItem('profileAvatar');
  }
}

function getIsAdmin() {
  return localStorage.getItem('is_admin') === '1';
}

function setAdminFlag(isAdmin) {
  if (isAdmin) {
    localStorage.setItem('is_admin', '1');
  } else {
    localStorage.removeItem('is_admin');
  }
}

function getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function api(method, path, body, options = {}) {
  const { auth = true } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getHeaders(auth),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || res.statusText || '';
    if (res.status === 401 && auth && (msg.includes('Token không hợp lệ') || msg.includes('Thiếu token'))) {
      // token hết hạn hoặc hỏng: dọn localStorage và chuyển về trang đăng nhập
      localStorage.removeItem('token');
      localStorage.removeItem('profileId');
      localStorage.removeItem('profileName');
      localStorage.removeItem('profileAvatar');
      localStorage.removeItem('is_admin');
      try {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?reason=expired';
        }
      } catch {
        // bỏ qua lỗi nếu không chạy trong browser
      }
    }
    throw new Error(msg);
  }
  return data;
}

export async function apiFormData(method, path, formData, options = {}) {
  const { auth = true } = options;
  const headers = {};
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || res.statusText || '';
    if (res.status === 401 && auth && (msg.includes('Token không hợp lệ') || msg.includes('Thiếu token'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('profileId');
      localStorage.removeItem('profileName');
      localStorage.removeItem('profileAvatar');
      localStorage.removeItem('is_admin');
      try {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?reason=expired';
        }
      } catch {
        // ignore
      }
    }
    throw new Error(msg);
  }
  return data;
}

export { API_BASE, getToken, getProfileId, getProfileName, getProfileAvatar, setProfileInfo, getIsAdmin, setAdminFlag };

