import { useEffect, useRef, useState } from 'react';

function isNearViewport(el, marginPx) {
  const rect = el.getBoundingClientRect();
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const top = -marginPx;
  const bottom = vh + marginPx;
  return rect.top < bottom && rect.bottom > top;
}

/**
 * Chỉ mount children khi section gần vào viewport — giảm ảnh + DOM đồng thời lúc tải trang.
 * Kiểm tra đồng bộ lần đầu để trang ngắn / cuộn nhanh vẫn hiện nội dung kịp (giảm CLS).
 */
export default function HomeDeferredSection({ children, minHeight = 300 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const margin = 420;
    if (isNearViewport(el, margin)) {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: '420px 0px 280px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="home-deferred-section">
      {visible ? (
        children
      ) : (
        <div className="home-deferred-placeholder" style={{ minHeight }} aria-hidden />
      )}
    </div>
  );
}
