import { useEffect, useRef } from 'react';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Tải GIS một lần — không chặn FCP trên các trang không cần Google */
function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (existing) {
      const waitReady = () => {
        if (window.google?.accounts?.id) resolve();
        else setTimeout(waitReady, 50);
      };
      if (existing.getAttribute('data-loaded') === '1') {
        waitReady();
        return;
      }
      existing.addEventListener('load', waitReady);
      existing.addEventListener('error', () => reject(new Error('GSI script error')));
      return;
    }
    const s = document.createElement('script');
    s.src = GSI_SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-gsi-loader', '1');
    s.onload = () => {
      s.setAttribute('data-loaded', '1');
      resolve();
    };
    s.onerror = () => reject(new Error('GSI script failed'));
    document.head.appendChild(s);
  });
}

// Chỉ initialize Google một lần cho cả app (tránh warning "initialize() is called multiple times")
let googleAccountsInitialized = false;
const globalCallbackRef = { onSuccess: null, onError: null };

/** Nút Đăng nhập bằng Google - dùng Google Identity Services (GIS) */
export default function GoogleSignInButton({ onSuccess, onError, disabled = false }) {
  const containerRef = useRef(null);
  const renderedRef = useRef(false);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    globalCallbackRef.onSuccess = onSuccess;
    globalCallbackRef.onError = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!clientId || !containerRef.current || renderedRef.current) return undefined;

    let cancelled = false;

    const initGoogle = () => {
      if (cancelled) return;
      if (typeof window.google === 'undefined' || !window.google.accounts) {
        setTimeout(initGoogle, 100);
        return;
      }
      try {
        if (!googleAccountsInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => {
              if (res.credential) {
                globalCallbackRef.onSuccess?.(res.credential);
              } else {
                globalCallbackRef.onError?.(new Error('Không nhận được thông tin từ Google'));
              }
            },
            auto_select: false,
          });
          googleAccountsInitialized = true;
        }
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 320,
          locale: 'vi',
        });
        renderedRef.current = true;
      } catch (e) {
        globalCallbackRef.onError?.(e);
      }
    };

    loadGsiScript()
      .then(() => {
        if (!cancelled) initGoogle();
      })
      .catch((e) => globalCallbackRef.onError?.(e));

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p style={{ fontSize: 12, color: '#888' }}>
        Đăng nhập Google chưa cấu hình (thêm VITE_GOOGLE_CLIENT_ID vào .env)
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    />
  );
}
