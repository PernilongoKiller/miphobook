import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-cubie-content">
      <span className="cubie-text">
        Powered by <a href="https://cubie.com.br/" target="_blank" rel="noopener noreferrer" className="cubie-link">CubieCloud</a>
      </span>
      <a href="https://cubie.com.br/" target="_blank" rel="noopener noreferrer" className="cubie-img-link">
        <img 
          src="https://content.cubie.com.br/assets/cubiecloud-watermark.png" 
          alt="CubieCloud Logo" 
          width="103" 
          height="30" 
          className="cubie-watermark"
        />
      </a>
    </footer>
  );
}
