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
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  CategoryOutlined,
  DeleteOutlineOutlined,
  EditOutlined,
  RefreshOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const emptyForm = {
  name: "",
  parent: "",
};

function canManageCatalog(user) {
  const rawRole = typeof user?.role === "object" ? user.role?.name : user?.role;
  const role = String(rawRole || "").trim().toLowerCase();
  return Boolean(
    user?.is_superuser ||
      user?.is_staff ||
      role === "admin" ||
      role === "staff" ||
      role === "employee",
  );
}

function getApiError(error, fallback) {
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
      const message = Array.isArray(messages) ? messages.join(", ") : messages;
      return `${field}: ${message}`;
    })
    .join(" ");
}

function buildForm(category) {
  return {
    name: category?.name || "",
    parent: category?.parent ? String(category.parent) : "",
  };
}

export default function AdminCategoryManagement() {
  const { user } = useContext(AuthContext);
  const hasAccess = canManageCatalog(user);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async () => {
    if (!hasAccess) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (query.trim()) {
        params.search = query.trim();
      }
      const response = await axiosClient.get("/admin/categories/", { params });
      setCategories(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(getApiError(err, "Không thể tải danh sách thể loại."));
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess, query]);

  useEffect(() => {
    const timer = window.setTimeout(loadCategories, 0);
    return () => window.clearTimeout(timer);
  }, [loadCategories]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      root: categories.filter((category) => !category.parent).length,
      used: categories.filter((category) => Number(category.book_count || 0) > 0).length,
    }),
    [categories],
  );

  const openDialog = (category = null) => {
    setEditingCategory(category || { id: null });
    setForm(category ? buildForm(category) : emptyForm);
    setError("");
    setSuccess("");
  };

  const closeDialog = () => {
    if (isSaving) {
      return;
    }
    setEditingCategory(null);
    setForm(emptyForm);
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      setError("Điền thiếu thông tin tên thể loại.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name.trim(),
        parent: form.parent ? Number(form.parent) : null,
      };
      const savedCategory = editingCategory?.id
        ? await axiosClient.patch(`/admin/categories/${editingCategory.id}/`, payload)
        : await axiosClient.post("/admin/categories/", payload);

      setCategories((currentCategories) => {
        if (editingCategory?.id) {
          return currentCategories.map((category) =>
            category.id === savedCategory.id ? savedCategory : category,
          );
        }
        return [savedCategory, ...currentCategories];
      });
      setSuccess(`Đã lưu thể loại "${savedCategory.name}".`);
      closeDialog();
    } catch (err) {
      setError(getApiError(err, "Không thể lưu thể loại."));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (category) => {
    const confirmed = window.confirm(`Xóa thể loại "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await axiosClient.delete(`/admin/categories/${category.id}/`);
      setCategories((currentCategories) =>
        currentCategories.filter((item) => item.id !== category.id),
      );
      setSuccess(`Đã xóa thể loại "${category.name}".`);
    } catch (err) {
      setError(getApiError(err, "Không thể xóa thể loại."));
    }
  };

  const parentOptions = categories.filter(
    (category) => category.id !== editingCategory?.id,
  );

  if (!hasAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Chỉ tài khoản Admin hoặc Employee mới có quyền quản lý thể loại.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: "1px solid #ffe0e3",
            boxShadow: "0 16px 40px rgba(231, 91, 91, 0.08)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "primary.main", fontWeight: 900, letterSpacing: 1.2 }}
              >
                Catalog
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                Quản lý thể loại
              </Typography>
              <Typography color="text.secondary">
                Thêm, chỉnh sửa và sắp xếp nhóm thể loại dùng trong trang Khám phá.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                type="button"
                variant="outlined"
                startIcon={<RefreshOutlined />}
                onClick={loadCategories}
                sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
              >
                Tải lại
              </Button>
              <Button
                type="button"
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={() => openDialog()}
                sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
              >
                Thêm thể loại
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {[
            ["Tổng thể loại", stats.total],
            ["Thể loại gốc", stats.root],
            ["Đang có sách", stats.used],
          ].map(([label, value]) => (
            <Card key={label} sx={{ p: 2.25, borderRadius: 2.5 }}>
              <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
                {value}
              </Typography>
            </Card>
          ))}
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Card
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            border: "1px solid #eef2f7",
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ mb: 2.5 }}
          >
            <TextField
              fullWidth
              label="Tìm theo tên thể loại"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="button"
              variant="outlined"
              startIcon={<SearchOutlined />}
              onClick={loadCategories}
              sx={{ borderRadius: 2.5, minWidth: 136, py: 1.55, fontWeight: 800 }}
            >
              Tìm kiếm
            </Button>
          </Stack>

          {isLoading ? (
            <Stack alignItems="center" sx={{ py: 7 }}>
              <CircularProgress />
            </Stack>
          ) : categories.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 7 }}>
              <CategoryOutlined color="disabled" sx={{ fontSize: 54 }} />
              <Typography sx={{ fontWeight: 800 }}>Chưa có thể loại nào</Typography>
            </Stack>
          ) : (
            <Stack spacing={1.25}>
              {categories.map((category) => (
                <Card key={category.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography sx={{ fontWeight: 900, fontSize: "1.05rem" }}>
                          {category.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${category.book_count || 0} sách`}
                          color={category.book_count ? "success" : "default"}
                          variant={category.book_count ? "filled" : "outlined"}
                          sx={{ fontWeight: 800 }}
                        />
                      </Stack>
                      <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                        ID #{category.id} · Thể loại cha: {category.parent_name || "Không có"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75}>
                      <Button
                        variant="outlined"
                        startIcon={<EditOutlined />}
                        onClick={() => openDialog(category)}
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}
                      >
                        Sửa
                      </Button>
                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineOutlined />}
                        onClick={() => deleteCategory(category)}
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      </Stack>

      <Dialog open={Boolean(editingCategory)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingCategory?.id ? "Chỉnh sửa thể loại" : "Thêm thể loại"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Tên thể loại"
              value={form.name}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
              }
              autoFocus
            />
            <TextField
              select
              label="Thể loại cha"
              value={form.parent}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, parent: event.target.value }))
              }
              helperText="Bỏ trống nếu đây là thể loại cấp cao nhất."
            >
              <MenuItem value="">Không có</MenuItem>
              {parentOptions.map((category) => (
                <MenuItem key={category.id} value={String(category.id)}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Đóng</Button>
          <Button
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={18} /> : <SaveOutlined />}
            disabled={isSaving}
            onClick={saveCategory}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
