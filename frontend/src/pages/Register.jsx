import { useRef, useState } from "react";
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
    username: "",
    full_name: "",
    dob: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });
  const [visiblePasswordFields, setVisiblePasswordFields] = useState({
    password: false,
    confirm_password: false,
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const usernameRef = useRef(null);
  const fullNameRef = useRef(null);
  const dobRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [e.target.name]: "",
    }));
  };

  const handleTogglePasswordField = (fieldName) => {
    setVisiblePasswordFields((currentFields) => ({
      ...currentFields,
      [fieldName]: !currentFields[fieldName],
    }));
  };

  const handlePasswordMouseDown = (event) => {
    event.preventDefault();
  };

  const getPasswordAdornment = (fieldName) => {
    const isVisible = visiblePasswordFields[fieldName];
    return (
      <InputAdornment position="end">
        <IconButton
          aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          title={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          edge="end"
          type="button"
          onClick={() => handleTogglePasswordField(fieldName)}
          onMouseDown={handlePasswordMouseDown}
        >
          {isVisible ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    );
  };

  const formatRegisterError = (err) => {
    const data = err.response?.data;
    if (!data) {
      return "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
    }
    if (typeof data === "string") {
      return data;
    }
    if (data.detail || data.message) {
      return data.detail || data.message;
    }
    return Object.entries(data)
      .map(([field, messages]) => {
        const value = Array.isArray(messages) ? messages.join(", ") : messages;
        return `${field}: ${value}`;
      })
      .join(" | ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess("");

    const nextErrors = {};
    if (!formData.username.trim()) {
      nextErrors.username = "Điền thiếu thông tin tên đăng nhập.";
    }
    if (!formData.full_name.trim()) {
      nextErrors.full_name = "Điền thiếu thông tin họ tên.";
    }
    if (!formData.dob) {
      nextErrors.dob = "Điền thiếu thông tin ngày sinh.";
    }
    if (!formData.email.trim()) {
      nextErrors.email = "Điền thiếu thông tin email.";
    }
    if (!formData.phone_number.trim()) {
      nextErrors.phone_number = "Điền thiếu thông tin số điện thoại.";
    }
    if (!formData.password.trim()) {
      nextErrors.password = "Điền thiếu thông tin mật khẩu.";
    }
    if (!formData.confirm_password.trim()) {
      nextErrors.confirm_password = "Điền thiếu thông tin xác nhận mật khẩu.";
    } else if (formData.password !== formData.confirm_password) {
      nextErrors.confirm_password = "Mật khẩu xác nhận không khớp.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.username) {
        usernameRef.current?.focus();
      } else if (nextErrors.full_name) {
        fullNameRef.current?.focus();
      } else if (nextErrors.dob) {
        dobRef.current?.focus();
      } else if (nextErrors.email) {
        emailRef.current?.focus();
      } else if (nextErrors.phone_number) {
        phoneRef.current?.focus();
      } else if (nextErrors.password) {
        passwordRef.current?.focus();
      } else {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API đăng ký thực tế của Backend Django
      await axiosClient.post("/auth/register/", formData);

      setSuccess(
        "Đăng ký tài khoản thành công! Đang chuyển hướng sang Đăng nhập...",
      );
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(formatRegisterError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
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
              fullWidth
              label="Tên đăng nhập"
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
              label="Họ tên"
              name="full_name"
              autoComplete="name"
              value={formData.full_name}
              onChange={handleChange}
              inputRef={fullNameRef}
              error={Boolean(fieldErrors.full_name)}
              helperText={fieldErrors.full_name || " "}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Ngày sinh"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              inputRef={dobRef}
              error={Boolean(fieldErrors.dob)}
              helperText={fieldErrors.dob || " "}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { "aria-label": "Ngày sinh" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                "& input[type='date']::-webkit-datetime-edit": {
                  color: formData.dob ? "inherit" : "var(--text-secondary)",
                },
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Địa chỉ email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              inputRef={emailRef}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email || " "}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Số điện thoại"
              name="phone_number"
              type="tel"
              autoComplete="tel"
              value={formData.phone_number}
              onChange={handleChange}
              inputRef={phoneRef}
              error={Boolean(fieldErrors.phone_number)}
              helperText={fieldErrors.phone_number || " "}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Mật khẩu"
              type={visiblePasswordFields.password ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              inputRef={passwordRef}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password || " "}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              slotProps={{
                input: {
                  endAdornment: getPasswordAdornment("password"),
                },
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="confirm_password"
              label="Nhập lại mật khẩu"
              type={visiblePasswordFields.confirm_password ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirm_password}
              onChange={handleChange}
              inputRef={confirmPasswordRef}
              error={Boolean(fieldErrors.confirm_password)}
              helperText={fieldErrors.confirm_password || " "}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              slotProps={{
                input: {
                  endAdornment: getPasswordAdornment("confirm_password"),
                },
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
