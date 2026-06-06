import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookCard from "../../components/BookCard/BookCard";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./BookDetailPage.css";

const TABS = ["Mô tả", "Mục lục", "Đánh giá"];

function buildReviewSummary(reviews = []) {
  if (!reviews.length) {
    return {
      rating: 0,
      reviewsCount: 0,
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return {
    rating: Number((totalRating / reviews.length).toFixed(1)),
    reviewsCount: reviews.length,
  };
}

function getAvatarGradient(username) {
  const gradients = [
    "linear-gradient(135deg, #F87171 0%, #FB7185 100%)",
    "linear-gradient(135deg, #E75B5B 0%, #FDBA74 100%)",
    "linear-gradient(135deg, #B42323 0%, #F97316 100%)",
    "linear-gradient(135deg, #FB7185 0%, #FDA4AF 100%)",
    "linear-gradient(135deg, #DC2626 0%, #FCA5A5 100%)",
    "linear-gradient(135deg, #F97316 0%, #FECACA 100%)",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash += username.charCodeAt(i);
  }
  return gradients[hash % gradients.length];
}

function mapApiBookDetail(book) {
  const price = Number(book.price || 0);
  const originalPrice = Number(book.original_price || book.price || 0);
  const authors = book.authors || [];
  const categories = book.categories || [];
  const formats = (book.ebook_files || [])
    .map((ebookFile) => ebookFile.format_type?.name)
    .filter(Boolean);
  const chapters = book.chapters || [];
  const reviews = book.reviews || [];
  const reviewSummary = buildReviewSummary(reviews);

  return {
    id: book.id,
    title: book.title,
    author:
      authors.map((author) => author.full_name).filter(Boolean).join(", ") ||
      "Chưa cập nhật",
    categoryLabel:
      categories.map((category) => category.name).filter(Boolean).join(", ") ||
      "Chưa phân loại",
    price,
    originalPrice,
    rating: reviewSummary.rating,
    reviewsCount: reviewSummary.reviewsCount,
    formats,
    previewText: book.preview_text || "",
    previewSourceFormat: book.preview_source_format || "",
    coverUrl: book.cover_url,
    coverIcon: book.cover_url ? "" : "📚",
    isBestseller: false,
    isActive: book.is_active !== false,
    publishDate: book.year_of_publication
      ? `${book.year_of_publication}-01-01`
      : "1970-01-01",
    publisher: book.publisher?.name || "Chưa cập nhật",
    description: book.description || "Chưa có mô tả cho sách này.",
    isbn: "Chưa cập nhật",
    pages: chapters.length || "Chưa cập nhật",
    language: "Tiếng Việt",
    tableOfContents:
      chapters.length > 0
        ? chapters.map((chapter) => ({
            title: chapter.title,
            page: chapter.order_index,
          }))
        : [{ title: "Nội dung đang được cập nhật", page: 1 }],
    reviews,
  };
}

function mapRelatedBook(book) {
  const price = Number(book.price || 0);
  const originalPrice = Number(book.original_price || book.price || 0);
  return {
    id: book.id,
    title: book.title,
    author:
      (book.authors || [])
        .map((author) => author.full_name)
        .filter(Boolean)
        .join(", ") || "Chưa cập nhật",
    categoryLabel:
      (book.categories || [])
        .map((category) => category.name)
        .filter(Boolean)
        .join(", ") || "Chưa phân loại",
    price,
    originalPrice,
    rating: Number(book.average_rating || 0),
    reviewsCount: Number(book.review_count || 0),
    formats: book.format_labels || [],
    coverUrl: book.cover_url,
    coverIcon: book.cover_url ? "" : "📚",
    isBestseller: false,
    isActive: book.is_active !== false,
  };
}

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);
  const { addToCart } = useCart();
  const bookId = Number(id);
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [cartError, setCartError] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reportNotice, setReportNotice] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportingReviewId, setReportingReviewId] = useState(null);

  useEffect(() => {
    const loadBookTimer = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const [bookResponse, relatedResponse] = await Promise.all([
          axiosClient.get(`/books/${bookId}/`),
          axiosClient.get("/books/", { params: { page_size: 4 } }),
        ]);
        const mappedBook = mapApiBookDetail(bookResponse);
        const relatedApiBooks = relatedResponse.results || relatedResponse;
        setBook(mappedBook);
        setRelatedBooks(
          Array.isArray(relatedApiBooks)
            ? relatedApiBooks
                .filter((related) => related.id !== bookId)
                .slice(0, 3)
                .map(mapRelatedBook)
            : [],
        );
      } catch {
        setBook(null);
        setLoadError("Không thể tải chi tiết sách từ API.");
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(loadBookTimer);
  }, [bookId]);

  useEffect(() => {
    if (!isAuthReady || !book?.id) {
      return;
    }

    let isMounted = true;
    const loadUserBookStateTimer = window.setTimeout(async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setIsWishlisted(false);
          setBook((currentBook) =>
            currentBook
              ? { ...currentBook, isPurchased: false, hasPendingOrder: false }
              : currentBook,
          );
        }
        return;
      }

      try {
        const [wishlistResponse, libraryResponse, ordersResponse] = await Promise.all([
          axiosClient.get("/wishlists/"),
          axiosClient.get("/library/"),
          axiosClient.get("/orders/", { params: { status: "pending" } }),
        ]);
        const wishlistIds = new Set((wishlistResponse.book_ids || []).map(Number));
        const purchasedIds = new Set(
          (Array.isArray(libraryResponse) ? libraryResponse : [])
            .flatMap((library) => library.items || [])
            .map((item) => Number(item.book_id))
            .filter(Boolean),
        );
        const pendingIds = new Set(
          (Array.isArray(ordersResponse) ? ordersResponse : [])
            .flatMap((order) => order.items || [])
            .map((item) => Number(item.book_id))
            .filter(Boolean),
        );
        if (isMounted) {
          setIsWishlisted(wishlistIds.has(bookId));
          setBook((currentBook) =>
            currentBook
              ? {
                  ...currentBook,
                  isPurchased: purchasedIds.has(bookId),
                  hasPendingOrder: pendingIds.has(bookId),
                }
              : currentBook,
          );
        }
      } catch {
        if (isMounted) {
          setIsWishlisted(false);
        }
      }
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(loadUserBookStateTimer);
    };
  }, [book?.id, bookId, isAuthReady, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="book-detail">
        <div className="container">
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <h2>Đang tải sách</h2>
            <p>Đang lấy dữ liệu chi tiết từ backend API.</p>
          </div>
        </div>
      </div>
    );
  }

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
            <p>
              {loadError ||
                "Cuốn sách bạn tìm không tồn tại hoặc đã bị xóa."}
            </p>
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
  const hasReviews = book.reviewsCount > 0;
  const previewParagraphs = book.previewText
    ? book.previewText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  const handleAddToCart = async (targetBook, { goToCart = false } = {}) => {
    if (!targetBook.isActive) {
      setCartNotice("");
      setCartError(`"${targetBook.title}" hiện không khả dụng.`);
      return;
    }

    if (targetBook.isPurchased) {
      setCartNotice(`"${targetBook.title}" đã có trong thư viện của bạn.`);
      setCartError("");
      return;
    }

    if (targetBook.hasPendingOrder) {
      setCartNotice("");
      setCartError(`"${targetBook.title}" đang có đơn chờ thanh toán.`);
      return;
    }

    setCartNotice("");
    setCartError("");
    setIsAddingToCart(true);
    try {
      const result = await addToCart(targetBook);
      if (result.status === "duplicate") {
        setCartNotice(result.message);
      } else {
        setCartNotice(`Đã thêm "${targetBook.title}" vào giỏ hàng.`);
      }
      if (goToCart) {
        navigate("/cart");
      }
    } catch (error) {
      if (error.code === "LOGIN_REQUIRED") {
        navigate("/login");
        return;
      }
      setCartError(error.message || "Không thể thêm sách vào giỏ hàng.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const nextWishlisted = !isWishlisted;
    setIsWishlisted(nextWishlisted);
    setCartNotice("");
    setCartError("");
    try {
      if (nextWishlisted) {
        await axiosClient.post("/wishlists/", { book_id: book.id });
        setCartNotice("Đã thêm sách vào danh sách yêu thích.");
      } else {
        await axiosClient.delete(`/wishlists/${book.id}/`);
        setCartNotice("Đã bỏ sách khỏi danh sách yêu thích.");
      }
    } catch (error) {
      setIsWishlisted(!nextWishlisted);
      setCartError(
        error.response?.data?.detail ||
          "Không thể cập nhật danh sách yêu thích.",
      );
    }
  };

  const handleReportReview = async (review) => {
    setReportNotice("");
    setReportError("");
    setReportingReviewId(review.id);
    try {
      await axiosClient.post(`/book-reviews/${review.id}/report/`);
      setBook((currentBook) => {
        if (!currentBook) {
          return currentBook;
        }
        const remainingReviews = currentBook.reviews.filter(
          (currentReview) => currentReview.id !== review.id,
        );
        const reviewSummary = buildReviewSummary(remainingReviews);
        return {
          ...currentBook,
          reviews: remainingReviews,
          rating: reviewSummary.rating,
          reviewsCount: reviewSummary.reviewsCount,
        };
      });
      setReportNotice("Đã gửi báo cáo. Đội ngũ quản trị sẽ kiểm tra đánh giá này.");
    } catch (error) {
      setReportError(
        error.response?.data?.detail ||
          "Không thể gửi báo cáo đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setReportingReviewId(null);
    }
  };

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
              {hasReviews ? (
                <span className="book-detail__rating-summary">
                  <span className="book-detail__stars">★</span>
                  {book.rating} • {book.reviewsCount} đánh giá
                </span>
              ) : (
                <span className="book-detail__rating-summary book-detail__rating-summary--empty">
                  Chưa có đánh giá
                </span>
              )}
              <span>NXB: {book.publisher}</span>
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

            {!book.isActive && (
              <div className="book-detail__unavailable-message">
                Sách hiện không khả dụng. Bạn vẫn có thể xem thông tin, nhưng chưa thể mua hoặc thêm vào giỏ hàng.
              </div>
            )}

            <div className="book-detail__formats-section">
              <div className="book-detail__formats-title">Quyền lợi sau khi mua</div>
              <div className="book-detail__formats-list">
                {book.formats.length > 0 ? book.formats.map((format) => (
                  <div
                    key={format}
                    className="book-detail__format-card"
                  >
                    <span className="book-detail__format-icon">
                      {format === "PDF" ? "📄" : format === "EPUB" ? "📘" : "📱"}
                    </span>
                    <span className="book-detail__format-name">{format}</span>
                    <span className="book-detail__format-price">Được bao gồm</span>
                  </div>
                )) : (
                  <p className="book-detail__short-desc">
                    Sách này chưa có file ebook khả dụng.
                  </p>
                )}
                {book.formats.length > 0 && (
                  <div className="book-detail__format-card book-detail__format-card--reader">
                    <span className="book-detail__format-icon">🌐</span>
                    <span className="book-detail__format-name">Web reader</span>
                    <span className="book-detail__format-price">Đọc online</span>
                  </div>
                )}
              </div>
              {book.formats.length > 0 && (
                <p className="book-detail__formats-note">
                  Một lần mua bao gồm toàn bộ định dạng sách đã upload và quyền đọc trực tiếp trên web.
                </p>
              )}
            </div>

            <div className="book-detail__actions">
              <button
                type="button"
                className="btn btn-primary book-detail__btn-buy"
                disabled={isAddingToCart || !book.isActive || book.isPurchased || book.hasPendingOrder}
                onClick={() => handleAddToCart(book, { goToCart: true })}
              >
                {!book.isActive
                  ? "Không khả dụng"
                  : book.isPurchased
                    ? "Đã có trong thư viện"
                    : book.hasPendingOrder
                      ? "Đang chờ thanh toán"
                      : "Mua trọn bộ ebook"}
              </button>
              <button
                type="button"
                className="btn btn-ghost book-detail__btn-cart"
                disabled={isAddingToCart || !book.isActive || book.isPurchased || book.hasPendingOrder}
                onClick={() => handleAddToCart(book)}
              >
                {isAddingToCart ? "Đang thêm..." : "Thêm bộ ebook vào giỏ"}
              </button>
              <button
                type="button"
                className={`book-detail__wish-btn${isWishlisted ? " book-detail__wish-btn--active" : ""}`}
                aria-label="Yêu thích sách"
                onClick={handleWishlistToggle}
              >
                ❤
              </button>
            </div>
            {(cartNotice || cartError) && (
              <div
                className={`book-detail__cart-message${cartError ? " book-detail__cart-message--error" : ""}`}
              >
                {cartError || cartNotice}
              </div>
            )}
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
                {(reportNotice || reportError) && (
                  <div
                    className={`book-detail__review-report-message${
                      reportError ? " book-detail__review-report-message--error" : ""
                    }`}
                  >
                    {reportError || reportNotice}
                  </div>
                )}
                {hasReviews ? (
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
                          key={review.id}
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
                          {review.title && (
                            <h4 className="review-item__title">{review.title}</h4>
                          )}
                          <p className="review-item__content">{review.comment}</p>
                          <button
                            type="button"
                            className="review-item__report-button"
                            disabled={reportingReviewId === review.id}
                            onClick={() => handleReportReview(review)}
                          >
                            {reportingReviewId === review.id
                              ? "Đang báo cáo..."
                              : "Báo cáo nội dung xấu"}
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="reviews-empty glass-card">
                    <div className="reviews-empty__icon">☆</div>
                    <h3>Chưa có đánh giá</h3>
                    <p>Cuốn sách này chưa có lượt đánh giá nào từ độc giả.</p>
                  </div>
                )}
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
                  onAddToCart={() => handleAddToCart(related)}
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
              {previewParagraphs.length > 0 ? (
                <>
                  {book.previewSourceFormat && (
                    <p className="preview-modal__source">
                      Trích từ file {book.previewSourceFormat}
                    </p>
                  )}
                  {previewParagraphs.map((paragraph, index) => (
                    <p key={`${paragraph.slice(0, 24)}-${index}`} className="preview-modal__sample-p">
                      {paragraph}
                    </p>
                  ))}
                </>
              ) : (
                <div className="preview-modal__empty">
                  <h3>Chưa có nội dung đọc thử</h3>
                  <p>
                    Backend chưa trích được phần đầu từ file ebook. Hãy ưu tiên upload EPUB hoặc PDF
                    có text để hệ thống tạo preview tự động.
                  </p>
                </div>
              )}
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
