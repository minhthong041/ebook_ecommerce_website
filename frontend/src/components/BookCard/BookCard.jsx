import './BookCard.css'

export default function BookCard({
  book,
  viewMode = 'grid',
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart
}) {
  const {
    id,
    title,
    author,
    categoryLabel,
    price,
    originalPrice,
    rating,
    reviewsCount,
    formats,
    coverIcon,
    coverUrl,
    isBestseller
  } = book

  const hasDiscount = originalPrice > price
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  const handleWishlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onWishlistToggle) {
      onWishlistToggle(id)
    }
  }

  const handleCartClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(book)
    }
  }

  return (
    <article className={`book-card book-card--${viewMode}`}>
      {/* Cover / Image area */}
      <div className="book-card__cover-wrap">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="book-card__cover" loading="lazy" />
        ) : (
          <div className="book-card__cover" aria-hidden="true">
            {coverIcon || '📚'}
          </div>
        )}

        {/* Sale / Bestseller Badge */}
        {hasDiscount && (
          <span className="book-card__badge-sale">-{discountPercent}%</span>
        )}
        {isBestseller && (
          <span className="book-card__badge-bestseller">Bán chạy</span>
        )}

        {/* Formats Badge */}
        {formats && formats.length > 0 && (
          <div className="book-card__formats">
            {formats.map(format => (
              <span key={format} className="book-card__format-tag">{format}</span>
            ))}
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          className={`book-card__wishlist-btn${isWishlisted ? ' book-card__wishlist-btn--active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
        >
          ❤
        </button>
      </div>

      {/* Info details */}
      <div className="book-card__info">
        <div className="book-card__details">
          {categoryLabel && <span className="book-card__category">{categoryLabel}</span>}
          <h3 className="book-card__title" title={title}>{title}</h3>
          <p className="book-card__author">{author}</p>
          
          {/* Rating */}
          <div className="book-card__rating">
            <span className="book-card__stars" aria-hidden="true">
              {"★".repeat(Math.floor(rating))}
              {"☆".repeat(5 - Math.floor(rating))}
            </span>
            <span>{rating} ({reviewsCount})</span>
          </div>
        </div>

        {/* Price & Buy Button */}
        <div className="book-card__footer">
          <div className="book-card__price-box">
            <span className="book-card__price">{price.toLocaleString('vi-VN')}₫</span>
            {hasDiscount && (
              <span className="book-card__original-price">{originalPrice.toLocaleString('vi-VN')}₫</span>
            )}
          </div>
          <button
            type="button"
            className="book-card__cart-btn"
            onClick={handleCartClick}
            aria-label="Thêm sách vào giỏ hàng"
          >
            🛒
          </button>
        </div>
      </div>
    </article>
  )
}

