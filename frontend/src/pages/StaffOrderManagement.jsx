import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CancelOutlined,
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  HourglassEmptyOutlined,
  ReceiptLongOutlined,
  RefreshOutlined,
  ReplayOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const ORDER_STATUSES = [
  { value: "all", label: "Tất cả", color: "default" },
  { value: "pending", label: "Chờ thanh toán", color: "warning" },
  { value: "completed", label: "Đã duyệt", color: "success" },
  { value: "cancelled", label: "Đã hủy", color: "default" },
  { value: "failed", label: "Thất bại", color: "error" },
  { value: "refunded", label: "Đã hoàn tiền", color: "info" },
];

function canManageOrders(user) {
  const role = (user?.role || "").trim().toLowerCase();
  return Boolean(user?.is_superuser || user?.is_staff || role === "admin" || role === "employee");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatDateTime(value) {
  if (!value) {
    return "Chưa cập nhật";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusConfig(status) {
  return ORDER_STATUSES.find((item) => item.value === status) || ORDER_STATUSES[0];
}

function formatOrderError(error) {
  const detail = error.response?.data?.detail;
  if (error.response?.status === 403) {
    return detail || "Tài khoản hiện tại không có quyền quản lý hóa đơn.";
  }
  return detail || "Không thể tải danh sách hóa đơn. Vui lòng thử lại.";
}

export default function StaffOrderManagement() {
  const { user } = useContext(AuthContext);
  const hasAccess = canManageOrders(user);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingId, setIsSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = useCallback(async () => {
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
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (paymentTypeFilter !== "all") {
        params.payment_type = paymentTypeFilter;
      }
      const response = await axiosClient.get("/staff/orders/", { params });
      setOrders(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(formatOrderError(err));
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess, paymentTypeFilter, query, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(loadOrders, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      completed: orders.filter((order) => order.status === "completed").length,
      revenue: orders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + Number(order.total_price || 0), 0),
    }),
    [orders],
  );

  const handleUpdateStatus = async (order, nextStatus) => {
    setIsSavingId(order.id);
    setError("");
    setSuccess("");
    try {
      const updatedOrder = await axiosClient.patch(`/staff/orders/${order.id}/`, {
        status: nextStatus,
      });
      setOrders((currentOrders) =>
        currentOrders
          .map((currentOrder) =>
            currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder,
          )
          .filter((currentOrder) =>
            statusFilter === "all" ? true : currentOrder.status === statusFilter,
          ),
      );
      setSuccess(`Đã cập nhật hóa đơn #${updatedOrder.id}.`);
    } catch (err) {
      setError(formatOrderError(err));
    } finally {
      setIsSavingId(null);
    }
  };

  if (!hasAccess) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Tài khoản hiện tại không có quyền quản lý hóa đơn.</Alert>
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
              Quản lý hóa đơn
            </Typography>
            <Typography color="text.secondary">
              Duyệt chuyển khoản, theo dõi trạng thái và xử lý hóa đơn ebook.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={loadOrders}
            disabled={isLoading}
            sx={{ borderRadius: 2, alignSelf: { xs: "stretch", md: "center" } }}
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
            <Typography sx={{ fontWeight: 800 }}>Tổng hóa đơn</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.total}</Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Chờ duyệt</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.pending}</Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Đã duyệt</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.completed}</Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Doanh thu đã duyệt</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{formatCurrency(stats.revenue)}</Typography>
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
              placeholder="Tìm mã hóa đơn, khách hàng, email, sách..."
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
              label="Trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              {ORDER_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Thanh toán"
              value={paymentTypeFilter}
              onChange={(event) => setPaymentTypeFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="Bank Transfer">Chuyển khoản</MenuItem>
              <MenuItem value="Card">Thẻ</MenuItem>
            </TextField>
            <Button variant="contained" onClick={loadOrders} sx={{ px: 4, borderRadius: 2 }}>
              Tìm kiếm
            </Button>
          </Stack>
        </Card>

        {isLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Card sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
            <ReceiptLongOutlined sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ fontWeight: 900 }}>Không có hóa đơn phù hợp</Typography>
            <Typography color="text.secondary">Thử đổi bộ lọc hoặc tải lại danh sách.</Typography>
          </Card>
        ) : (
          <Stack spacing={2}>
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const isSaving = isSavingId === order.id;
              return (
                <Card key={order.id} sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", lg: "center" }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            Hóa đơn #{order.id}
                          </Typography>
                          <Chip
                            size="small"
                            color={statusConfig.color}
                            label={statusConfig.label}
                            sx={{ fontWeight: 800 }}
                          />
                          {order.payment_type && (
                            <Chip size="small" variant="outlined" label={order.payment_type} />
                          )}
                        </Stack>
                        <Typography color="text.secondary">
                          {order.customer?.full_name || order.customer?.username} · {order.customer?.email}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Tạo lúc {formatDateTime(order.created_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: { xs: "left", lg: "right" } }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                          {formatCurrency(order.total_price)}
                        </Typography>
                        {order.gateway_reference && (
                          <Typography color="text.secondary" variant="body2">
                            Mã GD: {order.gateway_reference}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    <Divider />

                    <Box>
                      <Typography sx={{ fontWeight: 800, mb: 0.75 }}>Sách trong hóa đơn</Typography>
                      <Stack spacing={0.75}>
                        {(order.items || []).map((item) => (
                          <Stack
                            key={item.id}
                            direction="row"
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Typography>{item.book_title}</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{formatCurrency(item.price)}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>

                    {order.payment_instructions?.transfer_content && (
                      <Alert severity="info">
                        Nội dung chuyển khoản: <strong>{order.payment_instructions.transfer_content}</strong>
                      </Alert>
                    )}

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleOutlineOutlined />}
                        disabled={isSaving || order.status === "completed"}
                        onClick={() => handleUpdateStatus(order, "completed")}
                      >
                        Duyệt hóa đơn
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<CancelOutlined />}
                        disabled={isSaving || order.status === "cancelled"}
                        onClick={() => handleUpdateStatus(order, "cancelled")}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ErrorOutlineOutlined />}
                        disabled={isSaving || order.status === "failed"}
                        onClick={() => handleUpdateStatus(order, "failed")}
                      >
                        Thất bại
                      </Button>
                      <Button
                        variant="outlined"
                        color="info"
                        startIcon={<ReplayOutlined />}
                        disabled={isSaving || order.status === "refunded"}
                        onClick={() => handleUpdateStatus(order, "refunded")}
                      >
                        Hoàn tiền
                      </Button>
                      {order.pending_expires_at && (
                        <Chip
                          icon={<HourglassEmptyOutlined />}
                          label={`Hết hạn: ${formatDateTime(order.pending_expires_at)}`}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
