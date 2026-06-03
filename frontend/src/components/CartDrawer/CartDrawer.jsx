import { useMemo } from "react";
import { Link } from "react-router-dom";
import "./CartDrawer.css";

function CartRow({ item, onChangeQuantity, onRemove }) {
  const itemTotal = item.price * item.quantity;

  return (
    <div className="cart-drawer-row">
      <div className="cart-drawer-row__book">
        <div className="cart-drawer-row__cover" aria-hidden="true">
          {item.cover}
        </div>
        <div className="cart-drawer-row__meta">
          <h3>{item.title}</h3>
          <p>{item.author}</p>
        </div>
      </div>

      <div className="cart-drawer-row__price">
        {item.price.toLocaleString()}₫
      </div>

      <div className="cart-drawer-row__quantity">
        <button
          type="button"
          className="cart-drawer-row__qty-btn"
          onClick={() =>
            onChangeQuantity(item.id, Math.max(1, item.quantity - 1))
          }
          aria-label={`Giảm số lượng ${item.title}`}
          disabled={item.quantity <= 1}
        >
          −
        </button>
        <span>{item.quantity}</span>
        <button
          type="button"
          className="cart-drawer-row__qty-btn"
          onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
          aria-label={`Tăng số lượng ${item.title}`}
        >
          +
        </button>
      </div>

      <div className="cart-drawer-row__total">
        {itemTotal.toLocaleString()}₫
      </div>

      <button
        type="button"
        className="cart-drawer-row__remove"
        onClick={() => onRemove(item.id)}
      >
        Xóa
      </button>
    </div>
  );
}

export default function CartDrawer({
  isOpen,
  items,
  onClose,
  onChangeQuantity,
  onRemove,
}) {
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const shipping = items.length > 0 ? 18000 : 0;
  const total = subtotal + shipping;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {isOpen && (
        <div
          className="cart-drawer__overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`}
        aria-label="Giỏ hàng"
        aria-hidden={!isOpen}
      >
        <div className="cart-drawer__header">
          <div>
            <p className="cart-drawer__eyebrow">Giỏ hàng</p>
            <h2>Bạn có {itemCount} sản phẩm trong giỏ</h2>
          </div>
          <button
            type="button"
            className="cart-drawer__close"
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
          >
            ✕
          </button>
        </div>

        {items.length > 0 ? (
          <>
            <div className="cart-drawer__list">
              {items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  onChangeQuantity={onChangeQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>

            <div className="cart-drawer__summary">
              <div className="cart-drawer__summary-row">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString()}₫</span>
              </div>
              <div className="cart-drawer__summary-row">
                <span>Phí vận chuyển</span>
                <span>{shipping.toLocaleString()}₫</span>
              </div>
              <div className="cart-drawer__summary-row cart-drawer__summary-row--total">
                <span>Tổng thanh toán</span>
                <span>{total.toLocaleString()}₫</span>
              </div>
              <button
                type="button"
                className="btn btn-primary cart-drawer__checkout"
              >
                Thanh toán
              </button>
            </div>
          </>
        ) : (
          <div className="cart-drawer__empty">
            <div className="cart-drawer__empty-icon" aria-hidden="true">
              🛒
            </div>
            <h3>Giỏ hàng đang trống</h3>
            <p>Thêm sách vào giỏ để xem nhanh và thanh toán.</p>
          </div>
        )}

        <div className="cart-drawer__footer">
          <Link
            to="/cart"
            className="btn btn-ghost cart-drawer__view-cart-btn"
            onClick={onClose}
          >
            Xem trang giỏ hàng
          </Link>
        </div>
      </aside>
    </>
  );
}
