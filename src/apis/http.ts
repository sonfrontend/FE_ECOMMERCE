import { HttpStatusCode } from '@/contants/httpStatusCode.enum';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Định nghĩa lại Type để tránh lỗi TypeScript với thuộc tính _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class Http {
  instance: AxiosInstance;
  // Biến dùng để khóa (lock) các request gọi Refresh Token trùng lặp
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_ENDPOINT,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 1. REQUEST INTERCEPTOR
    this.instance.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (config.headers && accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 2. RESPONSE INTERCEPTOR
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Nếu lỗi 401 và chưa từng retry
        if (error.response?.status === HttpStatusCode.Unauthorized && !originalRequest._retry) {
          
          // Bỏ qua logic refresh token nếu là request login
          if (originalRequest.url?.includes('/api/Auth/login')) {
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          const refreshToken = localStorage.getItem('refreshToken');
          const expiredAccessToken = localStorage.getItem('accessToken');

          if (!refreshToken) {
            this.clearAuthAndRedirect();
            return Promise.reject(error);
          }

          // KỸ THUẬT PROMISE LOCK: Nếu chưa có tiến trình Refresh nào đang chạy thì mới tạo mới
          if (!this.refreshTokenPromise) {
            this.refreshTokenPromise = axios
              .post(`${import.meta.env.VITE_API_ENDPOINT}/api/auth/refresh-token`, {
                accessToken: expiredAccessToken, // Gửi kèm Access Token cũ cho Backend C#
                refreshToken: refreshToken
              })
              .then((response) => {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                // Lưu Token mới vào LocalStorage
                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                return newAccessToken; // Trả về Token mới để các request đang chờ sử dụng
              })
              .catch((refreshError) => {
                // Nếu bản thân Refresh Token cũng hết hạn hoặc lỗi -> Xóa sạch và bắt Login lại
                this.clearAuthAndRedirect();
                return Promise.reject(refreshError);
              })
              .finally(() => {
                // Xử lý xong thì mở khóa
                this.refreshTokenPromise = null;
              });
          }

          try {
            // Xếp hàng đợi tiến trình Refresh Token hoàn tất
            const newAccessToken = await this.refreshTokenPromise;

            // Gắn Token mới vào Request cũ và gọi lại
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return this.instance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        // Xử lý lỗi 404 (Không redirect vì làm hỏng SPA nếu gọi API lỗi)
        else if (error.response?.status === HttpStatusCode.NotFound) {
          // window.location.href = '/404';
        }

        return Promise.reject(error);
      }
    );
  }

  // Hàm tiện ích dọn dẹp dữ liệu khi bị đá ra ngoài
  private clearAuthAndRedirect() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // Xóa cả thông tin user nếu có
    window.location.href = '/login';
  }
}

const http = new Http().instance;

export default http;
