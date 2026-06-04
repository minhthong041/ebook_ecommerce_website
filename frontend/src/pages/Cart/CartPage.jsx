import { useMemo, useState } from "react";
// 🟢 SỬA DÒNG NÀY: Import thêm useNavigate
import { Link, useNavigate } from "react-router-dom";
import { CART_ITEMS } from "../../data/cartData";
import "./CartPage.css";

function CartRow({ item, onChangeQuantity, onRemove }) {
  const itemTotal = item.price * item.quantity;

  return (
    <div className="cart-row">
      <div className="cart-row__book">
        <div className="cart-row__cover" aria-hidden="true">
          {item.cover}
        </div>
        <div>
          <h3 className="cart-row__title">{item.title}</h3>
          <p className="cart-row__author">{item.author}</p>
        </div>
      </div>

      <div className="cart-row__price">{item.price.toLocaleString()}₫</div>

      <div className="cart-row__quantity">
        <button
          type="button"
          className="cart-qty-btn"
          onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
          aria-label={`Giảm số lượng ${item.title}`}
          disabled={item.quantity <= 1}
        >
          −
        </button>
        <span>{item.quantity}</span>
        <button
          type="button"
          className="cart-qty-btn"
          onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
          aria-label={`Tăng số lượng ${item.title}`}
        >
          +
        </button>
      </div>

      <div className="cart-row__total">{itemTotal.toLocaleString()}₫</div>

      <button
        type="button"
        className="cart-row__remove"
        onClick={() => onRemove(item.id)}
      >
        Xóa
      </button>
    </div>
  );
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState(CART_ITEMS);
  // 🟢 THÊM DÒNG NÀY: Khởi tạo biến navigate
  const navigate = useNavigate();

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  const shipping = cartItems.length > 0 ? 18000 : 0;
  const total = subtotal + shipping;

  const handleChangeQuantity = (itemId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item,
      ),
    );
  };

  const handleRemove = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
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

      {cartItems.length > 0 ? (
        <div className="cart-layout">
          <section className="cart-list">
            <div className="cart-list__header">
              <span>Sản phẩm</span>
              <span>Giá</span>
              <span>Số lượng</span>
              <span>Tổng</span>
              <span aria-hidden="true"></span>
            </div>

            {cartItems.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                onChangeQuantity={handleChangeQuantity}
                onRemove={handleRemove}
              />
            ))}
          </section>

          <aside className="cart-summary">
            <div className="cart-summary__box">
              <h2>Tóm tắt đơn hàng</h2>
              <div className="cart-summary__row">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString()}₫</span>
              </div>
              <div className="cart-summary__row">
                <span>Phí vận chuyển</span>
                <span>{shipping.toLocaleString()}₫</span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>Tổng thanh toán</span>
                <span>{total.toLocaleString()}₫</span>
              </div>
              <button
                type="button"
                className="btn btn-primary cart-summary__checkout"
                // 🟢 SỬA DÒNG NÀY: Thêm sự kiện onClick để chuyển trang
                onClick={() => navigate("/checkout")}
              >
                Thanh toán
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <section className="cart-empty">
          <div className="cart-empty__card">
            <div className="cart-empty__icon">🛒</div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Thêm một vài cuốn sách yêu thích để tiếp tục mua sắm.</p>
            <Link to="/browse" className="btn btn-primary cart-empty__button">
              Tiếp tục mua sắm
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
