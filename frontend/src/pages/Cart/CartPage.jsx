import { useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./CartPage.css";

function CartRow({ item, onRemove }) {
  return (
    <div className="cart-row">
      <div className="cart-row__book">
        <div className="cart-row__cover" aria-hidden="true">
          {item.coverUrl ? (
            <img src={item.coverUrl} alt="" />
          ) : (
            item.cover || "📘"
          )}
        </div>
        <div className="cart-row__meta">
          <h3 className="cart-row__title">{item.title}</h3>
          <p className="cart-row__author">{item.author}</p>
        </div>
      </div>

      <div className="cart-row__price">{item.price.toLocaleString("vi-VN")}₫</div>

      <div className="cart-row__quantity">
        <span className="cart-qty-value">{item.quantity}</span>
      </div>

      <div className="cart-row__total">{item.price.toLocaleString("vi-VN")}₫</div>

      <button
        type="button"
        className="cart-row__remove"
        onClick={() => onRemove(item.id)}
        title="Xóa khỏi giỏ hàng"
      >
        ✕
      </button>
    </div>
  );
}

export default function CartPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const {
    items: cartItems,
    isLoading,
    error,
    removeFromCart,
  } = useCart();
  const navigate = useNavigate();

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price, 0),
    [cartItems],
  );

  const shipping = 0;
  const total = subtotal + shipping;

  const handleRemove = async (itemId) => {
    await removeFromCart(itemId);
  };

  return (
    <main className="cart-page">
      <section className="cart-hero" aria-labelledby="cart-title">
        <div className="cart-hero__content">
          <span className="cart-hero__eyebrow">🛒 Giỏ hàng của bạn</span>
          <h1 className="cart-hero__title" id="cart-title">
            Kiểm tra đơn hàng và thanh toán nhanh chóng
          </h1>
          <p className="cart-hero__description">
            Chỉnh sửa số lượng, kiểm tra tổng chi phí và tiếp tục mua sắm ngay.
          </p>
        </div>
      </section>

      {/* Checkout Steps Indicator */}
      <div className="cart-steps container">
        <div className="cart-step cart-step--active">
          <span className="cart-step__num">1</span>
          <span className="cart-step__label">Giỏ hàng</span>
        </div>
        <div className="cart-steps__line cart-steps__line--active" />
        <div className="cart-step">
          <span className="cart-step__num">2</span>
          <span className="cart-step__label">Thanh toán</span>
        </div>
        <div className="cart-steps__line" />
        <div className="cart-step">
          <span className="cart-step__num">3</span>
          <span className="cart-step__label">Hoàn tất</span>
        </div>
      </div>

      {!isAuthenticated ? (
        <section className="cart-empty container">
          <div className="cart-empty__card glass-card">
            <div className="cart-empty__icon">🔐</div>
            <h2>Vui lòng đăng nhập</h2>
            <p>Đăng nhập để xem và đồng bộ giỏ hàng ebook của bạn.</p>
            <Link to="/login" className="btn btn-primary cart-empty__button">
              Đăng nhập
            </Link>
          </div>
        </section>
      ) : isLoading ? (
        <section className="cart-empty container">
          <div className="cart-empty__card glass-card">
            <div className="cart-empty__icon">⏳</div>
            <h2>Đang tải giỏ hàng</h2>
            <p>Đang đồng bộ giỏ hàng từ tài khoản của bạn.</p>
          </div>
        </section>
      ) : error ? (
        <section className="cart-empty container">
          <div className="cart-empty__card glass-card">
            <div className="cart-empty__icon">⚠️</div>
            <h2>Không thể tải giỏ hàng</h2>
            <p>{error}</p>
          </div>
        </section>
      ) : cartItems.length > 0 ? (
        <div className="cart-layout container">
          <section className="cart-list">
            <div className="cart-list__header">
              <span>Sản phẩm</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Tổng tiền</span>
              <span aria-hidden="true"></span>
            </div>

            <div className="cart-list__items">
              {cartItems.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </section>

          <aside className="cart-summary">
            <div className="cart-summary__box glass-card">
              <h2>Tóm tắt đơn hàng</h2>
              <div className="cart-summary__divider" />
              <div className="cart-summary__row">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="cart-summary__row">
                <span>Phí giao ebook</span>
                <span>{shipping.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="cart-summary__divider" />
              <div className="cart-summary__row cart-summary__row--total">
                <span>Tổng thanh toán</span>
                <span className="cart-summary__total-val">{total.toLocaleString("vi-VN")}₫</span>
              </div>
              <button
                type="button"
                className="btn btn-primary cart-summary__checkout"
                onClick={() => navigate("/checkout")}
              >
                Tiến hành thanh toán
              </button>
              <Link to="/browse" className="cart-summary__continue">
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </aside>
        </div>
      ) : (
        <section className="cart-empty container">
          <div className="cart-empty__card glass-card">
            <div className="cart-empty__icon">🛒</div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Thêm một vài cuốn sách yêu thích để tiếp tục mua sắm các tựa sách hay nhất.</p>
            <Link to="/browse" className="btn btn-primary cart-empty__button">
              Tiếp tục mua sắm
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
