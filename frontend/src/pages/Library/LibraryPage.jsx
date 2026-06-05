import { Link } from "react-router-dom";
import "./LibraryPage.css";

const books = [
  {
    id: 1,
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    genre: "Công nghệ",
    progress: 42,
    icon: "🧠",
  },
  {
    id: 2,
    title: "Đắc Nhân Tâm (How to Win Friends and Influence People)",
    author: "Dale Carnegie",
    genre: "Kỹ năng sống",
    progress: 74,
    icon: "🤝",
  },
  {
    id: 3,
    title: "Nghĩ Giàu và Làm Giàu (Think and Grow Rich)",
    author: "Napoleon Hill",
    genre: "Kinh doanh",
    progress: 100,
    icon: "💵",
  },
  {
    id: 4,
    title: "Lược Sử Thời Gian (A Brief History of Time)",
    author: "Stephen Hawking",
    genre: "Khoa học",
    progress: 56,
    icon: "🌌",
  },
];

export default function LibraryPage() {
  return (
    <div className="library-page container">
      <section className="library-hero">
        <div>
          <p className="library-eyebrow">Thư viện</p>
          <h1 className="library-title">Quản lý toàn bộ ebook của bạn</h1>
          <p className="library-sub">
            Duyệt, theo dõi tiến độ và đặt lại hành trình đọc sách của bạn từ
            một dashboard chuyên nghiệp.
          </p>
        </div>
        <button className="btn btn-primary">Thêm sách mới</button>
      </section>

      <div className="library-highlights">
        <article className="library-card library-card--highlight">
          <p className="library-card-label">Số sách hiện có</p>
          <h2>{books.length}</h2>
        </article>
        <article className="library-card library-card--accent">
          <p className="library-card-label">Đang đọc</p>
          <h2>
            {books.filter((b) => b.progress > 0 && b.progress < 100).length}
          </h2>
        </article>
        <article className="library-card library-card--accent2">
          <p className="library-card-label">Hoàn thành</p>
          <h2>{books.filter((b) => b.progress === 100).length}</h2>
        </article>
      </div>

      <section className="library-grid">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/reader/${book.id}`}
            className="library-book-card-link"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "grid",
            }}
          >
            <article className="library-book-card glass-card">
              <div className="library-cover">
                <div className="library-cover-icon">{book.icon || "📘"}</div>
              </div>
              <div className="library-book-meta">
                <p className="library-book-genre">{book.genre}</p>
                <h3>{book.title}</h3>
                <p className="library-book-author">{book.author}</p>
              </div>
              <div className="library-progress">
                <span>{book.progress}%</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </div>
  );
}
