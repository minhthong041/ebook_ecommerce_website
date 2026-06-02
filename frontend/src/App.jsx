import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import ProtectedRoute from "./context/ProtectedRoute";

// Import các thành phần MUI để nâng cấp thanh điều hướng (Navbar)
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import { MenuBookOutlined } from "@mui/icons-material";

const Navbar = () => {
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={1}
      sx={{ borderBottom: "1px solid #e0e0e0" }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          {/* 1. Logo và Tên dự án nằm ở bên trái */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <MenuBookOutlined color="primary" sx={{ fontSize: 28 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 800,
                letterSpacing: ".05rem",
                background: "linear-gradient(45deg, #1976d2 30%, #00b0ff 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              EBOOKSHOP
            </Typography>
          </Box>

          {/* 2. Các nút điều hướng xịn mịn nằm ở bên phải */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              component={Link}
              to="/"
              variant="text"
              color="inherit"
              sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
            >
              Trang chủ
            </Button>

            <Button
              component={Link}
              to="/login"
              variant="text"
              color="inherit"
              sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
            >
              Đăng nhập
            </Button>

            <Button
              component={Link}
              to="/register"
              variant="contained"
              color="primary"
              sx={{
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                boxShadow: "none",
              }}
            >
              Đăng ký
            </Button>

            <Button
              component={Link}
              to="/account"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
            >
              Tài khoản
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* Gắn Thanh điều hướng xịn vừa tạo vào đây */}
      <Navbar />

      {/* Toàn bộ vùng nội dung bên dưới sẽ có màu nền xám nhạt nhẹ nhàng để nổi bật các Form Card lên */}
      <Box sx={{ bgcolor: "#f9f9f9", minHeight: "calc(100vh - 64px)", py: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;
