import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookCard from "../../components/BookCard/BookCard";
import CategoryFilter from "../../components/CategoryFilter/CategoryFilter";
import axiosClient from "../../api/axiosClient";
import { useCart } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import "./BrowsePage.css";

function mapApiBook(book) {
  const price = Number(book.price || 0);
  const authors = book.authors || [];
  const categories = book.categories || [];
  const formats = book.format_labels || [];

  return {
    id: book.id,
    title: book.title,
    author:
      authors.map((author) => author.full_name).filter(Boolean).join(", ") ||
      "Chưa cập nhật",
    categoryIds: categories.map((category) => String(category.id)),
    categoryLabel:
      categories.map((category) => category.name).filter(Boolean).join(", ") ||
      "Chưa phân loại",
    price,
    originalPrice: price,
    rating: Number(book.average_rating || 0),
    reviewsCount: Number(book.review_count || 0),
    formats,
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

export default function BrowsePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [includePurchased, setIncludePurchased] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState([]);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [cartError, setCartError] = useState("");
  const [purchasedBookIds, setPurchasedBookIds] = useState(() => new Set());
  const [pendingBookIds, setPendingBookIds] = useState(() => new Set());

  const itemsPerPage = 6;

  useEffect(() => {
    const loadBooksTimer = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await axiosClient.get("/books/", {
          params: { page_size: 100 },
        });
        const apiBooks = response.results || response;
        setBooks(Array.isArray(apiBooks) ? apiBooks.map(mapApiBook) : []);
      } catch {
        setLoadError("Không thể tải catalog sách từ API.");
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(loadBooksTimer);
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) {
      const clearLibraryTimer = window.setTimeout(() => {
        setPurchasedBookIds(new Set());
        setPendingBookIds(new Set());
        setWishlist([]);
      }, 0);
      return () => window.clearTimeout(clearLibraryTimer);
    }

    let isMounted = true;
    const loadUserStateTimer = window.setTimeout(async () => {
      try {
        const [libraryResponse, ordersResponse, wishlistResponse] = await Promise.all([
          axiosClient.get("/library/"),
          axiosClient.get("/orders/", { params: { status: "pending" } }),
          axiosClient.get("/wishlists/"),
        ]);
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
          setPurchasedBookIds(purchasedIds);
          setPendingBookIds(pendingIds);
          setWishlist((wishlistResponse.book_ids || []).map(Number));
        }
      } catch {
        if (isMounted) {
          setPurchasedBookIds(new Set());
          setPendingBookIds(new Set());
        }
      }
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(loadUserStateTimer);
    };
  }, [isAuthReady, isAuthenticated]);

  const categoryFilters = useMemo(() => {
    const categoryMap = new Map();
    books.forEach((book) => {
      book.categoryIds.forEach((categoryId, index) => {
        const label = book.categoryLabel.split(", ")[index] || "Chưa phân loại";
        const current = categoryMap.get(categoryId);
        categoryMap.set(categoryId, {
          value: categoryId,
          label,
          count: (current?.count || 0) + 1,
        });
      });
    });
    return Array.from(categoryMap.values());
  }, [books]);

  // Handlers for Filters
  const handleCatChange = (catValue) => {
    setSelectedCats((prev) =>
      prev.includes(catValue)
        ? prev.filter((c) => c !== catValue)
        : [...prev, catValue],
    );
    setCurrentPage(1);
  };

  const toggleWishlist = async (id) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const isWishlisted = wishlist.includes(id);
    setWishlist((prev) =>
      isWishlisted ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setCartNotice("");
    setCartError("");
    try {
      if (isWishlisted) {
        await axiosClient.delete(`/wishlists/${id}/`);
        setCartNotice("Đã bỏ sách khỏi danh sách yêu thích.");
      } else {
        await axiosClient.post("/wishlists/", { book_id: id });
        setCartNotice("Đã thêm sách vào danh sách yêu thích.");
      }
    } catch (error) {
      setWishlist((prev) =>
        isWishlisted ? [...prev, id] : prev.filter((item) => item !== id),
      );
      setCartError(
        error.response?.data?.detail ||
          "Không thể cập nhật danh sách yêu thích.",
      );
    }
  };

  const handleAddToCart = async (book) => {
    if (!book.isActive) {
      setCartNotice("");
      setCartError(`"${book.title}" hiện không khả dụng.`);
      return;
    }

    if (book.isPurchased) {
      setCartNotice(`"${book.title}" đã có trong thư viện của bạn.`);
      setCartError("");
      return;
    }

    if (book.hasPendingOrder) {
      setCartNotice("");
      setCartError(`"${book.title}" đang có đơn chờ thanh toán.`);
      return;
    }

    setCartNotice("");
    setCartError("");
    try {
      const result = await addToCart(book);
      if (result.status === "duplicate") {
        setCartNotice(result.message);
      } else {
        setCartNotice(`Đã thêm "${book.title}" vào giỏ hàng.`);
      }
    } catch (error) {
      if (error.code === "LOGIN_REQUIRED") {
        navigate("/login");
        return;
      }
      setCartError(error.message || "Không thể thêm sách vào giỏ hàng.");
    }
  };

  const handleOpenBook = (event, book) => {
    if (book.isActive) {
      return;
    }

    event.preventDefault();
    setCartNotice("");
    setCartError(`"${book.title}" hiện không khả dụng.`);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCats([]);
    setIncludePurchased(false);
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setCurrentPage(1);
  };

  const handleClearCategories = () => {
    setSelectedCats([]);
    setCurrentPage(1);
  };

  // Filter and Sort Logic
  const filteredBooks = useMemo(() => {
    return books.map((book) => ({
      ...book,
      isPurchased: purchasedBookIds.has(book.id),
      hasPendingOrder: pendingBookIds.has(book.id),
    })).filter((book) => {
      if (!includePurchased && book.isPurchased) {
        return false;
      }

      // Search check
      if (search.trim()) {
        const query = search.toLowerCase();
        const titleMatch = book.title.toLowerCase().includes(query);
        const authorMatch = book.author.toLowerCase().includes(query);
        if (!titleMatch && !authorMatch) return false;
      }

      // Categories check
      if (
        selectedCats.length > 0 &&
        !book.categoryIds.some((categoryId) => selectedCats.includes(categoryId))
      ) {
        return false;
      }

      // Price range check
      if (minPrice && book.price < parseFloat(minPrice)) return false;
      if (maxPrice && book.price > parseFloat(maxPrice)) return false;

      // Rating check
      if (minRating > 0 && book.rating < minRating) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "popular") return b.reviewsCount - a.reviewsCount;
      if (sortBy === "newest")
        return new Date(b.publishDate) - new Date(a.publishDate);
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [
    search,
    selectedCats,
    includePurchased,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    books,
    purchasedBookIds,
    pendingBookIds,
  ]);

  // Pagination Logic
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBooks, currentPage]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Common JSX Filter Content (Shared between Sidebar and Mobile Drawer)
  const renderFilterContent = () => (
    <>
      {/* Search Filter */}
      <div className="filter-group">
        <span className="filter-group__title">Tìm kiếm nhanh</span>
        <div className="filter-search">
          <span className="filter-search__icon">🔍</span>
          <input
            type="search"
            className="filter-search__input"
            placeholder="Tên sách, tác giả..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Tìm kiếm nhanh trong trang"
          />
        </div>
      </div>

      <CategoryFilter
        categories={categoryFilters}
        selectedCats={selectedCats}
        onToggleCategory={handleCatChange}
        onClearCategories={handleClearCategories}
      />

      <div className="filter-group">
        <span className="filter-group__title">Sách đã mua</span>
        <label className="filter-checkbox-row">
          <input
            type="checkbox"
            checked={includePurchased}
            onChange={(event) => {
              setIncludePurchased(event.target.checked);
              setCurrentPage(1);
            }}
          />
          <span>Đã mua</span>
        </label>
      </div>

      {/* Price Range Filter */}
      <div className="filter-group">
        <span className="filter-group__title">Khoảng giá (đ)</span>
        <div className="filter-price">
          <input
            type="number"
            className="filter-price__input"
            placeholder="Từ"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Giá tối thiểu"
          />
          <span className="filter-price__to">đến</span>
          <input
            type="number"
            className="filter-price__input"
            placeholder="Đến"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Giá tối đa"
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div className="filter-group">
        <span className="filter-group__title">Đánh giá tối thiểu</span>
        <div className="filter-ratings-list">
          {[4.5, 4.0, 3.5].map((rating) => {
            const isSelected = minRating === rating;
            return (
              <button
                key={rating}
                type="button"
                className={`filter-rating-row ${isSelected ? "filter-rating-row--active" : ""}`}
                onClick={() => {
                  setMinRating(isSelected ? 0 : rating);
                  setCurrentPage(1);
                }}
              >
                <span className="filter-rating-stars">
                  {"★".repeat(Math.floor(rating))}
                  {rating % 1 !== 0 ? "½" : ""}
                </span>
                <span className="filter-rating-label">{rating} trở lên</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="browse-page">
      <div className="container">
        <div className="browse-page__inner">
          {/* ---- Desktop Sidebar ---- */}
          <aside className="browse-sidebar" aria-label="Bộ lọc tìm kiếm">
            <div className="browse-sidebar__header">
              <h2 className="browse-sidebar__title">Bộ lọc</h2>
              <button
                type="button"
                className="browse-sidebar__reset-btn"
                onClick={handleResetFilters}
              >
                Xóa lọc
              </button>
            </div>
            {renderFilterContent()}
          </aside>

          {/* ---- Main Catalog Area ---- */}
          <main className="browse-content" aria-label="Danh sách sách">
            {/* Page Header */}
            <section className="browse-hero">
              <p className="browse-hero__eyebrow">Danh mục Readify</p>
              <h1 className="browse-hero__title">Khám phá kho Ebook</h1>
              <p className="browse-hero__subtitle">
                Lọc nhanh, duyệt sách theo thể loại yêu thích để tìm ngay tựa
                sách phù hợp.
              </p>
            </section>

            {/* Toolbar */}
            <div className="catalog-toolbar">
              <div className="catalog-toolbar__results">
                Tìm thấy <strong>{filteredBooks.length}</strong> kết quả
              </div>

              <div className="catalog-toolbar__actions">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  className="catalog-toolbar__filter-trigger"
                  onClick={() => setDrawerOpen(true)}
                >
                  ⚙️ Bộ lọc
                </button>

                {/* Sort */}
                <div className="catalog-toolbar__sort">
                  <span className="catalog-toolbar__sort-label">Sắp xếp:</span>
                  <select
                    className="catalog-toolbar__sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Tiêu chí sắp xếp"
                  >
                    <option value="popular">Bán chạy nhất</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                    <option value="rating">Đánh giá tốt nhất</option>
                  </select>
                </div>

                {/* View Switcher */}
                <div className="catalog-toolbar__view-modes">
                  <button
                    type="button"
                    className={`catalog-toolbar__view-btn${viewMode === "grid" ? " catalog-toolbar__view-btn--active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    aria-label="Dạng lưới"
                  >
                    田
                  </button>
                  <button
                    type="button"
                    className={`catalog-toolbar__view-btn${viewMode === "list" ? " catalog-toolbar__view-btn--active" : ""}`}
                    onClick={() => setViewMode("list")}
                    aria-label="Dạng danh sách dòng"
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>

            {(cartNotice || cartError) && (
              <div
                className={`catalog-cart-message${cartError ? " catalog-cart-message--error" : ""}`}
              >
                {cartError || cartNotice}
              </div>
            )}

            {/* Grid / List Content */}
            {loadError ? (
              <div className="catalog-empty">
                <div className="catalog-empty__icon">⚠️</div>
                <h3 className="catalog-empty__title">Không tải được catalog</h3>
                <p className="catalog-empty__desc">{loadError}</p>
              </div>
            ) : isLoading ? (
              <div className="catalog-empty">
                <div className="catalog-empty__icon">⏳</div>
                <h3 className="catalog-empty__title">Đang tải sách</h3>
                <p className="catalog-empty__desc">
                  Đang lấy dữ liệu sách từ backend API.
                </p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="catalog-empty">
                <div className="catalog-empty__icon">🔍</div>
                <h3 className="catalog-empty__title">
                  Không tìm thấy sách phù hợp
                </h3>
                <p className="catalog-empty__desc">
                  Thử tìm kiếm từ khóa khác hoặc xóa bớt các bộ lọc đang chọn để
                  hiển thị thêm kết quả.
                </p>
                <button
                  type="button"
                  className="btn btn-primary catalog-empty__btn"
                  onClick={handleResetFilters}
                >
                  Thiết lập lại bộ lọc
                </button>
              </div>
            ) : (
              <div
                className={`book-grid${viewMode === "list" ? " book-grid--list" : ""}`}
              >
                {paginatedBooks.map((book) => (
                  <Link
                    key={book.id}
                    to={`/book/${book.id}`}
                    onClick={(event) => handleOpenBook(event, book)}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <BookCard
                      book={book}
                      viewMode={viewMode}
                      isWishlisted={wishlist.includes(book.id)}
                      onWishlistToggle={toggleWishlist}
                      onAddToCart={handleAddToCart}
                    />
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="catalog-pagination" aria-label="Phân trang">
                <button
                  type="button"
                  className={`catalog-pagination__btn${currentPage === 1 ? " catalog-pagination__btn--disabled" : ""}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`catalog-pagination__btn${currentPage === pageNum ? " catalog-pagination__btn--active" : ""}`}
                      onClick={() => handlePageChange(pageNum)}
                      aria-label={`Trang ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className={`catalog-pagination__btn${currentPage === totalPages ? " catalog-pagination__btn--disabled" : ""}`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Trang tiếp theo"
                >
                  ›
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>

      {/* ---- Mobile Filter Drawer ---- */}
      <div
        className={`mobile-filter-drawer${drawerOpen ? " mobile-filter-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="mobile-filter-drawer__overlay"
          onClick={() => setDrawerOpen(false)}
        />
        <div className="mobile-filter-drawer__content">
          <div className="mobile-filter-drawer__header">
            <h2 className="browse-sidebar__title">Bộ lọc</h2>
            <button
              type="button"
              className="mobile-filter-drawer__close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Đóng bộ lọc"
            >
              ✕
            </button>
          </div>
          {renderFilterContent()}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "20px",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => {
                handleResetFilters();
                setDrawerOpen(false);
              }}
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => setDrawerOpen(false)}
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
