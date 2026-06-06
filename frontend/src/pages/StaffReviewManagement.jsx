import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  DeleteOutlineOutlined,
  DoneOutlined,
  HourglassEmptyOutlined,
  RefreshOutlined,
  ReportProblemOutlined,
  SearchOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const REVIEW_STATUSES = [
  {
    value: "pending",
    label: "Chờ duyệt",
    chipColor: "warning",
    actionLabel: "Chờ duyệt",
    icon: <HourglassEmptyOutlined fontSize="small" />,
  },
  {
    value: "approved",
    label: "Đã duyệt",
    chipColor: "success",
    actionLabel: "Duyệt",
    icon: <DoneOutlined fontSize="small" />,
  },
  {
    value: "rejected",
    label: "Từ chối",
    chipColor: "error",
    actionLabel: "Từ chối",
    icon: <BlockOutlined fontSize="small" />,
  },
  {
    value: "reported",
    label: "Bị báo cáo",
    chipColor: "error",
    actionLabel: "Đánh dấu báo cáo",
    icon: <ReportProblemOutlined fontSize="small" />,
  },
  {
    value: "hidden",
    label: "Đã ẩn",
    chipColor: "default",
    actionLabel: "Ẩn",
    icon: <VisibilityOffOutlined fontSize="small" />,
  },
  {
    value: "deleted",
    label: "Đã xóa mềm",
    chipColor: "default",
    actionLabel: "Xóa mềm",
    icon: <DeleteOutlineOutlined fontSize="small" />,
  },
];

const STATUS_LABELS = REVIEW_STATUSES.reduce((labels, status) => {
  labels[status.value] = status.label;
  return labels;
}, {});

function getCanManageCatalog(user) {
  const normalizedRole = (user?.role || "").trim().toLowerCase();
  return Boolean(
    user?.is_superuser ||
      user?.is_staff ||
      normalizedRole === "admin" ||
      normalizedRole === "employee",
  );
}

function formatReviewError(error) {
  const detail = error.response?.data?.detail;
  if (
    error.response?.status === 401 ||
    detail === "Authentication credentials were not provided."
  ) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để quản lý đánh giá.";
  }

  if (error.response?.status === 403) {
    return detail || "Tài khoản hiện tại không có quyền quản lý đánh giá.";
  }

  return detail || "Không thể tải danh sách đánh giá. Vui lòng thử lại.";
}

