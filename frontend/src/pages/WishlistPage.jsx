import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import BookCard from "../components/BookCard/BookCard";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./WishlistPage.css";

function mapApiBook(book) {
  const price = Number(book.price || 0);
  const authors = book.authors || [];
  const categories = book.categories || [];

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
    originalPrice: price,
    rating: Number(book.average_rating || 0),
    reviewsCount: Number(book.review_count || 0),
    formats: book.format_labels || [],
    coverUrl: book.cover_url,
    coverIcon: book.cover_url ? "" : "📚",
    isBestseller: false,
    isActive: book.is_active !== false,
    publishDate: book.year_of_publication
      ? `${book.year_of_publication}-01-01`
      : "1970-01-01",
    description: book.description,
  };
}

function getBookIdsFromLibraries(libraries) {
  return new Set(
    (Array.isArray(libraries) ? libraries : [])
      .flatMap((library) => library.items || [])
      .map((item) => Number(item.book_id))
      .filter(Boolean),
  );
}

function getBookIdsFromOrders(orders) {
  return new Set(
    (Array.isArray(orders) ? orders : [])
      .flatMap((order) => order.items || [])
      .map((item) => Number(item.book_id))
      .filter(Boolean),
  );
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);
  const { addToCart } = useCart();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [purchasedBookIds, setPurchasedBookIds] = useState(() => new Set());
  const [pendingBookIds, setPendingBookIds] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthReady) {
      return undefined;
    }

    if (!isAuthenticated) {
      const clearTimer = window.setTimeout(() => {
        setBooks([]);
        setPurchasedBookIds(new Set());
        setPendingBookIds(new Set());
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }

    let isMounted = true;
    const loadTimer = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");
      setNotice("");
      setActionError("");
      try {
        const [wishlistResponse, libraryResponse, ordersResponse] = await Promise.all([
          axiosClient.get("/wishlists/"),
          axiosClient.get("/library/"),
          axiosClient.get("/orders/", { params: { status: "pending" } }),
        ]);

        if (isMounted) {
          setBooks((wishlistResponse.items || []).map(mapApiBook));
          setPurchasedBookIds(getBookIdsFromLibraries(libraryResponse));
          setPendingBookIds(getBookIdsFromOrders(ordersResponse));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error.response?.data?.detail ||
              "Không thể tải danh sách yêu thích.",
          );
          setBooks([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(loadTimer);
    };
  }, [isAuthReady, isAuthenticated]);

  const decoratedBooks = useMemo(
    () =>
      books.map((book) => ({
        ...book,
        isPurchased: purchasedBookIds.has(book.id),
        hasPendingOrder: pendingBookIds.has(book.id),
      })),
    [books, pendingBookIds, purchasedBookIds],
  );

  const visibleBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return decoratedBooks;
    }

    return decoratedBooks.filter((book) => {
      const titleMatch = book.title.toLowerCase().includes(query);
      const authorMatch = book.author.toLowerCase().includes(query);
      const categoryMatch = book.categoryLabel.toLowerCase().includes(query);
      return titleMatch || authorMatch || categoryMatch;
    });
  }, [decoratedBooks, search]);

  const handleWishlistToggle = async (bookId) => {
    setNotice("");
    setActionError("");
    const removedBook = books.find((book) => book.id === bookId);
    setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));

    try {
      await axiosClient.delete(`/wishlists/${bookId}/`);
      setNotice(
        removedBook
          ? `Đã bỏ "${removedBook.title}" khỏi danh sách yêu thích.`
          : "Đã bỏ sách khỏi danh sách yêu thích.",
      );
    } catch (error) {
      if (removedBook) {
        setBooks((currentBooks) => [removedBook, ...currentBooks]);
      }
      setActionError(
        error.response?.data?.detail ||
          "Không thể cập nhật danh sách yêu thích.",
      );
    }
  };

  const handleAddToCart = async (book) => {
    if (!book.isActive) {
      setNotice("");
      setActionError(`"${book.title}" hiện không khả dụng.`);
      return;
    }

    if (book.isPurchased) {
      setNotice(`"${book.title}" đã có trong thư viện của bạn.`);
      setActionError("");
      return;
    }

    if (book.hasPendingOrder) {
      setNotice("");
      setActionError(`"${book.title}" đang có đơn chờ thanh toán.`);
      return;
    }

    setNotice("");
    setActionError("");
    try {
      const result = await addToCart(book);
      if (result.status === "duplicate") {
        setNotice(result.message);
      } else {
        setNotice(`Đã thêm "${book.title}" vào giỏ hàng.`);
      }
    } catch (error) {
      if (error.code === "LOGIN_REQUIRED") {
        navigate("/login");
        return;
      }
      setActionError(error.message || "Không thể thêm sách vào giỏ hàng.");
    }
  };

  const handleOpenBook = (event, book) => {
    if (book.isActive) {
      return;
    }

    event.preventDefault();
    setNotice("");
    setActionError(`"${book.title}" hiện không khả dụng.`);
  };

  return (
    <section className="wishlist-page">
      <div className="wishlist-hero">
        <div>
          <p className="wishlist-eyebrow">Danh sách cá nhân</p>
          <h1 className="wishlist-title">Sách yêu thích</h1>
          <p className="wishlist-sub">
            Lưu lại những ebook bạn quan tâm để quay lại mua hoặc đọc thông tin
            chi tiết sau.
          </p>
        </div>
        <Link to="/browse" className="btn btn-primary wishlist-browse-btn">
          Khám phá thêm sách
        </Link>
      </div>

      <div className="wishlist-summary">
        <div className="wishlist-summary__card">
          <span>Tổng sách yêu thích</span>
          <strong>{books.length}</strong>
        </div>
        <div className="wishlist-summary__card">
          <span>Đã có trong thư viện</span>
          <strong>{decoratedBooks.filter((book) => book.isPurchased).length}</strong>
        </div>
        <div className="wishlist-summary__card">
          <span>Đang chờ thanh toán</span>
          <strong>{decoratedBooks.filter((book) => book.hasPendingOrder).length}</strong>
        </div>
      </div>

      {(notice || actionError) && (
        <div
          className={`wishlist-feedback${actionError ? " wishlist-feedback--error" : ""}`}
        >
          {actionError || notice}
        </div>
      )}

      <div className="wishlist-toolbar">
        <input
          type="search"
          className="wishlist-search"
          placeholder="Tìm trong sách yêu thích..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Tìm trong danh sách yêu thích"
        />
        {search && (
          <button
            type="button"
            className="btn btn-ghost wishlist-clear-btn"
            onClick={() => setSearch("")}
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {loadError ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty__icon">⚠️</div>
          <h2>Không tải được danh sách yêu thích</h2>
          <p>{loadError}</p>
        </div>
      ) : isLoading ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty__icon">⏳</div>
          <h2>Đang tải danh sách yêu thích</h2>
          <p>Readify đang lấy các sách bạn đã bấm tim.</p>
        </div>
      ) : books.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty__icon">❤</div>
          <h2>Chưa có sách yêu thích</h2>
          <p>
            Khi bạn bấm biểu tượng trái tim ở trang Khám phá hoặc chi tiết sách,
            sách sẽ xuất hiện ở đây.
          </p>
          <Link to="/browse" className="btn btn-primary">
            Đi tới Khám phá
          </Link>
        </div>
      ) : visibleBooks.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty__icon">🔍</div>
          <h2>Không tìm thấy sách phù hợp</h2>
          <p>Thử tìm bằng tên sách, tác giả hoặc thể loại khác.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSearch("")}
          >
            Xóa tìm kiếm
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {visibleBooks.map((book) => (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              onClick={(event) => handleOpenBook(event, book)}
              className="wishlist-book-link"
            >
              <BookCard
                book={book}
                isWishlisted
                onWishlistToggle={handleWishlistToggle}
                onAddToCart={handleAddToCart}
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
