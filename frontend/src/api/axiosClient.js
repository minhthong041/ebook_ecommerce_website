import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

// Không gài token từ localStorage nữa vì hệ thống dùng HttpOnly Cookie
axiosClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý lỗi từ response (ví dụ: 401 Unauthorized do token hết hạn)
// Để tránh refresh lặp vô tận, dùng cờ _retry
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    
    // Các đường dẫn public không cần thiết bắt 401
    const PUBLIC_PATHS = ["/auth/login/", "/auth/register/", "/auth/refresh/"];
    const isPublicPath = PUBLIC_PATHS.some(path => requestUrl.includes(path));

    if (error.response?.status === 401 && !isPublicPath && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Cố gắng gọi api xin lại refresh_token (Postman/Trình duyệt sẽ tự gắn refresh cookie)
        await axiosClient.post("/auth/refresh/");
        
        // Gọi lại request ban đầu sau khi đã có access_token mới trong cookie
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Log out thực sự trên Frontend nếu Refresh thất bại
        localStorage.removeItem("user_info");
        
        // Tránh vòng lặp vô tận: không redirect nếu request gốc là check session
        if (originalRequest.url !== "/auth/me/") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
