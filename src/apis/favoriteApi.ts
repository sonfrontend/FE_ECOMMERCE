import http from './http';

export const toggleFavoriteApi = (productId: string) => {
  return http.post(`/api/Favorite/toggle/${productId}`);
};

export const getMyFavoritesApi = () => {
  return http.get<string[]>('/api/Favorite/my-favorites');
};
