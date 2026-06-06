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
  { label: "Facebook", icon: "📘", href: "https://facebook.com" },
  { label: "Twitter", icon: "🐦", href: "https://twitter.com" },
  { label: "Instagram", icon: "📸", href: "https://instagram.com" },
  { label: "YouTube", icon: "▶️", href: "https://youtube.com" },
];

const LEGAL_LINKS = [
  { labelVi: "Chính sách bảo mật", to: "/privacy" },
  { labelVi: "Điều khoản sử dụng", to: "/terms" },
  { label: "Cookie", to: "/cookies" },
];

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
                className="footer__social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
              >
                {social.icon}
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
