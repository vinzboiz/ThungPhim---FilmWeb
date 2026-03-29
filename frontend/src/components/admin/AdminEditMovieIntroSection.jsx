import IntroRangeSlider from '../player/IntroRangeSlider';
import { API_BASE } from '../../apis/client';

export default function AdminEditMovieIntroSection({
  form,
  setForm,
  introVideoRef,
  introPreviewDuration,
  setIntroPreviewDuration,
}) {
  return (
    <div className="admin-intro-panel">
      <h3>Skip Intro (Movie)</h3>
      <p className="admin-intro-hint">
        Kéo 2 tay nắm để chọn đoạn intro. Khi người dùng xem phim, trong khoảng này sẽ hiện nút “Skip Intro”.
      </p>
      {form.video_url ? (
        <>
          <div className="admin-intro-video-wrap">
            <video
              ref={introVideoRef}
              src={String(form.video_url).startsWith('http') ? form.video_url : `${API_BASE}${form.video_url}`}
              controls
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (isFinite(d) && d > 0) setIntroPreviewDuration(d);
              }}
              className="admin-intro-video"
            />
            <IntroRangeSlider
              attachedBelowVideo
              durationSeconds={
                introPreviewDuration > 0
                  ? introPreviewDuration
                  : Number(form.duration_minutes)
                    ? Number(form.duration_minutes) * 60
                    : 0
              }
              startSeconds={form.intro_start_seconds === '' ? 0 : Number(form.intro_start_seconds)}
              endSeconds={form.intro_end_seconds === '' ? 0 : Number(form.intro_end_seconds)}
              onChange={({ startSeconds, endSeconds }) => {
                setForm((prev) => ({
                  ...prev,
                  intro_start_seconds: String(startSeconds),
                  intro_end_seconds: String(endSeconds),
                }));
              }}
              onSeek={(sec) => {
                const v = introVideoRef.current;
                if (v) v.currentTime = sec;
              }}
            />
          </div>
          <div className="admin-intro-actions">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, intro_start_seconds: '', intro_end_seconds: '' }))}
            >
              Xóa intro
            </button>
          </div>
        </>
      ) : (
        <p className="admin-intro-empty">Chưa có video, hãy upload/gán Video URL trước.</p>
      )}
    </div>
  );
}
