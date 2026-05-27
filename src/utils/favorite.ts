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
  if (history.includes(articleId)) {
    removeFavorite(articleId);
    return false; // is now unfavorited
  } else {
    addFavorite(articleId);
    return true; // is now favorited
  }
};

export const isFavorite = (articleId: string): boolean => {
  return getFavorites().includes(articleId);
};
