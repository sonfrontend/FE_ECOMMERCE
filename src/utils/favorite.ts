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

export const addFavorite = (articleId: string) => {
  let history = getFavorites();
  if (!history.includes(articleId)) {
    history.push(articleId);
    localStorage.setItem('favorite_ids', JSON.stringify(history));
  }
};

export const removeFavorite = (articleId: string) => {
  let history = getFavorites();
  history = history.filter(id => id !== articleId);
  localStorage.setItem('favorite_ids', JSON.stringify(history));
};

export const toggleFavorite = (articleId: string): boolean => {
  let history = getFavorites();
  let isFavorited = false;
  if (history.includes(articleId)) {
    removeFavorite(articleId);
    isFavorited = false;
  } else {
    addFavorite(articleId);
    isFavorited = true;
  }

  // Gọi API nền để lưu vào DB (Nếu đã đăng nhập)
  http.post('/api/Favorite', { articleId }).catch(() => {
    // Silently ignore if not logged in
  });

  return isFavorited;
};

export const isFavorite = (articleId: string): boolean => {
  return getFavorites().includes(articleId);
};
