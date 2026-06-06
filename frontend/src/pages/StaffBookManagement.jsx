import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  CheckCircleOutlineOutlined,
  CloseOutlined,
  DeleteOutlineOutlined,
  EditOutlined,
  ImageOutlined,
  Inventory2Outlined,
  OpenInNewOutlined,
  PauseCircleOutlineOutlined,
  RefreshOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

function getCanManageCatalog(user) {
  const normalizedRole = (user?.role || "").trim().toLowerCase();
  return Boolean(
    user?.is_superuser ||
      user?.is_staff ||
      normalizedRole === "admin" ||
      normalizedRole === "employee",
  );
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function getNames(items, fieldName) {
  if (!Array.isArray(items)) {
    return "";
  }
  return items.map((item) => item?.[fieldName]).filter(Boolean).join(", ");
}

function formatStaffBookError(error) {
  const detail = error.response?.data?.detail;
  if (
    error.response?.status === 401 ||
    detail === "Authentication credentials were not provided."
  ) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để quản lý sách.";
  }

  if (error.response?.status === 403) {
    return detail || "Tài khoản hiện tại không có quyền quản lý sách.";
  }

  return detail || "Không thể tải danh sách sách. Vui lòng thử lại.";
}

function formatSaveError(error) {
  const data = error.response?.data;
  if (!data) {
    return "Không thể cập nhật sách. Vui lòng thử lại.";
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

function buildEditForm(book) {
  return {
    title: book?.title || "",
    publisher_name: book?.publisher?.name || "",
    price: book?.price ? String(Math.round(Number(book.price))) : "",
    year_of_publication: book?.year_of_publication
      ? String(book.year_of_publication)
      : "",
    description: book?.description || "",
    authors: getNames(book?.authors, "full_name"),
    categories: getNames(book?.categories, "name"),
    is_active: Boolean(book?.is_active),
  };
}

function matchesCurrentFilters(book, query, statusFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery =
    !normalizedQuery || book.title.toLowerCase().includes(normalizedQuery);
  const matchesStatus =
    statusFilter === "all" ||
    (statusFilter === "active" && book.is_active) ||
    (statusFilter === "inactive" && !book.is_active);
  return matchesQuery && matchesStatus;
}

function BookCover({ book }) {
  if (book.cover_url) {
    return (
      <Box
        component="img"
        src={book.cover_url}
        alt={book.title}
        sx={{
          width: 48,
          height: 66,
          borderRadius: 1.25,
          objectFit: "cover",
          boxShadow: "0 10px 22px rgba(15, 23, 42, 0.14)",
          flex: "0 0 auto",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 48,
        height: 66,
        borderRadius: 1.25,
        display: "grid",
        placeItems: "center",
        bgcolor: "#fff1f2",
        color: "primary.main",
        border: "1px solid #ffe0e3",
        flex: "0 0 auto",
      }}
    >
      <ImageOutlined />
    </Box>
  );
}

export default function StaffBookManagement() {
  const { user } = useContext(AuthContext);
  const canManageCatalog = getCanManageCatalog(user);
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState(buildEditForm(null));
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const publisherInputRef = useRef(null);

  const loadBooks = useCallback(async () => {
    if (!canManageCatalog) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (query.trim()) {
        params.q = query.trim();
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await axiosClient.get("/staff/books/", { params });
      setBooks(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(formatStaffBookError(err));
    } finally {
      setIsLoading(false);
    }
  }, [canManageCatalog, query, statusFilter]);

  useEffect(() => {
    const loadTimer = window.setTimeout(loadBooks, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadBooks]);

  const stats = useMemo(
    () => ({
      total: books.length,
      active: books.filter((book) => book.is_active).length,
      inactive: books.filter((book) => !book.is_active).length,
    }),
    [books],
  );

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setEditForm(buildEditForm(book));
    setEditError("");
    setEditFieldErrors({});
    setSuccess("");
  };

  const handleCloseEdit = () => {
    if (isSaving) {
      return;
    }
    setEditingBook(null);
    setEditError("");
    setEditFieldErrors({});
  };

  const handleEditField = (fieldName, value) => {
    setEditForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
    setEditFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: "",
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingBook) {
      return;
    }

    const nextErrors = {};
    if (!editForm.title.trim()) {
      nextErrors.title = "Điền thiếu thông tin tên sách.";
    }
    if (!editForm.price.trim()) {
      nextErrors.price = "Điền thiếu thông tin giá bán.";
    }
    if (!editForm.publisher_name.trim()) {
      nextErrors.publisher_name = "Điền thiếu thông tin nhà xuất bản.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setEditFieldErrors(nextErrors);
      setEditError("Vui lòng bổ sung các thông tin bắt buộc.");
      if (nextErrors.title) {
        titleInputRef.current?.focus();
      } else if (nextErrors.price) {
        priceInputRef.current?.focus();
      } else {
        publisherInputRef.current?.focus();
      }
      return;
    }

    setIsSaving(true);
    setEditError("");
    setEditFieldErrors({});
    setSuccess("");
    try {
      const payload = {
        title: editForm.title.trim(),
        publisher_name: editForm.publisher_name.trim(),
        price: editForm.price || "0",
        year_of_publication: editForm.year_of_publication
          ? Number(editForm.year_of_publication)
          : null,
        description: editForm.description,
        authors: editForm.authors,
        categories: editForm.categories,
        is_active: editForm.is_active,
      };
      const updatedBook = await axiosClient.patch(
        `/staff/books/${editingBook.id}/`,
        payload,
      );
      setBooks((currentBooks) =>
        currentBooks
          .map((book) => (book.id === updatedBook.id ? updatedBook : book))
          .filter((book) => matchesCurrentFilters(book, query, statusFilter)),
      );
      setEditingBook(updatedBook);
      setEditForm(buildEditForm(updatedBook));
      setSuccess(`Đã cập nhật sách "${updatedBook.title}".`);
    } catch (err) {
      setEditError(formatSaveError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (book) => {
    const confirmed = window.confirm(
      `Xóa sách "${book.title}" khỏi catalog? Thao tác này không thể hoàn tác.`,
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await axiosClient.delete(`/staff/books/${book.id}/`);
      setBooks((currentBooks) =>
        currentBooks.filter((currentBook) => currentBook.id !== book.id),
      );
      setSuccess(`Đã xóa sách "${book.title}".`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Không thể xóa sách. Vui lòng kiểm tra lại quyền truy cập.",
      );
    }
  };

  if (!canManageCatalog) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert
          severity="warning"
          action={
            <Button component={Link} to="/library" color="inherit" size="small">
              Về thư viện
            </Button>
          }
        >
          Chỉ tài khoản Admin hoặc Employee mới có quyền quản lý sách.
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
                Quản trị catalog
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                Quản lý sách
              </Typography>
              <Typography color="text.secondary">
                Theo dõi sách đã upload, trạng thái hiển thị và thông tin bán hàng.
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/staff/books/upload"
              variant="contained"
              startIcon={<AddOutlined />}
              sx={{
                alignSelf: { xs: "flex-start", md: "center" },
                borderRadius: 999,
                px: 2.25,
                py: 0.9,
                fontWeight: 800,
                textTransform: "none",
                boxShadow: "0 10px 22px rgba(231, 91, 91, 0.18)",
              }}
            >
              Upload sách mới
            </Button>
          </Stack>
        </Card>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {[
            ["Tổng số sách", stats.total],
            ["Đang hoạt động", stats.active],
            ["Đã tắt", stats.inactive],
          ].map(([label, value]) => (
            <Card
              key={label}
              sx={{
                p: 2.25,
                borderRadius: 2.5,
                border: "1px solid #eef2f7",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
              }}
            >
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
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", lg: "center" }}
            sx={{ mb: 2.5 }}
          >
            <TextField
              fullWidth
              label="Tìm theo tên sách"
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
            <TextField
              select
              label="Trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: { xs: "100%", lg: 190 } }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="inactive">Đã tắt</MenuItem>
            </TextField>
            <Button
              type="button"
              variant="outlined"
              onClick={loadBooks}
              startIcon={<SearchOutlined />}
              sx={{
                borderRadius: 2.5,
                minWidth: 136,
                py: 1.55,
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              Tìm kiếm
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={loadBooks}
              startIcon={<RefreshOutlined />}
              sx={{
                borderRadius: 999,
                minWidth: 110,
                py: 1.1,
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              Tải lại
            </Button>
          </Stack>

          {isLoading ? (
            <Stack alignItems="center" sx={{ py: 7 }}>
              <CircularProgress />
            </Stack>
          ) : books.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 7 }}>
              <Inventory2Outlined color="disabled" sx={{ fontSize: 54 }} />
              <Typography sx={{ fontWeight: 800 }}>Chưa có sách nào</Typography>
              <Typography color="text.secondary">
                Upload sách đầu tiên để bắt đầu quản lý catalog.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.25}>
              {books.map((book) => (
                <Card
                  key={book.id}
                  variant="outlined"
                  sx={{
                    p: { xs: 1.5, md: 1.75 },
                    borderRadius: 2,
                    borderColor: "#eef2f7",
                    boxShadow: "none",
                    transition: "background-color 0.18s ease, border-color 0.18s ease",
                    "&:hover": {
                      bgcolor: "#fff7f8",
                      borderColor: "#ffd1d6",
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.35}
                      alignItems="flex-start"
                      sx={{ flex: "1 1 auto", minWidth: 0 }}
                    >
                      <BookCover book={book} />
                      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            lineHeight: 1.25,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {book.title}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          ID #{book.id}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Tác giả: {getNames(book.authors, "full_name") || "Chưa có"}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Nhà xuất bản: {book.publisher?.name || "Chưa có"}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Thể loại: {getNames(book.categories, "name") || "Chưa phân loại"}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Giá:{" "}
                          <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                            {formatCurrency(book.price)}
                          </Box>
                          {book.year_of_publication ? ` · Năm ${book.year_of_publication}` : ""}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ pt: 0.25 }}>
                          <Typography color="text.secondary" variant="body2">
                            Trạng thái:
                          </Typography>
                          <Chip
                            icon={
                              book.is_active ? (
                                <CheckCircleOutlineOutlined />
                              ) : (
                                <PauseCircleOutlineOutlined />
                              )
                            }
                            label={book.is_active ? "Hoạt động" : "Đã tắt"}
                            color={book.is_active ? "success" : "default"}
                            variant={book.is_active ? "filled" : "outlined"}
                            size="small"
                            sx={{ fontWeight: 900 }}
                          />
                        </Stack>
                      </Stack>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                      sx={{ flex: "0 0 auto" }}
                    >
                      <Tooltip title="Xem trang bán sách">
                        <IconButton
                          component={Link}
                          to={`/book/${book.id}`}
                          size="small"
                          sx={{
                            width: 38,
                            height: 38,
                            border: "1px solid #fecdd3",
                            borderRadius: 1.5,
                            color: "primary.main",
                            flex: "0 0 auto",
                          }}
                          aria-label={`Xem sách ${book.title}`}
                        >
                          <OpenInNewOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa thông tin">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(book)}
                          sx={{
                            width: 38,
                            height: 38,
                            border: "1px solid #fecdd3",
                            borderRadius: 1.5,
                            color: "primary.main",
                            flex: "0 0 auto",
                          }}
                          aria-label={`Sửa sách ${book.title}`}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa sách">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(book)}
                          sx={{
                            width: 38,
                            height: 38,
                            border: "1px solid #fecdd3",
                            borderRadius: 1.5,
                            flex: "0 0 auto",
                          }}
                          aria-label={`Xóa sách ${book.title}`}
                        >
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      </Stack>

      <Dialog open={Boolean(editingBook)} onClose={handleCloseEdit} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Chỉnh sửa thông tin sách
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Cập nhật metadata, phân loại và trạng thái hiển thị của sách.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.25}>
            {editError && <Alert severity="error">{editError}</Alert>}
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "1.3fr 0.7fr" },
              }}
            >
              <TextField
                label="Tên sách"
                value={editForm.title}
                onChange={(event) => handleEditField("title", event.target.value)}
                inputRef={titleInputRef}
                error={Boolean(editFieldErrors.title)}
                helperText={editFieldErrors.title || " "}
              />
              <TextField
                label="Giá bán"
                type="number"
                value={editForm.price}
                onChange={(event) => handleEditField("price", event.target.value)}
                inputProps={{ min: 0 }}
                inputRef={priceInputRef}
                error={Boolean(editFieldErrors.price)}
                helperText={editFieldErrors.price || " "}
              />
              <TextField
                label="Nhà xuất bản"
                value={editForm.publisher_name}
                onChange={(event) =>
                  handleEditField("publisher_name", event.target.value)
                }
                inputRef={publisherInputRef}
                error={Boolean(editFieldErrors.publisher_name)}
                helperText={editFieldErrors.publisher_name || " "}
              />
              <TextField
                label="Năm xuất bản"
                type="number"
                value={editForm.year_of_publication}
                onChange={(event) =>
                  handleEditField("year_of_publication", event.target.value)
                }
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Tác giả"
                value={editForm.authors}
                onChange={(event) => handleEditField("authors", event.target.value)}
                helperText="Nhập nhiều tác giả bằng dấu phẩy."
              />
              <TextField
                label="Danh mục"
                value={editForm.categories}
                onChange={(event) => handleEditField("categories", event.target.value)}
                helperText="Nhập nhiều danh mục bằng dấu phẩy."
              />
            </Box>
            <TextField
              label="Mô tả"
              value={editForm.description}
              onChange={(event) => handleEditField("description", event.target.value)}
              multiline
              minRows={5}
            />
            <Divider />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={(event) =>
                    handleEditField("is_active", event.target.checked)
                  }
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>
                    {editForm.is_active
                      ? "Sách đang hoạt động"
                      : "Sách đang bị tắt"}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Khi tắt, sách vẫn hiển thị trong cửa hàng và thư viện nhưng người dùng không thể mua, thêm giỏ hàng hoặc đọc.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: "flex-start", gap: 1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseEdit}
            startIcon={<CloseOutlined />}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Đóng
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={18} /> : <SaveOutlined />}
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900 }}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
