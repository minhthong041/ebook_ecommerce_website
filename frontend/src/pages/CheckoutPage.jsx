import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./CheckoutPage.css";

function detectCardBrand(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.startsWith("4")) {
    return "Visa";
  }
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
    return "Mastercard";
  }
  if (/^3[47]/.test(digits)) {
    return "American Express";
  }
  return "Card";
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function buildDemoCardToken() {
  if (window.crypto?.randomUUID) {
    return `demo_card_${window.crypto.randomUUID()}`;
  }
  return `demo_card_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { items: cartItems, isLoading, refreshCart } = useCart();
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [bankInfo, setBankInfo] = useState(null);
  const [bankInfoError, setBankInfoError] = useState("");
  const [isBankInfoLoading, setIsBankInfoLoading] = useState(false);
  const cardholderRef = useRef(null);
  const cardNumberRef = useRef(null);
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);

  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    phone: "",
    note: "",
  });
  const [cardInfo, setCardInfo] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price, 0),
    [cartItems],
  );
  const shipping = 0;
  const totalAmount = subtotal + shipping;

  useEffect(() => {
    if (!isAuthenticated || paymentMethod !== "bank_transfer") {
      return;
    }

    let isMounted = true;
    const loadBankInfo = async () => {
      setIsBankInfoLoading(true);
      setBankInfoError("");
      try {
        const response = await axiosClient.get(
          `/payment/bank-transfer-info/?amount=${totalAmount}`,
        );
        if (isMounted) {
          setBankInfo(response);
        }
      } catch {
        if (isMounted) {
          setBankInfoError("Không thể tải QR chuyển khoản. Vui lòng thử lại.");
        }
      } finally {
        if (isMounted) {
          setIsBankInfoLoading(false);
        }
      }
    };

    loadBankInfo();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, paymentMethod, totalAmount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "cardNumber"
        ? formatCardNumber(value)
        : name === "expiry"
          ? formatExpiry(value)
          : name === "cvv"
            ? value.replace(/\D/g, "").slice(0, 4)
            : value;

    setCardInfo((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const handleUseDemoCard = () => {
    setCardInfo({
      cardholderName: "READIFY DEMO",
      cardNumber: "4242 4242 4242 4242",
      expiry: "12/30",
      cvv: "123",
    });
    setSubmitError("");
  };

  const validateCardForm = () => {
    if (paymentMethod !== "card") {
      return "";
    }

    const digits = cardInfo.cardNumber.replace(/\D/g, "");
    if (!cardInfo.cardholderName.trim()) {
      cardholderRef.current?.focus();
      return "Vui lòng nhập tên chủ thẻ.";
    }
    if (digits.length < 12) {
      cardNumberRef.current?.focus();
      return "Số thẻ chưa hợp lệ. Không nhập thẻ thật khi chưa tích hợp cổng thanh toán chính thức.";
    }
    if (!/^\d{2}\/\d{2}$/.test(cardInfo.expiry)) {
      expiryRef.current?.focus();
      return "Ngày hết hạn cần có định dạng MM/YY.";
    }
    if (cardInfo.cvv.length < 3) {
      cvvRef.current?.focus();
      return "CVV cần có ít nhất 3 chữ số.";
    }

    return "";
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const validationError = validateCardForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        note: customerInfo.note,
        payment_method: paymentMethod,
      };

      if (paymentMethod === "card") {
        const digits = cardInfo.cardNumber.replace(/\D/g, "");
        payload.card = {
          token: buildDemoCardToken(),
          brand: detectCardBrand(digits),
          last4: digits.slice(-4),
          holder_name: cardInfo.cardholderName.trim(),
        };
      }

      const order = await axiosClient.post("/checkout/", payload);
      await refreshCart();
      navigate("/order-success", { state: { order } });
    } catch (error) {
      setSubmitError(
        error.response?.data?.detail ||
          "Không thể thanh toán đơn hàng. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="checkout-page">
        <h2 className="checkout-title">Thanh toán</h2>
        <div className="checkout-empty">
          <h3>Vui lòng đăng nhập</h3>
          <p>Đăng nhập để tiếp tục thanh toán ebook trong giỏ hàng.</p>
          <Link to="/login" className="btn btn-primary">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="checkout-page">
        <h2 className="checkout-title">Thanh toán</h2>
        <div className="checkout-empty">
          <h3>Đang tải giỏ hàng</h3>
          <p>Đang đồng bộ dữ liệu đơn hàng từ tài khoản của bạn.</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <h2 className="checkout-title">Thanh toán</h2>
        <div className="checkout-empty">
          <h3>Giỏ hàng đang trống</h3>
          <p>Thêm ebook vào giỏ hàng trước khi thanh toán.</p>
          <Link to="/browse" className="btn btn-primary">
            Mua sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h2 className="checkout-title">Thanh toán</h2>

      <div className="checkout-content">
        {/* Form điền thông tin */}
        <div className="checkout-form-section">
          <h3>Thông tin liên hệ</h3>
          <form onSubmit={handlePlaceOrder} noValidate>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                onChange={handleInputChange}
                placeholder="Nhập họ và tên nếu cần"
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại nếu cần"
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

            <section className="payment-methods" aria-label="Phương thức thanh toán">
              <h3>Phương thức thanh toán</h3>
              <div className="payment-method-grid">
                <label
                  className={`payment-method-card${
                    paymentMethod === "card" ? " payment-method-card--active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <span className="payment-method-card__icon">💳</span>
                  <span>
                    <strong>Thẻ ngân hàng</strong>
                    <small>Thanh toán demo bằng token, không lưu số thẻ/CVV.</small>
                  </span>
                </label>

                <label
                  className={`payment-method-card${
                    paymentMethod === "bank_transfer"
                      ? " payment-method-card--active"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                  />
                  <span className="payment-method-card__icon">🏦</span>
                  <span>
                    <strong>Chuyển khoản ngân hàng</strong>
                    <small>Tạo đơn chờ xác nhận chuyển khoản.</small>
                  </span>
                </label>
              </div>
            </section>

            {paymentMethod === "card" ? (
              <section className="card-payment-panel">
                <div className="checkout-alert">
                  Đây là luồng thẻ demo để chuẩn bị tích hợp cổng thật. Không nhập thông tin thẻ thật.
                </div>
                <button
                  type="button"
                  className="demo-card-button"
                  onClick={handleUseDemoCard}
                >
                  Dùng thẻ demo
                </button>
                <div className="form-group">
                  <label>Tên chủ thẻ</label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={cardInfo.cardholderName}
                    onChange={handleCardInputChange}
                    placeholder="NGUYEN VAN A"
                    autoComplete="cc-name"
                    ref={cardholderRef}
                  />
                </div>
                <div className="form-group">
                  <label>Số thẻ</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardInfo.cardNumber}
                    onChange={handleCardInputChange}
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    ref={cardNumberRef}
                  />
                </div>
                <div className="checkout-card-row">
                  <div className="form-group">
                    <label>Hết hạn</label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardInfo.expiry}
                      onChange={handleCardInputChange}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      ref={expiryRef}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      value={cardInfo.cvv}
                      onChange={handleCardInputChange}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      ref={cvvRef}
                    />
                  </div>
                </div>
              </section>
            ) : (
              <section className="bank-transfer-panel">
                <h4>Thông tin chuyển khoản</h4>
                {isBankInfoLoading && (
                  <p className="bank-transfer-status">Đang tải QR Vietcombank...</p>
                )}
                {bankInfoError && (
                  <p className="checkout-error">{bankInfoError}</p>
                )}
                {bankInfo?.qr_url && (
                  <div className="vietqr-preview">
                    <img
                      src={bankInfo.qr_url}
                      alt="QR thanh toán Vietcombank"
                      loading="lazy"
                    />
                    <span>Quét QR bằng ứng dụng ngân hàng để chuyển khoản.</span>
                  </div>
                )}
                <div className="bank-info-row">
                  <span>Ngân hàng</span>
                  <strong>{bankInfo?.bank_name || "Vietcombank"}</strong>
                </div>
                <div className="bank-info-row">
                  <span>Số tài khoản</span>
                  <strong>{bankInfo?.account_number || "Đang cập nhật"}</strong>
                </div>
                <div className="bank-info-row">
                  <span>Chủ tài khoản</span>
                  <strong>{bankInfo?.account_name || "Đang cập nhật"}</strong>
                </div>
                <div className="bank-info-row">
                  <span>Nội dung</span>
                  <strong>{bankInfo?.transfer_content || "READIFY-CHECKOUT"}</strong>
                </div>
                <p>
                  Sau khi tạo đơn, hệ thống sẽ cung cấp nội dung chuyển khoản theo mã đơn.
                  Sách sẽ được mở trong thư viện sau khi giao dịch được xác nhận.
                </p>
              </section>
            )}

            {submitError && <p className="checkout-error">{submitError}</p>}
            <button
              type="submit"
              className="btn btn-primary checkout-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang xử lý..."
                : paymentMethod === "bank_transfer"
                  ? "Tạo đơn chuyển khoản"
                  : "Thanh toán bằng thẻ"}
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
                  {item.title} <span className="item-qty">x1</span>
                </span>
                <span className="item-price">
                  {item.price.toLocaleString("vi-VN")}₫
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
              <span>Phí giao ebook:</span>
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
