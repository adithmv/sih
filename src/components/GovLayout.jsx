import { Accessibility, Languages, Menu, Phone, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export function GovLayout({ children, language, setLanguage, error, clearError }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="gov-site">
      <div className="utility-bar">
        <div className="container utility-inner">
          <span>കേരള സർക്കാർ &nbsp;|&nbsp; Government of Kerala</span>
          <div className="utility-actions">
            <a href="#main-content">Skip to main content</a>
            <span className="utility-divider" />
            <Accessibility size={15} aria-hidden="true" />
            <span>A−</span><span>A</span><span>A+</span>
            <span className="utility-divider" />
            <Languages size={15} aria-hidden="true" />
            <select aria-label="Choose language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ml">മലയാളം</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>
        </div>
      </div>

      <header className="department-header">
        <div className="container brand-row">
          <div className="state-mark" aria-hidden="true"><ShieldCheck size={32} /></div>
          <div className="brand-copy">
            <span className="department-name">Labour &amp; Skills Department</span>
            <strong>Migrant Health &amp; Claim Services</strong>
            <span>Integrated worker health identity and insurance portal</span>
          </div>
          <div className="helpline">
            <Phone size={21} aria-hidden="true" />
            <div><span>Toll-free assistance</span><strong>1800-425-55214</strong></div>
          </div>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Primary navigation">
        <div className="container nav-inner">
          <a href="#main-content">Home</a><a href="#services">Services</a><a href="#main-content">Track Claim</a><a href="#footer">Help &amp; Support</a>
        </div>
      </nav>

      <div className="service-alert">
        <div className="container"><strong>Citizen notice:</strong> Never share your OTP or Aadhaar details with unauthorised persons.</div>
      </div>

      {error && (
        <div className="container error-banner" role="alert">
          <span>{error}</span><button onClick={clearError} aria-label="Dismiss message"><X size={18} /></button>
        </div>
      )}

      <main id="main-content" className="container main-content">{children}</main>

      <footer id="footer" className="site-footer">
        <div className="container footer-grid">
          <div><strong>Migrant Health &amp; Claim Services</strong><p>An initiative of the Labour &amp; Skills Department, Government of Kerala.</p></div>
          <div><strong>Quick links</strong><a href="#services">Citizen services</a><a href="#main-content">Track a claim</a></div>
          <div><strong>Need help?</strong><p>Call 1800-425-55214<br />Monday–Saturday, 8 AM–8 PM</p></div>
        </div>
        <div className="copyright">© Government of Kerala. This prototype connects to authorised health-service APIs.</div>
      </footer>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, onBack }) {
  return <div className="page-heading">
    {onBack && <button className="back-link" onClick={onBack}>← Back</button>}
    <span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}
  </div>;
}

export function ActionButton({ children, secondary = false, loading = false, disabled = false, onClick, type = "button" }) {
  return <button type={type} className={secondary ? "button button-secondary" : "button button-primary"} disabled={disabled || loading} onClick={onClick}>
    {loading ? <span className="spinner" aria-hidden="true" /> : null}{children}
  </button>;
}
