import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BookCard from "../../components/BookCard/BookCard";
import { BOOKS } from "../../data/bookData";
import "./BookDetailPage.css";

const TABS = ["Mo ta", "Noi dung", "Danh gia"];

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
              Trang chu
            </Link>
            <span className="breadcrumbs__separator">/</span>
            <Link to="/browse" className="breadcrumbs__link">
              Thu vien
            </Link>
            <span className="breadcrumbs__separator">/</span>
            <span className="breadcrumbs__current">Khong tim thay sach</span>
          </div>
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <h2>Khong tim thay sach</h2>
            <p>Cuon sach ban tim khong ton tai hoac da bi xoa.</p>
            <Link to="/browse" className="btn btn-primary">
              Quay lai Browse
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
            Trang chu
          </Link>
          <span className="breadcrumbs__separator">/</span>
          <Link to="/browse" className="breadcrumbs__link">
            Thu vien
          </Link>
          <span className="breadcrumbs__separator">/</span>
          <span className="breadcrumbs__current">{book.title}</span>
        </div>

        <div className="book-detail__main">
          <aside className="book-detail__left">
            <div className="book-detail__cover-container">
              {book.coverIcon ? (
                <div className="book-detail__cover-img" aria-hidden="true">
                  {book.coverIcon}
                </div>
              ) : (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="book-detail__cover-img"
                />
              )}
              {book.isBestseller && (
                <span className="book-detail__bestseller-badge">Ban chay</span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-secondary book-detail__preview-btn"
              onClick={() => setPreviewOpen(true)}
            >
              Xem thu phan dau
            </button>
          </aside>

          <section className="book-detail__right">
            <span className="book-detail__category">{book.categoryLabel}</span>
            <h1 className="book-detail__title">{book.title}</h1>
            <div className="book-detail__meta-row">
              <span>
                Tac gia{" "}
                <Link to="/browse" className="book-detail__author-link">
                  {book.author}
                </Link>
              </span>
              <span className="book-detail__rating-summary">
                <span className="book-detail__stars">★</span>
                {book.rating} • {book.reviewsCount} danh gia
              </span>
              <span>
                {new Date(book.publishDate).toLocaleDateString("vi-VN")}
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
              <div className="book-detail__formats-title">Hinh thuc doc</div>
              <div className="book-detail__formats-list">
                {book.formats.map((format) => (
                  <button
                    key={format}
                    type="button"
                    className={`book-detail__format-card${selectedFormat === format ? " book-detail__format-card--active" : ""}`}
                    onClick={() => setSelectedFormat(format)}
                  >
                    <span className="book-detail__format-icon">📘</span>
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
                onClick={() => console.log("Them vao gio:", book.title)}
              >
                Them vao gio
              </button>
              <button
                type="button"
                className={`book-detail__wish-btn${isWishlisted ? " book-detail__wish-btn--active" : ""}`}
                aria-label="Yeu thich sach"
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
            {activeTab === "Mo ta" && (
              <div className="book-detail__tab-pane">
                <p className="book-detail__desc-text">{book.description}</p>
                <table className="specs-table">
                  <tbody>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">ISBN</td>
                      <td className="specs-table__value">{book.isbn}</td>
                    </tr>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">Trang</td>
                      <td className="specs-table__value">{book.pages}</td>
                    </tr>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">Nha xuat ban</td>
                      <td className="specs-table__value">{book.publisher}</td>
                    </tr>
                    <tr className="specs-table__row">
                      <td className="specs-table__label">Ngon ngu</td>
                      <td className="specs-table__value">{book.language}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "Noi dung" && (
              <div className="book-detail__tab-pane">
                <div className="toc-list">
                  {book.tableOfContents.map((item) => (
                    <div key={item.title} className="toc-item">
                      <span className="toc-item__title">{item.title}</span>
                      <span className="toc-item__page">trang {item.page}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Danh gia" && (
              <div className="book-detail__tab-pane">
                <div className="reviews-container">
                  <div className="reviews-summary">
                    <div className="reviews-summary__score">{book.rating}</div>
                    <div className="reviews-summary__total">
                      tren {book.reviewsCount} luot danh gia
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
                            <div className="review-item__avatar">
                              {review.user.slice(0, 2).toUpperCase()}
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
          <h2 className="related-books__title">Sach lien quan</h2>
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
                    console.log("Them vao gio:", related.title)
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
              <div className="preview-modal__title">Xem thu: {book.title}</div>
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
                "Day la mot phan mo dau mau de ban cam nhan phong cach viet va
                cach trinh bay cua cuon sach. Noi dung nay chi mang tinh minh
                hoa."
              </p>
              <p className="preview-modal__sample-p">
                "Voi moi dinh dang, ban co the lua chon doc ebook theo cach phu
                hop nhat. Hay tan dung bo loc va tim hieu them ve sach trong
                phan thong tin chi tiet."
              </p>
              <p className="preview-modal__sample-p">
                "Chuc ban co trai nghiem doc sach tuyet voi va nhanh chong tim
                duoc dau sach ung y trong BookVerse."
              </p>
            </div>
            <div className="preview-modal__footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPreviewOpen(false)}
              >
                Dong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
