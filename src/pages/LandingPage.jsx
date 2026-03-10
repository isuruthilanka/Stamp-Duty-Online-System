import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="hero-background"></div>
      <div className="hero-overlay"></div>

      <div className="department-branding-corner">
        <span className="dept-full-title">Department of Revenue - Western Province</span>
      </div>

      <div className="decor-blur circle-1"></div>
      <div className="decor-blur circle-2"></div>
      <div className="decor-blur circle-3"></div>

      <div className="main-layout">
        {/* Left Column: Branding & Info */}
        <section className="branding-section">
          <div className="branding-header">
            <div className="branding-top">
              <img src="/emblem-sri-lanka.svg" alt="Sri Lanka Emblem" className="provincial-logo" />
              <h1 className="hero-title">Western Province Stamp Duty Digital Platform</h1>
            </div>

            <div className="branding-sub-header">
              <div className="shield-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#D4AF37" />
                  <polyline points="9 11 11 13 15 9" stroke="white" />
                </svg>
              </div>
              <h2 className="hero-subtitle-primary">Secure, Transparent, and Seamless.</h2>
            </div>

            <div className="branding-divider">
              <span className="divider-line"></span>
              <span className="divider-motif">⬥ ◈ ⬥</span>
              <span className="divider-line"></span>
            </div>

            <p className="hero-tagline">
              “A secure and fully integrated digital platform providing end-to-end stamp duty administration through transparent, compliant, and efficient processes, supporting effective revenue management and accountable public financial governance in the Western Province.”
            </p>
          </div>

          <div className="compact-info-new">
            <div className="feature-grid">
              <div className="feature-mini"><span className="feature-icon">◈</span> Secure Verification</div>
              <div className="feature-mini"><span className="feature-icon">◈</span> Auto Calculations</div>
              <div className="feature-mini"><span className="feature-icon">◈</span> Real-time Tracking</div>
              <div className="feature-mini"><span className="feature-icon">◈</span> Digital Certificates</div>
            </div>
          </div>
        </section>

        {/* Right Column: Authentication */}
        <section className="auth-section-new">
          <div className="auth-card" onClick={() => navigate('/department-login')}>
            <div className="card-icon">🏛️</div>
            <h3>Department Portal</h3>
            <p>Exclusive access for Departmental Users.</p>
            <button className="btn-primary">Officer Login</button>
          </div>

          <div className="auth-card" onClick={() => navigate('/login')}>
            <div className="card-icon">⚖️</div>
            <h3>General Portal</h3>
            <p>For Lawyers, Notaries, Financial Institutions, and the Public.</p>
            <button className="btn-primary">Enter Portal</button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 Department of Revenue - Western Province. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
