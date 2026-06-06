import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AccountCircleOutlined,
  BadgeOutlined,
  ExitToAppOutlined,
  LockResetOutlined,
  PhotoCameraOutlined,
  SaveOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const emptyProfile = {
  full_name: "",
  email: "",
  phone_number: "",
  dob: "",
};

const emptyPasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function formatApiError(error, fallback) {
  const data = error.response?.data;
  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      const value = Array.isArray(messages) ? messages.join(", ") : messages;
      return `${field}: ${value}`;
    })
    .join(" | ");
}

export default function Account() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(() => ({
    ...emptyProfile,
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    dob: user?.dob || "",
  }));
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [visiblePasswordFields, setVisiblePasswordFields] = useState({
    current_password: false,
    new_password: false,
    confirm_password: false,
  });
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const displayName = user?.full_name || user?.username || "Người dùng";
  const roleLabel =
    user?.role ||
    (user?.is_superuser ? "Admin" : user?.is_staff ? "Nhân viên" : "Thành viên");
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar_url),
    [avatarFile, user?.avatar_url],
  );

  useEffect(() => {
    const loadProfileTimer = window.setTimeout(async () => {
      try {
        const freshUser = await axiosClient.get("/auth/me/");
        updateUser(freshUser);
        setProfile({
          full_name: freshUser.full_name || "",
          email: freshUser.email || "",
          phone_number: freshUser.phone_number || "",
          dob: freshUser.dob || "",
        });
      } catch {
        setProfileError("Không thể tải hồ sơ mới nhất.");
      }
    }, 0);

    return () => window.clearTimeout(loadProfileTimer);
  }, [updateUser]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarFile) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
    setProfileFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((currentPasswordForm) => ({
      ...currentPasswordForm,
      [name]: value,
    }));
    setPasswordFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
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

  const getPasswordVisibilityAdornment = (fieldName) => {
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

  const handleAvatarChange = (event) => {
    setAvatarFile(event.target.files?.[0] || null);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const nextErrors = {};
    if (!profile.full_name.trim()) {
      nextErrors.full_name = "Điền thiếu thông tin họ tên.";
    }
    if (!profile.email.trim()) {
      nextErrors.email = "Điền thiếu thông tin email.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setProfileFieldErrors(nextErrors);
      if (nextErrors.full_name) {
        fullNameRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }
      return;
    }

    setIsProfileSaving(true);

    const payload = new FormData();
    payload.append("full_name", profile.full_name);
    payload.append("email", profile.email);
    payload.append("phone_number", profile.phone_number);
    payload.append("dob", profile.dob);
    if (avatarFile) {
      payload.append("avatar", avatarFile);
    }

    try {
      const updatedUser = await axiosClient.patch("/auth/me/", payload);
      updateUser(updatedUser);
      setAvatarFile(null);
      setProfileMessage("Đã cập nhật hồ sơ cá nhân.");
    } catch (error) {
      setProfileError(formatApiError(error, "Không thể cập nhật hồ sơ."));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    const nextErrors = {};
    if (!passwordForm.current_password.trim()) {
      nextErrors.current_password = "Điền thiếu thông tin mật khẩu hiện tại.";
    }
    if (!passwordForm.new_password.trim()) {
      nextErrors.new_password = "Điền thiếu thông tin mật khẩu mới.";
    }
    if (!passwordForm.confirm_password.trim()) {
      nextErrors.confirm_password = "Điền thiếu thông tin xác nhận mật khẩu.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setPasswordFieldErrors(nextErrors);
      if (nextErrors.current_password) {
        currentPasswordRef.current?.focus();
      } else if (nextErrors.new_password) {
        newPasswordRef.current?.focus();
      } else {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

    setIsPasswordSaving(true);

    try {
      await axiosClient.post("/auth/change-password/", passwordForm);
      setPasswordForm(emptyPasswordForm);
      setPasswordMessage("Đã đổi mật khẩu thành công.");
    } catch (error) {
      setPasswordError(formatApiError(error, "Không thể đổi mật khẩu."));
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Hồ sơ cá nhân
          </Typography>
          <Typography color="text.secondary">
            Cập nhật thông tin tài khoản và bảo mật đăng nhập.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(320px, 1fr)" },
            gap: 3,
          }}
        >
          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: "primary.light",
                    fontSize: "2.25rem",
                    fontWeight: 800,
                  }}
                >
                  {avatarInitial || <AccountCircleOutlined sx={{ fontSize: 56 }} />}
                </Avatar>
                <Stack spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {displayName}
                  </Typography>
                  <Typography color="text.secondary">{roleLabel}</Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<PhotoCameraOutlined />}
                    sx={{ borderRadius: 2, width: "fit-content" }}
                  >
                    Chọn ảnh đại diện
                    <input hidden type="file" accept="image/*" onChange={handleAvatarChange} />
                  </Button>
                  {avatarFile && (
                    <Typography variant="body2" color="text.secondary">
                      Đã chọn: {avatarFile.name}
                    </Typography>
                  )}
                </Stack>
              </Stack>

              <Divider />

              {profileError && <Alert severity="error">{profileError}</Alert>}
              {profileMessage && <Alert severity="success">{profileMessage}</Alert>}

              <Box component="form" onSubmit={handleProfileSubmit} noValidate>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Họ tên"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleProfileChange}
                    inputRef={fullNameRef}
                    error={Boolean(profileFieldErrors.full_name)}
                    helperText={profileFieldErrors.full_name || " "}
                  />
                  <TextField
                    label="Địa chỉ email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    inputRef={emailRef}
                    error={Boolean(profileFieldErrors.email)}
                    helperText={profileFieldErrors.email || " "}
                  />
                  <TextField
                    label="Số điện thoại"
                    name="phone_number"
                    value={profile.phone_number}
                    onChange={handleProfileChange}
                  />
                  <TextField
                    label="Ngày sinh"
                    name="dob"
                    type="date"
                    value={profile.dob || ""}
                    onChange={handleProfileChange}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { "aria-label": "Ngày sinh" },
                    }}
                    sx={{
                      "& input[type='date']": {
                        minHeight: "1.4375em",
                        lineHeight: 1.4375,
                      },
                      "& input[type='date']::-webkit-datetime-edit": {
                        color: profile.dob ? "inherit" : "var(--text-secondary)",
                      },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isProfileSaving}
                  startIcon={<SaveOutlined />}
                  sx={{ mt: 3, borderRadius: 2 }}
                >
                  Lưu thay đổi
                </Button>
              </Box>
            </Stack>
          </Card>

          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BadgeOutlined color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Thông tin tài khoản
                  </Typography>
                </Stack>
                <Box>
                  <Typography color="text.secondary">Tên đăng nhập</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{user?.username}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">Quyền truy cập</Typography>
                  <Typography color="success.main" sx={{ fontWeight: 700 }}>
                    {roleLabel}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ExitToAppOutlined />}
                  onClick={logout}
                  sx={{ borderRadius: 2 }}
                >
                  Đăng xuất
                </Button>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LockResetOutlined color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Đổi mật khẩu
                  </Typography>
                </Stack>

                {passwordError && <Alert severity="error">{passwordError}</Alert>}
                {passwordMessage && <Alert severity="success">{passwordMessage}</Alert>}

                <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
                  <Stack spacing={2}>
                    <TextField
                      label="Mật khẩu hiện tại"
                      name="current_password"
                      type={visiblePasswordFields.current_password ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      inputRef={currentPasswordRef}
                      error={Boolean(passwordFieldErrors.current_password)}
                      helperText={passwordFieldErrors.current_password || " "}
                      slotProps={{
                        input: {
                          endAdornment:
                            getPasswordVisibilityAdornment("current_password"),
                        },
                      }}
                    />
                    <TextField
                      label="Mật khẩu mới"
                      name="new_password"
                      type={visiblePasswordFields.new_password ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      inputRef={newPasswordRef}
                      error={Boolean(passwordFieldErrors.new_password)}
                      helperText={passwordFieldErrors.new_password || " "}
                      slotProps={{
                        input: {
                          endAdornment:
                            getPasswordVisibilityAdornment("new_password"),
                        },
                      }}
                    />
                    <TextField
                      label="Xác nhận mật khẩu mới"
                      name="confirm_password"
                      type={visiblePasswordFields.confirm_password ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      inputRef={confirmPasswordRef}
                      error={Boolean(passwordFieldErrors.confirm_password)}
                      helperText={passwordFieldErrors.confirm_password || " "}
                      slotProps={{
                        input: {
                          endAdornment:
                            getPasswordVisibilityAdornment("confirm_password"),
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="outlined"
                      disabled={isPasswordSaving}
                      startIcon={<LockResetOutlined />}
                      sx={{ borderRadius: 2 }}
                    >
                      Đổi mật khẩu
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
