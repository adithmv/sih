import { Languages, Phone, ShieldCheck, X } from "lucide-react";
import { languageOptions, useI18n } from "@/lib/i18n";

export function GovLayout({ children, language, setLanguage, error, clearError, onHome }) {
  const { t } = useI18n();
  return <div className="gov-site">
    <a className="skip-link" href="#main-content">{t("skip")}</a>
    <header className="simple-header">
      <div className="container header-row">
        <button className="brand-button" onClick={onHome} aria-label={t("home")}>
          <span className="state-mark"><ShieldCheck size={28} /></span>
          <span className="brand-copy"><small>{t("govt")} · {t("dept")}</small><strong>{t("appName")}</strong><span>{t("appTag")}</span></span>
        </button>
        <a className="header-help" href="tel:180042555214"><Phone size={19} /><span><small>{t("helpline")}</small><strong>1800 425 55214</strong></span></a>
      </div>
    </header>
    <div className="language-bar">
      <div className="container language-bar-inner"><span><Languages size={18} />{t("chooseLanguage")}</span><div>{languageOptions.map(([code,label]) => <button key={code} className={language === code ? "active" : ""} onClick={() => setLanguage(code)} aria-pressed={language === code}>{label}</button>)}</div></div>
    </div>
    <div className="safety-line"><div className="container">🔒 {t("safety")}</div></div>
    {error && <div className="container error-banner" role="alert"><span>{error}</span><button onClick={clearError} aria-label={t("dismiss")}><X size={20} /></button></div>}
    <main id="main-content" className="container main-content">{children}</main>
    <footer className="site-footer"><div className="container minimal-footer"><div><strong>{t("appName")}</strong><p>{t("footerLine")}</p></div><a href="tel:180042555214"><Phone size={18} /> {t("needHelp")} 1800 425 55214</a></div><div className="copyright">© {t("copyright")}</div></footer>
  </div>;
}

export function PageHeading({ eyebrow, title, description, onBack }) { const { t } = useI18n(); return <div className="page-heading">{onBack && <button className="back-link" onClick={onBack}>← {t("back")}</button>}<span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>; }
export function ActionButton({ children, secondary=false, loading=false, disabled=false, onClick, type="button" }) { return <button type={type} className={secondary ? "button button-secondary" : "button button-primary"} disabled={disabled || loading} onClick={onClick}>{loading && <span className="spinner" aria-hidden="true" />}{children}</button>; }