function formatSaveError(error) {
  const data = error.response?.data;
  if (!data) {
    return "Không thể cập nhật đánh giá. Vui lòng thử lại.";
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
  return (
    REVIEW_STATUSES.find((statusOption) => statusOption.value === status) ||
    REVIEW_STATUSES[0]
  );
}

function reviewMatchesCurrentFilters(review, query, statusFilter, ratingFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery =
    !normalizedQuery ||
    [
      review.book_title,
      review.customer_name,
      review.customer_email,
      review.title,
      review.comment,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  const matchesStatus =
    statusFilter === "all" || review.status === statusFilter;
  const matchesRating =
    ratingFilter === "all" || Number(review.rating) === Number(ratingFilter);

  return matchesQuery && matchesStatus && matchesRating;
}

function RatingStars({ rating }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <Box component="span" sx={{ color: "#f59e0b", letterSpacing: 0.5 }}>
      {"★".repeat(safeRating)}
      {"☆".repeat(5 - safeRating)}
    </Box>
  );
}

export default function StaffReviewManagement() {
  const { user } = useContext(AuthContext);
  const canManageCatalog = getCanManageCatalog(user);
  const [reviews, setReviews] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReviews = useCallback(async () => {
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
      if (ratingFilter !== "all") {
        params.rating = ratingFilter;
      }
      const response = await axiosClient.get("/staff/reviews/", { params });
      setReviews(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(formatReviewError(err));
    } finally {
      setIsLoading(false);
    }
  }, [canManageCatalog, query, statusFilter, ratingFilter]);

  useEffect(() => {
    const loadTimer = window.setTimeout(loadReviews, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadReviews]);

  const stats = useMemo(
    () => ({
      total: reviews.length,
      pending: reviews.filter((review) => review.status === "pending").length,
      approved: reviews.filter((review) => review.status === "approved").length,
      reported: reviews.filter((review) => review.status === "reported").length,
    }),
    [reviews],
  );

  const updateReviewInList = (updatedReview) => {
    setReviews((currentReviews) =>
      currentReviews
        .map((review) =>
          review.id === updatedReview.id ? updatedReview : review,
        )
        .filter((review) =>
          reviewMatchesCurrentFilters(review, query, statusFilter, ratingFilter),
        ),
    );
  };

  const handleSetStatus = async (review, nextStatus) => {
    if (review.status === nextStatus) {
      return;
    }

    setUpdatingId(review.id);
    setError("");
    setSuccess("");
    try {
      const updatedReview = await axiosClient.patch(
        `/staff/reviews/${review.id}/`,
        { status: nextStatus },
      );
      updateReviewInList(updatedReview);
      setSuccess(
        `Đã chuyển đánh giá #${review.id} sang trạng thái "${STATUS_LABELS[nextStatus] || nextStatus}".`,
      );
    } catch (err) {
      setError(formatSaveError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSoftDelete = async (review) => {
    const confirmed = window.confirm(
      `Xóa mềm đánh giá #${review.id}? Frontend sẽ không hiển thị đánh giá này, nhưng dữ liệu vẫn được lưu trong database.`,
    );
    if (!confirmed) {
      return;
    }

    setUpdatingId(review.id);
    setError("");
    setSuccess("");
    try {
      const updatedReview = await axiosClient.delete(
        `/staff/reviews/${review.id}/`,
      );
      updateReviewInList(updatedReview);
      setSuccess(`Đã xóa mềm đánh giá #${review.id}.`);
    } catch (err) {
      setError(formatSaveError(err));
    } finally {
      setUpdatingId(null);
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
          Chỉ tài khoản Admin hoặc Employee mới có quyền quản lý đánh giá.
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
                Kiểm duyệt nội dung
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                Quản lý đánh giá
              </Typography>
              <Typography color="text.secondary">
                Duyệt review trước khi hiển thị công khai và xử lý đánh giá bị báo cáo.
              </Typography>
            </Box>
            <Button
              type="button"
              variant="contained"
              startIcon={<RefreshOutlined />}
              onClick={loadReviews}
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
              Tải lại
            </Button>
          </Stack>
        </Card>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {[
            ["Tổng đánh giá", stats.total],
            ["Chờ duyệt", stats.pending],
            ["Đã duyệt", stats.approved],
            ["Bị báo cáo", stats.reported],
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
              label="Tìm theo sách, người dùng hoặc nội dung"
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
              {REVIEW_STATUSES.map((statusOption) => (
                <MenuItem key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Số sao"
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value)}
              sx={{ minWidth: { xs: "100%", lg: 130 } }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {[5, 4, 3, 2, 1].map((rating) => (
                <MenuItem key={rating} value={String(rating)}>
                  {rating} sao
                </MenuItem>
              ))}
            </TextField>
            <Button
              type="button"
              variant="outlined"
              onClick={loadReviews}
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
          </Stack>

          {isLoading ? (
            <Stack alignItems="center" sx={{ py: 7 }}>
              <CircularProgress />
            </Stack>
          ) : reviews.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 7 }}>
              <CheckCircleOutlineOutlined color="disabled" sx={{ fontSize: 54 }} />
              <Typography sx={{ fontWeight: 800 }}>
                Chưa có đánh giá cần hiển thị
              </Typography>
              <Typography color="text.secondary">
                Khi người dùng gửi review, đánh giá sẽ xuất hiện tại đây để kiểm duyệt.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.25}>
              {reviews.map((review) => {
                const statusConfig = getStatusConfig(review.status);
                const isUpdating = updatingId === review.id;

                return (
                  <Card
                    key={review.id}
                    variant="outlined"
                    sx={{
                      p: { xs: 1.75, md: 2 },
                      borderRadius: 2,
                      borderColor:
                        review.status === "reported" ? "#fecaca" : "#eef2f7",
                      boxShadow: "none",
                      bgcolor:
                        review.status === "reported" ? "#fff7f8" : "#fff",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-between"
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              lineHeight: 1.35,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {review.book_title || `Sách #${review.book}`}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            Review #{review.id} • {formatDateTime(review.created_at)}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip
                            label={statusConfig.label}
                            color={statusConfig.chipColor}
                            size="small"
                            sx={{ fontWeight: 900 }}
                          />
                          {review.is_purchased && (
                            <Chip
                              label="Đã mua"
                              color="success"
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 900 }}
                            />
                          )}
                        </Stack>
                      </Stack>

                      <Box
                        sx={{
                          display: "grid",
                          gap: 1,
                          gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" variant="body2">
                            Người đánh giá
                          </Typography>
                          <Typography sx={{ fontWeight: 800 }}>
                            {review.customer_name || `Customer #${review.customer}`}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {review.customer_email || "Chưa có email"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography color="text.secondary" variant="body2">
                            Số sao
                          </Typography>
                          <Typography sx={{ fontWeight: 900 }}>
                            <RatingStars rating={review.rating} />{" "}
                            <Box component="span" sx={{ color: "text.primary" }}>
                              {review.rating}/5
                            </Box>
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid #eef2f7",
                          bgcolor: "#fffafa",
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                          {review.title || "Không có tiêu đề"}
                        </Typography>
                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {review.comment || "Không có nội dung nhận xét."}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        useFlexGap
                        alignItems="center"
                      >
                        {REVIEW_STATUSES.filter(
                          (statusOption) => statusOption.value !== "deleted",
                        ).map((statusOption) => (
                          <Button
                            key={statusOption.value}
                            type="button"
                            size="small"
                            variant={
                              review.status === statusOption.value
                                ? "contained"
                                : "outlined"
                            }
                            startIcon={statusOption.icon}
                            disabled={isUpdating}
                            onClick={() =>
                              handleSetStatus(review, statusOption.value)
                            }
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 800,
                            }}
                          >
                            {statusOption.actionLabel}
                          </Button>
                        ))}
                        <Tooltip title="Xóa mềm review khỏi frontend, vẫn giữ trong database">
                          <span>
                            <Button
                              type="button"
                              size="small"
                              color="error"
                              variant={
                                review.status === "deleted"
                                  ? "contained"
                                  : "outlined"
                              }
                              startIcon={<DeleteOutlineOutlined />}
                              disabled={isUpdating || review.status === "deleted"}
                              onClick={() => handleSoftDelete(review)}
                              sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 800,
                              }}
                            >
                              Xóa mềm
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Card>
      </Stack>
    </Box>
  );
}
