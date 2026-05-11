import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-content" style={{ opacity: 0.2, marginTop: '40px', padding: '20px' }}>
      <a href="https://cubie.com.br/" target="_blank" rel="noopener noreferrer" style={{ filter: 'grayscale(1)' }}>
        <img 
          src="https://content.cubie.com.br/assets/cubiecloud-watermark.png" 
          alt="CubieCloud" 
          width="50" 
        />
      </a>
    </footer>
  );
}
