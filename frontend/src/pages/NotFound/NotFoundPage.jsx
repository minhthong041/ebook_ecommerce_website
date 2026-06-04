import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found__glow" aria-hidden="true" />
      <div className="not-found__content">
        <div className="not-found__code" aria-hidden="true">404</div>
        <div className="not-found__icon" aria-hidden="true">📚</div>
        <h1 className="not-found__title">Trang không tồn tại</h1>
        <p className="not-found__desc">
          Có vẻ như trang bạn đang tìm kiếm đã bị xóa, đổi tên,
          hoặc chưa từng tồn tại. Hãy quay về trang chủ nhé!
        </p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn-primary not-found__btn" id="not-found-home-btn">
            🏠 Về trang chủ
          </Link>
          <Link to="/browse" className="btn btn-ghost not-found__btn">
            🔭 Khám phá sách
          </Link>
        </div>
      </div>
    </div>
  )
}
