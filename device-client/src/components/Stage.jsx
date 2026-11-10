/** Menampilkan satu content layar penuh sesuai tipenya. */
export default function Stage({ content, loop, onEnded, onError }) {
  switch (content.tipe) {
    case 'image':
      return <img className="stage-media" src={content.payload} alt={content.judul} onError={onError} />;
    case 'video':
      return (
        <video
          className="stage-media"
          src={content.payload}
          autoPlay
          muted
          playsInline
          loop={loop}
          onEnded={onEnded}
          onError={onError}
        />
      );
    case 'text':
      return (
        <div className="stage-text">
          <p>{content.payload}</p>
        </div>
      );
    case 'url':
      return <iframe className="stage-frame" src={content.payload} title={content.judul} allow="autoplay; fullscreen" />;
    default:
      return null;
  }
}
