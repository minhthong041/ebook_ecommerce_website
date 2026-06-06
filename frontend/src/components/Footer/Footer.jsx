import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePreferences } from "../../context/usePreferences";
import "./Footer.css";

const EXPLORE_LINKS = [
  { labelKey: "app.home", to: "/" },
  { labelKey: "app.browse", to: "/browse" },
  { labelVi: "Sách mới nhất", to: "/new-arrivals" },
  { labelVi: "Sách miễn phí", to: "/free" },
  { labelVi: "Thể loại", to: "/categories" },
];

const SUPPORT_LINKS = [
  { labelVi: "Trung tâm hỗ trợ", to: "/help" },
  { labelVi: "Liên hệ chúng tôi", to: "/contact" },
  { labelVi: "Chính sách hoàn trả", to: "/refund-policy" },
  { labelVi: "Câu hỏi thường gặp", to: "/faq" },
  { labelVi: "Sơ đồ trang", to: "/sitemap" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", brand: "facebook", href: "https://facebook.com" },
  { label: "Instagram", brand: "instagram", href: "https://instagram.com" },
  { label: "X", brand: "x", href: "https://x.com" },
  { label: "YouTube", brand: "youtube", href: "https://youtube.com" },
];

const LEGAL_LINKS = [
  { labelVi: "Chính sách bảo mật", to: "/privacy" },
  { labelVi: "Điều khoản sử dụng", to: "/terms" },
  { label: "Cookie", to: "/cookies" },
];

function SocialIcon({ brand }) {
  if (brand === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14.12 8.02h2.02V5.13c-.35-.05-1.56-.15-2.96-.15-2.93 0-4.94 1.79-4.94 5.07v2.82H5v3.24h3.24V24h3.98v-7.89h3.12l.5-3.24h-3.62v-2.5c0-.94.25-1.58 1.9-1.58Z" />
      </svg>
    );
  }

  if (brand === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="4" y="4" width="16" height="16" rx="4.5" />
        <circle cx="12" cy="12" r="3.8" />
        <circle cx="17.1" cy="6.9" r="1.1" />
      </svg>
    );
  }

  if (brand === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.96 6.82H1.69l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

export default function Footer() {
  const { t } = usePreferences();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const emailRef = useRef(null);
  const getLabel = (link) =>
    link.labelKey ? t(link.labelKey) : link.labelVi || link.label;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("Điền thiếu thông tin email.");
      emailRef.current?.focus();
      return;
    }
    setEmailError("");
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="footer">
      <div className="footer__main">
        {/* Brand Column */}
        <div className="footer__brand">
          <Link
            to="/"
            className="footer__logo"
            aria-label="Readify – Trang chủ"
          >
            <div className="footer__logo-icon" aria-hidden="true">
              <img src="/logo.svg" alt="" className="footer__logo-img" />
            </div>
            <span className="footer__logo-text">Readify</span>
          </Link>
          <p className="footer__tagline">
            {t("footer.tagline")}
          </p>
          <div className="footer__socials">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={`footer__social-link footer__social-link--${social.brand}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
              >
                <SocialIcon brand={social.brand} />
              </a>
            ))}
          </div>
        </div>

        {/* Explore Column */}
        <div className="footer__col">
          <h3 className="footer__col-title">{t("footer.explore")}</h3>
          <nav className="footer__links" aria-label="Điều hướng khám phá">
            {EXPLORE_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="footer__link">
                {getLabel(link)}
              </Link>
            ))}
          </nav>
        </div>

        {/* Support Column */}
        <div className="footer__col">
          <h3 className="footer__col-title">{t("footer.support")}</h3>
          <nav className="footer__links" aria-label="Hỗ trợ khách hàng">
            {SUPPORT_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="footer__link">
                {getLabel(link)}
              </Link>
            ))}
          </nav>
        </div>

        {/* Newsletter Column */}
        <div className="footer__newsletter">
          <h3 className="footer__col-title">{t("footer.newsletter")}</h3>
          <p className="footer__newsletter-desc">
            {t("footer.newsletterDesc")}
          </p>

          {subscribed ? (
            <p
              style={{
                color: "var(--accent-light)",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              ✅ {t("footer.success")}
            </p>
          ) : (
            <form
              className="footer__newsletter-form"
              onSubmit={handleSubscribe}
              aria-label="Form đăng ký nhận bản tin"
              noValidate
            >
              <div className="footer__newsletter-input-wrap">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  className="footer__newsletter-input"
                  placeholder={t("footer.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  aria-label="Địa chỉ email"
                  ref={emailRef}
                />
              </div>
              {emailError && (
                <p
                  style={{
                    margin: 0,
                    color: "var(--accent-light)",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                  }}
                >
                  {emailError}
                </p>
              )}
              <button
                type="submit"
                className="footer__newsletter-btn"
                id="footer-subscribe-btn"
              >
                ✉️ {t("footer.subscribe")}
              </button>
              <p className="footer__newsletter-note">
                🔒 {t("footer.privacyNote")}
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <p className="footer__copyright">
            © {new Date().getFullYear()} Readify. {t("footer.rights")}
          </p>
          <nav className="footer__legal" aria-label="Điều khoản pháp lý">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="footer__legal-link">
                {getLabel(link)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
