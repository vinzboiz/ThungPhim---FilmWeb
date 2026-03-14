function Footer() {
  return (
    <footer
      style={{
        marginTop: '40px',
        padding: '16px',
        borderTop: '1px solid #333',
        color: '#888',
        backgroundColor: '#000',
        fontSize: '13px',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span>© {new Date().getFullYear()} ThungPhim – Dự án học tập local.</span>
        <span>Backend: Node.js + Express + MySQL · Frontend: React + Vite</span>
      </div>
    </footer>
  );
}

export default Footer;

