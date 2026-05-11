import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-content">
      <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
        miphobook
      </span>
      <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '8px' }}>
        © 2026 — Nem toda foto é só uma imagem.
      </span>
      
      <div style={{ marginTop: '32px', opacity: 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Com o apoio de</span>
        <a href="https://cubie.com.br/" target="_blank" rel="noopener noreferrer" style={{ filter: 'grayscale(1)' }}>
          <img 
            src="https://content.cubie.com.br/assets/cubiecloud-watermark.png" 
            alt="CubieCloud" 
            width="80" 
            className="cubie-watermark-small"
          />
        </a>
      </div>
    </footer>
  );
}
