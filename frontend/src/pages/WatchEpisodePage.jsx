import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { API_BASE, getToken, getProfileId } from '../apis/client';
import { resolveMediaUrl } from '../utils/mediaUrl';
import ReviewSection from '../components/ReviewSection';
import DetailSuggestions from '../components/detail/DetailSuggestions';
import HeroBanner from '../components/home/HeroBanner';
import '../styles/pages/watch-movie.css';
import '../styles/pages/watch-episode.css';

function WatchEpisodePage() {
  const { episodeId } = useParams();
  const location = useLocation();
  const fromStart = location.state?.fromStart === true;
  const continueSecondsFromState = location.state?.continueSeconds || 0;
  const [showContinuePrompt, setShowContinuePrompt] = useState(
    !!location.state?.askContinue && continueSecondsFromState > 0,
  );
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestionModalItem, setSuggestionModalItem] = useState(null);
  const [error, setError] = useState('');
  const [savedProgress, setSavedProgress] = useState(0);
  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const initialProgressApplied = useRef(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const showSkipRef = useRef(false);
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
    if (continueSecondsFromState <= 0) return;
    const t = setTimeout(() => {
      setSavedProgress(continueSecondsFromState);
    }, 0);
    return () => clearTimeout(t);
  }, [continueSecondsFromState]);

  useEffect(() => {
    if (fromStart || !token || !profileId || !episodeId || showContinuePrompt) return;
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
  }, [fromStart, token, profileId, episodeId, showContinuePrompt]);

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

    // Skip intro (episode) - effective intro theo intro_mode + series intro
    const mode = (episode?.intro_mode || 'series').toString().toLowerCase();
    let s = null;
    let e = null;
    if (mode === 'none') {
      s = null; e = null;
    } else if (mode === 'custom') {
      s = episode?.intro_start_seconds != null ? Number(episode.intro_start_seconds) : null;
      e = episode?.intro_end_seconds != null ? Number(episode.intro_end_seconds) : null;
    } else {
      s = episode?.series_intro_start_seconds != null ? Number(episode.series_intro_start_seconds) : null;
      e = episode?.series_intro_end_seconds != null ? Number(episode.series_intro_end_seconds) : null;
    }
    if (s != null && e != null && isFinite(s) && isFinite(e) && e > s) {
      const inRange = v.currentTime >= s && v.currentTime < e;
      if (inRange !== showSkipRef.current) {
        showSkipRef.current = inRange;
        setShowSkipIntro(inRange);
      }
    } else if (showSkipRef.current) {
      showSkipRef.current = false;
      setShowSkipIntro(false);
    }
  }, [saveProgress, episode]);

  const handlePause = useCallback(() => {
    if (videoRef.current) saveProgress(Math.floor(videoRef.current.currentTime));
  }, [saveProgress]);

  const handleSeeked = useCallback(() => {
    if (initialProgressApplied.current && videoRef.current) {
      saveProgress(Math.floor(videoRef.current.currentTime));
    }
    handleTimeUpdate();
  }, [saveProgress, handleTimeUpdate]);

  const applySavedProgressOnce = useCallback(() => {
    if (showContinuePrompt) return;
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
  }, [savedProgress, fromStart, token, profileId, saveProgress, showContinuePrompt]);

  const handleVideoLoaded = useCallback(() => {
    applySavedProgressOnce();
    queueMicrotask(() => {
      handleTimeUpdate();
    });
  }, [applySavedProgressOnce, handleTimeUpdate]);

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

  if (loading) return <div className="watch-episode__loading">Đang tải...</div>;
  if (error || !episode) return <div className="watch-episode__error">{error || 'Không tìm thấy tập'}</div>;

  const videoSrc = resolveMediaUrl(episode.video_url);

  return (
    <div className="watch-episode">
      {showContinuePrompt && savedProgress > 0 && (
        <div className="watch-movie-continue-overlay">
          <div className="watch-movie-continue-dialog">
            <p>
              Hiện bạn đang xem đến{' '}
              <strong>{Math.floor(savedProgress / 60)} phút {Math.floor(savedProgress % 60)} giây</strong>.
            </p>
            <p>Bạn muốn tiếp tục xem từ vị trí này hay xem lại từ đầu?</p>
            <div className="watch-movie-continue-actions">
              <button
                type="button"
                onClick={() => {
                  setShowContinuePrompt(false);
                  const v = videoRef.current;
                  if (v && savedProgress > 0) {
                    const duration = v.duration;
                    const start =
                      isFinite(duration) && duration > 0 && duration > savedProgress
                        ? Math.min(savedProgress, duration - 1)
                        : savedProgress;
                    v.currentTime = start;
                  }
                  initialProgressApplied.current = true;
                }}
              >
                Tiếp tục xem
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowContinuePrompt(false);
                  const v = videoRef.current;
                  initialProgressApplied.current = true;
                  if (v) {
                    v.currentTime = 0;
                    saveProgress(0);
                  }
                }}
              >
                Xem lại từ đầu
              </button>
            </div>
          </div>
        </div>
      )}
      <p>
        <Link to={episode.series_id ? `/series/${episode.series_id}` : '/'} className="watch-episode__back">
          ← Quay lại series
        </Link>
      </p>
      <h1>Tập {episode.episode_number}: {episode.title}</h1>
      {episode.description && <p className="watch-episode__desc">{episode.description}</p>}

      {/* Khu vực video: luôn hiển thị, có video thì phát, không thì placeholder */}
      <div className="watch-episode__video-shell">
        {videoSrc ? (
          <>
            <p className="watch-episode__hint">Nhấn vào vùng video rồi dùng: Space (phát/tạm dừng), ← → (tua 10 giây, tự lưu lịch sử).</p>
            <div
              ref={videoWrapRef}
              tabIndex={0}
              role="button"
              onClick={() => videoWrapRef.current?.focus()}
              onKeyDown={handleVideoKeyDown}
              className="watch-episode__video-focus"
            >
              <video
                ref={videoRef}
                controls
                className="watch-episode__video"
                src={videoSrc}
                onLoadedMetadata={handleVideoLoaded}
                onTimeUpdate={handleTimeUpdate}
                onPlaying={handleTimeUpdate}
                onPause={handlePause}
                onSeeked={handleSeeked}
              >
                Trình duyệt không hỗ trợ video.
              </video>
              {showSkipIntro && (
                <button
                  type="button"
                  className="watch-skip-intro-btn"
                  onClick={() => {
                    const v = videoRef.current;
                    const mode = (episode?.intro_mode || 'series').toString().toLowerCase();
                    const end =
                      mode === 'custom'
                        ? (episode?.intro_end_seconds != null ? Number(episode.intro_end_seconds) : null)
                        : (episode?.series_intro_end_seconds != null ? Number(episode.series_intro_end_seconds) : null);
                    if (v && end != null && isFinite(end)) v.currentTime = end;
                  }}
                >
                  Skip Intro
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="watch-episode__placeholder">
            Chưa có video cho tập này.
          </div>
        )}
      </div>

      {/* Đánh giá & bình luận */}
      {episode.series_id && (
        <ReviewSection
          contentType="episode"
          contentId={episodeId}
          title="Đánh giá & Bình luận tập này"
        />
      )}

      {/* Gợi ý xem: phim / series khác */}
      <DetailSuggestions type="series" contentId={String(episode.series_id || '')} onOpenInfo={setSuggestionModalItem} />
      <HeroBanner
        modalOnly
        externalModalItem={suggestionModalItem}
        onCloseModal={() => setSuggestionModalItem(null)}
      />
    </div>
  );
}

export default WatchEpisodePage;
