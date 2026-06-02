import { Link } from 'react-router-dom'
import './HomePage.css'

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
]

const STATS = [
  { value: '50K+', label: 'Đầu sách' },
  { value: '2M+',  label: 'Độc giả' },
  { value: '4.9★', label: 'Đánh giá' },
]

export default function HomePage() {
  return (
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
  )
}
