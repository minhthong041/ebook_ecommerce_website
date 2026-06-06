import { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddPhotoAlternateOutlined,
  CloudUploadOutlined,
  LibraryAddOutlined,
} from "@mui/icons-material";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const initialForm = {
  title: "",
  publisher_name: "",
  price: "",
  year_of_publication: "",
  authors: "",
  categories: "",
  description: "",
};

const initialFiles = {
  cover_image: null,
  pdf_file: null,
  epub_file: null,
  mobi_file: null,
};

const requiredEbookFileFields = ["pdf_file", "epub_file", "mobi_file"];

function FilePicker({ accept, field, file, icon, label, onChange, required = false }) {
  return (
    <Stack spacing={1}>
      <Button
        component="label"
        variant="outlined"
        startIcon={icon}
        sx={{ justifyContent: "flex-start", borderRadius: 2, py: 1.1 }}
      >
        {label}
        {required ? " *" : ""}
        <input
          hidden
          type="file"
          accept={accept}
          onChange={(event) => onChange(field, event.target.files?.[0] || null)}
        />
      </Button>
      {file && <Chip label={file.name} size="small" variant="outlined" />}
    </Stack>
  );
}

export default function StaffBookUpload() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState(initialFiles);
  const [createdBook, setCreatedBook] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleRef = useRef(null);
  const publisherRef = useRef(null);
  const priceRef = useRef(null);
  const normalizedRole = (user?.role || "").trim().toLowerCase();
  const canManageCatalog = Boolean(
    user?.is_superuser ||
      user?.is_staff ||
      normalizedRole === "admin" ||
      normalizedRole === "employee",
  );
  const hasRequiredEbookFiles = requiredEbookFileFields.every(
    (field) => files[field],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
  };

  const handleFileChange = (field, file) => {
    setFiles((prevFiles) => ({ ...prevFiles, [field]: file }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setFiles(initialFiles);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setCreatedBook(null);

    const nextErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = "Điền thiếu thông tin tên sách.";
    }
    if (!form.publisher_name.trim()) {
      nextErrors.publisher_name = "Điền thiếu thông tin nhà xuất bản.";
    }
    if (!String(form.price).trim()) {
      nextErrors.price = "Điền thiếu thông tin giá bán.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.title) {
        titleRef.current?.focus();
      } else if (nextErrors.publisher_name) {
        publisherRef.current?.focus();
      } else {
        priceRef.current?.focus();
      }
      return;
    }

    if (!hasRequiredEbookFiles) {
      setError("Vui lòng chọn đủ 3 file sách: PDF, EPUB và MOBI.");
      return;
    }

    setIsSubmitting(true);

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== "") {
        payload.append(key, value);
      }
    });

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        payload.append(key, file);
      }
    });

    try {
      const response = await axiosClient.post("/staff/books/upload/", payload);
      setCreatedBook(response);
      resetForm();
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData && typeof responseData === "object") {
        setError(JSON.stringify(responseData));
      } else {
        setError("Không thể upload sách. Vui lòng kiểm tra lại dữ liệu.");
      }
    } finally {
      setIsSubmitting(false);
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
          Chỉ tài khoản Admin hoặc Employee mới có quyền upload sách.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Upload sách
          </Typography>
          <Typography color="text.secondary">
            Tạo sách mới và lưu file ebook vào kho media nội bộ.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {createdBook && (
          <Alert severity="success">
            Đã tạo sách "{createdBook.title}" với ID #{createdBook.id}.
          </Alert>
        )}

        <Card sx={{ p: 3, borderRadius: 2 }}>
          {isSubmitting && <LinearProgress sx={{ mb: 3 }} />}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
              }}
            >
              <TextField
                label="Tên sách"
                name="title"
                value={form.title}
                onChange={handleChange}
                inputRef={titleRef}
                error={Boolean(fieldErrors.title)}
                helperText={fieldErrors.title || " "}
              />
              <TextField
                label="Nhà xuất bản"
                name="publisher_name"
                value={form.publisher_name}
                onChange={handleChange}
                inputRef={publisherRef}
                error={Boolean(fieldErrors.publisher_name)}
                helperText={fieldErrors.publisher_name || " "}
              />
              <TextField
                label="Giá bán"
                name="price"
                type="number"
                inputProps={{ min: 0, step: 1000 }}
                value={form.price}
                onChange={handleChange}
                inputRef={priceRef}
                error={Boolean(fieldErrors.price)}
                helperText={fieldErrors.price || " "}
              />
              <TextField
                label="Năm xuất bản"
                name="year_of_publication"
                type="number"
                inputProps={{ min: 0 }}
                value={form.year_of_publication}
                onChange={handleChange}
              />
              <TextField
                label="Tác giả"
                name="authors"
                placeholder="Nguyen Van A, Tran Thi B"
                value={form.authors}
                onChange={handleChange}
              />
              <TextField
                label="Thể loại"
                name="categories"
                placeholder="Programming, Business"
                value={form.categories}
                onChange={handleChange}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Mô tả"
              name="description"
              value={form.description}
              onChange={handleChange}
              sx={{ mt: 2 }}
            />

            <Alert severity="info" sx={{ mt: 3 }}>
              Mỗi sách bắt buộc có đủ 3 file PDF, EPUB và MOBI. Nếu thiếu một
              định dạng, hệ thống sẽ không cho upload.
            </Alert>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                mt: 3,
              }}
            >
              <FilePicker
                accept="image/*"
                field="cover_image"
                file={files.cover_image}
                icon={<AddPhotoAlternateOutlined />}
                label="Chọn ảnh bìa"
                onChange={handleFileChange}
              />
              <FilePicker
                accept=".pdf,application/pdf"
                field="pdf_file"
                file={files.pdf_file}
                icon={<CloudUploadOutlined />}
                label="Chọn PDF"
                onChange={handleFileChange}
                required
              />
              <FilePicker
                accept=".epub,application/epub+zip"
                field="epub_file"
                file={files.epub_file}
                icon={<CloudUploadOutlined />}
                label="Chọn EPUB"
                onChange={handleFileChange}
                required
              />
              <FilePicker
                accept=".mobi"
                field="mobi_file"
                file={files.mobi_file}
                icon={<CloudUploadOutlined />}
                label="Chọn MOBI"
                onChange={handleFileChange}
                required
              />
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !hasRequiredEbookFiles}
                startIcon={<LibraryAddOutlined />}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Upload sách
              </Button>
              <Button
                type="button"
                variant="text"
                disabled={isSubmitting}
                onClick={resetForm}
              >
                Xóa form
              </Button>
            </Stack>
          </Box>
        </Card>
      </Stack>
    </Container>
  );
}
