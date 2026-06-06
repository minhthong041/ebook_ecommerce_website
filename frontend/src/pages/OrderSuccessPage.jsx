import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./OrderSuccessPage.css"; // 🟢 QUAN TRỌNG: Import CSS

function getRemainingSeconds(expiresAt) {
  if (!expiresAt) {
    return null;
  }
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds) {
  if (seconds === null) {
    return "";
  }
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order || null;
  const isPendingBankTransfer =
    order?.status === "pending" ||
    order?.payment_type === "Bank Transfer" ||
    order?.payment_status === "Pending";
  const instructions = order?.payment_instructions;
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(order?.pending_expires_at),
  );
  const isExpired = remainingSeconds === 0;

  useEffect(() => {
    if (!order?.pending_expires_at) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(order.pending_expires_at));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [order?.pending_expires_at]);

  return (
    <div className="order-success-page">
      {/* Icon checkmark với class CSS thuần để giới hạn kích thước */}
      <svg
        className="success-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isPendingBankTransfer ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>

      <h1 className="success-title">
        {isPendingBankTransfer ? "Đơn hàng đang chờ chuyển khoản" : "Thanh toán thành công!"}
      </h1>

      <p className="success-message">
        {isPendingBankTransfer && isExpired
          ? "Mã QR đã hết thời gian giữ đơn. Vui lòng tạo đơn thanh toán mới nếu bạn chưa chuyển khoản."
          : isPendingBankTransfer
          ? "Vui lòng chuyển khoản theo thông tin bên dưới. Ebook sẽ được mở trong thư viện sau khi quản trị viên xác nhận thanh toán."
          : "Cảm ơn bạn đã mua sắm tại Readify. Ebook đã được thêm vào thư viện của bạn."}
      </p>

      {order && (
        <div className="success-order-card">
          <div>
            <span>Mã đơn</span>
            <strong>#{order.id}</strong>
          </div>
          <div>
            <span>Giao dịch</span>
            <strong>{order.gateway_reference || "Đang cập nhật"}</strong>
          </div>
          <div>
            <span>Trạng thái</span>
            <strong>{order.payment_status || order.status}</strong>
          </div>
        </div>
      )}

      {instructions && (
        <div className="bank-instructions-card">
          <h2>Thông tin chuyển khoản</h2>
          {instructions.qr_url && (
            <div className="success-vietqr">
              <img
                src={instructions.qr_url}
                alt="QR thanh toán Vietcombank"
                loading="lazy"
              />
              <span>Quét QR và kiểm tra đúng số tiền, nội dung trước khi chuyển.</span>
            </div>
          )}
          {remainingSeconds !== null && (
            <div className={`payment-countdown${isExpired ? " payment-countdown--expired" : ""}`}>
              <span>{isExpired ? "Đã hết hạn thanh toán" : "Thời gian giữ đơn"}</span>
              <strong>{formatCountdown(remainingSeconds)}</strong>
            </div>
          )}
          <div className="bank-instruction-row">
            <span>Ngân hàng</span>
            <strong>{instructions.bank_name}</strong>
          </div>
          <div className="bank-instruction-row">
            <span>Số tài khoản</span>
            <strong>{instructions.account_number}</strong>
          </div>
          <div className="bank-instruction-row">
            <span>Chủ tài khoản</span>
            <strong>{instructions.account_name}</strong>
          </div>
          <div className="bank-instruction-row">
            <span>Số tiền</span>
            <strong>
              {Number(instructions.amount || 0).toLocaleString("vi-VN")}₫
            </strong>
          </div>
          <div className="bank-instruction-row">
            <span>Nội dung</span>
            <strong>{instructions.transfer_content}</strong>
          </div>
        </div>
      )}

      <div className="success-actions">
        {/* Quay lại trang khám phá sách */}
        <button onClick={() => navigate("/browse")} className="btn btn-primary">
          Tiếp tục mua sắm
        </button>

        {/* Nút xem đơn hàng (nối vào route /orders mà file App.jsx đã khai báo) */}
        <button onClick={() => navigate("/orders")} className="btn-secondary">
          Xem đơn hàng
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
