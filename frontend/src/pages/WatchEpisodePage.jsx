import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { API_BASE, getToken, getProfileId } from '../apis/client';
import ReviewSection from '../components/ReviewSection';

function WatchEpisodePage() {
  const { episodeId } = useParams();
  const location = useLocation();
  const fromStart = location.state?.fromStart === true;
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedProgress, setSavedProgress] = useState(0);
  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const initialProgressApplied = useRef(false);
  const profileId = getProfileId();
  const token = getToken();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/series/episode/${episodeId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Không tìm thấy tập');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setEpisode(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [episodeId]);

  useEffect(() => {
    if (fromStart || !token || !profileId || !episodeId) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/watch/progress?profile_id=${profileId}&episode_id=${episodeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { progress_seconds: 0 }))
      .then((data) => {
        if (!cancelled && data && data.progress_seconds > 0) setSavedProgress(data.progress_seconds);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [fromStart, token, profileId, episodeId]);

  const saveProgress = useCallback(
    (seconds) => {
      if (!token || !profileId || !episodeId || (seconds !== 0 && !seconds)) return;
      fetch(`${API_BASE}/api/watch/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_id: profileId,
          episode_id: Number(episodeId),
          progress_seconds: Math.floor(seconds),
        }),
      }).catch(() => {});
    },
    [token, profileId, episodeId]
  );

  const lastSaved = useRef(0);
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = Math.floor(v.currentTime);
    if (t - lastSaved.current >= 10) {
      lastSaved.current = t;
      saveProgress(t);
    }
  }, [saveProgress]);

  const handlePause = useCallback(() => {
    if (videoRef.current) saveProgress(Math.floor(videoRef.current.currentTime));
  }, [saveProgress]);

  const handleSeeked = useCallback(() => {
    if (initialProgressApplied.current && videoRef.current) {
      saveProgress(Math.floor(videoRef.current.currentTime));
    }
  }, [saveProgress]);

  const applySavedProgressOnce = useCallback(() => {
    if (initialProgressApplied.current) return;
    const v = videoRef.current;
    if (fromStart) {
      if (v) {
        v.currentTime = 0;
        if (token && profileId) saveProgress(0);
      }
      initialProgressApplied.current = true;
      return;
    }
    if (savedProgress <= 0) return;
    if (!v || v.readyState < 1) return;
    const duration = v.duration;
    const start = isFinite(duration) && duration > 0 && duration > savedProgress
      ? Math.min(savedProgress, duration - 1)
      : savedProgress;
    v.currentTime = start;
    initialProgressApplied.current = true;
  }, [savedProgress, fromStart, token, profileId, saveProgress]);

  const handleVideoLoaded = useCallback(() => {
    applySavedProgressOnce();
  }, [applySavedProgressOnce]);

  const handleVideoKeyDown = useCallback((e) => {
    const v = videoRef.current;
    if (!v) return;
    if (e.key === ' ') {
      e.preventDefault();
      v.paused ? v.play() : v.pause();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      v.currentTime = Math.max(0, v.currentTime - 10);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const d = v.duration;
      v.currentTime = isFinite(d) && d > 0 ? Math.min(d, v.currentTime + 10) : v.currentTime + 10;
    }
  }, []);

  if (loading) return <div style={{ padding: '24px' }}>Đang tải...</div>;
  if (error || !episode) return <div style={{ padding: '24px', color: 'red' }}>{error || 'Không tìm thấy tập'}</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <p>
        <Link to={episode.series_id ? `/series/${episode.series_id}` : '/'} style={{ color: '#61dafb' }}>
          ← Quay lại series
        </Link>
      </p>
      <h1>Tập {episode.episode_number}: {episode.title}</h1>
      {episode.description && <p style={{ color: '#ccc' }}>{episode.description}</p>}
      {episode.video_url && (
        <>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Nhấn vào vùng video rồi dùng: Space (phát/tạm dừng), ← → (tua 10 giây, tự lưu lịch sử).</p>
          <div
            ref={videoWrapRef}
            tabIndex={0}
            role="button"
            onClick={() => videoWrapRef.current?.focus()}
            onKeyDown={handleVideoKeyDown}
            style={{ outline: 'none' }}
          >
            <video
              ref={videoRef}
              controls
              style={{ width: '100%', maxHeight: '400px', backgroundColor: '#000' }}
              src={`${API_BASE}${episode.video_url}`}
              onLoadedMetadata={handleVideoLoaded}
              onTimeUpdate={handleTimeUpdate}
              onPause={handlePause}
              onSeeked={handleSeeked}
            >
              Trình duyệt không hỗ trợ video.
            </video>
          </div>
        </>
      )}

      <ReviewSection contentType="episode" contentId={episodeId} title="Đánh giá & Bình luận tập này" />
    </div>
  );
}

export default WatchEpisodePage;
