import http from '@/apis/http';

export const getFavorites = (): string[] => {
  try {
    const data = localStorage.getItem('favorite_ids');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing favorite_ids', e);
  }
  return [];
};

export const addFavorite = (productId: string) => {
  let history = getFavorites();
  if (!history.includes(productId)) {
    history.push(productId);
    localStorage.setItem('favorite_ids', JSON.stringify(history));
  }
};

export const removeFavorite = (productId: string) => {
  let history = getFavorites();
  history = history.filter(id => id !== productId);
  localStorage.setItem('favorite_ids', JSON.stringify(history));
};

export const toggleFavorite = (productId: string): boolean => {
  let history = getFavorites();
  let isFavorited = false;
  if (history.includes(productId)) {
    removeFavorite(productId);
    isFavorited = false;
  } else {
    addFavorite(productId);
    isFavorited = true;
  }

  // Gọi API nền để lưu vào DB (Nếu đã đăng nhập)
  http.post(`/api/Favorite/toggle/${productId}`).catch(() => {
    // Silently ignore if not logged in
  });

  return isFavorited;
};

export const isFavorite = (productId: string): boolean => {
  return getFavorites().includes(productId);
};
