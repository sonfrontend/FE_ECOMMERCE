import http from './http';

export const getProducts = (params: { categoryId?: number | string; keyword?: string; sortBy?: string; page?: number; pageSize?: number; isFlashSale?: boolean; isFavorite?: boolean }) => {
  return http.get('/api/Product', { params });
};
