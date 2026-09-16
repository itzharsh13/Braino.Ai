import React from 'react';

const Footer = () => {
  return (
    <footer className="footer-web3 page-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="footer-web3__card">
          <div className="footer-web3__top">
            <div>
              <p className="footer-web3__brand">
                Braino<span className="text-neon-cyan">AI</span>
              </p>
              <p className="footer-web3__tagline">Calm care, guided by AI.</p>
            </div>
            <div className="footer-web3__links">
              {['Privacy', 'Terms', 'Support', 'Contact'].map((l) => (
                <a key={l} href="#" className="footer-web3__link">{l}</a>
              ))}
            </div>
          </div>
          <div className="footer-web3__line" />
          <p className="footer-web3__copy">© 2025 Braino AI · Mental health support made simpler.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
