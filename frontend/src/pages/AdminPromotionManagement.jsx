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
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  DeleteOutlineOutlined,
  EditOutlined,
  LocalOfferOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const emptyPromotionForm = {
  name: "",
  description: "",
  discount_rate: "",
  start_date: "",
  end_date: "",
  book_ids: [],
  category_ids: [],
};

const emptyCouponForm = {
  code: "",
  discount_value: "",
  usage_limit: "",
  expiry_date: "",
  book_ids: [],
  category_ids: [],
};

function isAdmin(user) {
  const role = (user?.role || "").trim().toLowerCase();
  return Boolean(user?.is_superuser || role === "admin");
}

function getListPayload(response) {
  if (Array.isArray(response)) {
    return response;
  }
  return Array.isArray(response?.results) ? response.results : [];
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) {
    return "Chưa đặt";
  }
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
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

function MultiSelectBox({ label, options, value, onChange }) {
  return (
    <Box>
      <Typography sx={{ mb: 0.75, fontWeight: 800 }}>{label}</Typography>
      <Box
        component="select"
        multiple
        value={value.map(String)}
        onChange={(event) => {
          const nextValue = Array.from(event.target.selectedOptions).map((option) =>
            Number(option.value),
          );
          onChange(nextValue);
        }}
        sx={{
          width: "100%",
          minHeight: 132,
          p: 1,
          borderRadius: 2,
          border: "1px solid #dbe2ea",
          bgcolor: "background.paper",
          color: "text.primary",
          fontFamily: "inherit",
          "& option": { p: 1 },
        }}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.title || option.name}
          </option>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Giữ Ctrl để chọn nhiều mục. Bỏ trống nghĩa là áp dụng toàn bộ.
      </Typography>
    </Box>
  );
}

