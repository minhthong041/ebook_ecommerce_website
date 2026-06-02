import { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const EXPLORE_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Khám phá sách", to: "/browse" },
  { label: "Sách mới nhất", to: "/new-arrivals" },
  { label: "Sách miễn phí", to: "/free" },
  { label: "Thể loại", to: "/categories" },
];

const SUPPORT_LINKS = [
  { label: "Trung tâm hỗ trợ", to: "/help" },
  { label: "Liên hệ chúng tôi", to: "/contact" },
  { label: "Chính sách hoàn trả", to: "/refund-policy" },
  { label: "Câu hỏi thường gặp", to: "/faq" },
  { label: "Sơ đồ trang", to: "/sitemap" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", icon: "📘", href: "https://facebook.com" },
  { label: "Twitter", icon: "🐦", href: "https://twitter.com" },
  { label: "Instagram", icon: "📸", href: "https://instagram.com" },
  { label: "YouTube", icon: "▶️", href: "https://youtube.com" },
];

const LEGAL_LINKS = [
  { label: "Chính sách bảo mật", to: "/privacy" },
  { label: "Điều khoản sử dụng", to: "/terms" },
  { label: "Cookie", to: "/cookies" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="footer">
      <div className="footer__main">
        {/* Brand Column */}
        <div className="footer__brand">
          <Link
            to="/"
            className="footer__logo"
            aria-label="BookVerse – Trang chủ"
          >
            <div className="footer__logo-icon" aria-hidden="true">
              📖
            </div>
            <span className="footer__logo-text">BookVerse</span>
          </Link>
          <p className="footer__tagline">
            Nền tảng ebook hàng đầu Việt Nam. Hàng nghìn đầu sách chất lượng,
            đọc mọi lúc mọi nơi trên mọi thiết bị.
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
          <h3 className="footer__col-title">Khám phá</h3>
          <nav className="footer__links" aria-label="Điều hướng khám phá">
            {EXPLORE_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="footer__link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Support Column */}
        <div className="footer__col">
          <h3 className="footer__col-title">Hỗ trợ</h3>
          <nav className="footer__links" aria-label="Hỗ trợ khách hàng">
            {SUPPORT_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="footer__link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Newsletter Column */}
        <div className="footer__newsletter">
          <h3 className="footer__col-title">Nhận thông báo</h3>
          <p className="footer__newsletter-desc">
            Đăng ký để nhận ưu đãi độc quyền, sách mới và nội dung hay mỗi tuần.
          </p>

          {subscribed ? (
            <p
              style={{
                color: "var(--accent-light)",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              ✅ Đăng ký thành công! Cảm ơn bạn.
            </p>
          ) : (
            <form
              className="footer__newsletter-form"
              onSubmit={handleSubscribe}
              aria-label="Form đăng ký nhận bản tin"
            >
              <div className="footer__newsletter-input-wrap">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  className="footer__newsletter-input"
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Địa chỉ email"
                  required
                />
              </div>
              <button
                type="submit"
                className="footer__newsletter-btn"
                id="footer-subscribe-btn"
              >
                ✉️ Đăng ký ngay
              </button>
              <p className="footer__newsletter-note">
                🔒 Chúng tôi không bao giờ chia sẻ email của bạn.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <p className="footer__copyright">
            © {new Date().getFullYear()} BookVerse. All rights reserved.
          </p>
          <nav className="footer__legal" aria-label="Điều khoản pháp lý">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="footer__legal-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
