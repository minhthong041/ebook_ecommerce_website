import React from "react";
import { useNavigate } from "react-router-dom";
import "./OrderSuccessPage.css"; // 🟢 QUAN TRỌNG: Import CSS

const OrderSuccessPage = () => {
  const navigate = useNavigate();

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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h1 className="success-title">Đặt hàng thành công!</h1>

      <p className="success-message">
        Cảm ơn bạn đã mua sắm tại BookVerse. Đơn hàng của bạn đang được xử lý và
        sẽ sớm được giao đến bạn.
      </p>

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
