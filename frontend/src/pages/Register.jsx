import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Card,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  PersonAddOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Gọi API đăng ký thực tế của Backend Django
      await axiosClient.post("/auth/register", formData);

      setSuccess(
        "Đăng ký tài khoản thành công! Đang chuyển hướng sang Đăng nhập...",
      );
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 6 }}>
      <Card
        sx={{
          p: 4,
          borderRadius: 4,
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              m: 1,
              bgcolor: "success.main",
              color: "white",
              p: 1.5,
              borderRadius: "50%",
              display: "flex",
            }}
          >
            <PersonAddOutlined />
          </Box>
          <Typography
            component="h1"
            variant="h5"
            sx={{ fontWeight: 700, mt: 1, mb: 3 }}
          >
            Tạo Tài Khoản
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ width: "100%", mb: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{ width: "100%", mb: 2, borderRadius: 2 }}
            >
              {success}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              label="Địa chỉ Email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Tên đăng nhập"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                p: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đăng Ký"
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Đã có tài khoản?{" "}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{ fontWeight: 600, textDecoration: "none" }}
                >
                  Đăng nhập tại đây
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>
    </Container>
  );
};

export default Register;
