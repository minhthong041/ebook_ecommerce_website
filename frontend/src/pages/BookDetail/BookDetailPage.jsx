import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BookCard from "../../components/BookCard/BookCard";
import { BOOKS } from "../../data/bookData";
import "./BookDetailPage.css";

const TABS = ["Mô tả", "Mục lục", "Đánh giá"];

function getAvatarGradient(username) {
  const gradients = [
    "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)", // Coral/Peach
    "linear-gradient(135deg, #4E65FF 0%, #92EFFD 100%)", // Blue/Aqua
    "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", // Teal/Green
    "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)", // Purple/Indigo
    "linear-gradient(135deg, #f80759 0%, #bc4e9c 100%)", // Rose/Magenta
    "linear-gradient(135deg, #F7971E 0%, #FFD200 100%)", // Gold/Amber
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash += username.charCodeAt(i);
  }
  return gradients[hash % gradients.length];
}

export default function BookDetailPage() {
  const { id } = useParams();
  const bookId = Number(id);
  const book = useMemo(
    () => BOOKS.find((item) => item.id === bookId),
    [bookId],
  );
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedFormat, setSelectedFormat] = useState(
    book?.formats?.[0] || "",
  );
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!book) {
    return (
      <div className="book-detail">
        <div className="container">
          <div className="breadcrumbs">
            <Link to="/" className="breadcrumbs__link">
              Trang chủ
            </Link>
            <span className="breadcrumbs__separator">/</span>
            <Link to="/browse" className="breadcrumbs__link">
              Thư viện
            </Link>
            <span className="breadcrumbs__separator">/</span>
            <span className="breadcrumbs__current">Không tìm thấy sách</span>
          </div>
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <h2>Không tìm thấy sách</h2>
            <p>Cuốn sách bạn tìm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/browse" className="btn btn-primary">
              Quay lại Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasDiscount = book.originalPrice > book.price;
  const discountPercent = hasDiscount
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : 0;

  const relatedBooks = BOOKS.filter((item) => item.id !== book.id).slice(0, 3);

  return (
    <div className="book-detail">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/" className="breadcrumbs__link">
            Trang chủ
          </Link>
          <span className="breadcrumbs__separator">/</span>
          <Link to="/browse" className="breadcrumbs__link">
            Thư viện
          </Link>
          <span className="breadcrumbs__separator">/</span>
          <span className="breadcrumbs__current">{book.title}</span>
        </div>

        <div className="book-detail__main">
          <aside className="book-detail__left">
            <div className="book-detail__cover-container">
              {/* Spine effect */}
              <div className="book-cover-spine" />
              {book.coverIcon ? (
                <div className="book-detail__cover-img-wrapper">
                  <div className="book-detail__cover-img" aria-hidden="true">
                    {book.coverIcon}
                  </div>
                </div>
              ) : (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="book-detail__cover-img"
                />
              )}
              {book.isBestseller && (
                <span className="book-detail__bestseller-badge">Bán chạy</span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost book-detail__preview-btn"
              onClick={() => setPreviewOpen(true)}
            >
              📖 Xem thử phần đầu
            </button>
          </aside>

          <section className="book-detail__right">
            <span className="book-detail__category">{book.categoryLabel}</span>
            <h1 className="book-detail__title">{book.title}</h1>
            <div className="book-detail__meta-row">
              <span>
                Tác giả:{" "}
                <Link to="/browse" className="book-detail__author-link">
                  {book.author}
                </Link>
              </span>
              <span className="book-detail__rating-summary">
                <span className="book-detail__stars">★</span>
                {book.rating} • {book.reviewsCount} đánh giá
              </span>
              <span>
                NXB: {new Date(book.publishDate).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <div className="book-detail__price-container">
              <span className="book-detail__price">
                {book.price.toLocaleString("vi-VN")}₫
              </span>
              {hasDiscount && (
                <span className="book-detail__original-price">
                  {book.originalPrice.toLocaleString("vi-VN")}₫
                </span>
              )}
              {hasDiscount && (
                <span className="book-detail__discount-badge">
                  -{discountPercent}%
                </span>
              )}
            </div>

            <p className="book-detail__short-desc">{book.description}</p>

            <div className="book-detail__formats-section">
              <div className="book-detail__formats-title">Hình thức đọc khả dụng</div>
              <div className="book-detail__formats-list">
                {book.formats.map((format) => (
                  <button
                    key={format}
                    type="button"
                    className={`book-detail__format-card${selectedFormat === format ? " book-detail__format-card--active" : ""}`}
                    onClick={() => setSelectedFormat(format)}
                  >
                    <span className="book-detail__format-icon">
                      {format === "PDF" ? "📄" : format === "EPUB" ? "📘" : "🎧"}
                    </span>
                    <span className="book-detail__format-name">{format}</span>
                    <span className="book-detail__format-price">
                      {book.price.toLocaleString("vi-VN")}₫
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="book-detail__actions">
              <button
                type="button"
                className="btn btn-primary book-detail__btn-buy"
                onClick={() => console.log("Mua ngay:", book.title)}
              >
                Mua ngay
              </button>
              <button
                type="button"
                className="btn btn-ghost book-detail__btn-cart"
                onClick={() => console.log("Thêm vào giỏ:", book.title)}
              >
                Thêm vào giỏ
              </button>
              <button
                type="button"
                className={`book-detail__wish-btn${isWishlisted ? " book-detail__wish-btn--active" : ""}`}
                aria-label="Yêu thích sách"
                onClick={() => setIsWishlisted((prev) => !prev)}
              >
                ❤
              </button>
            </div>
          </section>
        </div>

        <section className="book-detail__tabs-section">
          <div className="book-detail__tabs-header">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`book-detail__tab-btn${activeTab === tab ? " book-detail__tab-btn--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="book-detail__tab-content">
            {activeTab === "Mô tả" && (
              <div className="book-detail__tab-pane">
                <p className="book-detail__desc-text">{book.description}</p>
                <table className="specs-table">
                  <tbody>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">ISBN</td>
                      <td className="specs-table__value">{book.isbn}</td>
                    </tr>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">Số trang</td>
                      <td className="specs-table__value">{book.pages} trang</td>
                    </tr>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">Nhà xuất bản</td>
                      <td className="specs-table__value">{book.publisher}</td>
                    </tr>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">Ngôn ngữ</td>
                      <td className="specs-table__value">{book.language}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "Mục lục" && (
              <div className="book-detail__tab-pane">
                <div className="toc-list">
                  {book.tableOfContents.map((item, index) => (
                    <div key={item.title} className="toc-item">
                      <span className="toc-item__index">{index + 1}</span>
                      <span className="toc-item__title">{item.title}</span>
                      <span className="toc-item__page">trang {item.page}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Đánh giá" && (
              <div className="book-detail__tab-pane">
                <div className="reviews-container">
                  <div className="reviews-summary glass-card">
                    <div className="reviews-summary__score">{book.rating}</div>
                    <div className="reviews-summary__stars">
                      {"★".repeat(Math.floor(book.rating))}
                    </div>
                    <div className="reviews-summary__total">
                      trên {book.reviewsCount} lượt đánh giá
                    </div>
                  </div>
                  <div className="reviews-list">
                    {book.reviews.map((review) => (
                      <article
                        key={`${review.user}-${review.date}`}
                        className="review-item"
                      >
                        <div className="review-item__header">
                          <div className="review-item__user-info">
                            <div
                              className="review-item__avatar"
                              style={{ background: getAvatarGradient(review.user) }}
                            >
                              {review.user.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="review-item__username">
                                {review.user}
                              </div>
                              <div className="review-item__stars">
                                {"★".repeat(review.rating)}
                              </div>
                            </div>
                          </div>
                          <div className="review-item__date">{review.date}</div>
                        </div>
                        <p className="review-item__content">{review.comment}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="related-books">
          <h2 className="related-books__title">Sách liên quan có thể bạn thích</h2>
          <div className="book-grid">
            {relatedBooks.map((related) => (
              <Link
                key={related.id}
                to={`/book/${related.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <BookCard
                  book={related}
                  viewMode="grid"
                  isWishlisted={false}
                  onWishlistToggle={() => {}}
                  onAddToCart={() =>
                    console.log("Thêm vào giỏ:", related.title)
                  }
                />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {previewOpen && (
        <div className="preview-modal" role="dialog" aria-modal="true">
          <div
            className="preview-modal__backdrop"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="preview-modal__content">
            <div className="preview-modal__header">
              <div className="preview-modal__title">Đọc thử: {book.title}</div>
              <button
                type="button"
                className="preview-modal__close"
                onClick={() => setPreviewOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="preview-modal__body">
              <p className="preview-modal__sample-p">
                "Đây là một phần mở đầu mẫu để bạn cảm nhận phong cách viết và
                cách trình bày của cuốn sách. Nội dung này chỉ mang tính minh
                họa cho trải nghiệm người dùng."
              </p>
              <p className="preview-modal__sample-p">
                "Với mỗi định dạng sách mua tại BookVerse, bạn có thể lựa chọn đọc ebook theo cách phù
                hợp nhất trên mọi trình duyệt web. Hãy tận dụng bộ lọc và tìm hiểu thêm về sách trong
                phần thông tin chi tiết."
              </p>
              <p className="preview-modal__sample-p">
                "Chúc bạn có trải nghiệm đọc sách tuyệt vời và nhanh chóng tìm
                được đầu sách ưng ý trong tủ sách BookVerse."
              </p>
            </div>
            <div className="preview-modal__footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPreviewOpen(false)}
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
