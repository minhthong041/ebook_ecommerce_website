import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm access token vào header trước khi gửi request
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (phần "Lưu access token" trong task)
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý lỗi từ response (ví dụ: 401 Unauthorized do token hết hạn)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Xử lý logout hoặc gọi API refresh token ở đây
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
