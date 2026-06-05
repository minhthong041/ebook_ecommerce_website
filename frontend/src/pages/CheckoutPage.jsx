import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CheckoutPage.css";

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: "",
  });

  const cartItems = [
    { id: 1, name: "Đắc Nhân Tâm", price: 85000, quantity: 1 },
    { id: 2, name: "Nhà Giả Kim", price: 79000, quantity: 2 },
  ];

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shipping = 18000;
  const totalAmount = subtotal + shipping;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    console.log("Order Data:", { customerInfo, cartItems, totalAmount });
    navigate("/order-success");
  };

  return (
    <div className="checkout-page">
      <h2 className="checkout-title">Thanh toán</h2>

      <div className="checkout-content">
        {/* Form điền thông tin */}
        <div className="checkout-form-section">
          <h3>Thông tin giao hàng</h3>
          <form onSubmit={handlePlaceOrder}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                required
                onChange={handleInputChange}
                placeholder="Nhập họ và tên người nhận"
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                required
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="form-group">
              <label>Địa chỉ nhận hàng</label>
              <input
                type="text"
                name="address"
                required
                onChange={handleInputChange}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
              />
            </div>
            <div className="form-group">
              <label>Ghi chú (Tuỳ chọn)</label>
              <textarea
                name="note"
                rows="3"
                onChange={handleInputChange}
                placeholder="Lưu ý cho người giao hàng..."
              ></textarea>
            </div>
            {/* Tái sử dụng class btn btn-primary của nhóm bạn để nút giống giỏ hàng */}
            <button
              type="submit"
              className="btn btn-primary checkout-submit-btn"
            >
              Đặt hàng ngay
            </button>
          </form>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="checkout-summary-section">
          <h3>Đơn hàng của bạn</h3>
          <ul className="summary-items">
            {cartItems.map((item) => (
              <li key={item.id} className="summary-item">
                <span>
                  {item.name} <span className="item-qty">x{item.quantity}</span>
                </span>
                <span className="item-price">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                </span>
              </li>
            ))}
          </ul>

          <div className="summary-calc">
            <div className="summary-calc-row">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString("vi-VN")}₫</span>
            </div>
            <div className="summary-calc-row">
              <span>Phí vận chuyển:</span>
              <span>{shipping.toLocaleString("vi-VN")}₫</span>
            </div>
          </div>

          <div className="summary-total">
            <span>Tổng cộng:</span>
            <span>{totalAmount.toLocaleString("vi-VN")}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
