export default function ContentDetailTrailerSection({
  youtubeEmbedUrl,
  localTrailerSrc,
  trailerSectionRef,
}) {
  return (
    <section className="movie-detail-trailer" ref={trailerSectionRef}>
      <h2>Trailer</h2>
      {youtubeEmbedUrl ? (
        <div className="detail-trailer-video detail-trailer-video--embed">
          <iframe
            src={youtubeEmbedUrl}
            title="Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <video src={localTrailerSrc} controls className="detail-trailer-video" />
      )}
    </section>
  );
}
