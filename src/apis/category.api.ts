import http from './http';

export const getCategories = () => {
  return http.get('/api/Category');
};
