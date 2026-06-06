import { useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material";

const INVALID_LOGIN_MESSAGE =
  "Sai thông tin đăng nhập. Vui lòng kiểm tra lại tài khoản/email và mật khẩu.";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [e.target.name]: "",
    }));
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((currentValue) => !currentValue);
  };

  const handlePasswordMouseDown = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const nextErrors = {};
    if (!formData.username.trim()) {
      nextErrors.username = "Điền thiếu thông tin tài khoản hoặc email.";
    }
    if (!formData.password.trim()) {
      nextErrors.password = "Điền thiếu thông tin mật khẩu.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.username) {
        usernameRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosClient.post("/auth/login/", formData);
      if (response.user) {
        login(response.user);
        navigate("/");
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message;
      setError(status === 401 ? INVALID_LOGIN_MESSAGE : detail || INVALID_LOGIN_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
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
              bgcolor: "primary.main",
              color: "white",
              p: 1.5,
              borderRadius: "50%",
              display: "flex",
            }}
          >
            <LockOutlined />
          </Box>
          <Typography
            component="h1"
            variant="h5"
            sx={{ fontWeight: 700, mt: 1, mb: 3 }}
          >
            Đăng Nhập
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ width: "100%", mb: 2, borderRadius: 2 }}
            >
              {error}
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
              fullWidth
              label="Tài khoản hoặc Email"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              inputRef={usernameRef}
              error={Boolean(fieldErrors.username)}
              helperText={fieldErrors.username || " "}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              inputRef={passwordRef}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password || " "}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        edge="end"
                        type="button"
                        onClick={handleTogglePasswordVisibility}
                        onMouseDown={handlePasswordMouseDown}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
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
                "Đăng Nhập"
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có tài khoản?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{ fontWeight: 600, textDecoration: "none" }}
                >
                  Đăng ký ngay
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>
    </Container>
  );
};

export default Login;
