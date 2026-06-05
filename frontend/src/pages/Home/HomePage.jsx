import { Link } from 'react-router-dom';
import './HomePage.css';

const HERO_BOOKS = [
  {
    id: 1,
    icon: '🧠',
    gradient: '',
    title: 'Tư duy nhanh và chậm',
    author: 'Daniel Kahneman',
    price: '79.000₫',
    featured: true,
  },
  {
    id: 2,
    icon: '🚀',
    gradient: '--2',
    title: 'Zero to One',
    author: 'Peter Thiel',
    price: '65.000₫',
  },
  {
    id: 3,
    icon: '🌊',
    gradient: '--3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    price: '89.000₫',
  },
];

const STATS = [
  { value: '50K+', label: 'Đầu sách' },
  { value: '2M+',  label: 'Độc giả' },
  { value: '4.9★', label: 'Đánh giá' },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Đọc mượt mà',
    desc: 'Không quảng cáo, không gián đoạn. Giao diện đọc tối ưu cho mắt.'
  },
  {
    icon: '📱',
    title: 'Đa thiết bị',
    desc: 'Tự động đồng bộ tiến độ đọc giữa điện thoại, máy tính bảng và laptop.'
  },
  {
    icon: '📶',
    title: 'Đọc offline',
    desc: 'Tải ebook trực tiếp về thiết bị và đọc bất kỳ nơi đâu không cần Internet.'
  },
  {
    icon: '🔒',
    title: 'Bảo mật & Bản quyền',
    desc: 'Sách bản quyền chất lượng cao, giao dịch mua bán an toàn tuyệt đối.'
  }
];

const POPULAR_CATEGORIES = [
  { id: 'technology', label: 'Công nghệ', icon: '💻', count: '12,500+ sách' },
  { id: 'business', label: 'Kinh doanh', icon: '📈', count: '8,200+ sách' },
  { id: 'science', label: 'Khoa học', icon: '🌌', count: '5,400+ sách' },
  { id: 'selfhelp', label: 'Kỹ năng sống', icon: '🌱', count: '9,100+ sách' },
  { id: 'literature', label: 'Văn học', icon: '📚', count: '6,800+ sách' }
];

export default function HomePage() {
  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero__inner">
          {/* Left – Text content */}
          <div className="home-hero__content">
            <span className="home-hero__eyebrow">
              ✨ Nền tảng ebook #1 Việt Nam
            </span>

            <h1 className="home-hero__title" id="hero-title">
              Đọc sách hay,<br />
              <em>Không giới hạn</em>
            </h1>

            <p className="home-hero__description">
              Khám phá hàng chục nghìn đầu ebook chất lượng cao. Đọc mọi lúc, mọi nơi,
              trên mọi thiết bị. Tải về đọc offline và chia sẻ với gia đình.
            </p>

            <div className="home-hero__actions">
              <Link to="/browse" className="btn btn-primary home-hero__btn-primary">
                🔭 Khám phá ngay
              </Link>
              <a href="#featured" className="home-hero__btn-secondary">
                ▶ Xem demo
              </a>
            </div>

            <div className="home-hero__stats">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className="home-hero__stat-value">{stat.value}</div>
                  <div className="home-hero__stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right – Book stack visual */}
          <div className="home-hero__visual" aria-hidden="true">
            <div className="home-hero__book-stack">
              {HERO_BOOKS.map((book) => (
                <div
                  key={book.id}
                  className="home-hero__book-card"
                >
                  <div className={`home-hero__book-cover home-hero__book-cover${book.gradient || ''}`}>
                    {book.icon}
                  </div>
                  <div className="home-hero__book-info">
                    <div className="home-hero__book-title">{book.title}</div>
                    <div className="home-hero__book-author">{book.author}</div>
                    <div className="home-hero__book-price">{book.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features container" id="featured">
        <div className="section-header">
          <span className="section-eyebrow">Trải nghiệm khác biệt</span>
          <h2 className="section-title">Tại sao nên đọc sách tại BookVerse?</h2>
          <p className="section-subtitle">Chúng tôi mang lại giải pháp đọc sách điện tử tối ưu nhất cho thói quen hàng ngày của bạn.</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feat, idx) => (
            <div key={idx} className="feature-card glass-card">
              <div className="feature-card__icon">{feat.icon}</div>
              <h3 className="feature-card__title">{feat.title}</h3>
              <p className="feature-card__desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="home-categories container">
        <div className="section-header">
          <span className="section-eyebrow">Khám phá đa dạng</span>
          <h2 className="section-title">Thể loại phổ biến</h2>
          <p className="section-subtitle">Tìm kiếm các tác phẩm xuất sắc nhất từ các danh mục được độc giả yêu thích.</p>
        </div>

        <div className="categories-grid">
          {POPULAR_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/browse?category=${cat.id}`}
              className="category-card glass-card"
            >
              <div className="category-card__icon-wrap">
                <span className="category-card__icon">{cat.icon}</span>
              </div>
              <div className="category-card__meta">
                <h3 className="category-card__title">{cat.label}</h3>
                <span className="category-card__count">{cat.count}</span>
              </div>
              <span className="category-card__arrow">→</span>
            </Link>
          ))}
        </div>

        <div className="home-categories__footer">
          <Link to="/browse" className="btn btn-ghost">
            Xem tất cả thể loại
          </Link>
        </div>
      </section>
    </div>
  );
}