export default function AdminPromotionManagement() {
  const { user } = useContext(AuthContext);
  const hasAccess = isAdmin(user);
  const [tab, setTab] = useState("promotions");
  const [promotions, setPromotions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!hasAccess) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [promotionResponse, couponResponse, bookResponse, categoryResponse] =
        await Promise.all([
          axiosClient.get("/admin/promotions/"),
          axiosClient.get("/admin/coupons/"),
          axiosClient.get("/books/", { params: { page_size: 200 } }),
          axiosClient.get("/categories/"),
        ]);
      setPromotions(getListPayload(promotionResponse));
      setCoupons(getListPayload(couponResponse));
      setBooks(getListPayload(bookResponse));
      setCategories(getListPayload(categoryResponse));
    } catch (err) {
      setError(getApiError(err, "Không thể tải dữ liệu khuyến mãi."));
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const stats = useMemo(
    () => ({
      activePromotions: promotions.filter((item) => item.is_active).length,
      activeCoupons: coupons.filter((item) => item.is_active).length,
      totalPromotions: promotions.length,
      totalCoupons: coupons.length,
    }),
    [promotions, coupons],
  );

  const openPromotionDialog = (promotion = null) => {
    setEditingPromotion(promotion || { id: null });
    setPromotionForm(
      promotion
        ? {
            name: promotion.name || "",
            description: promotion.description || "",
            discount_rate: String(Number(promotion.discount_rate || 0)),
            start_date: promotion.start_date || "",
            end_date: promotion.end_date || "",
            book_ids: promotion.book_ids || [],
            category_ids: promotion.category_ids || [],
          }
        : emptyPromotionForm,
    );
    setError("");
    setSuccess("");
  };

  const openCouponDialog = (coupon = null) => {
    setEditingCoupon(coupon || { id: null });
    setCouponForm(
      coupon
        ? {
            code: coupon.code || "",
            discount_value: String(Number(coupon.discount_value || 0)),
            usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : "",
            expiry_date: toDateTimeLocal(coupon.expiry_date),
            book_ids: coupon.book_ids || [],
            category_ids: coupon.category_ids || [],
          }
        : emptyCouponForm,
    );
    setError("");
    setSuccess("");
  };

  const closeDialogs = () => {
    if (isSaving) {
      return;
    }
    setEditingPromotion(null);
    setEditingCoupon(null);
  };

  const savePromotion = async () => {
    if (!promotionForm.name.trim() || !promotionForm.discount_rate || !promotionForm.start_date || !promotionForm.end_date) {
      setError("Điền thiếu thông tin chương trình khuyến mãi.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = {
        ...promotionForm,
        name: promotionForm.name.trim(),
        discount_rate: promotionForm.discount_rate,
      };
      const saved = editingPromotion?.id
        ? await axiosClient.patch(`/admin/promotions/${editingPromotion.id}/`, payload)
        : await axiosClient.post("/admin/promotions/", payload);
      setPromotions((current) => {
        if (editingPromotion?.id) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current];
      });
      setSuccess(`Đã lưu chương trình "${saved.name}".`);
      setEditingPromotion(null);
    } catch (err) {
      setError(getApiError(err, "Không thể lưu chương trình khuyến mãi."));
    } finally {
      setIsSaving(false);
    }
  };

  const saveCoupon = async () => {
    if (!couponForm.code.trim() || !couponForm.discount_value || !couponForm.expiry_date) {
      setError("Điền thiếu thông tin mã giảm giá.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = {
        ...couponForm,
        code: couponForm.code.trim().toUpperCase(),
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      };
      const saved = editingCoupon?.id
        ? await axiosClient.patch(`/admin/coupons/${editingCoupon.id}/`, payload)
        : await axiosClient.post("/admin/coupons/", payload);
      setCoupons((current) => {
        if (editingCoupon?.id) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current];
      });
      setSuccess(`Đã lưu mã "${saved.code}".`);
      setEditingCoupon(null);
    } catch (err) {
      setError(getApiError(err, "Không thể lưu mã giảm giá."));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (type, item) => {
    const label = type === "promotion" ? item.name : item.code;
    const confirmed = window.confirm(`Xóa "${label}"?`);
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      if (type === "promotion") {
        await axiosClient.delete(`/admin/promotions/${item.id}/`);
        setPromotions((current) => current.filter((promotion) => promotion.id !== item.id));
      } else {
        await axiosClient.delete(`/admin/coupons/${item.id}/`);
        setCoupons((current) => current.filter((coupon) => coupon.id !== item.id));
      }
      setSuccess(`Đã xóa "${label}".`);
    } catch (err) {
      setError(getApiError(err, "Không thể xóa dữ liệu."));
    }
  };

  if (!hasAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Chỉ tài khoản Admin mới có quyền quản lý khuyến mãi và mã giảm giá.
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
                Bán hàng
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                Khuyến mãi & mã giảm giá
              </Typography>
              <Typography color="text.secondary">
                Tạo chương trình giảm trực tiếp theo sách/thể loại và mã coupon ở checkout.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                type="button"
                variant="outlined"
                startIcon={<RefreshOutlined />}
                onClick={loadData}
                sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
              >
                Tải lại
              </Button>
              <Button
                type="button"
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={() =>
                  tab === "promotions" ? openPromotionDialog() : openCouponDialog()
                }
                sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
              >
                Thêm mới
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {[
            ["Chương trình", stats.totalPromotions],
            ["Đang chạy", stats.activePromotions],
            ["Mã giảm giá", stats.totalCoupons],
            ["Mã còn hiệu lực", stats.activeCoupons],
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

        <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab value="promotions" label="Chương trình khuyến mãi" />
            <Tab value="coupons" label="Mã giảm giá" />
          </Tabs>
          <Divider />

          {isLoading ? (
            <Stack alignItems="center" sx={{ py: 7 }}>
              <CircularProgress />
            </Stack>
          ) : tab === "promotions" ? (
            <Stack spacing={1.25} sx={{ p: 2 }}>
              {promotions.map((promotion) => (
                <Card key={promotion.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography sx={{ fontWeight: 900, fontSize: "1.05rem" }}>
                          {promotion.name}
                        </Typography>
                        <Chip
                          size="small"
                          color={promotion.is_active ? "success" : "default"}
                          label={promotion.is_active ? "Đang chạy" : "Không hoạt động"}
                          sx={{ fontWeight: 800 }}
                        />
                      </Stack>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        Giảm {Number(promotion.discount_rate || 0)}% · {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        Áp dụng {promotion.book_count || 0} sách, {promotion.category_count || 0} thể loại.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75}>
                      <Button
                        variant="outlined"
                        startIcon={<EditOutlined />}
                        onClick={() => openPromotionDialog(promotion)}
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}
                      >
                        Sửa
                      </Button>
                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineOutlined />}
                        onClick={() => deleteItem("promotion", promotion)}
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
              {promotions.length === 0 && (
                <Stack alignItems="center" spacing={1} sx={{ py: 7 }}>
                  <LocalOfferOutlined color="disabled" sx={{ fontSize: 54 }} />
                  <Typography sx={{ fontWeight: 800 }}>Chưa có chương trình nào</Typography>
                </Stack>
              )}
            </Stack>
          ) : (
            <Stack spacing={1.25} sx={{ p: 2 }}>
              {coupons.map((coupon) => (
                <Card key={coupon.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography sx={{ fontWeight: 900, fontSize: "1.05rem" }}>
                          {coupon.code}
                        </Typography>
                        <Chip
                          size="small"
                          color={coupon.is_active ? "success" : "default"}
                          label={coupon.is_active ? "Còn hiệu lực" : "Hết hiệu lực"}
                          sx={{ fontWeight: 800 }}
                        />
                      </Stack>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        Giảm {formatCurrency(coupon.discount_value)} · Hết hạn {formatDate(coupon.expiry_date)}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        Đã dùng {coupon.usage_count || 0}
                        {coupon.usage_limit ? `/${coupon.usage_limit}` : ""} lượt · Áp dụng {coupon.book_count || 0} sách, {coupon.category_count || 0} thể loại.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75}>
                      <Button
                        variant="outlined"
                        startIcon={<EditOutlined />}
                        onClick={() => openCouponDialog(coupon)}
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}
                      >
                        Sửa
                      </Button>
                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineOutlined />}
                        onClick={() => deleteItem("coupon", coupon)}
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
              {coupons.length === 0 && (
                <Stack alignItems="center" spacing={1} sx={{ py: 7 }}>
                  <LocalOfferOutlined color="disabled" sx={{ fontSize: 54 }} />
                  <Typography sx={{ fontWeight: 800 }}>Chưa có mã giảm giá nào</Typography>
                </Stack>
              )}
            </Stack>
          )}
        </Card>
      </Stack>

      <Dialog open={Boolean(editingPromotion)} onClose={closeDialogs} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingPromotion?.id ? "Chỉnh sửa chương trình" : "Thêm chương trình"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Tên chương trình"
              value={promotionForm.name}
              onChange={(event) =>
                setPromotionForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <TextField
              label="Mô tả"
              multiline
              minRows={2}
              value={promotionForm.description}
              onChange={(event) =>
                setPromotionForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
              <TextField
                label="Phần trăm giảm"
                type="number"
                value={promotionForm.discount_rate}
                onChange={(event) =>
                  setPromotionForm((current) => ({ ...current, discount_rate: event.target.value }))
                }
              />
              <TextField
                label="Ngày bắt đầu"
                type="date"
                value={promotionForm.start_date}
                onChange={(event) =>
                  setPromotionForm((current) => ({ ...current, start_date: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Ngày kết thúc"
                type="date"
                value={promotionForm.end_date}
                onChange={(event) =>
                  setPromotionForm((current) => ({ ...current, end_date: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <MultiSelectBox
                label="Áp dụng theo sách"
                options={books}
                value={promotionForm.book_ids}
                onChange={(value) =>
                  setPromotionForm((current) => ({ ...current, book_ids: value }))
                }
              />
              <MultiSelectBox
                label="Áp dụng theo thể loại"
                options={categories}
                value={promotionForm.category_ids}
                onChange={(value) =>
                  setPromotionForm((current) => ({ ...current, category_ids: value }))
                }
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Đóng</Button>
          <Button variant="contained" onClick={savePromotion} disabled={isSaving}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingCoupon)} onClose={closeDialogs} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingCoupon?.id ? "Chỉnh sửa mã giảm giá" : "Thêm mã giảm giá"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
              <TextField
                label="Mã giảm giá"
                value={couponForm.code}
                onChange={(event) =>
                  setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
              <TextField
                label="Số tiền giảm"
                type="number"
                value={couponForm.discount_value}
                onChange={(event) =>
                  setCouponForm((current) => ({ ...current, discount_value: event.target.value }))
                }
              />
              <TextField
                label="Giới hạn lượt dùng"
                type="number"
                value={couponForm.usage_limit}
                onChange={(event) =>
                  setCouponForm((current) => ({ ...current, usage_limit: event.target.value }))
                }
                placeholder="Bỏ trống nếu không giới hạn"
              />
            </Box>
            <TextField
              label="Ngày hết hạn"
              type="datetime-local"
              value={couponForm.expiry_date}
              onChange={(event) =>
                setCouponForm((current) => ({ ...current, expiry_date: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <MultiSelectBox
                label="Áp dụng theo sách"
                options={books}
                value={couponForm.book_ids}
                onChange={(value) =>
                  setCouponForm((current) => ({ ...current, book_ids: value }))
                }
              />
              <MultiSelectBox
                label="Áp dụng theo thể loại"
                options={categories}
                value={couponForm.category_ids}
                onChange={(value) =>
                  setCouponForm((current) => ({ ...current, category_ids: value }))
                }
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Đóng</Button>
          <Button variant="contained" onClick={saveCoupon} disabled={isSaving}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
