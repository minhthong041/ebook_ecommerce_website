import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  EditOutlined,
  PeopleAltOutlined,
  RefreshOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

function isAdmin(user) {
  const role = (user?.role || "").trim().toLowerCase();
  return Boolean(user?.is_superuser || role === "admin");
}

function formatDate(value) {
  if (!value) {
    return "Chưa cập nhật";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatUserError(error) {
  const detail = error.response?.data?.detail;
  if (error.response?.status === 403) {
    return detail || "Chỉ admin mới có quyền quản lý người dùng.";
  }
  if (detail) {
    return detail;
  }
  const data = error.response?.data;
  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
      .join(" ");
  }
  return "Không thể xử lý dữ liệu người dùng. Vui lòng thử lại.";
}

function buildUserForm(user) {
  return {
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    dob: user?.dob || "",
    role_id: user?.role_id ? String(user.role_id) : "",
    is_active: Boolean(user?.is_active),
    is_staff: Boolean(user?.is_staff),
  };
}

export default function AdminUserManagement() {
  const { user } = useContext(AuthContext);
  const hasAccess = isAdmin(user);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(buildUserForm(null));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(async () => {
    if (!hasAccess) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (query.trim()) {
        params.q = query.trim();
      }
      if (roleFilter !== "all") {
        params.role = roleFilter;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const [usersResponse, rolesResponse] = await Promise.all([
        axiosClient.get("/admin/users/", { params }),
        axiosClient.get("/admin/roles/"),
      ]);
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      setRoles(Array.isArray(rolesResponse) ? rolesResponse : []);
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess, query, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((item) => item.is_active).length,
      staff: users.filter((item) => item.is_staff || item.is_superuser).length,
      admin: users.filter((item) => item.is_superuser || item.role?.name === "Admin").length,
    }),
    [users],
  );

  const handleOpenEdit = (selectedUser) => {
    setEditingUser(selectedUser);
    setEditForm(buildUserForm(selectedUser));
    setError("");
    setSuccess("");
  };

  const handleEditField = (field, value) => {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!editingUser) {
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...editForm,
        role_id: editForm.role_id ? Number(editForm.role_id) : null,
      };
      const updatedUser = await axiosClient.patch(`/admin/users/${editingUser.id}/`, payload);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === updatedUser.id ? updatedUser : currentUser,
        ),
      );
      setEditingUser(updatedUser);
      setEditForm(buildUserForm(updatedUser));
      setSuccess(`Đã cập nhật người dùng ${updatedUser.username}.`);
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasAccess) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Chỉ admin mới có quyền quản lý người dùng.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Quản lý người dùng
            </Typography>
            <Typography color="text.secondary">
              Chỉ admin được chỉnh quyền, trạng thái và thông tin tài khoản.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={loadUsers}
            disabled={isLoading}
            sx={{ borderRadius: 2 }}
          >
            Tải lại
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Tổng người dùng</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.total}</Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Đang hoạt động</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.active}</Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Staff/Admin</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.staff}</Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Admin</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.admin}</Typography>
          </Card>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Card sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm username, họ tên, email, số điện thoại..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="none">Chưa gán role</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={String(role.id)}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="inactive">Đã khóa</MenuItem>
            </TextField>
            <Button variant="contained" onClick={loadUsers} sx={{ px: 4, borderRadius: 2 }}>
              Tìm kiếm
            </Button>
          </Stack>
        </Card>

        {isLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Card sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
            <PeopleAltOutlined sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ fontWeight: 900 }}>Không có người dùng phù hợp</Typography>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {users.map((item) => (
              <Card key={item.id} sx={{ p: 2.25, borderRadius: 2 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {item.full_name || item.username}
                      </Typography>
                      <Chip size="small" label={`@${item.username}`} variant="outlined" />
                      <Chip
                        size="small"
                        color={item.is_active ? "success" : "default"}
                        label={item.is_active ? "Hoạt động" : "Đã khóa"}
                      />
                      {(item.is_staff || item.is_superuser) && (
                        <Chip size="small" color="primary" label="Staff" />
                      )}
                    </Stack>
                    <Typography color="text.secondary">{item.email}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Role: {item.role?.name || "Chưa gán"} · Tham gia {formatDate(item.date_joined)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={() => handleOpenEdit(item)}
                    sx={{ borderRadius: 2 }}
                  >
                    Chỉnh sửa
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      <Dialog open={Boolean(editingUser)} onClose={() => setEditingUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Chỉnh sửa người dùng
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Username là cố định và không thể thay đổi.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Username" value={editingUser?.username || ""} disabled />
            <TextField
              label="Họ tên"
              value={editForm.full_name}
              onChange={(event) => handleEditField("full_name", event.target.value)}
            />
            <TextField
              label="Email"
              value={editForm.email}
              onChange={(event) => handleEditField("email", event.target.value)}
            />
            <TextField
              label="Số điện thoại"
              value={editForm.phone_number || ""}
              onChange={(event) => handleEditField("phone_number", event.target.value)}
            />
            <TextField
              label="Ngày sinh"
              type="date"
              value={editForm.dob || ""}
              onChange={(event) => handleEditField("dob", event.target.value)}
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
                  color: editForm.dob ? "inherit" : "var(--text-secondary)",
                },
              }}
            />
            <TextField
              select
              label="Role"
              value={editForm.role_id}
              onChange={(event) => handleEditField("role_id", event.target.value)}
            >
              <MenuItem value="">Không gán role</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={String(role.id)}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={(event) => handleEditField("is_active", event.target.checked)}
                />
              }
              label="Tài khoản đang hoạt động"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_staff}
                  onChange={(event) => handleEditField("is_staff", event.target.checked)}
                />
              }
              label="Cho phép truy cập khu vực staff/Django admin"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingUser(null)}>Đóng</Button>
          <Button
            variant="contained"
            startIcon={<SaveOutlined />}
            disabled={isSaving}
            onClick={handleSave}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
