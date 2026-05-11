import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-content" style={{ opacity: 0.3, borderTop: 'none' }}>
      <span style={{ fontSize: '10px', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '400' }}>
        miphobook
      </span>
      <span style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}>
        © 2026 — Nem toda foto é só uma imagem.
      </span>
      
      <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Com o apoio de</span>
        <a href="https://cubie.com.br/" target="_blank" rel="noopener noreferrer" style={{ filter: 'grayscale(1)' }}>
          <img 
            src="https://content.cubie.com.br/assets/cubiecloud-watermark.png" 
            alt="CubieCloud" 
            width="60" 
            style={{ opacity: 0.5 }}
          />
        </a>
      </div>
    </footer>
  );
}
