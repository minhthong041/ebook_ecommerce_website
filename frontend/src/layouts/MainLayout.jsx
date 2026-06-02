import { Outlet, ScrollRestoration } from 'react-router-dom'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import './layouts.css'

/**
 * MainLayout – layout chính cho các trang công khai.
 * Cấu trúc: Header (fixed) + main content + Footer
 */
export default function MainLayout() {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout__content" id="main-content">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
