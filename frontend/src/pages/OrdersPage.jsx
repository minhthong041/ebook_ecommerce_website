import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ReceiptLongOutlined, StorefrontOutlined } from "@mui/icons-material";
import axiosClient from "../api/axiosClient";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function getPaymentStatusColor(status) {
  if (status === "Success" || status === "success") {
    return "success";
  }
  if (status === "Pending" || status === "pending") {
    return "warning";
  }
  if (status === "Failed" || status === "failed") {
    return "error";
  }
  return "default";
}

const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "failed", label: "Thất bại" },
  { value: "refunded", label: "Đã hoàn tiền" },
];

function getOrderStatusLabel(status) {
  return (
    ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ||
    status ||
    "Chưa cập nhật"
  );
}

function getOrderStatusColor(status) {
  if (status === "completed") {
    return "success";
  }
  if (status === "pending") {
    return "warning";
  }
  if (status === "cancelled" || status === "failed") {
    return "error";
  }
  return "default";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    const loadOrdersTimer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = statusFilter === "all" ? {} : { status: statusFilter };
        const response = await axiosClient.get("/orders/", { params });
        if (isMounted) {
          setOrders(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              "Không thể tải danh sách đơn hàng.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(loadOrdersTimer);
    };
  }, [statusFilter]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "flex-end" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                Đơn hàng
              </Typography>
              <Typography color="text.secondary">
                Theo dõi lịch sử mua ebook và các giao dịch đã thanh toán.
              </Typography>
            </Box>
            <TextField
              select
              label="Lọc trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: { xs: "100%", md: 220 } }}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {isLoading ? (
          <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <ReceiptLongOutlined color="disabled" sx={{ fontSize: 56 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Đang tải đơn hàng
              </Typography>
              <Typography color="text.secondary">
                Đang đồng bộ lịch sử mua ebook của bạn.
              </Typography>
            </Stack>
          </Card>
        ) : orders.length === 0 ? (
          <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <ReceiptLongOutlined color="disabled" sx={{ fontSize: 56 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Chưa có đơn hàng nào
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
                Khi bạn thanh toán ebook, đơn hàng và trạng thái giao dịch sẽ hiển thị tại đây.
              </Typography>
              <Button
                component={Link}
                to="/browse"
                variant="contained"
                startIcon={<StorefrontOutlined />}
                sx={{ borderRadius: 999, px: 3 }}
              >
                Mua sách
              </Button>
            </Stack>
          </Card>
        ) : (
          <Stack spacing={2}>
            {orders.map((order) => (
              <Card key={order.id} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Đơn hàng #{order.id}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={getOrderStatusLabel(order.status)}
                        color={getOrderStatusColor(order.status)}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                      <Chip
                        label={order.payment_status || "Chưa có giao dịch"}
                        color={getPaymentStatusColor(order.payment_status)}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                      {order.payment_type && (
                        <Chip
                          label={order.payment_type}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    {(order.items || []).map((item) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Typography>{item.book_title}</Typography>
                        <Typography sx={{ fontWeight: 800 }}>
                          {formatCurrency(item.price)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Divider />

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Mã giao dịch
                      </Typography>
                      <Typography sx={{ fontWeight: 800 }}>
                        {order.gateway_reference || "Đang cập nhật"}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                      <Typography color="text.secondary" variant="body2">
                        Tổng tiền
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: "primary.main" }}>
                        {formatCurrency(order.total_price)}
                      </Typography>
                    </Box>
                  </Stack>

                  {order.payment_instructions && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, mb: 1 }}>
                        Thông tin chuyển khoản
                      </Typography>
                      {order.payment_instructions.qr_url && (
                        <Box
                          component="img"
                          src={order.payment_instructions.qr_url}
                          alt="QR thanh toán Vietcombank"
                          sx={{
                            display: "block",
                            width: { xs: "100%", sm: 220 },
                            maxWidth: 260,
                            aspectRatio: "1 / 1",
                            objectFit: "contain",
                            p: 1,
                            mb: 1.5,
                            borderRadius: 2,
                            bgcolor: "#fff",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      )}
                      <Typography variant="body2">
                        {order.payment_instructions.bank_name} •{" "}
                        {order.payment_instructions.account_number} •{" "}
                        {order.payment_instructions.account_name}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Nội dung: <strong>{order.payment_instructions.transfer_content}</strong>
                      </Typography>
                      {order.pending_expires_at && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Hạn thanh toán:{" "}
                          <strong>
                            {new Date(order.pending_expires_at).toLocaleString("vi-VN")}
                          </strong>
                        </Typography>
                      )}
                    </Box>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

      </Stack>
    </Container>
  );
}
