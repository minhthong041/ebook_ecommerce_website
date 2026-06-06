import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AutoStoriesOutlined,
  EmojiEventsOutlined,
  ManageAccountsOutlined,
  ReceiptLongOutlined,
  StorefrontOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

function canManageCatalog(user) {
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

function formatDashboardError(error) {
  const detail = error.response?.data?.detail;
  if (error.response?.status === 403) {
    return detail || "Tài khoản hiện tại không có quyền xem thống kê quản trị.";
  }
  return detail || "Không thể tải thống kê dashboard.";
}

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const displayName = user?.full_name || user?.username || "Người dùng";
  const hasCatalogAccess = canManageCatalog(user);
  const [staffStats, setStaffStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    if (!hasCatalogAccess) {
      return undefined;
    }

    let isMounted = true;
    const loadStatsTimer = window.setTimeout(async () => {
      setIsStatsLoading(true);
      setStatsError("");
      try {
        const response = await axiosClient.get("/staff/dashboard/");
        if (isMounted) {
          setStaffStats(response);
        }
      } catch (error) {
        if (isMounted) {
          setStatsError(formatDashboardError(error));
        }
      } finally {
        if (isMounted) {
          setIsStatsLoading(false);
        }
      }
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(loadStatsTimer);
    };
  }, [hasCatalogAccess]);

  const maxMonthlyRevenue = useMemo(() => {
    const revenues = staffStats?.monthly_revenue?.map((item) => Number(item.revenue || 0)) || [];
    return Math.max(...revenues, 1);
  }, [staffStats]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            Xin chào {displayName}, đây là khu vực tổng quan tài khoản Readify.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <AutoStoriesOutlined color="primary" />
            <Typography sx={{ mt: 1.5, fontWeight: 800 }}>
              Thư viện cá nhân
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Theo dõi các ebook đã mua và tiếp tục đọc.
            </Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <ReceiptLongOutlined color="primary" />
            <Typography sx={{ mt: 1.5, fontWeight: 800 }}>
              Đơn hàng
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Kiểm tra lịch sử mua sách và trạng thái thanh toán.
            </Typography>
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 2 }}>
            <ManageAccountsOutlined color="primary" />
            <Typography sx={{ mt: 1.5, fontWeight: 800 }}>
              Hồ sơ
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Cập nhật thông tin cá nhân, ảnh đại diện và mật khẩu.
            </Typography>
          </Card>
        </Box>

        {hasCatalogAccess && (
          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Thống kê kinh doanh
                  </Typography>
                  <Typography color="text.secondary">
                    Doanh thu tháng hiện tại và bảng xếp hạng sách bán chạy.
                  </Typography>
                </Box>
                {staffStats?.current_month?.label && (
                  <Chip
                    icon={<TrendingUpOutlined />}
                    label={`Tháng ${staffStats.current_month.label}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                )}
              </Stack>

              {statsError && <Alert severity="error">{statsError}</Alert>}

              {isStatsLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : staffStats ? (
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                    }}
                  >
                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                        Doanh thu tháng
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
                        {formatCurrency(staffStats.current_month?.revenue)}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {staffStats.current_month?.order_count || 0} hóa đơn đã duyệt
                      </Typography>
                    </Card>
                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                        So với tháng trước
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          mt: 0.5,
                          color: Number(staffStats.revenue_delta || 0) >= 0 ? "success.main" : "error.main",
                        }}
                      >
                        {Number(staffStats.revenue_delta || 0) >= 0 ? "+" : ""}
                        {formatCurrency(staffStats.revenue_delta)}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        Tháng trước: {formatCurrency(staffStats.previous_month?.revenue)}
                      </Typography>
                    </Card>
                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                        Tổng doanh thu đã duyệt
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
                        {formatCurrency(staffStats.total_completed_revenue)}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        Tính theo các hóa đơn completed
                      </Typography>
                    </Card>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 900, mb: 2 }}>
                        Doanh thu 6 tháng gần nhất
                      </Typography>
                      <Stack spacing={1.5}>
                        {(staffStats.monthly_revenue || []).map((month) => {
                          const width = `${Math.max((Number(month.revenue || 0) / maxMonthlyRevenue) * 100, 4)}%`;
                          return (
                            <Box key={month.month}>
                              <Stack direction="row" justifyContent="space-between" spacing={2}>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                  {month.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatCurrency(month.revenue)}
                                </Typography>
                              </Stack>
                              <Box
                                sx={{
                                  height: 10,
                                  bgcolor: "action.hover",
                                  borderRadius: 999,
                                  overflow: "hidden",
                                  mt: 0.75,
                                }}
                              >
                                <Box
                                  sx={{
                                    width,
                                    height: "100%",
                                    bgcolor: "primary.main",
                                    borderRadius: 999,
                                  }}
                                />
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Card>

                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <EmojiEventsOutlined color="primary" />
                        <Typography sx={{ fontWeight: 900 }}>
                          Bảng xếp hạng sách bán chạy
                        </Typography>
                      </Stack>
                      {(staffStats.best_selling_books || []).length === 0 ? (
                        <Typography color="text.secondary">
                          Chưa có sách nào được bán trong các hóa đơn đã duyệt.
                        </Typography>
                      ) : (
                        <Stack divider={<Divider flexItem />} spacing={1.25}>
                          {staffStats.best_selling_books.map((book, index) => (
                            <Stack
                              key={book.book_id}
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                                <Chip label={`#${index + 1}`} size="small" sx={{ fontWeight: 900 }} />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 900 }} noWrap>
                                    {book.title}
                                  </Typography>
                                  <Typography color="text.secondary" variant="body2">
                                    {book.sold_count} lượt bán
                                  </Typography>
                                </Box>
                              </Stack>
                              <Typography sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>
                                {formatCurrency(book.revenue)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Card>
                  </Box>
                </>
              ) : null}
            </Stack>
          </Card>
        )}

        <Card sx={{ p: 3, borderRadius: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Thao tác nhanh
              </Typography>
              <Typography color="text.secondary">
                Truy cập nhanh các khu vực thường dùng trong hệ thống.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} to="/library" variant="outlined">
                Thư viện
              </Button>
              <Button component={Link} to="/orders" variant="outlined">
                Đơn hàng
              </Button>
              {hasCatalogAccess && (
                <Button
                  component={Link}
                  to="/staff/books"
                  variant="contained"
                  startIcon={<StorefrontOutlined />}
                >
                  Quản lý sách
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
