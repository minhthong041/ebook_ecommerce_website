import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import BookCard from "../../components/BookCard/BookCard";
import CategoryFilter from "../../components/CategoryFilter/CategoryFilter";
import { BOOKS } from "../../data/bookData";
import "./BrowsePage.css";

const MOCK_BOOKS = BOOKS;

const CATEGORY_FILTERS = [
  { value: "technology", label: "Công nghệ", count: 2 },
  { value: "business", label: "Kinh doanh", count: 2 },
  { value: "science", label: "Khoa học", count: 2 },
  { value: "selfhelp", label: "Kỹ năng sống", count: 1 },
  { value: "literature", label: "Văn học", count: 1 },
];

const FORMAT_FILTERS = ["PDF", "EPUB", "AUDIO"];

export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState([]);

  const itemsPerPage = 6;

  // Handlers for Filters
  const handleCatChange = (catValue) => {
    setSelectedCats((prev) =>
      prev.includes(catValue)
        ? prev.filter((c) => c !== catValue)
        : [...prev, catValue],
    );
    setCurrentPage(1);
  };

  const handleFormatChange = (formatVal) => {
    setSelectedFormat((prev) =>
      prev.includes(formatVal)
        ? prev.filter((f) => f !== formatVal)
        : [...prev, formatVal],
    );
    setCurrentPage(1);
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCats([]);
    setSelectedFormat([]);
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
    return MOCK_BOOKS.filter((book) => {
      // Search check
      if (search.trim()) {
        const query = search.toLowerCase();
        const titleMatch = book.title.toLowerCase().includes(query);
        const authorMatch = book.author.toLowerCase().includes(query);
        if (!titleMatch && !authorMatch) return false;
      }

      // Categories check
      if (selectedCats.length > 0 && !selectedCats.includes(book.category)) {
        return false;
      }

      // Formats check
      if (selectedFormat.length > 0) {
        const hasFormat = book.formats.some((f) => selectedFormat.includes(f));
        if (!hasFormat) return false;
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
    selectedFormat,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
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
        categories={CATEGORY_FILTERS}
        selectedCats={selectedCats}
        onToggleCategory={handleCatChange}
        onClearCategories={handleClearCategories}
      />

      {/* Format Filter */}
      <div className="filter-group">
        <span className="filter-group__title">Định dạng Ebook</span>
        <div className="filter-formats-grid">
          {FORMAT_FILTERS.map((format) => {
            const isSelected = selectedFormat.includes(format);
            return (
              <button
                key={format}
                type="button"
                className={`filter-format-chip ${isSelected ? "filter-format-chip--active" : ""}`}
                onClick={() => handleFormatChange(format)}
              >
                <span className="filter-format-icon">
                  {format === "PDF" ? "📄" : format === "EPUB" ? "📘" : "🎧"}
                </span>
                <span>{format}</span>
              </button>
            );
          })}
        </div>
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
              <p className="browse-hero__eyebrow">BookVerse Catalog</p>
              <h1 className="browse-hero__title">Khám phá kho Ebook</h1>
              <p className="browse-hero__subtitle">
                Lọc nhanh, duyệt sách theo định dạng và thể loại yêu thích để
                tìm ngay tựa sách phù hợp.
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

            {/* Grid / List Content */}
            {filteredBooks.length === 0 ? (
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
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <BookCard
                      book={book}
                      viewMode={viewMode}
                      isWishlisted={wishlist.includes(book.id)}
                      onWishlistToggle={toggleWishlist}
                      onAddToCart={(b) => console.log("Added to cart:", b)}
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
