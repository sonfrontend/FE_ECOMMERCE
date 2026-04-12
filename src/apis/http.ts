import { HttpStatusCode } from '@/contants/httpStatusCode.enum';
import axios, { AxiosInstance } from 'axios';

class Http {
  instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_ENDPOINT,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.instance.interceptors.request.use(
      async (config) => {
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

    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === HttpStatusCode.Unauthorized && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('Không có Refresh Token');
            }

            const response = await axios.post(`${import.meta.env.VITE_API_ENDPOINT}/api/auth/refresh-token`, {
              refreshToken: refreshToken
            });

            const { token, refreshToken: newRefreshToken } = response.data;

            localStorage.setItem('accessToken', token);
            localStorage.setItem('refreshToken', newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${token}`;

            return this.instance(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else if (error.response?.status === HttpStatusCode.NotFound) {
          window.location.href = '/404';
        }
        return Promise.reject(error);
      }
    );
  }
}

const http = new Http().instance;

export default http;
