import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CartDrawer.css";

function CartRow({ item, onRemove }) {
  return (
    <div className="cart-drawer-row">
      <div className="cart-drawer-row__book">
        <div className="cart-drawer-row__cover" aria-hidden="true">
          {item.coverUrl ? (
            <img src={item.coverUrl} alt="" />
          ) : (
            item.cover || "📘"
          )}
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
        <span>{item.quantity}</span>
      </div>

      <div className="cart-drawer-row__total">
        {item.price.toLocaleString()}₫
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
  isLoading = false,
  onClose,
  onRemove,
}) {
  const navigate = useNavigate();
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const shipping = 0;
  const total = subtotal + shipping;
  const itemCount = items.length;

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

        {isLoading ? (
          <div className="cart-drawer__empty">
            <div className="cart-drawer__empty-icon" aria-hidden="true">
              ⏳
            </div>
            <h3>Đang tải giỏ hàng</h3>
            <p>Đang đồng bộ giỏ hàng từ tài khoản của bạn.</p>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="cart-drawer__list">
              {items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
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
                <span>Phí giao ebook</span>
                <span>{shipping.toLocaleString()}₫</span>
              </div>
              <div className="cart-drawer__summary-row cart-drawer__summary-row--total">
                <span>Tổng thanh toán</span>
                <span>{total.toLocaleString()}₫</span>
              </div>
              <button
                type="button"
                className="btn btn-primary cart-drawer__checkout"
                onClick={() => {
                  onClose();
                  navigate("/checkout");
                }}
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
