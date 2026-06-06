import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import './HomePage.css';

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

const formatCurrency = (value) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}₫`;

const getApiResults = (response) => {
  if (Array.isArray(response)) {
    return { count: response.length, results: response };
  }
  return {
    count: response?.count ?? response?.results?.length ?? 0,
    results: response?.results ?? [],
  };
};

const mapHeroBook = (book, index) => ({
  id: book.id,
  icon: '📘',
  gradient: index === 0 ? '' : `--${index + 1}`,
  title: book.title,
  author:
    book.authors?.map((author) => author.full_name).filter(Boolean).join(', ') ||
    book.publisher?.name ||
    'Ebook',
  price: formatCurrency(book.price),
  coverUrl: book.cover_url || '',
});

const mapPopularCategory = (category) => {
  const bookCount = Number(category.book_count || 0);

  return {
    id: category.id,
    label: category.name || 'Chưa phân loại',
    bookCount,
  };
};

const buildStats = (catalogCount) => [
  { value: String(catalogCount), label: 'Đầu sách hiện có' },
  { value: 'PDF', label: 'Đọc và tải file' },
  { value: 'EPUB', label: 'Hỗ trợ ebook' },
];

export default function HomePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [heroBooks, setHeroBooks] = useState([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [popularCategories, setPopularCategories] = useState([]);

  useEffect(() => {
    let isCancelled = false;

    axiosClient
      .get('/books/', { params: { page_size: 3, ordering: '-id' } })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        const { count, results } = getApiResults(response);
        setCatalogCount(count);
        setHeroBooks(results.map(mapHeroBook));
      })
      .catch(() => {
        if (!isCancelled) {
          setCatalogCount(0);
          setHeroBooks([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    axiosClient
      .get('/categories/', { params: { ordering: '-book_count' } })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        const { results } = getApiResults(response);
        const categories = results
          .map(mapPopularCategory)
          .filter((category) => category.bookCount > 0)
          .sort(
            (a, b) =>
              b.bookCount - a.bookCount || a.label.localeCompare(b.label, 'vi'),
          )
          .slice(0, 5);

        setPopularCategories(categories);
      })
      .catch(() => {
        if (!isCancelled) {
          setPopularCategories([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const stats = buildStats(catalogCount);

  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero__inner">
          {/* Left – Text content */}
          <div className="home-hero__content">
            <span className="home-hero__eyebrow">
              ✨ Nền tảng ebook Readify
            </span>

            <h1 className="home-hero__title" id="hero-title">
              Đọc sách hay,<br />
              <em>Không giới hạn</em>
            </h1>

            <p className="home-hero__description">
              Khám phá catalog ebook của cửa hàng. Đọc mọi lúc, mọi nơi,
              trên mọi thiết bị và tải các định dạng ebook đã sở hữu.
            </p>

            <div className="home-hero__actions">
              <Link to="/browse" className="btn btn-primary home-hero__btn-primary">
                🔭 Khám phá ngay
              </Link>
              <Link
                to={isAuthenticated ? "/account" : "/login"}
                className="home-hero__btn-secondary"
              >
                {isAuthenticated ? "👤 Hồ sơ cá nhân" : "🔐 Đăng nhập"}
              </Link>
            </div>

            <div className="home-hero__stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="home-hero__stat-value">{stat.value}</div>
                  <div className="home-hero__stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right – Book stack visual */}
          <div className="home-hero__visual" aria-label="Sách mới trong catalog">
            <div className={`home-hero__book-stack ${heroBooks.length ? '' : 'home-hero__book-stack--empty'}`}>
              {heroBooks.length ? (
                heroBooks.map((book) => (
                <Link
                  key={book.id}
                  className="home-hero__book-card"
                  to={`/book/${book.id}`}
                >
                  <div className={`home-hero__book-cover home-hero__book-cover${book.gradient || ''}`}>
                    {book.coverUrl ? <img src={book.coverUrl} alt="" /> : book.icon}
                  </div>
                  <div className="home-hero__book-info">
                    <div className="home-hero__book-title">{book.title}</div>
                    <div className="home-hero__book-author">{book.author}</div>
                    <div className="home-hero__book-price">{book.price}</div>
                  </div>
                </Link>
                ))
              ) : (
                <div className="home-hero__empty-card">
                  <div className="home-hero__empty-icon">📚</div>
                  <div>
                    <div className="home-hero__book-title">Chưa có sách nào</div>
                    <div className="home-hero__book-author">
                      Sách upload mới sẽ xuất hiện tại đây.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features container" id="featured">
        <div className="section-header">
          <span className="section-eyebrow">Trải nghiệm khác biệt</span>
          <h2 className="section-title">Tại sao nên đọc sách tại Readify?</h2>
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
          {popularCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/browse?category=${cat.id}`}
              className="category-card glass-card"
              aria-label={`${cat.label}, ${cat.bookCount} sách`}
            >
              <span className="category-card__title">{cat.label}</span>
            </Link>
          ))}
          {!popularCategories.length && (
            <div className="category-card category-card--empty glass-card">
              <span className="category-card__title">Chưa có thể loại</span>
            </div>
          )}
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
