import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./LibraryPage.css";

export default function LibraryPage() {
  const [libraries, setLibraries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [reviewBook, setReviewBook] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  useEffect(() => {
    const loadTimer = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await axiosClient.get("/library/");
        setLibraries(Array.isArray(response) ? response : []);
      } catch {
        setLoadError("Không thể tải thư viện của bạn.");
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const books = useMemo(
    () =>
      libraries.flatMap((library) =>
        (library.items || []).map((item) => ({
          id: item.book_id,
          title: item.book_title,
          isActive: item.is_active !== false,
          author:
            (item.authors || [])
              .map((author) => author.full_name)
              .filter(Boolean)
              .join(", ") || "Chưa cập nhật",
          genre: library.name || "Thư viện",
          progress: Number(item.progress || 0),
          review: item.review || null,
          coverUrl: item.cover_url || "",
          icon: "📘",
        })),
      ),
    [libraries],
  );

  const openReviewModal = (book) => {
    setFeedback(null);
    setReviewError("");

    if (!book.isActive) {
      setFeedback({
        type: "error",
        message: `"${book.title}" hiện không khả dụng.`,
      });
      return;
    }

    if (book.progress < 10) {
      setFeedback({
        type: "error",
        message: `Bạn cần đọc ít nhất 10% "${book.title}" trước khi đánh giá.`,
      });
      return;
    }

    setReviewBook(book);
    setReviewRating(Number(book.review?.rating || 5));
    setReviewTitle(book.review?.title || "");
    setReviewComment(book.review?.comment || "");
  };

  const handleOpenReader = (event, book) => {
    if (book.isActive) {
      return;
    }

    event.preventDefault();
    setFeedback({
      type: "error",
      message: `"${book.title}" hiện không khả dụng.`,
    });
  };

  const closeReviewModal = () => {
    if (isSubmittingReview || isDeletingReview) {
      return;
    }
    setReviewBook(null);
    setReviewError("");
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!reviewBook) {
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");
    try {
      const savedReview = await axiosClient.post("/book-reviews/", {
        book: reviewBook.id,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });

      setLibraries((currentLibraries) =>
        currentLibraries.map((library) => ({
          ...library,
          items: (library.items || []).map((item) =>
            item.book_id === reviewBook.id
              ? {
                  ...item,
                  review: savedReview,
                }
              : item,
          ),
        })),
      );
      setFeedback({
        type: "success",
        message: `Đã gửi đánh giá cho "${reviewBook.title}". Đánh giá sẽ hiển thị sau khi được duyệt.`,
      });
      setReviewBook(null);
    } catch (error) {
      setReviewError(
        error.response?.data?.detail ||
          "Không thể lưu đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewBook?.review?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Xóa đánh giá của bạn cho "${reviewBook.title}"? Đánh giá sẽ không còn hiển thị, nhưng hệ thống vẫn lưu lại để đối soát.`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingReview(true);
    setReviewError("");
    try {
      await axiosClient.delete(`/book-reviews/${reviewBook.review.id}/`);
      setLibraries((currentLibraries) =>
        currentLibraries.map((library) => ({
          ...library,
          items: (library.items || []).map((item) =>
            item.book_id === reviewBook.id
              ? {
                  ...item,
                  review: null,
                }
              : item,
          ),
        })),
      );
      setFeedback({
        type: "success",
        message: `Đã xóa đánh giá cho "${reviewBook.title}".`,
      });
      setReviewBook(null);
    } catch (error) {
      setReviewError(
        error.response?.data?.detail ||
          "Không thể xóa đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setIsDeletingReview(false);
    }
  };

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
        <Link to="/browse" className="btn btn-primary">
          🛒 Mua sách mới
        </Link>
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

      {feedback && (
        <div className={`library-feedback library-feedback--${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {isLoading ? (
        <section className="library-empty glass-card">
          <div className="library-empty-icon">⏳</div>
          <h2>Đang tải thư viện</h2>
          <p>Đang đồng bộ các ebook bạn đã mua.</p>
        </section>
      ) : loadError ? (
        <section className="library-empty glass-card">
          <div className="library-empty-icon">⚠️</div>
          <h2>Không thể tải thư viện</h2>
          <p>{loadError}</p>
        </section>
      ) : books.length === 0 ? (
        <section className="library-empty glass-card">
          <div className="library-empty-icon">📚</div>
          <h2>Thư viện đang trống</h2>
          <p>Các ebook đã mua sẽ xuất hiện tại đây.</p>
          <Link to="/browse" className="btn btn-primary">
            Mua sách
          </Link>
        </section>
      ) : (
        <section className="library-grid">
          {books.map((book) => (
            <article
              key={book.id}
              className={`library-book-card glass-card${!book.isActive ? " library-book-card--inactive" : ""}`}
            >
              <Link
                to={`/reader/${book.id}`}
                className="library-book-card__main"
                onClick={(event) => handleOpenReader(event, book)}
              >
                <div className="library-cover">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={`Bìa sách ${book.title}`} />
                  ) : (
                    <div className="library-cover-icon">{book.icon || "📘"}</div>
                  )}
                </div>
                <div className="library-book-meta">
                  <p className="library-book-genre">{book.genre}</p>
                  <h3>{book.title}</h3>
                  <p className="library-book-author">{book.author}</p>
                  {!book.isActive && (
                    <p className="library-book-status">Không khả dụng</p>
                  )}
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
              </Link>
              <div className="library-book-actions">
                <Link
                  to={`/reader/${book.id}`}
                  className="btn btn-primary library-book-actions__read"
                  onClick={(event) => handleOpenReader(event, book)}
                >
                  Đọc sách
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost library-book-actions__review"
                  onClick={() => openReviewModal(book)}
                >
                  {book.review ? "Sửa đánh giá" : "Viết đánh giá"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {reviewBook && (
        <div className="library-review-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="library-review-modal__backdrop"
            aria-label="Đóng cửa sổ đánh giá"
            onClick={closeReviewModal}
          />
          <form
            className="library-review-modal__card"
            onSubmit={handleSubmitReview}
          >
            <div className="library-review-modal__header">
              <div>
                <p className="library-review-modal__eyebrow">
                  Đánh giá sách
                </p>
                <h2>{reviewBook.title}</h2>
              </div>
              <button
                type="button"
                className="library-review-modal__close"
                onClick={closeReviewModal}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="library-review-modal__stars" aria-label="Chọn số sao">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`library-review-modal__star${
                    rating <= reviewRating
                      ? " library-review-modal__star--active"
                      : ""
                  }`}
                  onClick={() => setReviewRating(rating)}
                  aria-label={`${rating} sao`}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="library-review-modal__field">
              <span>Tiêu đề đánh giá</span>
              <input
                type="text"
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                maxLength={255}
                placeholder="Ví dụ: Một cuốn sách rất đáng đọc"
              />
            </label>

            <label className="library-review-modal__field">
              <span>Nhận xét của bạn</span>
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={5}
                placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
              />
            </label>

            {reviewError && (
              <div className="library-review-modal__error">{reviewError}</div>
            )}

            <div className="library-review-modal__actions">
              {reviewBook.review?.id && (
                <button
                  type="button"
                  className="btn btn-ghost library-review-modal__delete"
                  onClick={handleDeleteReview}
                  disabled={isSubmittingReview || isDeletingReview}
                >
                  {isDeletingReview ? "Đang xóa..." : "Xóa đánh giá"}
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeReviewModal}
                disabled={isSubmittingReview || isDeletingReview}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmittingReview || isDeletingReview}
              >
                {isSubmittingReview ? "Đang lưu..." : "Lưu đánh giá"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
